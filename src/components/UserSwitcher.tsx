import { useEffect, useRef, useState } from "react";
import { useUsers } from "../context/UserContext";
import { inputClass } from "./ui";

export default function UserSwitcher() {
  const { users, currentUser, selectUser, createAndSelectUser, loading } = useUsers();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function add() {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await createAndSelectUser(trimmed);
      setName("");
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
          {currentUser ? currentUser.name[0]?.toUpperCase() : "?"}
        </span>
        <span className="max-w-[10rem] truncate">
          {loading ? "…" : (currentUser?.name ?? "Who are you?")}
        </span>
        <span className="text-xs text-slate-400">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Acting as
          </p>
          <ul className="max-h-56 overflow-auto">
            {users.map((u) => (
              <li key={u.id}>
                <button
                  onClick={() => {
                    selectUser(u.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm ${
                    u.id === currentUser?.id
                      ? "bg-violet-50 font-semibold text-violet-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate">{u.name}</span>
                  {u.id === currentUser?.id && <span>✓</span>}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 border-t border-slate-100 pt-2">
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
                placeholder="Your name…"
                className={`${inputClass} py-1.5 text-sm`}
              />
              <button
                onClick={add}
                disabled={busy || !name.trim()}
                className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
            <p className="mt-1 px-1 text-[11px] text-slate-400">
              No login — pick a persona or add your own name.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
