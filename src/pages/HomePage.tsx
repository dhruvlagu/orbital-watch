import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRevealOnScroll } from "../hooks/useRevealOnScroll";
import LiveDataSection from "../components/LiveDataSection";
import StarfieldCanvas from "../components/StarfieldCanvas";
import { useDocumentMetadata } from "../hooks/useDocumentMetadata";
import { useCardSpotlight } from "../hooks/useCardSpotlight";
import { fetchConjunctions, type ConjunctionResponse } from "../services/conjunctionData";
import { fetchLiveOrbitalEnvironment, type LiveOrbitalResponse } from "../services/liveOrbitalData";

const STATS_GROUP = (
  <div className="quickStats__group">
    <div className="quickStats__item">
      Objects tracked in orbit: <span>Tens of thousands</span>
    </div>
    <div className="quickStats__divider" />
    <div className="quickStats__item">
      Total mass in orbit: <span>17,000+ tons</span>
    </div>
    <div className="quickStats__divider" />
    <div className="quickStats__item">
      Minimum lethal fragment size: <span>1cm</span>
    </div>
    <div className="quickStats__divider" />
    <div className="quickStats__item">
      Objects added to LEO in 2025 (historical): <span>4,772</span>
    </div>
    <div className="quickStats__divider" />
    <div className="quickStats__item">
      Highest risk orbital shell: <span>LEO 800–1000 km</span>
    </div>
    <div className="quickStats__divider" />
  </div>
);

export default function HomePage() {
  useDocumentMetadata(
    "Orbital Watch | Space Debris Tracker & Policy Explorer",
    "Explore daily updated orbital debris data, collision-risk science, and policy tools for building a safer low Earth orbit."
  );

  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [conjunctionData, setConjunctionData] = useState<ConjunctionResponse | null>(null);
  const [liveOrbitalData, setLiveOrbitalData] = useState<LiveOrbitalResponse | null>(null);
  const [timeTick, setTimeTick] = useState(() => Date.now());
  const exploreGridRef = useRef<HTMLDivElement>(null);

  useCardSpotlight(exploreGridRef);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollIndicator(window.scrollY < 100);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fetch live orbital environment (total tracked objects)
  useEffect(() => {
    let isCancelled = false;
    fetchLiveOrbitalEnvironment((fresh) => {
      if (!isCancelled) setLiveOrbitalData(fresh);
    }).then((response) => {
      if (!isCancelled) setLiveOrbitalData(response);
    }).catch(() => {
      // Optional; don't surface errors on home page
    });
    return () => { isCancelled = true; };
  }, []);

  // Lightweight conjunction data fetch — filter for active events client-side
  useEffect(() => {
    let isCancelled = false;
    fetchConjunctions((fresh) => {
      if (!isCancelled) setConjunctionData(fresh);
    }).then((response) => {
      if (!isCancelled) setConjunctionData(response);
    }).catch(() => {
      // Data is optional; don't surface errors on the home page
    });
    return () => { isCancelled = true; };
  }, []);

  // Periodic tick to force active count re-evaluation (same 60s interval as CollisionWatchPage)
  useEffect(() => {
    const id = window.setInterval(() => {
      setTimeTick(Date.now());
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  // Filter out events whose TCA has already passed
  const activeConjunctionCount = useMemo(() => {
    if (!conjunctionData) return null;
    return conjunctionData.events.filter((e) => e.tcaMs > Date.now()).length;
  }, [conjunctionData, timeTick]);

  // Scroll Reveal Hook
  useRevealOnScroll(".reveal-item", null, 0.15);

  const handleScrollIndicatorClick = () => {
    window.scrollTo({
      top: window.innerHeight - 64,
      behavior: "smooth",
    });
  };

  return (
    <>
      <section className="hero">
        <StarfieldCanvas />
        <div className="hero__overlay">
          <div className="container hero__inner">
            <div className="hero__content">
              <div className="hero__label">ORBITAL DEBRIS CRISIS</div>
              <h1 className="hero__headline">Earth&apos;s Orbit Is Becoming a Graveyard.</h1>
              <p className="hero__subheadline">
                GPS, weather forecasts, and internet connectivity all depend on
                satellites. Decades of Cold War era neglect created tens of thousands of
                trackable objects in Earth orbit traveling at 17,500 mph. A single collision
                cascade could render low Earth orbit unusable for generations.
              </p>

              <div className="hero__liveData">
                <LiveDataSection variant="hero" />

                {/* Conjunction teaser */}
                <Link to="/collision-watch" className="cw__teaserCard" aria-label="View conjunction alerts on Collision Watch">
                  <div className="cw__teaserCard__left">
                    <span className="badge badge--red cw__teaserCard__badge--small">FEED</span>
                    <span className="cw__teaserCard__text cw__teaserCard__text--primary">
                      Active Conjunction Alerts <span className="cw__teaserCard__text--secondary">(Updated 3x Daily)</span>
                    </span>
                  </div>
                  <div className="cw__teaserCard__right cw__teaserCard__right--flex">
                    <span className="cw__teaserCard__count cw__teaserCard__count--large">
                      {activeConjunctionCount !== null ? activeConjunctionCount : "—"}
                    </span>
                    <span className="cw__teaserCard__arrow cw__teaserCard__arrow--reset" aria-hidden="true">→</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          <div
            className={
              showScrollIndicator
                ? "heroScrollIndicator heroScrollIndicator--visible"
                : "heroScrollIndicator"
            }
            onClick={handleScrollIndicatorClick}
            role="button"
            tabIndex={0}
            aria-label="Scroll down to explore"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                handleScrollIndicatorClick();
              }
            }}
          >
            <div className="heroScrollIndicator__chevron" />
          </div>
        </div>
      </section>

      <section className="quickStats">
        <div className="quickStats__track">
          {STATS_GROUP}
          {STATS_GROUP}
          {STATS_GROUP}
          {STATS_GROUP}
        </div>
      </section>

      <section className="homeExplore">
        <div className="container">
          <div className="homeExplore__header">
            <span className="homeExplore__label">RESEARCH PATHWAYS</span>
            <h2 className="homeExplore__title">Orbital Debris Research &amp; Action</h2>
            <p className="homeExplore__subtitle">
              From live satellite tracking data and hypervelocity physics to international space law and direct civic advocacy—explore each pillar of the crisis.
            </p>
          </div>

          <div className="homeExplore__grid" ref={exploreGridRef}>
            {/* Card 0: The Crisis (Uncertainty Debris Cloud + Catalog Stat) */}
            <div className="card homeExploreCard reveal-item" style={{ ["--reveal-i" as any]: 0 }}>
              <div className="homeExploreCard__cloudIcon" aria-hidden="true">
                <svg width="68" height="38" viewBox="0 0 68 38" fill="none">
                  <ellipse cx="34" cy="24" rx="30" ry="11" stroke="rgba(0, 212, 255, 0.35)" strokeWidth="1" strokeDasharray="3 2" />
                  <circle cx="34" cy="18" r="14" fill="var(--accent-red, #ff3b3b)" opacity="0.18" />
                  <circle cx="34" cy="18" r="7" fill="var(--accent-red, #ff3b3b)" opacity="0.32" />
                  <circle cx="28" cy="16" r="1.5" fill="#ff6b4a" />
                  <circle cx="38" cy="20" r="1.5" fill="#ffb347" />
                  <circle cx="34" cy="18" r="2.5" fill="#ffffff" />
                  <circle cx="44" cy="14" r="1" fill="#00d4ff" />
                </svg>
              </div>
              <h3 className="homeExploreCard__title">The Crisis</h3>
              <div className="homeExploreCard__liveValue">
                {liveOrbitalData ? liveOrbitalData.data.totalTracked.toLocaleString() : "28,000+"} <span className="homeExploreCard__liveUnit">Tracked Objects</span>
              </div>
              <p className="homeExploreCard__description">
                Trace how 70 years of satellite launches and missile tests filled low Earth orbit with tens of thousands of lethal fragments.
              </p>
              <Link to="/crisis" className="btn btn--secondary homeExploreCard__btn">
                Historical Timeline →
              </Link>
            </div>

            {/* Card 1: Collision Watch (Uncertainty Cloud SVG + Live Conjunction Count) */}
            <div className="card homeExploreCard reveal-item" style={{ ["--reveal-i" as any]: 1 }}>
              <div className="homeExploreCard__cloudIcon" aria-hidden="true">
                <svg width="72" height="38" viewBox="0 0 72 38" fill="none">
                  <circle cx="20" cy="19" r="16" fill="var(--accent-blue, #00d4ff)" opacity="0.16" />
                  <circle cx="20" cy="19" r="8" fill="var(--accent-blue, #00d4ff)" opacity="0.32" />
                  <circle cx="20" cy="19" r="2.5" fill="var(--accent-blue, #00d4ff)" />
                  <line x1="20" y1="19" x2="52" y2="19" stroke="rgba(255, 255, 255, 0.25)" strokeDasharray="2 2" strokeWidth="1" />
                  <circle cx="52" cy="19" r="16" fill="var(--accent-amber, #ffb347)" opacity="0.16" />
                  <circle cx="52" cy="19" r="8" fill="var(--accent-amber, #ffb347)" opacity="0.32" />
                  <circle cx="52" cy="19" r="2.5" fill="var(--accent-amber, #ffb347)" />
                </svg>
              </div>
              <h3 className="homeExploreCard__title">Collision Watch</h3>
              <div className="homeExploreCard__liveValue">
                {activeConjunctionCount !== null ? activeConjunctionCount : "—"}
                <span className="homeExploreCard__liveUnit">Active Events</span>
              </div>
              <p className="homeExploreCard__description">
                Updated 3x daily from U.S. Space Force CDMs to contextualize real collision probability.
              </p>
              <Link to="/collision-watch" className="btn btn--secondary homeExploreCard__btn">
                Live Conjunction Feed →
              </Link>
            </div>

            {/* Card 2: The Physics (Live Stat: LEO Velocity) */}
            <div className="card homeExploreCard reveal-item" style={{ ["--reveal-i" as any]: 2 }}>
              <div className="homeExploreCard__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <h3 className="homeExploreCard__title">The Physics</h3>
              <div className="homeExploreCard__liveValue">
                17,500 mph <span className="homeExploreCard__liveUnit">Orbital Speed</span>
              </div>
              <p className="homeExploreCard__description">
                At orbital speed (7.8 km/s), even a 1 cm fragment carries the kinetic energy of an exploding hand grenade.
              </p>
              <Link to="/physics" className="btn btn--secondary homeExploreCard__btn">
                Impact &amp; Cascade Simulator →
              </Link>
            </div>

            {/* Card 3: Policy */}
            <div className="card homeExploreCard reveal-item" style={{ ["--reveal-i" as any]: 3 }}>
              <div className="homeExploreCard__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 className="homeExploreCard__title">Policy</h3>
              <p className="homeExploreCard__description">
                Who owns a dead satellite, who is liable for collisions, and how the FCC 5-year deorbit mandate replaces voluntary inaction.
              </p>
              <Link to="/policy" className="btn btn--secondary homeExploreCard__btn">
                Treaty &amp; Scorecard Breakdown →
              </Link>
            </div>

            {/* Card 4: Solutions */}
            <div className="card homeExploreCard reveal-item" style={{ ["--reveal-i" as any]: 4 }}>
              <div className="homeExploreCard__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <h3 className="homeExploreCard__title">Solutions</h3>
              <p className="homeExploreCard__description">
                From robotic arms to drag sails—explore active debris removal tech and the legal challenge of sovereign space salvage.
              </p>
              <Link to="/solutions" className="btn btn--secondary homeExploreCard__btn">
                Active Debris Removal Tech →
              </Link>
            </div>

            {/* Card 5: Get Involved (Live Stat + Crowned Primary Button) */}
            <div className="card homeExploreCard reveal-item" style={{ ["--reveal-i" as any]: 5 }}>
              <div className="homeExploreCard__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="homeExploreCard__title">Get Involved</h3>
              <div className="homeExploreCard__liveValue">
                Direct Action
              </div>
              <p className="homeExploreCard__description">
                Find your U.S. House representative and generate an evidence-backed orbital safety policy letter.
              </p>
              <Link to="/get-involved" className="btn btn--primary homeExploreCard__btn">
                Contact Your Representative →
              </Link>
            </div>

            {/* Card 6: About & Methodology (Wide Card + Compact Button) */}
            <div className="card homeExploreCard homeExploreCard--wide reveal-item" style={{ ["--reveal-i" as any]: 6 }}>
              <div className="homeExploreCard__icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <div className="homeExploreCard__content">
                <h3 className="homeExploreCard__title">About &amp; Methodology</h3>
                <p className="homeExploreCard__description">
                  Inspect our Space-Track data pipelines, Redis caching architecture, and open methodology.
                </p>
              </div>
              <Link to="/about" className="btn btn--secondary homeExploreCard__btn">
                Read Research Methodology →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
