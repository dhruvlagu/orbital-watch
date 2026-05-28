import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import LiveDataSection from "../components/LiveDataSection";
import StarfieldCanvas from "../components/StarfieldCanvas";
import { useCountUp } from "../hooks/useCountUp";

export default function HomePage() {
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  const countObjects = useCountUp(25000, {
    durationMs: 2000,
    formatter: (v) => `${v.toLocaleString()}+`,
  });
  const countMass = useCountUp(9000, {
    durationMs: 2000,
    formatter: (v) => v.toLocaleString(),
  });

  useEffect(() => {
    const onScroll = () => {
      setShowScrollIndicator(window.scrollY < 100);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
                Decades of Cold War recklessness created 25,000+ trackable debris objects
                traveling at 17,500 mph. One collision cascade is all it takes to end the Space Age
                forever.
              </p>

              <div className="hero__stats">
                <div className="card heroStat">
                  <div className="heroStat__number">{countObjects}</div>
                  <div className="heroStat__label">Trackable Objects in LEO</div>
                </div>
                <div className="card heroStat">
                  <div className="heroStat__number">
                    {countMass}
                    <span className="heroStat__numberSup"> TONS</span>
                  </div>
                  <div className="heroStat__label">Mass Currently in Orbit</div>
                </div>
                <div className="card heroStat">
                  <div className="heroStat__number heroStat__number--static">1cm</div>
                  <div className="heroStat__label">Minimum Lethal Fragment Size</div>
                </div>
              </div>

              <div className="hero__ctas">
                <Link className="btn btn--primary" to="/crisis">
                  Explore the Crisis →
                </Link>
                <Link className="btn btn--secondary" to="/physics">
                  The Physics
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
          >
            <div className="heroScrollIndicator__chevron" />
          </div>
        </div>
      </section>

      <section className="quickStats">
        <div className="quickStats__inner">
          <div className="quickStats__item">
            New debris events in 2023: <span>2,000+</span>
          </div>
          <div className="quickStats__divider" />
          <div className="quickStats__item">
            ISS collision avoidance maneuvers in 2023: <span>3</span>
          </div>
          <div className="quickStats__divider" />
          <div className="quickStats__item">
            Active satellites: <span>~7,500</span>
          </div>
          <div className="quickStats__divider" />
          <div className="quickStats__item">
            Debris-to-satellite ratio: <span>3:1</span>
          </div>
        </div>
      </section>

      <LiveDataSection />
    </>
  );
}
