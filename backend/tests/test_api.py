"""SkillSwap API tests — booking lifecycle, DP1, DP2, DP3, permissions."""
import time

import pytest


def make_user(client, name):
    r = client.post("/users", json={"name": name})
    assert r.status_code == 201, r.text
    return r.json()


def make_gig(client, creator_id, title, category="Development", rate=1000, description="desc"):
    r = client.post("/gigs", json={
        "creator_id": creator_id, "title": title, "category": category,
        "rate": rate, "description": description,
    })
    assert r.status_code == 201, r.text
    return r.json()


def make_booking(client, gig_id, client_id, client_name="Test Client", deadline="2026-12-01"):
    r = client.post("/bookings", json={
        "gig_id": gig_id, "client_id": client_id, "client_name": client_name, "deadline": deadline,
    })
    assert r.status_code == 201, r.text
    return r.json()


def decide(client, booking_id, actor_id, status):
    return client.patch(f"/bookings/{booking_id}/status", json={"status": status, "actor_id": actor_id})


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_seed_loaded(client):
    gigs = client.get("/gigs").json()
    assert len(gigs) == 10
    cats = {g["category"] for g in gigs}
    assert cats == {"Design", "Development", "Video Editing", "Tutoring", "Music", "Content"}


def test_create_and_list_users(client):
    users = client.get("/users").json()
    names = [u["name"] for u in users]
    assert "Ashutosh" in names and "Rahul" in names
    u = make_user(client, "Test Person")
    assert u["id"] > 0


def test_post_gig_validation(client):
    r = client.post("/gigs", json={"creator_id": 999, "title": "x", "category": "Development", "rate": 100, "description": ""})
    assert r.status_code == 404  # unknown creator
    r = client.post("/gigs", json={"creator_id": 1, "title": "x", "category": "Videogames", "rate": 100, "description": ""})
    assert r.status_code == 422  # bad category


def test_gig_details(client):
    gig = make_gig(client, 2, "Unique Test Gig Title")
    r = client.get(f"/gigs/{gig['id']}")
    assert r.status_code == 200
    body = r.json()
    assert body["title"] == "Unique Test Gig Title"
    assert body["creator"]["name"] == "Rahul"


def test_search_filters_and_sort(client):
    gigs = client.get("/gigs", params={"q": "react"}).json()
    assert len(gigs) >= 2
    assert all("react" in g["title"].lower() or "react" in g["description"].lower() for g in gigs)

    dev = client.get("/gigs", params={"category": "Development"}).json()
    assert all(g["category"] == "Development" for g in dev)

    cheap = client.get("/gigs", params={"sort": "price_asc"}).json()
    rates = [g["rate"] for g in cheap]
    assert rates == sorted(rates)

    newest = client.get("/gigs", params={"sort": "newest"}).json()
    assert [g["id"] for g in newest] == sorted((g["id"] for g in newest), reverse=True)

    r = client.get("/gigs", params={"sort": "bogus"})
    assert r.status_code == 422


def test_dp3_relevance_title_beats_description(client):
    """Gigs with the query in the TITLE rank above description-only matches."""
    seeded = client.get("/gigs", params={"q": "react", "sort": "recommended"}).json()
    title_hits = [g for g in seeded if "react" in g["title"].lower()]
    desc_only = [g for g in seeded if "react" not in g["title"].lower()]
    assert title_hits, "expected at least one title match"
    if desc_only:
        last_title_idx = max(seeded.index(g) for g in title_hits)
        first_desc_idx = min(seeded.index(g) for g in desc_only)
        assert last_title_idx < first_desc_idx


def test_booking_lifecycle(client):
    creator = make_user(client, "Lifecycle Creator")
    client_user = make_user(client, "Lifecycle Client")
    gig = make_gig(client, creator["id"], "Lifecycle Gig")

    booking = make_booking(client, gig["id"], client_user["id"])
    assert booking["status"] == "pending"

    r = decide(client, booking["id"], creator["id"], "accepted")
    assert r.status_code == 200
    assert r.json()["status"] == "accepted"
    assert r.json()["decided_at"] is not None


def test_dp2_accept_cascade_auto_declines_siblings(client):
    creator = make_user(client, "Cascade Creator")
    a = make_user(client, "Client A")
    b = make_user(client, "Client B")
    c = make_user(client, "Client C")
    gig = make_gig(client, creator["id"], "Cascade Gig")

    ba = make_booking(client, gig["id"], a["id"], "Client A")
    bb = make_booking(client, gig["id"], b["id"], "Client B")
    bc = make_booking(client, gig["id"], c["id"], "Client C")
    assert all(x["status"] == "pending" for x in (ba, bb, bc))

    r = decide(client, ba["id"], creator["id"], "accepted")
    assert r.status_code == 200

    b2 = client.get(f"/bookings/{bb['id']}").json()
    c2 = client.get(f"/bookings/{bc['id']}").json()
    assert b2["status"] == "declined"
    assert b2["decided_reason"] == "Gig no longer available"
    assert c2["status"] == "declined"
    assert c2["decided_reason"] == "Gig no longer available"


def test_dp2_gig_stops_accepting_after_accept_409(client):
    creator = make_user(client, "Closure Creator")
    late = make_user(client, "Late Client")
    gig = make_gig(client, creator["id"], "Closure Gig")

    b1 = make_booking(client, gig["id"], late["id"])
    assert decide(client, b1["id"], creator["id"], "accepted").status_code == 200

    r = client.post("/bookings", json={
        "gig_id": gig["id"], "client_id": late["id"], "client_name": "Late Client", "deadline": "2026-12-15",
    })
    assert r.status_code == 409
    gig_view = client.get(f"/gigs/{gig['id']}").json()
    assert gig_view["has_accepted_booking"] is True


def test_dp1_declined_is_terminal_and_403_for_non_owner(client):
    creator = make_user(client, "Terminal Creator")
    impostor = make_user(client, "Not The Creator")
    client_user = make_user(client, "Terminal Client")
    gig = make_gig(client, creator["id"], "Terminal Gig")

    booking = make_booking(client, gig["id"], client_user["id"])

    # a non-owner cannot decide
    r = decide(client, booking["id"], impostor["id"], "declined")
    assert r.status_code == 403
    assert client.get(f"/bookings/{booking['id']}").json()["status"] == "pending"

    # owner declines -> terminal (DP1)
    r = decide(client, booking["id"], creator["id"], "declined")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "declined"
    assert body["decided_reason"] == "Creator declined this booking"

    # no further actions on a declined booking
    assert decide(client, booking["id"], creator["id"], "accepted").status_code == 409
    assert decide(client, booking["id"], creator["id"], "declined").status_code == 409


def test_my_bookings_and_creator_views(client):
    creator = make_user(client, "Views Creator")
    me = make_user(client, "Views Client")
    other = make_user(client, "Views Other")
    g1 = make_gig(client, creator["id"], "Views Gig One")
    g2 = make_gig(client, creator["id"], "Views Gig Two")

    b1 = make_booking(client, g1["id"], me["id"], "Views Client")
    b2 = make_booking(client, g2["id"], me["id"], "Views Client")
    make_booking(client, g1["id"], other["id"], "Views Other")

    mine = client.get("/bookings", params={"client_id": me["id"]}).json()
    assert sorted(b["id"] for b in mine) == sorted([b1["id"], b2["id"]])

    incoming = client.get("/creator/bookings", params={"creator_id": creator["id"]}).json()
    assert b1["id"] in [b["id"] for b in incoming]
    assert b2["id"] in [b["id"] for b in incoming]

    empty = client.get("/creator/bookings", params={"creator_id": other["id"] + 10_000}).json()
    assert empty == []


# ---------- v2: reviews, brief, price_desc, smart search ----------

def test_reviews_require_booking_relationship(client):
    creator = make_user(client, "Review Creator")
    booker = make_user(client, "Review Booker")
    stranger = make_user(client, "Review Stranger")
    gig = make_gig(client, creator["id"], "Reviewable Gig")

    r = client.post(f"/gigs/{gig['id']}/reviews", json={"client_id": stranger["id"], "rating": 5, "comment": "drive-by"})
    assert r.status_code == 403

    make_booking(client, gig["id"], booker["id"], "Review Booker")
    r = client.post(f"/gigs/{gig['id']}/reviews", json={"client_id": booker["id"], "rating": 5, "comment": "great"})
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["rating"] == 5 and body["client_name"] == "Review Booker"

    # one review per client per gig
    r = client.post(f"/gigs/{gig['id']}/reviews", json={"client_id": booker["id"], "rating": 4, "comment": "again"})
    assert r.status_code == 409

    listing = client.get(f"/gigs/{gig['id']}/reviews").json()
    assert len(listing) == 1

    # gig now carries the rating
    gig_view = client.get(f"/gigs/{gig['id']}").json()
    assert gig_view["rating_avg"] == 5.0
    assert gig_view["rating_count"] == 1


def test_project_brief_endpoint(client):
    r = client.post("/ai/project-brief", json={
        "requirement": "I need a 5 page website for my clothing brand with a contact form",
        "gig_title": "React Website Development",
        "category": "Development",
    })
    assert r.status_code == 200
    body = r.json()
    assert body["objective"]
    assert isinstance(body["deliverables"], list) and body["deliverables"]
    assert isinstance(body["milestones"], list) and body["milestones"]
    r2 = client.post("/ai/project-brief", json={"requirement": "too short"})
    assert r2.status_code == 422


def test_price_desc_sort(client):
    gigs = client.get("/gigs", params={"sort": "price_desc"}).json()
    rates = [g["rate"] for g in gigs]
    assert rates == sorted(rates, reverse=True)


def test_smart_search_budget_and_category_hints(client):
    gigs = client.get("/gigs", params={"q": "video editing under 700"}).json()
    assert gigs, "expected at least one cheap video editing gig"
    assert all(g["rate"] <= 700 for g in gigs)
    assert all(g["category"] == "Video Editing" for g in gigs)


def test_booking_requirements_roundtrip(client):
    creator = make_user(client, "Req Creator")
    cl = make_user(client, "Req Client")
    gig = make_gig(client, creator["id"], "Req Gig")
    b = make_booking(client, gig["id"], cl["id"], "Req Client")
    # update with requirements via raw POST
    r = client.post("/bookings", json={
        "gig_id": gig["id"], "client_id": cl["id"], "client_name": "Req Client",
        "deadline": "2026-12-24", "requirements": "Five pages plus a blog.",
    })
    assert r.status_code == 201
    assert r.json()["requirements"] == "Five pages plus a blog."


def test_creator_profile_endpoint(client):
    prof = client.get("/creators/2").json()
    assert prof["creator"]["name"] == "Rahul"
    assert prof["total_gigs"] >= 3
    assert prof["rating_avg"] is not None
    assert any("React" in s for s in prof["creator"]["skills"])
    r = client.get("/creators/99999")
    assert r.status_code == 404


# ---------- v3: booking chat, bargaining, DMs (live-mode parity) ----------

def test_booking_initial_message_and_offer_seed_the_chat(client):
    creator = make_user(client, "Seed Chat Creator")
    cl = make_user(client, "Seed Chat Client")
    gig = make_gig(client, creator["id"], "Seed Chat Gig", rate=2000)

    r = client.post("/bookings", json={
        "gig_id": gig["id"], "client_id": cl["id"], "client_name": "Seed Chat Client",
        "deadline": "2026-12-01", "initial_message": "Five pages, indigo accents.",
        "offer_price": 1600,
    })
    assert r.status_code == 201, r.text
    booking = r.json()
    assert booking["initial_message"] == "Five pages, indigo accents."
    assert booking["offer_price"] == 1600
    assert booking["offer_by"] == "client"

    msgs = client.get(
        f"/bookings/{booking['id']}/messages", params={"viewer_id": cl["id"]}
    ).json()
    assert any(m["kind"] == "user" and "Five pages" in m["body"] for m in msgs)
    assert any(m["kind"] == "system" and "offered ₹1,600" in m["body"] for m in msgs)


def test_booking_chat_permissions_and_declined_lock(client):
    creator = make_user(client, "Chat Perm Creator")
    cl = make_user(client, "Chat Perm Client")
    outsider = make_user(client, "Chat Outsider")
    gig = make_gig(client, creator["id"], "Chat Perm Gig")
    booking = make_booking(client, gig["id"], cl["id"], "Chat Perm Client")

    # stranger cannot read or write
    r = client.get(f"/bookings/{booking['id']}/messages", params={"viewer_id": outsider["id"]})
    assert r.status_code == 403
    r = client.post(f"/bookings/{booking['id']}/messages", json={"sender_id": outsider["id"], "body": "hi"})
    assert r.status_code == 403

    # parties can write
    r = client.post(f"/bookings/{booking['id']}/messages", json={"sender_id": creator["id"], "body": "On it!"})
    assert r.status_code == 201
    assert r.json()["sender_name"] == "Chat Perm Creator"

    # after a decline, chat closes for everyone
    assert decide(client, booking["id"], creator["id"], "declined").status_code == 200
    r = client.post(f"/bookings/{booking['id']}/messages", json={"sender_id": cl["id"], "body": "hello?"})
    assert r.status_code == 409


def test_bargain_full_flow_offer_counter_accept(client):
    creator = make_user(client, "Bargain Creator")
    cl = make_user(client, "Bargain Client")
    gig = make_gig(client, creator["id"], "Bargain Gig", rate=2000)
    booking = make_booking(client, gig["id"], cl["id"], "Bargain Client")
    bid = booking["id"]

    # only the client can open; offers must stay below the listed rate
    r = client.post(f"/bookings/{bid}/bargain", json={"actor_id": creator["id"], "action": "offer", "price": 1500})
    assert r.status_code == 403
    r = client.post(f"/bookings/{bid}/bargain", json={"actor_id": cl["id"], "action": "offer", "price": 2500})
    assert r.status_code == 422

    r = client.post(f"/bookings/{bid}/bargain", json={"actor_id": cl["id"], "action": "offer", "price": 1500})
    assert r.status_code == 200
    assert r.json()["offer_price"] == 1500 and r.json()["offer_by"] == "client"

    # double offer rejected; only the creator may respond
    r = client.post(f"/bookings/{bid}/bargain", json={"actor_id": cl["id"], "action": "offer", "price": 1400})
    assert r.status_code == 409
    r = client.post(f"/bookings/{bid}/bargain", json={"actor_id": cl["id"], "action": "counter", "price": 1700})
    assert r.status_code == 403

    # creator counters, client accepts
    r = client.post(f"/bookings/{bid}/bargain", json={"actor_id": creator["id"], "action": "counter", "price": 1700})
    assert r.status_code == 200
    assert r.json()["offer_by"] == "creator"
    r = client.post(f"/bookings/{bid}/bargain", json={"actor_id": cl["id"], "action": "accept"})
    assert r.status_code == 200
    body = r.json()
    assert body["agreed_price"] == 1700
    assert body["offer_price"] is None and body["offer_by"] is None

    # price is locked after the decision
    r = client.post(f"/bookings/{bid}/bargain", json={"actor_id": cl["id"], "action": "offer", "price": 100})
    assert r.status_code == 409

    # system messages recorded the whole negotiation
    msgs = client.get(f"/bookings/{bid}/messages", params={"viewer_id": cl["id"]}).json()
    sys_bodies = [m["body"] for m in msgs if m["kind"] == "system"]
    assert any("offered ₹1,500" in b for b in sys_bodies)
    assert any("Counter-offer: ₹1,700" in b for b in sys_bodies)
    assert any("Price agreed at ₹1,700" in b for b in sys_bodies)


def test_accept_at_listed_rate_clears_open_offer(client):
    creator = make_user(client, "Clear Offer Creator")
    cl = make_user(client, "Clear Offer Client")
    gig = make_gig(client, creator["id"], "Clear Offer Gig", rate=1000)
    r = client.post("/bookings", json={
        "gig_id": gig["id"], "client_id": cl["id"], "client_name": "Clear Offer Client",
        "deadline": "2026-12-01", "offer_price": 800,
    })
    booking = r.json()
    assert decide(client, booking["id"], creator["id"], "accepted").status_code == 200
    final = client.get(f"/bookings/{booking['id']}").json()
    assert final["status"] == "accepted"
    assert final["offer_price"] is None


def test_dm_thread_lifecycle(client):
    a = make_user(client, "DM Alice")
    b = make_user(client, "DM Bob")
    stranger = make_user(client, "DM Stranger")

    # open (creates), open again (returns the same thread)
    r = client.post("/dm/threads", json={"me_id": a["id"], "other_user_id": b["id"]})
    assert r.status_code == 201
    thread = r.json()
    r2 = client.post("/dm/threads", json={"me_id": b["id"], "other_user_id": a["id"]})
    assert r2.status_code == 201
    assert r2.json()["id"] == thread["id"]

    # cannot message yourself or a ghost
    assert client.post("/dm/threads", json={"me_id": a["id"], "other_user_id": a["id"]}).status_code == 400
    assert client.post("/dm/threads", json={"me_id": a["id"], "other_user_id": 99999}).status_code == 404

    # strangers cannot read; parties can post and list
    r = client.get(f"/dm/threads/{thread['id']}/messages", params={"viewer_id": stranger["id"]})
    assert r.status_code == 403
    r = client.post(f"/dm/threads/{thread['id']}/messages", json={"sender_id": a["id"], "body": "Hey Bob!"})
    assert r.status_code == 201
    client.post(f"/dm/threads/{thread['id']}/messages", json={"sender_id": b["id"], "body": "Hey Alice!"})

    msgs = client.get(f"/dm/threads/{thread['id']}/messages", params={"viewer_id": a["id"]}).json()
    assert [m["body"] for m in msgs] == ["Hey Bob!", "Hey Alice!"]

    # thread list shows the other party and the latest message
    threads = client.get("/dm/threads", params={"user_id": a["id"]}).json()
    mine = next(t for t in threads if t["id"] == thread["id"])
    assert mine["other_user_id"] == b["id"]
    assert mine["last_message"] == "Hey Alice!"


def test_list_gigs_by_creator_filter(client):
    creator = make_user(client, "Filter Creator")
    make_gig(client, creator["id"], "Filter Gig A")
    make_gig(client, creator["id"], "Filter Gig B")
    gigs = client.get("/gigs", params={"creator_id": creator["id"]}).json()
    assert {g["title"] for g in gigs} == {"Filter Gig A", "Filter Gig B"}
