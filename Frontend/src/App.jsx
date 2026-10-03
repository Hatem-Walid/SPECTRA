import { useEffect, useRef, useState } from 'react';
import ScrollExpand from './Components/ScrollExpand';
import Loader from './Components/Loader';
import Dashboard from './pages/Dashboard';
import { checkHealth } from './api';

// Two staggered layers (0.9s each, 0.14s apart) — keep in sync with .page-wipe in index.css
const WIPE_MS = 1050;

function App() {
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState('landing'); // 'landing' | 'dashboard'
  const [wipe, setWipe] = useState(null); // null | { phase: 'in' | 'out', forward: boolean }
  const busy = useRef(false);

  // Wake the backend while the loader is playing
  useEffect(() => {
    checkHealth().catch(() => {});
  }, []);

  // Page slider: a panel sweeps across, the view swaps while it covers the screen
  const navigate = (next) => {
    if (busy.current || next === view) return;
    busy.current = true;
    const forward = next === 'dashboard';

    setWipe({ phase: 'in', forward });
    setTimeout(() => {
      setView(next);
      window.scrollTo(0, 0);
      setWipe({ phase: 'out', forward });
      setTimeout(() => {
        setWipe(null);
        busy.current = false;
      }, WIPE_MS);
    }, WIPE_MS);
  };

  const handleOpenDashboard = (e) => {
    e.preventDefault();
    navigate('dashboard');
  };

  const wipeLayer = wipe && (
    <div
      className={`page-wipe page-wipe--${wipe.phase}`}
      style={{
        '--wipe-from': wipe.forward ? '115vw' : '-115vw',
        '--wipe-to': wipe.forward ? '-115vw' : '115vw',
      }}
    >
      <div className="page-wipe__layer page-wipe__layer--gold" />
      <div className="page-wipe__layer page-wipe__layer--cream">
        <span className="page-wipe__mark">SPECTRA</span>
      </div>
    </div>
  );

  return (
    <>
      {!loaded && <Loader onDone={() => setLoaded(true)} />}

      {view === 'dashboard' ? (
        <Dashboard onBackToHome={() => navigate('landing')} />
      ) : (
        <div className={`page-view ${wipe?.phase === 'in' ? 'page-view--dim' : ''}`}>
          <nav className="nav">
            <div className="nav__brand">Spectra</div>
            <div className="nav__links">
              <a href="#dashboard" onClick={handleOpenDashboard}>Start now</a>
            </div>
          </nav>

          {/* SECTION 1 — EDITORIAL */}
          <section className="editorial-section" id="approach">
            <div className="editorial-heading editorial-heading--wide">
              <h2>
                Intelligent{' '}
                <span className="pill">
                  <video src="/hero.mp4" autoPlay muted loop playsInline />
                </span>{' '}
                <em className="gx">predictions,</em>
                <br />
                one simple <em className="gx">conversation</em>
              </h2>
              <span className="editorial-tag editorial-tag--gold">Cost estimation</span>
              <span className="editorial-tag editorial-tag--terracotta">Intrusion detection</span>
              <span className="editorial-tag editorial-tag--white">Leaf diagnosis</span>
            </div>
          </section>

          {/* SECTION 2 — SCROLL EXPAND HERO */}
          <ScrollExpand
            className="scroll-expand--light"
            src="/hero.mp4"
            mediaType="video"
            alt="Abstract gradient hero"
            title="Next-gen AI"
            scrollHint="Scroll to expand"
            useWindowScroll
            scrollDistance={1.2}
            holdDistance={0.35}
            startWidth={50}
            startHeight={32}
            startRadius={200}
          >
            <div className="overlay-cta editorial-heading">
              <h2>Just describe it in <em className="gx">plain words</em></h2>
              <span className="editorial-text">
                Type a case, drop a CSV, or upload a leaf photo. Spectra picks out the details and returns the prediction in seconds.
              </span>
              <br />
              <a href="#dashboard" className="cta-button" onClick={handleOpenDashboard}>
                Start now
              </a>
            </div>
          </ScrollExpand>

          {/* SECTION 3 — SHOWCASE */}
          <section className="showcase" id="showcase">
            <div className="showcase__grid" aria-hidden="true">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="showcase__tile"
                  style={{ backgroundImage: `url(/showcase/${i + 1}.jpg)` }}
                />
              ))}
            </div>

            <div className="showcase__scrim" />

            <div className="showcase__content">
              <span className="showcase__mark">✦</span>

              <h2 className="showcase__heading">
                Stop{' '}
                <span className="pill">
                  <video src="/hero.mp4" autoPlay muted loop playsInline />
                </span>{' '}
                guessing.
                <br />
                <span className="dim">Start <em className="gx">predicting.</em></span>
              </h2>

              <div className="showcase__trust">
                <span className="showcase__dot" />
                <span>Three trained models, one assistant to talk to</span>
              </div>

              <a href="#dashboard" className="showcase__cta" onClick={handleOpenDashboard}>
                Open the dashboard
              </a>
            </div>
          </section>
        </div>
      )}

      {wipeLayer}
    </>
  );
}

export default App;