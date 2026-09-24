import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUsers } from "../context/UserContext";
import { Field, PageHeading, btnGhost, btnPrimary, inputClass } from "../components/ui";
import { api } from "../lib/apiClient";
import { CATEGORIES, type Category } from "../lib/types";

export default function PostGigPage() {
  const { currentUser } = useUsers();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Development");
  const [rate, setRate] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // AI assistant state
  const [idea, setIdea] = useState("");
  const [assistBusy, setAssistBusy] = useState(false);
  const [assistNote, setAssistNote] = useState("");

  const rateNumber = Number(rate);
  const valid =
    title.trim().length >= 4 &&
    description.trim().length >= 10 &&
    Number.isFinite(rateNumber) &&
    rateNumber > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) {
      setError("Pick who you are first (top-right) — that's who's posting the gig.");
      return;
    }
    if (!valid) return;
    setBusy(true);
    setError("");
    try {
      const gig = await api.createGig({
        creator_id: currentUser.id,
        title: title.trim(),
        category,
        rate: Math.round(rateNumber),
        description: description.trim(),
      });
      navigate(`/gigs/${gig.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  async function runAssistant() {
    if (!idea.trim() || assistBusy) return;
    setAssistBusy(true);
    setAssistNote("");
    try {
      const assist = await api.assistGig(idea.trim());
      setTitle(assist.title);
      setCategory(assist.category);
      setDescription(assist.description);
      setAssistNote("✨ Prefilled by AI — edit anything before posting.");
    } catch (e) {
      setAssistNote(`Assistant unavailable — fill the form manually. (${(e as Error).message})`);
    } finally {
      setAssistBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeading
        title="Post a Gig"
        subtitle="List a service students can book — title, category, rate, description."
      />

      {/* AI Gig Assistant */}
      <div className="mb-5 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-fuchsia-50 p-5">
        <p className="text-sm font-bold text-slate-800">🤖 AI Gig Assistant</p>
        <p className="mt-0.5 text-xs text-slate-500">
          Describe what you do in one line — get a polished title, category and description.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                runAssistant();
              }
            }}
            placeholder='e.g. "I can make websites using React and Tailwind"'
            className={inputClass}
          />
          <button
            type="button"
            onClick={runAssistant}
            disabled={assistBusy || idea.trim().length < 8}
            className={`${btnPrimary} shrink-0`}
          >
            {assistBusy ? "Thinking…" : "✨ Auto-fill"}
          </button>
        </div>
        {assistNote && <p className="mt-2 text-xs font-medium text-violet-700">{assistNote}</p>}
      </div>

      <form
        onSubmit={submit}
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <Field label="Title" hint='e.g. "React Website Development"'>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What will you do?"
            className={inputClass}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className={inputClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Rate (₹)" hint="Your price for the whole service, in INR.">
            <input
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              inputMode="numeric"
              placeholder="2000"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Description" hint="What exactly does the client get?">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="I will build a responsive React landing page…"
            className={inputClass}
          />
        </Field>

        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={!valid || busy} className={btnPrimary}>
            {busy ? "Posting…" : "Post Gig"}
          </button>
          <Link to="/" className={btnGhost}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
