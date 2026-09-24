import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------

export type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void;
}

let nextToastId = 1;

const TOAST_STYLES: Record<ToastKind, { border: string; icon: string; iconColor: string }> = {
  success: {
    border: "border-emerald-200 dark:border-emerald-500/30",
    icon: "✓",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  error: {
    border: "border-rose-200 dark:border-rose-500/30",
    icon: "✕",
    iconColor: "text-rose-600 dark:text-rose-400",
    },
  info: {
    border: "border-violet-200 dark:border-violet-500/30",
    icon: "✦",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
};

function ToastViewport({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => {
        const s = TOAST_STYLES[t.kind];
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onDismiss(t.id)}
            className={`pointer-events-auto flex max-w-md items-center gap-2.5 rounded-xl border bg-white px-4 py-2.5 text-left text-xs font-medium text-slate-800 shadow-lg shadow-slate-900/5 animate-toastIn dark:bg-zinc-900 dark:text-zinc-100 dark:shadow-black/30 ${s.border}`}
          >
            <span className={`text-sm font-bold ${s.iconColor}`}>{s.icon}</span>
            <span className="flex-1">{t.message}</span>
          </button>
         );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confirm modal
// ---------------------------------------------------------------------------

interface ConfirmOptions {
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

function ConfirmModal({ state, onResolve }: { state: ConfirmState; onResolve: (ok: boolean) => void }) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmBtnRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onResolve(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onResolve]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px] animate-fadeIn"
        onClick={() => onResolve(false)}
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-modalIn dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">{state.title}</h3>
        {state.body && (
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-zinc-400">{state.body}</p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onResolve(false)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {state.cancelLabel ?? "Cancel"}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={() => onResolve(true)}
            className={`rounded-xl px-3.5 py-2 text-xs font-semibold text-white transition active:scale-[0.98] ${
              state.danger
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-violet-600 hover:bg-violet-700"
            }`}
          >
            {state.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Combined provider
// ---------------------------------------------------------------------------

interface FeedbackContextValue extends ToastContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const timers = useRef<Set<number>>(new Set());

  const toast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = nextToastId++;
    setToasts((ts) => [...ts, { id, kind, message }]);
    const timer = window.setTimeout(() => {
      setToasts((ts) => ts.filter((t) => t.id !== id));
      timers.current.delete(timer);
    }, 3800);
    timers.current.add(timer);
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const t of pending) window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setConfirmState({ ...opts, resolve });
      }),
    [],
  );

  const resolveConfirm = useCallback((ok: boolean) => {
    setConfirmState((s) => {
      s?.resolve(ok);
      return null;
    });
  }, []);

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
      {confirmState && <ConfirmModal state={confirmState} onResolve={resolveConfirm} />}
    </FeedbackContext.Provider>
  );

  function dismiss(id: number) {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }
}

export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback must be used inside <FeedbackProvider>");
  return ctx;
}
