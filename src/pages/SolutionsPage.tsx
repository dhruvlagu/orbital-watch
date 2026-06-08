import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import StarfieldCanvas from "../components/StarfieldCanvas";

// ─── SSR Audit Data ───────────────────────────────────────────────────────────
const auditCriteria = [
  { pass: true,  text: "Pre-launch collision probability analysis filed" },
  { pass: true,  text: "Automatic identification system (AIS) installed" },
  { pass: true,  text: "Passivation plan submitted (venting fuel tanks at end of life)" },
  { pass: true,  text: "De-orbit plan within 5 years documented" },
  { pass: true,  text: "Propulsion system for active maneuverability" },
  { pass: true,  text: "TLE data shared with Space-Track.org" },
  { pass: false, text: "Laser ranging reflectors installed (enables precise tracking)" },
  { pass: false, text: "Debris removal docking plate installed" },
  { pass: false, text: "On-orbit servicing compatibility designed" },
  { pass: false, text: "Collision avoidance maneuver data shared publicly" },
];

// ─── ADR Mission Data ─────────────────────────────────────────────────────────
const adrMissions = [
  {
    name: "ClearSpace-1",
    org: "ESA",
    badgeClass: "badge--amber",
    badgeLabel: "In Development",
    meta: "Planned 2028 · ESA / ClearSpace SA",
    method: "Four-armed robotic claw capture",
    target: "PROBA-1 satellite (~94 kg, retired 2018)",
    description:
      "The first ESA-contracted debris removal mission. ClearSpace-1 will rendezvous with, capture, and de-orbit ESA's own retired PROBA-1 Earth-observation satellite — sidestepping the sovereignty problem by targeting ESA property. The original target (the VESPA adapter) was struck by debris in 2023 and replaced. A precursor technology demo, PRELUDE, is planned for 2027.",
    challenge: "Scaling from one object to thousands remains unsolved.",
    source: "ESA",
    accentColor: "amber",
  },
  {
    name: "Astroscale ELSA-d",
    org: "Astroscale",
    badgeClass: "badge--blue",
    badgeLabel: "Completed",
    meta: "2021–2024 · Astroscale (Japan / UK)",
    method: "Magnetic docking plate",
    target: null,
    description:
      "Astroscale's End-of-Life Services mission successfully demonstrated magnetic docking and proximity operations in 2021, validating the core capture mechanism with a cooperative (non-tumbling) client. A planned tumbling-target phase was cut short by an on-orbit anomaly in 2022. The mission concluded with a controlled de-orbit in January 2024 — proving proximity navigation works, with caveats.",
    challenge: "Legacy debris has no docking plates, and tumbling capture remains unproven at scale.",
    source: null,
    accentColor: "blue",
  },
  {
    name: "JAXA ADR Program",
    org: "JAXA",
    badgeClass: "badge--blue",
    badgeLabel: "Planned",
    meta: "JAXA · Japan",
    method: "Electrodynamic tether / robotic arm",
    target: "Large rocket bodies (H-IIA upper stages)",
    description:
      "JAXA is developing technology to de-orbit large rocket upper stages using electrodynamic tethers that interact with Earth's magnetic field to slow orbital velocity without fuel.",
    challenge: "Requires international legal framework that doesn't yet exist.",
    source: null,
    accentColor: "blue",
  },
  {
    name: "Space Sustainability Rating",
    org: "SSR",
    badgeClass: "badge--green",
    badgeLabel: "Active",
    meta: "WEF / MIT / ESA consortium",
    method: "Market incentive certification",
    target: null,
    description:
      "The SSR rates satellite missions on sustainability practices — data sharing, collision avoidance, de-orbit planning — and awards a public rating. Operators with high ratings gain reputational and potentially commercial advantages.",
    challenge: "Voluntary — no legal force.",
    source: null,
    accentColor: "green",
  },
];

// ─── Economics Panels ─────────────────────────────────────────────────────────
const economicsPanels = [
  {
    icon: "🥧",
    title: "The Commons Problem",
    body: "No nation or company owns orbital lanes. LEO is a global commons like the ocean or the atmosphere. Economic theory — first described by Garrett Hardin in 1968 — predicts that when a resource is shared, individuals acting in self-interest will deplete it, even when it's not in anyone's collective interest.",
    accent: "blue",
  },
  {
    icon: "🧮",
    title: "The Cleanup Math",
    body: "Removing one piece of large debris costs an estimated $100M–$300M per object. At 25,000+ objects, the math is brutal: even at the low end, full LEO cleanup exceeds $2.5 trillion. The nation that pays gets no exclusive benefit — cleaner orbits help every spacefaring nation equally. So no single actor will volunteer to foot the bill.",
    accent: "amber",
  },
  {
    icon: "🤝",
    title: "The Solution Framework",
    listItems: [
      "Liability expansion — make debris creators pay for future collision risk",
      "Market incentives — SSR ratings and insurance premiums that reward cleanup",
      "International cost-sharing — treaty-based funding pool (like the Montreal Protocol for ozone) for collective debris removal",
    ],
    accent: "green",
  },
];

// ─── Circular SSR Gauge ────────────────────────────────────────────────────────
function SSRGauge({ score, total }: { score: number; total: number }) {
  const [animated, setAnimated] = useState(false);
  const gaugeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = gaugeRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimated(true);
          obs.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const pct = score / total;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - (animated ? pct : 0));

  return (
    <div className="ssrGauge" ref={gaugeRef} aria-label={`SSR score ${score} out of ${total}`}>
      <svg viewBox="0 0 140 140" className="ssrGauge__svg" aria-hidden="true">
        {/* Track */}
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="10"
        />
        {/* Progress arc */}
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke="#f5a623"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)" }}
        />
        {/* Glow filter */}
        <defs>
          <filter id="gaugeGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Score text */}
        <text x="70" y="64" textAnchor="middle" className="ssrGauge__scoreText">{score}/{total}</text>
        <text x="70" y="84" textAnchor="middle" className="ssrGauge__ratingText">Silver</text>
      </svg>
    </div>
  );
}

// ─── Scroll-reveal hook ────────────────────────────────────────────────────────
function useRevealOnScroll(selector: string, threshold = 0.15) {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(selector);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [selector]);
}

// ─── Page Component ────────────────────────────────────────────────────────────
export default function SolutionsPage() {
  useRevealOnScroll(".sol-reveal");

  return (
    <section className="solutionsPage">
      <StarfieldCanvas />

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="container solHero">
        <div className="hero__label">ACTIVE DEBRIS REMOVAL</div>
        <h1 className="solHero__title">
          Technology Exists.{" "}
          <span className="solHero__title--dim">Law Doesn't.</span>
        </h1>
        <p className="solHero__subtitle">
          Active debris removal is technically feasible. The barriers are legal
          and economic — not scientific.
        </p>
        <div className="solHero__pills">
          <span className="badge badge--amber">Legal Paralysis</span>
          <span className="badge badge--blue">ADR Technology</span>
          <span className="badge badge--green">Market Solutions</span>
        </div>
      </div>

      {/* ── Section 1: Sovereignty Trap ──────────────────────────────────────── */}
      <div className="solSection solSection--sovereignty">
        <div className="container">
          <div className="solSection__header sol-reveal">
            <div className="hero__label">Section 01</div>
            <h2>Why We Can't Just Clean It Up</h2>
          </div>

          <div className="sovereigntyCallout sol-reveal">
            <div className="sovereigntyCallout__icon" aria-hidden="true">⚠️</div>
            <p className="sovereigntyCallout__text">
              "The same robot arm that removes dead satellite debris could
              theoretically disable an active military satellite. This single
              fact has paralyzed international debris removal negotiations for
              over a decade."
            </p>
          </div>

          <div className="sovereigntyGrid sol-reveal">
            <div className="card sovereigntyCard">
              <div className="sovereigntyCard__label">THE LEGAL REALITY</div>
              <h3 className="sovereigntyCard__title">Article VIII &amp; the Sovereignty Trap</h3>
              <p>
                Under Article VIII of the 1967 Outer Space Treaty, a nation
                retains 'jurisdiction and control' over objects it launches into
                space — <em>permanently</em>. This means that a derelict Russian
                rocket body orbiting at 800 km is still legally Russian property.
                No other nation or entity can touch it without explicit Russian
                government consent.
              </p>
              <p>
                This creates the <strong>'Sovereignty Trap'</strong>: the objects
                most dangerous to other satellites — abandoned military hardware,
                derelict spy satellites — are the exact objects whose owners are
                least likely to grant removal consent.
              </p>
              <div className="sovereigntyCard__treaty">
                <span className="badge badge--blue">1967 Outer Space Treaty · Article VIII</span>
              </div>
            </div>

            <div className="card sovereigntyCard sovereigntyCard--amber">
              <div className="sovereigntyCard__label sovereigntyCard__label--amber">
                THE SECURITY FEAR
              </div>
              <h3 className="sovereigntyCard__title">The Dual-Use Dilemma</h3>
              <p>
                Nations fear that any robotic system capable of grabbing a piece
                of debris is also capable of grabbing an active military
                satellite. This dual-use problem means that even a purely
                civilian ADR mission would face intense geopolitical resistance
                from nations viewing it as a potential weapons system.
              </p>
              <p>
                No inspection regime currently exists that could credibly verify
                a removal craft's intent before it approaches a target. That
                makes the dual-use concern technically unfalsifiable — and
                therefore politically insurmountable without a new class of
                international verification treaty.
              </p>
              <div className="sovereigntyCard__dualUse">
                <div className="dualUseRow">
                  <span className="dualUseRow__label dualUseRow__label--blue">Intended Use</span>
                  <span className="dualUseRow__value">Capture &amp; de-orbit dead debris</span>
                </div>
                <div className="dualUseRow__divider" aria-hidden="true">↕</div>
                <div className="dualUseRow">
                  <span className="dualUseRow__label dualUseRow__label--red">Perceived Risk</span>
                  <span className="dualUseRow__value">Disable active military satellite</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: ADR Missions ───────────────────────────────────────────── */}
      <div className="solSection solSection--adr">
        <div className="container">
          <div className="solSection__header sol-reveal">
            <div className="hero__label">Section 02</div>
            <h2>The Space Tow Trucks</h2>
            <p className="solSection__subtitle">
              Current and planned missions attempting to solve the cleanup problem.
            </p>
          </div>

          <div className="adrGrid">
            {adrMissions.map((mission) => (
              <article
                key={mission.name}
                className={`card adrCard adrCard--${mission.accentColor} sol-reveal`}
              >
                <div className="adrCard__header">
                  <div>
                    <div className="adrCard__org">{mission.org}</div>
                    <h3 className="adrCard__name">{mission.name}</h3>
                  </div>
                  <span className={`badge ${mission.badgeClass}`}>{mission.badgeLabel}</span>
                </div>

                <div className="adrCard__meta">{mission.meta}</div>

                <div className="adrCard__method">
                  <span className="adrCard__methodLabel">Method</span>
                  <span className="adrCard__methodValue">{mission.method}</span>
                </div>

                {mission.target && (
                  <div className="adrCard__method">
                    <span className="adrCard__methodLabel">Target</span>
                    <span className="adrCard__methodValue">{mission.target}</span>
                  </div>
                )}

                <p className="adrCard__description">{mission.description}</p>

                <div className="adrCard__challenge">
                  <span className="adrCard__challengeLabel">⚡ Key Challenge</span>
                  <span className="adrCard__challengeValue">{mission.challenge}</span>
                </div>

                {mission.source && (
                  <div className="adrCard__source">Source: {mission.source}</div>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 3: Economics ─────────────────────────────────────────────── */}
      <div className="solSection solSection--economics">
        <div className="container">
          <div className="solSection__header sol-reveal">
            <div className="hero__label">Section 03</div>
            <h2>The Tragedy of the Commons</h2>
            <p className="solSection__subtitle">
              Space is the ultimate shared resource — and economics tells us
              shared resources get exploited without governance.
            </p>
          </div>

          <div className="economicsGrid">
            {economicsPanels.map((panel, i) => (
              <div
                key={panel.title}
                className={`card economicsCard economicsCard--${panel.accent} sol-reveal`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="economicsCard__icon" aria-hidden="true">{panel.icon}</div>
                <h3 className="economicsCard__title">{panel.title}</h3>
                {panel.body && <p className="economicsCard__body">{panel.body}</p>}
                {panel.listItems && (
                  <ol className="economicsCard__list">
                    {panel.listItems.map((item, j) => (
                      <li key={j} className="economicsCard__listItem">{item}</li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 4: SSR Audit ──────────────────────────────────────────────── */}
      <div className="solSection solSection--audit">
        <div className="container">
          <div className="solSection__header sol-reveal">
            <div className="hero__label">Section 04</div>
            <h2>What Does Responsible Look Like?</h2>
            <p className="solSection__subtitle">
              A mock Space Sustainability Rating audit for a hypothetical
              satellite mission.
            </p>
          </div>

          <div className="auditLayout sol-reveal">
            {/* Checklist */}
            <div className="card auditCard">
              <div className="auditCard__header">
                <h3 className="auditCard__title">SSR Audit Checklist</h3>
                <span className="badge badge--blue">10 Criteria</span>
              </div>
              <ul className="auditList" aria-label="SSR audit criteria">
                {auditCriteria.map((item, i) => (
                  <li key={i} className={`auditList__item ${item.pass ? "auditList__item--pass" : "auditList__item--fail"}`}>
                    <span className="auditList__icon" aria-hidden="true">
                      {item.pass ? "✅" : "❌"}
                    </span>
                    <span className="auditList__text">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Score panel */}
            <div className="auditScore">
              <div className="card auditScoreCard">
                <h3 className="auditScoreCard__title">SSR Score</h3>
                <SSRGauge score={6} total={10} />
                <div className="auditScoreCard__rating">Silver Rating</div>
                <div className="auditScoreCard__breakdown">
                  <div className="auditScoreCard__row">
                    <span>Passed</span>
                    <span className="auditScoreCard__value auditScoreCard__value--pass">6</span>
                  </div>
                  <div className="auditScoreCard__row">
                    <span>Failed</span>
                    <span className="auditScoreCard__value auditScoreCard__value--fail">4</span>
                  </div>
                  <div className="auditScoreCard__row">
                    <span>Total</span>
                    <span className="auditScoreCard__value">10</span>
                  </div>
                </div>

                <div className="auditRatingScale">
                  {[
                    { label: "Bronze", range: "1–5", color: "#cd7f32", active: false },
                    { label: "Silver", range: "6–8", color: "#f5a623", active: true },
                    { label: "Gold",   range: "9–10", color: "#ffd700", active: false },
                  ].map((tier) => (
                    <div
                      key={tier.label}
                      className={`auditRatingScale__tier ${tier.active ? "auditRatingScale__tier--active" : ""}`}
                      style={{ "--tier-color": tier.color } as React.CSSProperties}
                    >
                      <span className="auditRatingScale__name">{tier.label}</span>
                      <span className="auditRatingScale__range">{tier.range}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card auditNote">
                <div className="auditNote__icon" aria-hidden="true">🏆</div>
                <p className="auditNote__text">
                  A <strong>Gold rating (9–10)</strong> earns preferred launch
                  slots at ESA facilities and favorable insurance premiums from
                  Lloyd's of London.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <div className="container crisisCTA sol-reveal">
        <h3>From Solutions to Action</h3>
        <p>
          Technology is only one part. Understand the policy levers and
          the history that brought us here.
        </p>
        <div className="crisisCTA__actions">
          <Link className="btn btn--primary" to="/policy">
            Policy Pathways →
          </Link>
          <Link className="btn btn--secondary" to="/crisis">
            The Crisis
          </Link>
        </div>
      </div>
    </section>
  );
}
