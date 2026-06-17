import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

/** Wrapper qui re-monte les enfants à chaque changement de route pour rejouer l'animation CSS. */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div key={pathname} className="page-transition">
      {children}
    </div>
  );
}