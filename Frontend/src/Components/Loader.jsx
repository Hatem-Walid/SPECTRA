import { useEffect, useState } from "react";

const MIN_MS = 1900; // shortest time the loader stays on screen
const LEAVE_MS = 700; // matches the fade-out transition in index.css

/**
 * Site-level loader. Mounted once in App, so it plays when the website
 * starts (not inside the dashboard). Waits for the minimum time and for
 * the web fonts, then fades out and calls onDone.
 */
export default function Loader({ onDone }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";

    let cancelled = false;
    let leaveTimer;

    const minWait = new Promise((r) => setTimeout(r, MIN_MS));
    const fontsReady = document.fonts?.ready
      ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 3000))])
      : Promise.resolve();

    Promise.all([minWait, fontsReady]).then(() => {
      if (cancelled) return;
      setLeaving(true);
      leaveTimer = setTimeout(onDone, LEAVE_MS);
    });

    return () => {
      cancelled = true;
      clearTimeout(leaveTimer);
      root.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`loader ${leaving ? "loader--leave" : ""}`}
      style={{ "--loader-ms": `${MIN_MS}ms` }}
      role="status"
      aria-live="polite"
    >
      <div className="loader__glow" />

      <div className="loader__orb">
        <span className="loader__ring loader__ring--1" />
        <span className="loader__ring loader__ring--2" />
        <span className="loader__ring loader__ring--3" />
        <span className="loader__core" />
      </div>

      <div className="loader__word" aria-label="Spectra">
        {"SPECTRA".split("").map((ch, i) => (
          <span key={i} style={{ animationDelay: `${300 + i * 80}ms` }}>
            {ch}
          </span>
        ))}
      </div>

      <div className="loader__bar">
        <span />
      </div>

      <p className="loader__hint">Warming up the models…</p>
    </div>
  );
}