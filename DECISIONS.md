# SkillSwap — Architecture & Product Decision Points (DECISIONS.md)

This document records the design and architectural choices for the three core Decision Points (DP1, DP2, DP3) implemented in SkillSwap.

---

## Decision Point 1 (DP1) — Rejection & Single Active Booking

### What Was Chosen
A gig holds at most one `accepted` active booking at any time. Booking decisions (`accepted` or `declined`) are immutable terminal states (`409 Conflict` on re-decision attempts), and only the verified gig owner/creator has permission to execute decisions (`403 Forbidden` for non-owners).

### Why
Creators—especially student freelancers balancing coursework—have finite operational capacity, so restricting each gig to one active accepted project prevents creator overload and guarantees dedicated client attention. Treating decisions as immutable terminal states ensures transaction finality and eliminates confusing post-decision state regressions. Strict owner-only authorization protects creators from unauthorized booking mutations across shared demo or multi-user environments.

---

## Decision Point 2 (DP2) — Double-Booking Prevention & State Machine Cascade

### What Was Chosen
An atomic transaction cascade where accepting a booking request immediately auto-declines all sibling `pending` requests on that gig with the recorded reason `"Gig no longer available"`, while simultaneously locking the gig from accepting new booking requests (`409 Conflict`).

### Why
Clients requesting a service deserve immediate clarity rather than remaining indefinitely stuck in pending status after a creator commits to another client. Executing the auto-decline cascade within the same database transaction eliminates double-booking race conditions and removes the manual burden from the creator. This keeps the marketplace state strictly synchronized with real-world creator availability in real time.

---

## Decision Point 3 (DP3) — Discovery & Smart Relevance Ranking

### What Was Chosen
A multi-tiered search and relevance engine that combines natural-language query parsing (extracting category hints and budget caps such as `"React developer under 3000"`) with weighted relevance scoring where title matches strictly outrank description-only matches, with graceful fallback to keyword search.

### Why
Clients often search conversationally with combined intent (e.g., target skill plus budget constraint) rather than manually adjusting multi-field filter controls. Ranking title matches higher than incidental description mentions surfaces the most targeted and relevant services first. Implementing this directly in the service layer ensures fast, deterministic, zero-latency discovery without requiring external search clusters.
