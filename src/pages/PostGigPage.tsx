import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Field, PageHeading, btnGhost, btnPrimary, inputClass } from "../components/ui";
import { useUsers } from "../context/UserContext";
import { api } from "../lib/apiClient";
import { CATEGORIES, type Category } from "../lib/types";

export default function PostGigPage() {
  const { currentUser } = useUsers();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state || {}) as {
    prefillTitle?: string;
    prefillCategory?: Category;
    prefillDescription?: string;
  };

  const [title, setTitle] = useState(locationState.prefillTitle || "");
  const [category, setCategory] = useState<Category>(
    locationState.prefillCategory && CATEGORIES.includes(locationState.prefillCategory)
      ? locationState.prefillCategory
      : "Development",
  );
  const [rate, setRate] = useState("");
  const [description, setDescription] = useState(locationState.prefillDescription || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // AI assistant state
  const [idea, setIdea] = useState("");
  const [assistBusy, setAssistBusy] = useState(false);
  const [assistNote, setAssistNote] = useState(
    locationState.prefillTitle
      ? "✨ Prefilled from AI Gig Builder — review and adjust as needed."
      : "",
  );

  const rateNumber = Number(rate);
  const valid =
    title.trim().length >= 4 &&
    description.trim().length >= 10 &&
    Number.isFinite(rateNumber) &&
    rateNumber > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) {
      setError("Please select who you are acting as (top-right switcher) before publishing.");
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
      setAssistNote("✨ Prefilled by AI Assistant — you can edit anything below before publishing.");
    } catch (e) {
      setAssistNote(`Assistant unavailable — please fill the form manually. (${(e as Error).message})`);
    } finally {
      setAssistBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeading
        title="Create a service"
        subtitle="Share your expertise with clients and publish a new Gig on the marketplace."
      />

      {/* AI Gig Assistant Helper */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-sm">✨</span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            AI Gig Builder (Optional)
          </h3>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Describe what you can do in one sentence — our AI will generate a structured title, category, and description.
        </p>

        <div className="mt-3.5 flex flex-col gap-2 sm:flex-row">
          <input
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                runAssistant();
              }
            }}
            placeholder='e.g. "I can build full-stack Next.js web applications with Tailwind"'
            className={inputClass}
          />
          <button
            type="button"
            onClick={runAssistant}
            disabled={assistBusy || idea.trim().length < 6}
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50"
          >
            {assistBusy ? "Thinking…" : "Auto-fill ✨"}
          </button>
        </div>
        {assistNote && <p className="mt-2.5 text-xs font-medium text-violet-700">{assistNote}</p>}
      </div>

      {/* Main Publishing Form */}
      <form
        onSubmit={submit}
        className="space-y-6 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs"
      >
        <Field
          label="Service Title"
          hint="Clear, specific title (e.g. 'React Dashboard Development')"
          required
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What service will you provide?"
            className={inputClass}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category" required>
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

          <Field label="Rate (₹ INR)" hint="Total fixed price for this service" required>
            <input
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              inputMode="numeric"
              placeholder="2500"
              className={inputClass}
            />
          </Field>
        </div>

        <Field
          label="Detailed Description"
          hint="Explain the deliverables, tech stack, and what the client receives"
          required
        >
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="I will build a responsive website with clean architecture..."
            className={inputClass}
          />
        </Field>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <Link to="/marketplace" className={btnGhost}>
            Cancel
          </Link>

          <button
            type="submit"
            disabled={!valid || busy}
            className={`${btnPrimary} px-6`}
          >
            {busy ? "Publishing service…" : "Publish service →"}
          </button>
        </div>
      </form>
    </div>
  );
}
