import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import LiveDataSection from "../components/LiveDataSection";
import StarfieldCanvas from "../components/StarfieldCanvas";
import { useDocumentMetadata } from "../hooks/useDocumentMetadata";

const STATS_GROUP = (
  <div className="quickStats__group">
    <div className="quickStats__item">
      Debris in LEO: <span>25,000+</span>
    </div>
    <div className="quickStats__divider" />
    <div className="quickStats__item">
      Total debris mass: <span>~9,000 tons</span>
    </div>
    <div className="quickStats__divider" />
    <div className="quickStats__item">
      Minimum lethal fragment size: <span>1cm</span>
    </div>
    <div className="quickStats__divider" />
    <div className="quickStats__item">
      Objects added to LEO in 2025: <span>4,500+</span>
    </div>
    <div className="quickStats__divider" />
  </div>
);

export default function HomePage() {
  useDocumentMetadata(
    "Orbital Watch | LEO Space Debris Tracker & Simulator",
    "Track live orbital objects, run physics-based collision cascade simulations, and inspect sovereign compliance with space sustainability guidelines."
  );

  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollIndicator(window.scrollY < 100);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleScrollIndicatorClick = () => {
    window.scrollTo({
      top: window.innerHeight,
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
                Imagine a world without GPS navigation, weather forecasts, or internet
                connectivity — all of it depends on satellites. Decades of Cold War recklessness
                created 25,000+ trackable debris objects in low Earth orbit traveling at
                17,500 mph. One collision cascade could render low Earth orbit unusable for
                generations.
              </p>

              <div className="hero__liveData">
                <LiveDataSection variant="hero" />
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
            <span className="homeExplore__label">EXPLORE THE PLATFORM</span>
            <h2 className="homeExplore__title">Platform Modules & Policy Tools</h2>
            <p className="homeExplore__subtitle">
              Analyze the science, orbital mechanics, regulatory frameworks, and engineering solutions driving space sustainability.
            </p>
          </div>

          <div className="homeExplore__grid">
            <div className="card homeExploreCard">
              <div className="homeExploreCard__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22a10 10 0 0 0 10-10C22 6.48 17.52 2 12 2S2 6.48 2 12" />
                  <path d="M12 18a6 6 0 0 0 6-6c0-3.31-2.69-6-6-6S6 8.69 6 12" />
                  <circle cx="12" cy="12" r="2" />
                  <path d="M12 12L19 5" />
                </svg>
              </div>
              <h3 className="homeExploreCard__title">The Crisis</h3>
              <p className="homeExploreCard__description">
                Examine the historical buildup of orbital debris, map object distribution across critical altitudes, and study the international treaties governing space.
              </p>
              <Link to="/crisis" className="btn btn--secondary homeExploreCard__btn">
                Analyze the Crisis
              </Link>
            </div>

            <div className="card homeExploreCard">
              <div className="homeExploreCard__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="8" r="3" />
                  <circle cx="16" cy="16" r="3" />
                  <path d="M16 8l-6 6" />
                  <path d="M8 16l6-6" />
                  <path d="M12 6V2" />
                  <path d="M12 18v4" />
                  <path d="M6 12H2" />
                  <path d="M18 12h4" />
                </svg>
              </div>
              <h3 className="homeExploreCard__title">The Physics</h3>
              <p className="homeExploreCard__description">
                Analyze the extreme kinetic energy of orbital debris, map high-risk altitude shells, and run interactive simulations of Kessler Syndrome cascade events.
              </p>
              <Link to="/physics" className="btn btn--secondary homeExploreCard__btn">
                Run the Simulator
              </Link>
            </div>

            <div className="card homeExploreCard">
              <div className="homeExploreCard__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 className="homeExploreCard__title">Policy</h3>
              <p className="homeExploreCard__description">
                Investigate legal liability under international space law, track treaty compliance, and inspect our nation-by-nation sustainability scorecard.
              </p>
              <Link to="/policy" className="btn btn--secondary homeExploreCard__btn">
                Inspect Policy
              </Link>
            </div>

            <div className="card homeExploreCard">
              <div className="homeExploreCard__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <h3 className="homeExploreCard__title">Solutions</h3>
              <p className="homeExploreCard__description">
                Evaluate emerging active debris removal (ADR) tech—like robotic capture—and study economic frameworks for maintaining space as a global commons.
              </p>
              <Link to="/solutions" className="btn btn--secondary homeExploreCard__btn">
                View ADR Tech
              </Link>
            </div>

            <div className="card homeExploreCard">
              <div className="homeExploreCard__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="homeExploreCard__title">Get Involved</h3>
              <p className="homeExploreCard__description">
                Discover how citizens, students, and policymakers can collaborate on space stewardship, advocacy, and STEM-focused educational initiatives.
              </p>
              <Link to="/get-involved" className="btn btn--secondary homeExploreCard__btn">
                Take Action
              </Link>
            </div>

            <div className="card homeExploreCard">
              <div className="homeExploreCard__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <h3 className="homeExploreCard__title">About</h3>
              <p className="homeExploreCard__description">
                Review our development methodology, meet the creators of Orbital Watch, and access our comprehensive library of peer-reviewed data sources.
              </p>
              <Link to="/about" className="btn btn--secondary homeExploreCard__btn">
                Read More
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
