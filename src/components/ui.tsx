import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Design System Tokens & Base Classes (light + dark)
// ---------------------------------------------------------------------------

export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 " +
  "placeholder:text-slate-400 transition-all duration-150 " +
  "focus:border-violet-500 focus:outline-none focus:ring-3 focus:ring-violet-500/10 " +
  "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 " +
  "dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 " +
  "dark:focus:border-violet-500 dark:disabled:bg-zinc-800/50 dark:disabled:text-zinc-600";

export const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 " +
  "text-sm font-semibold text-white shadow-xs transition-all duration-150 " +
  "hover:bg-violet-700 hover:shadow-sm active:scale-[0.98] " +
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 " +
  "bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition-all duration-150 " +
  "hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 active:scale-[0.98] " +
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 " +
  "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 " +
  "dark:hover:bg-zinc-800 dark:hover:border-zinc-600 dark:hover:text-zinc-100";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 " +
  "text-sm font-medium text-slate-600 transition-colors duration-150 " +
  "hover:bg-slate-100 hover:text-slate-900 " +
  "disabled:cursor-not-allowed disabled:opacity-50 " +
  "dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100";

export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 " +
  "bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition-all duration-150 " +
  "hover:bg-rose-100 hover:border-rose-300 active:scale-[0.98] " +
  "disabled:cursor-not-allowed disabled:opacity-50 " +
  "dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300 " +
  "dark:hover:bg-rose-950/70 dark:hover:border-rose-500/50";

// ---------------------------------------------------------------------------
// Core Form & Layout Components
// ---------------------------------------------------------------------------

export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className={labelClass}>
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
        {hint && !error && (
          <span className="mb-1.5 text-xs text-slate-400 dark:text-zinc-500">{hint}</span>
        )}
      </div>
      {children}
      {error && <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}

export function PageHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-zinc-100">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm leading-relaxed max-w-2xl text-slate-500 dark:text-zinc-400">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function EmptyState({
  emoji = "🔍",
  title,
  body,
  action,
}: {
  emoji?: string;
  title: string;
  body: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center sm:p-12 dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-2xl dark:bg-zinc-800/60">
        {emoji}
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-zinc-100">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-slate-500 dark:text-zinc-400">{body}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-slate-500 dark:text-zinc-400">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-violet-600 dark:border-zinc-700 dark:border-t-violet-400" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorNote({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-900 dark:text-rose-300">
            {title}
          </h4>
          <p className="mt-1 text-sm text-rose-700 dark:text-rose-300/90">{message}</p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg border border-rose-300 bg-white px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-500/40 dark:bg-transparent dark:text-rose-300 dark:hover:bg-rose-950/40"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton Loaders
// ---------------------------------------------------------------------------

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 animate-pulse dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-zinc-800" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-zinc-800" />
          <div className="h-3 w-1/4 rounded bg-slate-100 dark:bg-zinc-800/60" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-zinc-800" />
        <div className="h-3 w-full rounded bg-slate-100 dark:bg-zinc-800/60" />
        <div className="h-3 w-5/6 rounded bg-slate-100 dark:bg-zinc-800/60" />
      </div>
      <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800">
        <div className="h-4 w-16 rounded bg-slate-200 dark:bg-zinc-800" />
        <div className="h-4 w-20 rounded bg-slate-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
