import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useDocumentMetadata } from "../hooks/useDocumentMetadata";
import { Chart as ChartJS, CategoryScale, LinearScale, BarController, BarElement, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import KesslerSimulation from "../components/KesslerSimulation";

ChartJS.register(CategoryScale, LinearScale, BarController, BarElement, Tooltip, Legend);

export default function PhysicsPage() {
  useDocumentMetadata(
    "The Physics | Kessler Simulator & Collision Energy",
    "Understand the physics of orbital debris impacts, kinetic energy, and Kessler Syndrome with interactive simulations."
  );

  const [mass, setMass] = useState(10); // grams
  const [velocity, setVelocity] = useState(7.8); // km/s — standard LEO average (~17,500 mph)
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [isMobileChart, setIsMobileChart] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches,
  );

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const sync = () => setIsMobileChart(media.matches);
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

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

  const trackCalculatorUsage = (nextMass: number, nextVelocity: number) => {
    if (typeof window === "undefined") return;

    const gtagFn = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtagFn === "function") {
      gtagFn("event", "calculator_used", {
        mass_grams: nextMass,
        velocity_kms: nextVelocity,
      });
    }
  };

  // Calculate kinetic energy in joules
  const massKg = mass / 1000;
  const velocityMs = velocity * 1000;
  const kineticEnergy = 0.5 * massKg * velocityMs * velocityMs;

  // Derived values
  const tntEquivalent = kineticEnergy / 4184;
  const grenadesEquivalent = kineticEnergy / 160000;

  // Danger level calculation
  const getDangerLevel = () => {
    if (kineticEnergy < 1000) return { level: "Low", label: "Sensor damage likely", color: "#00d464", badge: "green" };
    if (kineticEnergy < 100000) return { level: "Moderate", label: "Structural penetration", color: "#f5a623", badge: "amber" };
    if (kineticEnergy < 10000000) return { level: "Severe", label: "Satellite destruction", color: "#ff3b3b", badge: "red" };
    return { level: "Catastrophic", label: "Cascade trigger risk", color: "#ff3b3b", badge: "red", pulsing: true };
  };

  const danger = getDangerLevel();

  const handleMassPreset = (value: number) => setMass(value);
  const handleVelocityPreset = (value: number) => setVelocity(value);

  const chartLabels = isMobileChart
    ? ["Bullet", "1cm (1g)", "1cm (5g)", "Grenade", "Tennis ball"]
    : [
      "Bullet\n(10g, 900 m/s)",
      "1cm debris\n(1g, 7,900 m/s)",
      "1cm debris\n(5g, 7,900 m/s)",
      "Hand grenade",
      "Tennis ball debris\n(57g, 7,900 m/s)",
    ];

  // Chart.js data
  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Kinetic Energy (Joules)",
        data: [4000, 31000, 155000, 160000, 1780000],
        backgroundColor: [
          "rgba(245, 166, 35, 0.6)",
          "rgba(255, 140, 35, 0.6)",
          "rgba(255, 100, 35, 0.6)",
          "rgba(255, 70, 35, 0.6)",
          "rgba(255, 40, 35, 0.6)",
        ],
        borderColor: [
          "rgba(245, 166, 35, 1)",
          "rgba(255, 140, 35, 1)",
          "rgba(255, 100, 35, 1)",
          "rgba(255, 70, 35, 1)",
          "rgba(255, 40, 35, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = useMemo(() => ({
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: { left: isMobileChart ? 4 : 0, right: isMobileChart ? 8 : 0 },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(10, 14, 26, 0.9)",
        titleColor: "#00d4ff",
        bodyColor: "#ffffff",
        borderColor: "rgba(0, 212, 255, 0.3)",
        borderWidth: 1,
        padding: 12,
        titleFont: { size: 14, weight: "bold" as const },
        bodyFont: { size: 13 },
        displayColors: false,
        callbacks: {
          title: (context: any) => {
            return context[0].label.split("\n")[0];
          },
          label: (context: any) => {
            const value = context.parsed.x;
            return `Kinetic Energy: ${value.toLocaleString()} J`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 2000000,
        type: "linear" as const,
        grid: { color: "rgba(255, 255, 255, 0.05)" },
        ticks: { color: "#8b9ab0", font: { size: 12 } },
        title: {
          display: true,
          text: "Kinetic Energy (Joules)",
          color: "#ffffff",
          font: { size: 13, weight: "bold" as const },
        },
      },
      y: {
        grid: { display: false },
        ticks: {
          color: "#8b9ab0",
          font: { size: isMobileChart ? 10 : 11, family: "monospace" },
          autoSkip: false,
        },
        afterFit: (scale: { width: number }) => {
          if (isMobileChart) scale.width = 84;
        },
      },
    },
  }), [isMobileChart]);

  return (
    <>
      {/* Hero Section */}
      <section className="hero physics-hero">
        <div className="hero__overlay">
          <div className="container hero__inner">
            <div className="hero__content">
              <h1 className="hero__headline">The Mathematics of Catastrophe</h1>
              <p className="hero__subheadline">
                Why orbital debris isn't just a space problem — it's a physics problem with a mathematical deadline.
              </p>
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

      {/* Section 1: The Speed Problem */}
      <section className="section physics-section section--speed">
        <div className="container">
          <h2>The Speed Problem</h2>

          <div className="speedCallout card">
            <div className="speedCallout__stat">~17,500 mph</div>
            <div className="speedCallout__label">Average orbital velocity in LEO</div>
            <div className="speedCallout__description">
              At this speed, a 1cm bolt carries kinetic energy comparable to a hand grenade. A 10cm fragment matches a small car crash. A 1kg object exceeds a military explosive.
            </div>
          </div>

          <div className="chartContainer">
            <h3>Kinetic Energy vs. Familiar Objects</h3>
            <div className="chartWrapper">
              <Bar key={isMobileChart ? "mobile" : "desktop"} data={chartData} options={chartOptions} />
            </div>
            <p className="chartCaption">
              Each bar represents kinetic energy in joules at orbital velocity. Red bars show impact energy exceeding military explosives.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Kinetic Energy Calculator */}
      <section className="section physics-section section--calculator">
        <div className="container">
          <h2>Calculate Impact Energy</h2>
          <p className="section-subtitle">Adjust the mass and speed of a debris object to see its kinetic energy in real terms.</p>

          <div className="calculator card calculator--dark">
            {/* Mass Slider */}
            <div className="calculatorRow">
              <div className="sliderGroup">
                <div className="sliderHeader">
                  <label className="sliderLabel">Object Mass</label>
                  <span className="sliderValue">{mass.toFixed(1)}g</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="10000"
                  step="0.1"
                  value={mass}
                  onChange={(e) => {
                    const nextMass = parseFloat(e.target.value);
                    setMass(nextMass);
                    trackCalculatorUsage(nextMass, velocity);
                  }}
                  className="slider"
                />
                <div className="presetButtons">
                  <button className="presetBtn" onClick={() => handleMassPreset(0.1)}>
                    Paint chip (0.1g)
                  </button>
                  <button className="presetBtn" onClick={() => handleMassPreset(10)}>
                    Bolt (10g)
                  </button>
                  <button className="presetBtn" onClick={() => handleMassPreset(200)}>
                    Camera lens (200g)
                  </button>
                  <button className="presetBtn" onClick={() => handleMassPreset(1000)}>
                    CubeSat (1kg)
                  </button>
                  <button className="presetBtn" onClick={() => handleMassPreset(100000)}>
                    Dead satellite (100kg)
                  </button>
                </div>
              </div>
            </div>

            {/* Velocity Slider */}
            <div className="calculatorRow">
              <div className="sliderGroup">
                <div className="sliderHeader">
                  <label className="sliderLabel">Impact Velocity</label>
                  <span className="sliderValue">{velocity.toFixed(2)} km/s</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="0.1"
                  value={velocity}
                  onChange={(e) => {
                    const nextVelocity = parseFloat(e.target.value);
                    setVelocity(nextVelocity);
                    trackCalculatorUsage(mass, nextVelocity);
                  }}
                  className="slider"
                />
                <div className="presetButtons">
                  <button className="presetBtn" onClick={() => handleVelocityPreset(3)}>
                    Slow (3 km/s)
                  </button>
                  <button className="presetBtn" onClick={() => handleVelocityPreset(7.8)}>
                    LEO Average (7.8 km/s)
                  </button>
                  <button className="presetBtn" onClick={() => handleVelocityPreset(11)}>
                    Max Orbital (11 km/s)
                  </button>
                </div>
              </div>
            </div>

            {/* Results Panel */}
            <div className="resultsPanel">
              <div className="technicalNote">
                <strong>Formula:</strong> KE = 0.5 × m(kg) × v(m/s)²
              </div>

              <div className="resultsGrid">
                <div className="resultCard">
                  <div className="resultLabel">Energy</div>
                  <div className="resultValue">
                    {kineticEnergy >= 1000000
                      ? (kineticEnergy / 1000000).toFixed(2) + " MJ"
                      : kineticEnergy.toLocaleString("en-US", { maximumFractionDigits: 0 }) + " J"}
                  </div>
                </div>

                <div className="resultCard">
                  <div className="resultLabel">TNT Equivalent</div>
                  <div className="resultValue">{tntEquivalent.toLocaleString("en-US", { maximumFractionDigits: 1 })}g TNT</div>
                </div>

                <div className="resultCard">
                  <div className="resultLabel">Hand Grenades</div>
                  <div className="resultValue">{grenadesEquivalent.toLocaleString("en-US", { maximumFractionDigits: 2 })}</div>
                </div>

                <div className={`resultCard resultCard--danger ${danger.pulsing ? "pulsing" : ""}`}>
                  <div className="resultLabel">Danger Level</div>
                  <div className={`badge badge--${danger.badge}`} style={{ display: "inline-block", marginTop: "8px" }}>
                    {danger.level}
                  </div>
                  <div className="dangerDescription">{danger.label}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Kessler Cascade */}
      <section className="section physics-section section--cascade">
        <div className="container">
          <h2>The Cascade Effect</h2>
          <p className="section-subtitle">Why debris doesn't just accumulate — it multiplies.</p>

          <div className="cascadeFlow">
            <div className="cascadeTimeline">
              <div className="cascadeTimeline__track" />

              {/* Step 1: Initial Impact */}
              <div className="cascadeStep cascadeStep--timeline cascadeStep--trigger">
                <div className="cascadeStep__node">01</div>
                <div className="cascadeStepContent">
                  <div className="cascadeStepLeft">
                    <h3>Initial Impact</h3>
                  </div>
                  <div className="cascadeStepRight">
                    <p>
                      A single hypervelocity collision shatters both objects into thousands of high-velocity fragments. Each fragment retains roughly the orbital energy of the original object.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2: Fragmentation Cloud */}
              <div className="cascadeStep cascadeStep--timeline cascadeStep--growth">
                <div className="cascadeStep__node">02</div>
                <div className="cascadeStepContent">
                  <div className="cascadeStepLeft">
                    <h3>Fragmentation Cloud</h3>
                  </div>
                  <div className="cascadeStepRight">
                    <p>
                      Fragments spread across a range of orbital altitudes. At LEO densities, each new fragment has a non-zero probability of striking another object within months or years.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3: Self-Sustaining Cascade */}
              <div className="cascadeStep cascadeStep--timeline cascadeStep--failure">
                <div className="cascadeStep__node">03</div>
                <div className="cascadeStepContent">
                  <div className="cascadeStepLeft">
                    <h3>Self-Sustaining Cascade</h3>
                  </div>
                  <div className="cascadeStepRight">
                    <p>
                      Above a critical density threshold, collisions produce fragments faster than atmospheric drag can remove them. The cascade becomes self-sustaining — LEO unusable for centuries.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <KesslerSimulation />
        </div>
      </section>

      {/* Section 4: Technical Appendix */}
      <section className="section physics-section section--appendix">
        <div className="container">
          <h2>The Math Behind This Page</h2>
          <p className="section-subtitle">For the technically curious.</p>

          <div className="technicalCard card">
            <pre className="technicalCode">{`Kinetic Energy Formula:
KE = ½mv²
Where m = mass in kilograms, v = velocity in meters/second

At orbital velocity (7,900 m/s):
- 1g object: KE = 0.5 × 0.001 × 7,900² = 31,205 J
- 10g object: KE = 0.5 × 0.01 × 7,900² = 312,050 J
- 1kg object: KE = 0.5 × 1 × 7,900² = 31,205,000 J

TNT Equivalent Conversion:
1 gram TNT = 4,184 Joules
KE_TNT = KE(J) / 4,184

Sources: Kessler & Cour-Palais (1978), NASA ODPO, 
ESA Space Debris User's Handbook`}</pre>
          </div>

          <div className="attribution">
            <p>
              This calculator was built by <strong>Dhruv Lagu</strong> as part of independent research into orbital debris policy. The physics formulas are standard Newtonian mechanics applied to orbital velocity parameters from ESA's Annual Space Environment Report.
            </p>
          </div>
        </div>
      </section>

      {/* Page Navigation CTA */}
      <div className="container crisisCTA" style={{ marginBottom: "60px" }}>
        <h3>From Equations to Action</h3>
        <p>
          Physics outlines the threat of collision cascades. Policy outlines our response.
          See why international space law is currently failing to stop the cascade.
        </p>
        <div className="crisisCTA__actions">
          <Link className="btn btn--primary" to="/policy">
            Read Policy Pathways →
          </Link>
          <Link className="btn btn--secondary" to="/crisis">
            Back to the Crisis
          </Link>
        </div>
      </div>
    </>
  );
}
