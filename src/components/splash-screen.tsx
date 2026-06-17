import { useEffect, useState } from "react";

const LOGO_URL = "/assets/innova-logo.png";

/** Splash overlay full-screen affiché au premier chargement (et masqué après hydratation). */
export function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [hide, setHide] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t1 = setTimeout(() => setHide(true), 550);
    const t2 = setTimeout(() => setGone(true), 1100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Important for Netlify/self-hosted deploys: never render the splash in SSR.
  // If the client bundle fails to load, an SSR splash would cover the real page forever.
  if (!mounted) return null;
  if (gone) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-white"
      style={{
        animation: hide ? "splash-fade-out 500ms ease-out forwards" : undefined,
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-4" style={{ animation: "splash-logo-in 500ms ease-out" }}>
        <img
          src={LOGO_URL}
          alt="Innova Lab Solutions"
          className="h-20 w-auto md:h-28 object-contain"
        />
        <div className="h-0.5 w-24 overflow-hidden rounded-full bg-primary/10">
          <div className="h-full w-1/2 bg-primary animate-pulse" />
        </div>
      </div>
    </div>
  );
}