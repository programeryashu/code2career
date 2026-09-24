import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "skillswap_saved_gigs";

interface SavedGigsContextValue {
  savedIds: number[];
  isSaved: (gigId: number) => boolean;
  toggleSave: (gigId: number) => void;
  saveCount: number;
}

const SavedGigsContext = createContext<SavedGigsContextValue | null>(null);

export function SavedGigsProvider({ children }: { children: ReactNode }) {
  const [savedIds, setSavedIds] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as number[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedIds));
    } catch {
      // storage unavailable
    }
  }, [savedIds]);

  const isSaved = useCallback(
    (gigId: number) => savedIds.includes(gigId),
    [savedIds],
  );

  const toggleSave = useCallback((gigId: number) => {
    setSavedIds((prev) =>
      prev.includes(gigId) ? prev.filter((id) => id !== gigId) : [...prev, gigId],
    );
  }, []);

  return (
    <SavedGigsContext.Provider
      value={{
        savedIds,
        isSaved,
        toggleSave,
        saveCount: savedIds.length,
      }}
    >
      {children}
    </SavedGigsContext.Provider>
  );
}

export function useSavedGigs(): SavedGigsContextValue {
  const ctx = useContext(SavedGigsContext);
  if (!ctx) throw new Error("useSavedGigs must be used inside <SavedGigsProvider>");
  return ctx;
}
