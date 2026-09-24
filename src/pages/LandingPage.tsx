import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GigCard from "../components/GigCard";
import { StaggerGrid } from "../components/Motion";
import { SkeletonGrid } from "../components/ui";
import { api } from "../lib/apiClient";
import { CATEGORIES, type Category, type GigWithCreator } from "../lib/types";

export default function LandingPage() {
  const navigate = useNavigate();
  const [gigs, setGigs] = useState<GigWithCreator[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and Category preview filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "All">("All");

  // AI Assistant Interactive Sandbox State
  const [aiPrompt, setAiPrompt] = useState("I build React websites for startups.");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState<{
    title: string;
    category: Category;
    description: string;
  } | null>({
    title: "Modern React Website Development",
    category: "Development",
    description:
      "Professional responsive websites built using React, TypeScript, and Tailwind CSS with clean code and fast performance.",
  });

  useEffect(() => {
    let active = true;
    api
      .listGigs()
      .then((all) => {
        if (active) setGigs(all);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Filter 3 real preview gigs
  const previewGigs = gigs
    .filter((g) => {
      const matchCat = selectedCategory === "All" || g.category === selectedCategory;
      const matchQ =
        !searchQuery.trim() ||
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.creator_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQ;
    })
    .slice(0, 3);

  async function handleGenerateDraft() {
    if (!aiPrompt.trim() || aiLoading) return;
    setAiLoading(true);
    try {
      const assist = await api.assistGig(aiPrompt.trim());
      setAiDraft({
        title: assist.title,
        category: assist.category,
        description: assist.description,
      });
    } catch {
      setAiDraft({
        title: "Modern React Website Development",
        category: "Development",
        description: `Professional service: ${aiPrompt.trim()}`,
      });
    } finally {
      setAiLoading(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/marketplace");
    }
  }

  return (
    <div className="space-y-28 pb-16">
      {/* ========================================================================= */}
      {/* 02 — HERO SECTION                                                         */}
      {/* ========================================================================= */}
      <section className="pt-8 text-center sm:pt-14">
        <div className="mx-auto max-w-3xl">
          {/* Eyebrow */}
          <span className="text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-zinc-400">
            THE CREATOR MARKETPLACE
          </span>

          {/* Main Headline */}
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-stone-900 sm:text-6xl sm:leading-[1.12] dark:text-zinc-100">
            Turn your skills into <br className="hidden sm:inline" />
            real opportunities.
          </h1>

          {/* Supporting copy */}
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-stone-600 sm:text-lg dark:text-zinc-400">
            Discover talented creators, showcase what you do best, and find the right skills for
            your next project.
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              to="/marketplace"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-violet-700 active:scale-[0.98]"
            >
              <span>Explore services</span>
              <span>→</span>
            </Link>
            <Link
              to="/gigs/new"
              className="inline-flex items-center justify-center rounded-xl border border-stone-200 bg-white px-6 py-3 text-sm font-semibold text-stone-700 shadow-xs transition hover:border-stone-300 hover:bg-stone-50 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
            >
              Offer your skills
            </Link>
          </div>

          {/* Interactive Hero Visual / Composition Card */}
          <div className="mx-auto mt-14 max-w-md">
            <div className="rounded-2xl border border-stone-200/90 bg-white p-6 text-left shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 dark:border-zinc-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  ✦ Featured creator
                </span>
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600 dark:bg-zinc-800 dark:text-zinc-300">
                  Development
                </span>
              </div>

              <div className="mt-4">
                <h3 className="text-base font-bold text-stone-900 dark:text-zinc-100">
                  React Development
                </h3>
                <p className="mt-1 text-xs text-stone-500 dark:text-zinc-400">
                  <span className="font-semibold text-stone-700 dark:text-zinc-300">Rahul</span> · Full-stack Developer
                </p>
                <p className="mt-2 text-xs leading-relaxed text-stone-600 dark:text-zinc-400">
                  Build a modern, fast, responsive website for your next project using React and
                  Tailwind CSS.
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-3 dark:border-zinc-800">
                <div className="flex items-center gap-1 text-xs font-semibold text-stone-700 dark:text-zinc-300">
                  <span className="text-amber-500 dark:text-amber-400">★</span>
                  <span>4.9</span>
                  <span className="font-normal text-stone-400 dark:text-zinc-500">(12 reviews)</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-stone-400 dark:text-zinc-500">Starting at </span>
                  <span className="text-sm font-bold text-stone-900 dark:text-zinc-100">₹2,500</span>
                </div>
              </div>

              <Link
                to="/marketplace?category=Development"
                className="mt-4 flex w-full items-center justify-center rounded-xl bg-stone-900 py-2.5 text-xs font-semibold text-white transition hover:bg-violet-600 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-violet-500 dark:hover:text-white"
              >
                View service →
              </Link>
            </div>

            <p className="mt-4 text-center text-xs font-medium text-stone-400 dark:text-zinc-500">
              Trusted by skills. Built for opportunity.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 03 — PRODUCT PREVIEW                                                      */}
      {/* ========================================================================= */}
      <section className="border-t border-stone-200/80 pt-16 dark:border-zinc-800">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl dark:text-zinc-100">
              What are you looking for?
            </h2>
            <p className="mt-2 text-sm text-stone-500 dark:text-zinc-400">
              Explore services from developers, designers, editors, writers, tutors, and more.
            </p>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative mt-8">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search services, skills or creators..."
              className="w-full rounded-2xl border border-stone-200 bg-white px-5 py-3.5 text-sm text-stone-900 shadow-xs placeholder:text-stone-400 focus:border-violet-500 focus:outline-none focus:ring-3 focus:ring-violet-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </form>

          {/* Category Chips */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory("All")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
                selectedCategory === "All"
                  ? "bg-stone-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
                  selectedCategory === cat
                    ? "bg-stone-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                {cat === "Video Editing" ? "Video" : cat === "Content" ? "Writing" : cat}
              </button>
            ))}
          </div>

          {/* 3 Real Gig Cards */}
          <div className="mt-8">
            {loading ? (
              <SkeletonGrid count={3} />
            ) : previewGigs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-8 text-center text-sm text-stone-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
                No services found.{" "}
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                  className="font-semibold text-violet-600 underline dark:text-violet-400"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <StaggerGrid className="grid gap-4 sm:grid-cols-3">
                {previewGigs.map((gig) => (
                  <GigCard key={gig.id} gig={gig} />
                ))}
              </StaggerGrid>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 04 — HOW IT WORKS                                                         */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="border-t border-stone-200/80 pt-16 dark:border-zinc-800">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl dark:text-zinc-100">
            From skill to opportunity in three steps.
          </h2>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 text-center shadow-xs sm:text-left dark:border-zinc-800 dark:bg-zinc-900/60">
            <span className="text-xs font-extrabold text-violet-600 dark:text-violet-400">01 — Create</span>
            <h3 className="mt-2 text-base font-bold text-stone-900 dark:text-zinc-100">Showcase your skill</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-stone-500 dark:text-zinc-400">
              Turn your expertise into a professional service with clear deliverables and transparent rates.
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 text-center shadow-xs sm:text-left dark:border-zinc-800 dark:bg-zinc-900/60">
            <span className="text-xs font-extrabold text-violet-600 dark:text-violet-400">02 — Discover</span>
            <h3 className="mt-2 text-base font-bold text-stone-900 dark:text-zinc-100">Find the right talent</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-stone-500 dark:text-zinc-400">
              Find creators and services that match your project requirements and budget in seconds.
            </p>
          </div>

          <div className="rounded-2xl border border-stone-200/90 bg-white p-6 text-center shadow-xs sm:text-left dark:border-zinc-800 dark:bg-zinc-900/60">
            <span className="text-xs font-extrabold text-violet-600 dark:text-violet-400">03 — Connect</span>
            <h3 className="mt-2 text-base font-bold text-stone-900 dark:text-zinc-100">Book and collaborate</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-stone-500 dark:text-zinc-400">
              Book a service, coordinate directly via messaging, and receive on-time quality delivery.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 05 — CREATOR SECTION (SPLIT-SCREEN)                                       */}
      {/* ========================================================================= */}
      <section className="border-t border-stone-200/80 pt-16 dark:border-zinc-800">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          {/* Left: Copy & CTA */}
          <div className="space-y-4 lg:col-span-6">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              For Creators
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl dark:text-zinc-100">
              Have a skill? Make it discoverable.
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-stone-600 dark:text-zinc-400">
              Create a service, showcase your expertise, and connect with people looking for what you do.
              Set your own rates and build a real portfolio.
            </p>
            <div className="pt-2">
              <Link
                to="/gigs/new"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-violet-600 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-violet-500 dark:hover:text-white"
              >
                <span>Create your first Gig</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Right: Visual Card */}
          <div className="lg:col-span-6">
            <div className="mx-auto max-w-md rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 dark:border-zinc-800">
                <span className="text-xs font-bold text-stone-900 dark:text-zinc-100">React Website Development</span>
                <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600 dark:bg-zinc-800 dark:text-zinc-300">
                  Development
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-stone-500 dark:text-zinc-400">
                Build responsive landing pages and modern web applications with clean TypeScript and
                Tailwind CSS.
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 dark:border-zinc-800">
                <span className="text-sm font-extrabold text-stone-900 dark:text-zinc-100">₹2,500</span>
                <span className="rounded-lg bg-violet-600 px-3 py-1 text-xs font-semibold text-white">
                  Publish service
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 06 — CLIENT SECTION (REVERSE SPLIT-SCREEN)                                */}
      {/* ========================================================================= */}
      <section className="border-t border-stone-200/80 pt-16 dark:border-zinc-800">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          {/* Left: Process Visual */}
          <div className="order-2 lg:order-1 lg:col-span-6">
            <div className="mx-auto max-w-md rounded-2xl border border-stone-200/90 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
              <div className="flex flex-col gap-2">
                {[
                  { step: "Search", desc: "Browse across web development, design, video, and tutoring" },
                  { step: "Filter", desc: "Filter by category, price, and creator ratings" },
                  { step: "Compare", desc: "Review real portfolios and client feedback" },
                  { step: "Book", desc: "Set deadlines, negotiate terms, and receive deliverables" },
                ].map((item, idx) => (
                  <div
                    key={item.step}
                    className="flex items-center gap-3 rounded-xl border border-stone-100 bg-stone-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="block text-xs font-bold text-stone-900 dark:text-zinc-100">{item.step}</span>
                      <span className="block text-[11px] text-stone-500 dark:text-zinc-400">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Copy & CTA */}
          <div className="order-1 space-y-4 lg:order-2 lg:col-span-6">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              For Clients
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl dark:text-zinc-100">
              Need a skill? Find it here.
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-stone-600 dark:text-zinc-400">
              Search across creative and technical services from emerging creators. Direct
              communication and clear scope agreements on every booking.
            </p>
            <div className="pt-2">
              <Link
                to="/marketplace"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-violet-600 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-violet-500 dark:hover:text-white"
              >
                <span>Explore the marketplace</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 07 — AI SECTION (GROUNDED & PRACTICAL)                                    */}
      {/* ========================================================================= */}
      <section className="border-t border-stone-200/80 pt-16 dark:border-zinc-800">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              AI Gig Assistant
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl dark:text-zinc-100">
              Your idea. Professionally presented.
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-stone-500 dark:text-zinc-400">
              Not sure how to describe your service? Let SkillSwap's AI assistant turn your idea into a
              polished Gig description.
            </p>
          </div>

          {/* Sandbox Box */}
          <div className="mt-8 rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder='e.g. "I build React websites for startups."'
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-4 py-2.5 text-xs text-stone-900 focus:border-violet-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:bg-zinc-900"
                />
                <button
                  type="button"
                  onClick={handleGenerateDraft}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-violet-600 active:scale-95 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-violet-500 dark:hover:text-white"
                >
                  {aiLoading ? "Generating…" : "Generate Gig →"}
                </button>
              </div>

              {/* Output Preview */}
              {aiDraft && (
                <div className="animate-fadeIn space-y-3 rounded-xl border border-stone-200 bg-stone-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center justify-between border-b border-stone-200/60 pb-2 dark:border-zinc-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
                      ↓ AI Generated Draft
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/gigs/new", {
                          state: {
                            prefillTitle: aiDraft.title,
                            prefillCategory: aiDraft.category,
                            prefillDescription: aiDraft.description,
                          },
                        });
                      }}
                      className="text-xs font-bold text-violet-600 hover:underline dark:text-violet-400"
                    >
                      Use this draft →
                    </button>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="font-semibold text-stone-500 dark:text-zinc-400">Title: </span>
                      <span className="font-bold text-stone-900 dark:text-zinc-100">{aiDraft.title}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-stone-500 dark:text-zinc-400">Category: </span>
                      <span className="rounded bg-stone-200/70 px-1.5 py-0.5 text-[10px] font-semibold text-stone-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {aiDraft.category}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-stone-500 dark:text-zinc-400">Description: </span>
                      <p className="mt-1 leading-relaxed text-stone-600 dark:text-zinc-400">{aiDraft.description}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 08 — FINAL CTA                                                            */}
      {/* ========================================================================= */}
      <section className="border-t border-stone-200/80 pt-16 dark:border-zinc-800">
        <div className="mx-auto max-w-3xl rounded-2xl border border-stone-200/90 bg-white p-8 text-center shadow-xs sm:p-14 dark:border-zinc-800 dark:bg-zinc-900/60">
          <h2 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl dark:text-zinc-100">
            Your next opportunity starts with what you already know.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-stone-500 dark:text-zinc-400">
            Whether you're offering a skill or looking for one, SkillSwap gives you a place to start.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              to="/marketplace"
              className="rounded-xl bg-violet-600 px-6 py-3 text-xs font-semibold text-white shadow-xs transition hover:bg-violet-700"
            >
              Explore services →
            </Link>
            <Link
              to="/gigs/new"
              className="rounded-xl border border-stone-200 bg-white px-6 py-3 text-xs font-semibold text-stone-700 shadow-xs transition hover:border-stone-300 hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
            >
              Become a creator →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
