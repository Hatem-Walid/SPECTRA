import { useState } from 'react';
import ScrollExpand from './Components/ScrollExpand';

function App() {
  const [showDashboard, setShowDashboard] = useState(false);

  // دالة الانتقال للداشبورد
  const handleOpenDashboard = (e) => {
    e.preventDefault();
    setShowDashboard(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // لو المستخدم ضغط على زرار يرجع للرئيسية
  const handleBackToHome = (e) => {
    e.preventDefault();
    setShowDashboard(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // لو المتصفح في وضع الداشبورد
  if (showDashboard) {
    return (
      <div className="app-shell">
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>Spectra Dashboard</h1>
            <button onClick={handleBackToHome} className="btn-ghost">
              ← Back to Home
            </button>
          </div>
          
          <div style={{ padding: '3rem', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Welcome to Spectra Console</h2>
            <p style={{ color: 'var(--text-muted)' }}>Here you can manage your AI models, computer vision tasks, and predictive healthcare analytics.</p>
          </div>
        </div>
      </div>
    );
  }

  // صفحة الهبوط (Landing Page الافتراضية)
  return (
    <div>
      <nav className="nav">
        <div className="nav__brand">Spectra</div>
        <div className="nav__links">
          <a href="#dashboard" onClick={handleOpenDashboard}>start now</a>
        </div>
      </nav>

      {/* ============================================================
          SECTION 1 — EDITORIAL SECTION
         ============================================================ */}
      <section className="editorial-section" id="approach">
        <div className="editorial-heading">
          <h2>
            From solo practices to
            <br />
            emerging collectives
          </h2>
          <span className="editorial-tag editorial-tag--gold">Brand as body</span>
          <span className="editorial-tag editorial-tag--terracotta">Female-led</span>
          <span className="editorial-tag editorial-tag--white">Consulting</span>
        </div>
      </section>

      {/* ============================================================
          SECTION 2 — ScrollExpand hero video (White Mode)
         ============================================================ */}
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
        startHeight={42}
      >
        <div className="overlay-cta editorial-heading">
          <h2>Every pixel, everywhere</h2>
          <span className="editorial-text">The frame opens up as you scroll and hands the whole stage to your media.</span>
          <br />
          <a href="#dashboard" className="cta-button" onClick={handleOpenDashboard}>
            start now
          </a>
        </div>
      </ScrollExpand>

      {/* ============================================================
          SECTION 3 — SHOWCASE
         ============================================================ */}
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
            Stop browsing.
            <br />
            <span className="dim">Start building.</span>
          </h2>

          <div className="showcase__trust">
            <div className="showcase__avatars">
              <img className="showcase__avatar" src="/avatars/1.jpg" alt="" />
              <img className="showcase__avatar" src="/avatars/2.jpg" alt="" />
              <img className="showcase__avatar" src="/avatars/3.jpg" alt="" />
              <img className="showcase__avatar" src="/avatars/4.jpg" alt="" />
            </div>
            <span className="showcase__trust-text">Spectra is trusted by 8000+</span>
          </div>

          <a href="#dashboard" className="showcase__cta" onClick={handleOpenDashboard}>
            Explore Spectra →
          </a>
        </div>
      </section>
    </div>
  );
}

export default App;