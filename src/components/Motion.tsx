import type { ReactNode } from "react";

/**
 * Page transition: a short fade/slide-up every time the route changes.
 * Wrap each route element with <PageTransition> (see App.tsx).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return <div className="animate-slideUpIn">{children}</div>;
}

/**
 * Staggered entrance for card grids: children fade/slide in one after
 * another (60ms apart) instead of popping in all at once.
 */
export function StaggerGrid({
  children,
  className = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.isArray(children)
        ? children.map((child, i) =>
            child ? (
              <div
                key={(child as { key?: string | number }).key ?? i}
                className="animate-slideUpIn"
                style={{ animationDelay: `${Math.min(i, 8) * 60}ms`, animationFillMode: "backwards" }}
              >
                {child}
              </div>
            ) : null,
          )
        : children}
    </div>
  );
}
