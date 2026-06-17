import { useEffect, useState } from "react";

const LOGO_URL = "/innova-logo.png";

/**
 * React splash overlay shown above the app while it boots / first data loads.
 * A static copy of this splash also lives in index.html so the user never sees
 * a blank white screen before the JS bundle is parsed.
 */
export function SplashScreen() {
  const [hide, setHide] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    // Remove the static splash injected by index.html as soon as React takes over.
    const staticEl = document.getElementById("app-splash");
    if (staticEl) staticEl.remove();

    const t1 = setTimeout(() => setHide(true), 700);
    const t2 = setTimeout(() => setGone(true), 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white"
      style={{
        animation: hide ? "splash-fade-out 500ms ease-out forwards" : undefined,
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      aria-hidden="true"
    >
      <div
        className="flex flex-col items-center gap-6"
        style={{ animation: "splash-logo-in 500ms ease-out" }}
      >
        <img
          src={LOGO_URL}
          alt="Innova Lab Solutions"
          className="h-24 w-auto md:h-32 object-contain select-none"
          draggable={false}
        />
        {/* Indeterminate progress bar */}
        <div className="h-1 w-48 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full w-1/3 rounded-full bg-[#0a1f3d]"
            style={{ animation: "splash-progress 1.1s ease-in-out infinite" }}
          />
        </div>
        <span className="text-xs tracking-wide text-slate-500">Chargement…</span>
      </div>
    </div>
  );
}
