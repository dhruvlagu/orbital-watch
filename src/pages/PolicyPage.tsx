import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCountUp } from "../hooks/useCountUp";
import { useDocumentMetadata } from "../hooks/useDocumentMetadata";

type Policy = {
  id: string;
  name: string;
  description: string;
  impact: number;
  tooltip: string;
};

const policyOptions: Policy[] = [
  {
    id: "iadc",
    name: "Make IADC Guidelines Legally Binding",
    description: "Transform voluntary international debris mitigation standards into enforceable international law with compliance monitoring.",
    impact: 8000,
    tooltip: "Based on ESA compliance modeling showing ~16% reduction in debris generation if all spacefaring nations followed IADC guidelines",
  },
  {
    id: "asat",
    name: "Global Ban on ASAT Missile Tests",
    description: "International treaty prohibiting all destructive anti-satellite weapons tests that generate trackable debris.",
    impact: 5000,
    tooltip: "Prevents recurrence of events like China 2007 (+150,000 fragments) and Russia 2021 (+1,500 fragments)",
  },
  {
    id: "adr",
    name: "Create International Debris Removal Authority",
    description: "A UN-backed body with legal authority and dedicated funding to conduct active debris removal missions on high-risk objects.",
    impact: 15000,
    tooltip: "Modeled on Liou et al. (2021) finding that removing 5 large objects per year stabilizes LEO debris density",
  },
  {
    id: "fiveyear",
    name: "Extend 5-Year De-orbit Rule Globally",
    description: "Apply the FCC's 5-Year Rule to all spacefaring nations through an international agreement — not just US-licensed operators.",
    impact: 10000,
    tooltip: "Currently only ~30% of global launches are FCC-licensed; global extension covers the remaining 70%",
  },
];
// Consolidated useCountValue helper to useCountUp hook

type EnforcementTone = "red" | "amber" | "green";

type Treaty = {
  year: string;
  name: string;
  jurisdiction: string;
  description: string;
  enforcementTone: EnforcementTone;
  enforcementLabel: string;
  enforcementLevel: number;
  whyItMatters: string;
  isMissing?: boolean;
};

type NationScore = {
  nation: string;
  mitigation: number;
  mitigationNote: string;
  asat: number;
  asatNote: string;
  adr: number;
  adrNote: string;
  grade: string;
  note: string;
};

type SortKey = keyof NationScore;

const treaties: Treaty[] = [
  {
    year: "1967",
    name: "Outer Space Treaty",
    jurisdiction: "International (118 nations)",
    description:
      "The foundational document of space law. Declares space the 'province of all mankind' and prohibits weapons of mass destruction in orbit. Critically, Article VIII establishes that nations retain permanent jurisdiction and control over objects they launch, even after those objects become debris. This sovereignty clause is the primary legal barrier to international debris removal today.",
    enforcementTone: "red",
    enforcementLabel: "Voluntary / No Enforcement Mechanism",
    enforcementLevel: 1,
    whyItMatters:
      "Legally prevents any nation from removing another's debris without explicit consent.",
  },
  {
    year: "1972",
    name: "Liability Convention",
    jurisdiction: "International",
    description:
      "Establishes that launching nations are liable for damage caused by their space objects on Earth's surface and, in cases of fault, in orbit. In 1978, Canada invoked the Convention after the nuclear-powered Cosmos 954 satellite crashed in Canadian territory. In 1981, the USSR paid Canada $3M CAD in a diplomatic settlement — notably without formally admitting liability. It remains the only time the Convention has been invoked between states, and no nation has ever faced consequences specifically for orbital debris damage.",
    enforcementTone: "amber",
    enforcementLabel: "Partially Binding / Rarely Enforced",
    enforcementLevel: 2,
    whyItMatters:
      "The sole precedent under this treaty was resolved diplomatically, not legally — revealing the limits of its enforcement mechanism.",
  },
  {
    year: "2002",
    name: "IADC Debris Mitigation Guidelines",
    jurisdiction: "International (voluntary)",
    description:
      "The Inter-Agency Space Debris Coordination Committee published a set of guidelines recommending debris mitigation practices including a 25-year de-orbit rule and passivation of rocket stages. These guidelines were adopted by the UN in 2007 as the UN Space Debris Mitigation Guidelines. However, they carry no legal force, so compliance is entirely voluntary and unverifiable.",
    enforcementTone: "red",
    enforcementLabel: "Voluntary / No Legal Force",
    enforcementLevel: 1,
    whyItMatters: "Nations routinely ignored these guidelines when compliance was expensive.",
  },
  {
    year: "2022",
    name: "FCC 5-Year Rule",
    jurisdiction: "United States Only",
    description:
      "The Federal Communications Commission updated its orbital debris rules to require that US-licensed satellites operating in LEO must de-orbit within five years of mission end, down from the previous 25-year standard. This is the strongest enforceable debris regulation in existence. However, it applies only to operators licensed by the FCC, leaving China, Russia, and others uncovered.",
    enforcementTone: "green",
    enforcementLabel: "Legally Binding / Actively Enforced",
    enforcementLevel: 4,
    whyItMatters:
      "The first real enforcement mechanism, but covers less than 30% of global launches.",
  },
  {
    year: "MISSING",
    name: "International ADR Framework",
    jurisdiction: "Does Not Exist",
    description:
      "No international treaty currently authorizes or funds active debris removal missions targeting objects owned by other nations. The combination of the 1967 Treaty's sovereignty clause and geopolitical distrust between major spacefaring nations has prevented any binding agreement on mandatory cleanup. This is the most critical gap in space law.",
    enforcementTone: "red",
    enforcementLabel: "Does Not Exist",
    enforcementLevel: 0,
    whyItMatters: "Without this, the Sovereignty Trap cannot be broken.",
    isMissing: true,
  },
];

const nationScores: NationScore[] = [
  {
    nation: "USA",
    mitigation: 4,
    mitigationNote: "FCC 5-Year Rule sets strong domestic standard",
    asat: 3,
    asatNote:
      "Conducted ASAT test in 2008 (Operation Burnt Frost) but at low altitude to minimize debris",
    adr: 4,
    adrNote: "DARPA, NASA funding ClearSpace and ADR research",
    grade: "B+",
    note: "Leader in domestic regulation but hasn't ratified key international agreements",
  },
  {
    nation: "Russia",
    mitigation: 2,
    mitigationNote: "Poor compliance record, aging satellite fleet",
    asat: 1,
    asatNote:
      "2021 ASAT test of Cosmos 1408 created 1,500+ trackable fragments, forced ISS evasive maneuvers",
    adr: 1,
    adrNote: "No significant ADR program or investment",
    grade: "D",
    note: "2021 ASAT test widely condemned as reckless by international community",
  },
  {
    nation: "China",
    mitigation: 2,
    mitigationNote: "Growing compliance with own megaconstellation but historical record is poor",
    asat: 1,
    asatNote:
      "2007 Fengyun-1C test remains the single most destructive debris event in history",
    adr: 2,
    adrNote: "Developing domestic ADR capability but not sharing data internationally",
    grade: "D+",
    note: "Responsible for largest single debris event in history",
  },
  {
    nation: "ESA (Europe)",
    mitigation: 5,
    mitigationNote:
      "Highest compliance rate of any space agency, leads international guideline development",
    asat: 5,
    asatNote: "No ASAT tests conducted, actively opposes them",
    adr: 5,
    adrNote:
      "ClearSpace-1 mission, active debris research, Space Debris Office in Darmstadt",
    grade: "A",
    note: "Global leader in debris mitigation, limited by lack of binding international authority",
  },
  {
    nation: "India",
    mitigation: 3,
    mitigationNote: "Improving compliance with growing space program",
    asat: 2,
    asatNote:
      "2019 Mission Shakti ASAT test at ~282 km altitude; debris designed to decay within 45 days per DRDO",
    adr: 2,
    adrNote: "Early stage ADR research, limited funding",
    grade: "C",
    note: "2019 test showed restraint in altitude selection, unlike China's 2007 test",
  },
];

const sortOptions: { label: string; value: SortKey }[] = [
  { label: "Overall Grade", value: "grade" },
  { label: "Nation", value: "nation" },
  { label: "Mitigation Compliance", value: "mitigation" },
  { label: "ASAT History", value: "asat" },
  { label: "ADR Investment", value: "adr" },
  { label: "Notes", value: "note" },
];

const gradeRanks: Record<string, number> = {
  A: 12,
  "A-": 11,
  "B+": 10,
  B: 9,
  "B-": 8,
  "C+": 7,
  C: 6,
  "C-": 5,
  "D+": 4,
  D: 3,
  "D-": 2,
  F: 1,
};

function EnforcementMeter({ level }: { level: number }) {
  return (
    <div className="policyMeter" aria-label={`${level} out of 5 enforcement strength`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span
          className={index < level ? "policyMeter__dot is-filled" : "policyMeter__dot"}
          key={index}
        />
      ))}
    </div>
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <span className="policyStars" aria-label={`${value} out of 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span className={index < value ? "is-filled" : ""} key={index}>
          {index < value ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

function ScoreCell({ value, note }: { value: number; note: string }) {
  return (
    <div className="policyScoreCell">
      <StarRating value={value} />
      <span>{note}</span>
    </div>
  );
}

export default function PolicyPage() {
  useDocumentMetadata(
    "Policy | Space Sustainability Scorecard",
    "Review treaty gaps, legal liability, and a country-by-country scorecard for orbital debris mitigation and space sustainability."
  );

  const [sortKey, setSortKey] = useState<SortKey>("grade");
  const [activeToggles, setActiveToggles] = useState<string[]>([]);

  const handleToggle = (id: string) => {
    const isActive = activeToggles.includes(id);
    const policy = policyOptions.find((option) => option.id === id);

    setActiveToggles((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );

    if (typeof window === "undefined") return;

    const gtagFn = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtagFn === "function") {
      gtagFn("event", "simulator_toggled", {
        policy_name: policy?.name ?? id,
        new_state: isActive ? "off" : "on",
      });
    }
  };

  const totalReduction = activeToggles.reduce((sum, id) => {
    const policy = policyOptions.find((p) => p.id === id);
    return sum + (policy ? policy.impact : 0);
  }, 0);

  const resultValue = 50000 - totalReduction;
  const animatedValue = useCountUp(resultValue, {
    startFromZero: false,
    durationMs: 1000,
    formatter: (v) => v.toLocaleString(),
  });

  let statusBadgeText = "";
  let statusBadgeColor = "";
  let displayColor = "";

  if (resultValue > 40000) {
    statusBadgeText = "⚠ CRITICAL — Kessler Cascade Risk";
    statusBadgeColor = "red";
    displayColor = "#ff3b3b";
  } else if (resultValue >= 25000) {
    statusBadgeText = "⚡ DANGEROUS";
    statusBadgeColor = "amber";
    displayColor = "#f5a623";
  } else if (resultValue >= 15000) {
    statusBadgeText = "↓ MANAGEABLE";
    statusBadgeColor = "blue";
    displayColor = "#00d4ff";
  } else {
    statusBadgeText = "✓ STABILIZING";
    statusBadgeColor = "green";
    displayColor = "#00d464";
  }

  const needlePos = Math.max(5, Math.min(95, (resultValue / 50000) * 90));
  const allTogglesOn = activeToggles.length === policyOptions.length;

  const displaySubtitle = activeToggles.length === 0
    ? "Baseline projection with no new policy action"
    : allTogglesOn
      ? "Best-case projection with all proposed policy reforms"
      : `Projected path with ${activeToggles.length} active reform${activeToggles.length > 1 ? "s" : ""}`;


  const sortedScores = useMemo(() => {
    return [...nationScores].sort((a, b) => {
      if (sortKey === "grade") return gradeRanks[b.grade] - gradeRanks[a.grade];
      if (sortKey === "mitigation" || sortKey === "asat" || sortKey === "adr") {
        return b[sortKey] - a[sortKey];
      }
      return String(a[sortKey]).localeCompare(String(b[sortKey]));
    });
  }, [sortKey]);

  return (
    <section className="policyPage">
      <div className="container policyHero">
        <div className="policyHero__label">The Policy Landscape</div>
        <h1>Why Policy Is Failing Orbit</h1>
        <p>
          A complete picture of space law, what exists, what's enforced, and what's missing.
        </p>
        <div className="policyWarningBanner">
          <span aria-hidden="true">⚠</span>
          The 1967 Outer Space Treaty has not been meaningfully amended in 59 years.
        </div>
      </div>

      <div className="container policySection">
        <div className="policySection__header">
          <div>
            <h2>Space Law Timeline</h2>
            <p>Every major international agreement, rated by enforcement strength.</p>
          </div>
        </div>

        <div className="policyTimeline">
          {treaties.map((treaty) => (
            <article
              className={treaty.isMissing ? "policyTreatyCard is-missing" : "policyTreatyCard"}
              key={`${treaty.year}-${treaty.name}`}
            >
              <div className="policyTreatyCard__year">{treaty.year}</div>
              <div className="policyTreatyCard__body">
                <div className="policyTreatyCard__topline">
                  <h3>{treaty.name}</h3>
                  <span className="badge badge--blue">{treaty.jurisdiction}</span>
                </div>
                <p>{treaty.description}</p>
                <div className="policyEnforcement">
                  <span className={`badge badge--${treaty.enforcementTone}`}>
                    {treaty.enforcementLabel}
                  </span>
                  <EnforcementMeter level={treaty.enforcementLevel} />
                </div>
                <div className="policyTreatyCard__why">
                  <span>Why It Matters</span>
                  {treaty.whyItMatters}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="container policySection policySection--scorecard">
        <div className="policySection__header policySection__header--withControl">
          <div>
            <h2>Who's Responsible?</h2>
            <p>
              Rating major spacefaring nations on debris mitigation compliance, ASAT weapons
              testing, and investment in cleanup technology.
            </p>
          </div>
          <label className="policySort">
            <span>Sort by</span>
            <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
              {sortOptions.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="policyTableWrap">
          <table className="policyTable">
            <thead>
              <tr>
                <th>Nation</th>
                <th>Mitigation Compliance</th>
                <th>ASAT History</th>
                <th>ADR Investment</th>
                <th>Overall Grade</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {sortedScores.map((score) => (
                <tr key={score.nation}>
                  <th scope="row">{score.nation}</th>
                  <td>
                    <ScoreCell value={score.mitigation} note={score.mitigationNote} />
                  </td>
                  <td>
                    <ScoreCell value={score.asat} note={score.asatNote} />
                  </td>
                  <td>
                    <ScoreCell value={score.adr} note={score.adrNote} />
                  </td>
                  <td>
                    <span className="policyGrade">{score.grade}</span>
                  </td>
                  <td>{score.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="policySourceNote">
          Ratings based on public records from ESA Annual Space Environment Report, NASA ODPO, and
          Secure World Foundation Annual Report. Research by Dhruv Lagu.
        </div>
      </div>

      {/* Treaty Reform Simulator Section */}
      <div className="container policySection policySection--simulator">
        <div className="simulatorHeader">
          <h2>What If We Fixed It?</h2>
          <p>
            Toggle policy reforms below and see their projected impact on LEO debris density by 2050.
            Projections are illustrative, modeled on debris growth research from Liou et al. (2021) and
            ESA Space Environment Report 2023.
          </p>
        </div>

        <div className="simulatorGrid">
          {/* Central Display Card */}
          <div className="card simulatorDisplay">
            <div className="displayLabel">Projected LEO Objects by 2050</div>
            <div className="displayNumber" style={{ color: displayColor }}>
              {animatedValue}
            </div>
            <div className={`badge badge--${statusBadgeColor} displayBadge`}>
              {statusBadgeText}
            </div>

            <div className="progressBarContainer">
              <div className="progressBarTrack" aria-hidden="true">
                <div className="progressBarNeedle" style={{ left: `${needlePos}%` }} />
              </div>
              <div className="progressBarLabels">
                <span>Stabilizing</span>
                <span>Critical</span>
              </div>
            </div>

            <div className="displaySubtitle">{displaySubtitle}</div>

            {!allTogglesOn ? null : (
              <div className="bestCaseBanner">
                <span className="bestCaseIcon">✓</span>
                <p>
                  <strong>Best Case Scenario:</strong> With all reforms enacted, models suggest LEO debris could stabilize below current levels by 2075.
                </p>
              </div>
            )}
          </div>

          {/* Toggles Grid */}
          <div className="togglesGrid">
            {policyOptions.map((policy) => {
              const isOn = activeToggles.includes(policy.id);
              return (
                <div
                  key={policy.id}
                  className={isOn ? "card toggleCard is-active" : "card toggleCard"}
                  onClick={() => handleToggle(policy.id)}
                  role="checkbox"
                  aria-checked={isOn}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleToggle(policy.id);
                    }
                  }}
                >
                  <div className="toggleCardHeader">
                    <div className="toggleSwitchContainer">
                      <span className={isOn ? "toggleSwitch is-on" : "toggleSwitch"} />
                    </div>
                    <span className="policyName">{policy.name}</span>
                    <div className="tooltipContainer" onClick={(e) => e.stopPropagation()}>
                      <span className="infoIcon" tabIndex={0} aria-label="Learn more about this logic">ⓘ</span>
                      <div className="tooltipText">{policy.tooltip}</div>
                    </div>
                  </div>
                  <p className="policyDesc">{policy.description}</p>
                  <div className="policyImpact">
                    {isOn ? (
                      <span className="text-green">
                        Projected reduction: {policy.impact.toLocaleString()} objects
                      </span>
                    ) : (
                      <span className="text-muted">
                        Projected reduction: {policy.impact.toLocaleString()} objects
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Obstacles Section */}
      <div className="container policySection policySection--obstacles">
        <div className="obstaclesHeader">
          <h2>What's Standing in the Way?</h2>
          <p>Enacting these reforms requires overcoming deep structural and geopolitical barriers.</p>
        </div>
        <div className="obstaclesGrid">
          <Link to="/solutions" className="card obstacleCard">
            <div>
              <h3>The Sovereignty Trap</h3>
              <p>The 1967 Outer Space Treaty prevents any nation from cleaning up or touching space debris without the owner nation's explicit consent, legally blocking active cleanup.</p>
            </div>
            <span className="obstacleLink">Explore Solutions →</span>
          </Link>
          <Link to="/solutions" className="card obstacleCard">
            <div>
              <h3>Geopolitical Distrust</h3>
              <p>US, Russia, and China treat space as a military domain, refusing to share precise tracking data or active debris removal technology due to espionage and weaponization fears.</p>
            </div>
            <span className="obstacleLink">Explore Solutions →</span>
          </Link>
          <Link to="/solutions" className="card obstacleCard">
            <div>
              <h3>The Economics</h3>
              <p>Space orbits are a global commons. Like oceanic plastic, no single nation or private operator has a direct financial incentive to pay for cleaning up debris they don't own.</p>
            </div>
            <span className="obstacleLink">Explore Solutions →</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

