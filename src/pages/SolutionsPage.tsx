import { useEffect, useRef, useState } from "react";
import { useRevealOnScroll } from "../hooks/useRevealOnScroll";
import { Link } from "react-router-dom";
import { useDocumentMetadata } from "../hooks/useDocumentMetadata";
import { useCardSpotlight } from "../hooks/useCardSpotlight";
import { useMagneticButton } from "../hooks/useMagneticButton";
import StarfieldCanvas from "../components/StarfieldCanvas";

// ─── SSR Audit Data ───────────────────────────────────────────────────────────
const auditCriteria = [
  { pass: true, text: "Pre-launch collision probability analysis filed" },
  { pass: true, text: "Detectability, identification, and tracking (DIT) plan filed" },
  { pass: true, text: "Passivation plan submitted (venting fuel tanks at end of life)" },
  { pass: true, text: "De-orbit plan within 5 years documented" },
  { pass: true, text: "Propulsion system for active maneuverability" },
  { pass: true, text: "TLE data shared with Space-Track.org" },
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
    meta: "Planned 2029 · ESA / ClearSpace SA",
    method: "Four-armed robotic claw capture",
    target: "PROBA-1 satellite (~94 kg; Earth-observation operations ended December 2022)",
    description:
      "The first ESA-contracted debris removal mission. ClearSpace-1 will rendezvous with, capture, and de-orbit ESA's own PROBA-1 Earth-observation satellite — sidestepping the sovereignty problem by targeting ESA property. The original target (the VESPA adapter) was struck by debris in 2023 and replaced. A precursor technology demo, PRELUDE, is planned for 2027.",
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
    source: "Astroscale",
    accentColor: "blue",
  },
  {
    name: "ADRAS-J2 (CRD2)",
    org: "JAXA / Astroscale",
    badgeClass: "badge--blue",
    badgeLabel: "Planned",
    meta: "Planned · JAXA / Astroscale · Japan",
    method: "Robotic arm capture",
    target: "H-IIA upper stage (launched 2009)",
    description:
      "JAXA's current active debris-removal effort is the Commercial Removal of Debris Demonstration 2 (CRD2) program, with ADRAS-J2 contracted to Astroscale. The mission will use robotic-arm capture to de-orbit a large H-IIA rocket upper stage left in orbit since 2009. An earlier JAXA electrodynamic-tether experiment (KITE, 2016) failed to deploy its tether — a separate, earlier concept.",
    challenge: "Requires international legal framework that doesn't yet exist.",
    source: "JAXA / Astroscale",
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
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
        <path d="M22 12A10 10 0 0 0 12 2v10z"/>
      </svg>
    ),
    title: "The Commons Problem",
    body: "No nation or company owns orbital lanes. LEO is a global commons like the ocean or the atmosphere. Economic theory — first described by Garrett Hardin in 1968 — predicts that when a resource is shared, individuals acting in self-interest will deplete it, even when it's not in anyone's collective interest.",
    accent: "blue",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2"/>
        <line x1="8" y1="6" x2="16" y2="6"/>
        <line x1="8" y1="10" x2="16" y2="10"/>
        <line x1="8" y1="14" x2="12" y2="14"/>
        <line x1="8" y1="18" x2="10" y2="18"/>
      </svg>
    ),
    title: "The Cleanup Math",
    body: "Removing a single large derelict object costs roughly $80\u2013$100M per mission at today\u2019s prices (e.g., ESA ClearSpace-1 ~\u20AC86M; JAXA ADRAS-J2 ~$82M). Even clearing only the largest, most dangerous objects \u2014 a few thousand rocket bodies and dead satellites by most estimates \u2014 would cost tens of billions. Removing every tracked catalog object would cost far more. The nation that pays gets no exclusive benefit \u2014 cleaner orbits help every spacefaring nation equally. So no single actor will volunteer to foot the bill.",
    accent: "amber",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: "The Solution Framework",
    listItems: [
      "Liability expansion \u2014 make debris creators pay for future collision risk",
      "Market incentives \u2014 SSR ratings and insurance premiums that reward cleanup",
      "International cost-sharing \u2014 treaty-based funding pool (like the Montreal Protocol for ozone) for collective debris removal",
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
      { threshold: 0.15 }
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
        <text x="70" y="84" textAnchor="middle" className="ssrGauge__ratingText">Mock</text>
      </svg>
    </div>
  );
}


// ─── Page Component ────────────────────────────────────────────────────────────
// MAGNETIC BUTTON AUDIT: "Get Involved →" button uses magnetic effect
export default function SolutionsPage() {
  useDocumentMetadata(
    "Solutions | Active Debris Removal & Sustainability | Orbital Watch",
    "Inspect active debris removal concepts, robotic capture systems, and the legal and economic barriers to cleaning up low Earth orbit."
  );

  const sovereigntyRef = useRef<HTMLDivElement>(null);
  const adrRef = useRef<HTMLDivElement>(null);
  const economicsRef = useRef<HTMLDivElement>(null);
  const auditRef = useRef<HTMLDivElement>(null);
  const getInvolvedButtonRef = useRef<HTMLAnchorElement>(null);

  useMagneticButton(getInvolvedButtonRef);
  useCardSpotlight(sovereigntyRef);
  useCardSpotlight(adrRef);
  useCardSpotlight(economicsRef);
  useCardSpotlight(auditRef);

  // Scroll-reveal IntersectionObserver
  useRevealOnScroll(".reveal-item", null, 0.15);

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
          Active debris removal works in principle — and has been demonstrated in orbit.
          The remaining barriers are legal, economic, and geopolitical — not a lack of basic engineering.
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
          <div className="solSection__header reveal-item">
            <div className="hero__label">Section 01</div>
            <h2>Why We Can't Just Clean It Up</h2>
          </div>

          <div className="sovereigntyCallout reveal-item">
            <div className="sovereigntyCallout__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <p className="sovereigntyCallout__text">
              The same robot arm that removes dead satellite debris could theoretically disable an active military satellite. This dual-use fear has shaped space security debates since at least the late 2010s, and no binding international framework has resolved it.
            </p>
          </div>

          <div className="sovereigntyGrid reveal-item" ref={sovereigntyRef}>
            <div className="card sovereigntyCard">
              <div className="sovereigntyCard__label">THE LEGAL REALITY</div>
              <h3 className="sovereigntyCard__title">Article VIII &amp; the Sovereignty Trap</h3>
              <p>
                Under Article VIII of the 1967 Outer Space Treaty, a nation
                retains 'jurisdiction and control' over objects it launches into
                space for as long as the object remains in space. This means that a derelict Russian
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
                a removal craft&apos;s intent before it approaches a target. The
                Outer Space Treaty&apos;s Article XI requires only vague
                &apos;due regard&apos; and general disclosure — not pre-approach
                verification of intent. That makes the dual-use concern hard to
                dismiss — which has so far blocked agreement without a new
                verification framework.
              </p>
              <div className="adrCard__source">Source: Global Security Review (space-law analysis)</div>
            </div>

            <div className="sovereigntyDualUseBar reveal-item" style={{ ["--reveal-i" as any]: 2 }}>
              <div className="card sovereigntyCard sovereigntyCard--amber">
                <div className="sovereigntyCard__dualUse">
                  <div className="dualUseRow">
                    <span className="dualUseRow__label dualUseRow__label--blue">Intended Use</span>
                    <span className="dualUseRow__value">Capture &amp; de-orbit dead debris</span>
                  </div>
                  <div className="dualUseRow__divider" aria-hidden="true">→</div>
                  <div className="dualUseRow">
                    <span className="dualUseRow__label dualUseRow__label--red">Perceived Risk</span>
                    <span className="dualUseRow__value">Disable active military satellite</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: ADR Missions ───────────────────────────────────────────── */}
      <div className="solSection solSection--adr">
        <div className="container">
          <div className="solSection__header reveal-item">
            <div className="hero__label">Section 02</div>
            <h2>Active Removal Missions</h2>
            <p className="solSection__subtitle">
              Current and planned missions attempting to solve the cleanup problem.
            </p>
          </div>

          <div className="adrGrid" ref={adrRef}>
            {adrMissions.map((mission, index) => (
              <article
                key={mission.name}
                className={`card adrCard adrCard--${mission.accentColor} reveal-item`}
                style={{ ["--reveal-i" as any]: Math.min(index, 8) }}
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
                  <span className="adrCard__challengeLabel">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',verticalAlign:'middle',marginRight:'4px'}} aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    Key Challenge
                  </span>
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
          <div className="solSection__header reveal-item">
            <div className="hero__label">Section 03</div>
            <h2>The Tragedy of the Commons</h2>
            <p className="solSection__subtitle">
              Space is the ultimate shared resource — and economics tells us
              shared resources get exploited without governance.
            </p>
          </div>

          <div className="economicsGrid" ref={economicsRef}>
            {economicsPanels.map((panel, i) => (
              <div
                key={panel.title}
                className={`card economicsCard economicsCard--${panel.accent} ${panel.listItems ? 'economicsCard--full' : ''} reveal-item`}
                style={{ ["--reveal-i" as any]: Math.min(i, 8) }}
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
          <div className="solSection__header reveal-item">
            <div className="hero__label">Section 04</div>
            <h2>What Does Responsible Look Like?</h2>
            <p className="solSection__subtitle">
              A mock Space Sustainability Rating audit for a hypothetical
              satellite mission.
            </p>
            <p className="auditContext">
              Hypothetical mid-size commercial satellite, scored on an illustrative
              10-point checklist — not the official SSR scoring model. Real SSR uses
              six weighted modules and percentage-based tiers (Bronze 40–55%, Silver
              56–70%, Gold 71–80%, Platinum 81–100%). Criteria pre-selected to reflect
              common real-world compliance gaps.
            </p>
          </div>

          <div className="auditLayout reveal-item" ref={auditRef}>
            {/* Checklist */}
            <div className="card auditCard">
              <div className="auditCard__header">
                <h3 className="auditCard__title">Mock Audit Checklist</h3>
                <span className="badge badge--blue">10 Criteria</span>
              </div>
              <ul className="auditList" aria-label="SSR audit criteria">
                {auditCriteria.map((item, i) => (
                  <li key={i} className={`auditList__item ${item.pass ? "auditList__item--pass" : "auditList__item--fail"} reveal-item`} style={{ ["--reveal-i" as any]: Math.min(i, 8) }}>
                    <span className="auditList__icon" aria-hidden="true">
                      {item.pass ? (
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      )}
                    </span>
                    <span className="auditList__text">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Score panel */}
            <div className="auditScore">
              <div className="card auditScoreCard">
                <h3 className="auditScoreCard__title">Mock Score</h3>
                <SSRGauge score={6} total={10} />
                <div className="auditScoreCard__rating">6/10 (Illustrative)</div>
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
                    { label: "Bronze", range: "40–55%", color: "#cd7f32", active: false },
                    { label: "Silver", range: "56–70%", color: "#f5a623", active: false },
                    { label: "Gold", range: "71–80%", color: "#ffd700", active: false },
                    { label: "Platinum", range: "81–100%", color: "#e8e8e8", active: false },
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
                <div className="auditNote__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="8 21 12 21 16 21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                    <path d="M7 4H4a2 2 0 0 0-2 2v1a4 4 0 0 0 4 4h.5"/>
                    <path d="M17 4h3a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4h-.5"/>
                    <path d="M7 4a5 5 0 0 0 10 0H7z"/>
                  </svg>
                </div>
                <p className="auditNote__text">
                  Per the SSR program&apos;s operators (EPFL / WEF), a favorable
                  score <em>might</em> result in lower insurance costs or improved
                  funding conditions from financial backers — the incentive the
                  rating is designed to create, not a guaranteed benefit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <div className="container crisisCTA reveal-item" style={{ marginBottom: "60px" }}>
        <h3>From Solutions to Action</h3>
        <p>
          Demonstrations prove the engineering. Scaling cleanup still depends on law,
          funding, and political will. Explore how you can support space sustainability
          efforts and advocate for LEO protection.
        </p>
        <div className="crisisCTA__actions">
          <Link ref={getInvolvedButtonRef} className="btn btn--primary" to="/get-involved">
            Get Involved →
          </Link>
          <Link className="btn btn--secondary" to="/policy">
            Back to Policy
          </Link>
        </div>
      </div>
    </section>
  );
}
