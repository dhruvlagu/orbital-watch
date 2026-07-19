import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import StarfieldCanvas from "../components/StarfieldCanvas";
import { useDocumentMetadata } from "../hooks/useDocumentMetadata";
import { useCardSpotlight } from "../hooks/useCardSpotlight";
import { useMagneticButton } from "../hooks/useMagneticButton";
import {
  fetchConjunctions,
  type ConjunctionEvent,
  type ConjunctionResponse,
  type RiskTier,
} from "../services/conjunctionData";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hoursAgo(timestamp: number | null): string {
  if (!timestamp) return "unknown";
  const diffMs = Date.now() - timestamp;
  if (diffMs < 60 * 1000) return "just now";
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"} ago`;
}

function getCountdown(tcaMs: number): string {
  const diff = tcaMs - Date.now();
  if (diff <= 0) return "PASSED";
  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatMissDistance(metres: number): { text: string; urgent: boolean } {
  const urgent = metres < 1000;
  const text =
    metres < 1000
      ? `${metres.toFixed(0)} m`
      : `${(metres / 1000).toFixed(1)} km`;
  return { text, urgent };
}

function formatPc(pc: number): string {
  if (pc === 0) return "< 1×10⁻⁶";
  const exp = Math.floor(Math.log10(pc));
  const mantissa = pc / Math.pow(10, exp);
  return `${mantissa.toFixed(2)} × 10${superscript(exp)}`;
}

function superscript(n: number): string {
  const supers: Record<string, string> = {
    "-": "⁻",
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
  };
  return String(n)
    .split("")
    .map((c) => supers[c] ?? c)
    .join("");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RiskBadge({ tier, emergency }: { tier: RiskTier; emergency: boolean }) {
  const tierMap: Record<RiskTier, { cls: string; label: string }> = {
    ELEVATED: { cls: "badge badge--amber", label: "ELEVATED" },
    MONITORED: { cls: "badge badge--blue", label: "MONITORED" },
    LOW: { cls: "badge badge--green", label: "LOW" },
    UNKNOWN: { cls: "badge badge--muted", label: "UNKNOWN" },
  };
  const { cls, label } = tierMap[tier];
  // Tooltip strings must reflect the thresholds in src/services/conjunctionData.ts
  const tierTooltip: Record<RiskTier, string> = {
    ELEVATED: "Probability of collision at or above 1 in 1,000 — the higher end of publicly modeled conjunction risk.",
    MONITORED: "Probability of collision between roughly 1 in 10,000 and 1 in 1,000 — being tracked, not currently high-risk.",
    LOW: "Probability of collision below 1 in 10,000 — the lower end of modeled conjunction risk, though still tracked.",
    UNKNOWN: "Probability of collision not publicly disclosed for this event.",
  };

  const emergencyTooltip =
    "Flagged by the 18th Space Defense Squadron as meeting emergency reporting criteria — notified directly to the satellite operators involved.";

  return (
    <div className="cw__badgeRow">
      <div className="tooltipContainer" style={{ marginLeft: 0 }}>
        <span className={cls} tabIndex={0} aria-label={`Risk tier: ${label}`}>
          {label}
        </span>
        <div className="tooltipText">{tierTooltip[tier]}</div>
      </div>
      {emergency && (
        <div className="tooltipContainer" style={{ marginLeft: 0 }} onClick={(e) => e.stopPropagation()}>
          <span className="badge badge--red" tabIndex={0} aria-label="Emergency reportable">⚠ EMERGENCY REPORTABLE</span>
          <div className="tooltipText">{emergencyTooltip}</div>
        </div>
      )}
    </div>
  );
}

function CountdownCell({ tcaMs }: { tcaMs: number }) {
  const [display, setDisplay] = useState(() => getCountdown(tcaMs));

  useEffect(() => {
    // Update every 60 seconds — don't re-render every second
    const id = window.setInterval(() => {
      setDisplay(getCountdown(tcaMs));
    }, 60_000);
    return () => window.clearInterval(id);
  }, [tcaMs]);

  return (
    <div
      className="cw__countdown"
      title={new Date(tcaMs).toUTCString()}
      aria-label={`Time to closest approach: ${display}`}
    >
      {display}
    </div>
  );
}

function ConjunctionCard({ event }: { event: ConjunctionEvent }) {
  const dist = formatMissDistance(event.missDistanceM);
  const pcFormatted = event.pc === null ? "Not publicly disclosed" : formatPc(event.pc);

  return (
    <article className="card cw__card reveal-item">
      {/* Object names */}
      <div className="cw__objects">
        <span className="cw__satName">{event.sat1Name}</span>
        <svg
          className="cw__crossIcon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          aria-hidden="true"
          width="18"
          height="18"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        <span className="cw__satName">{event.sat2Name}</span>
      </div>

      {/* Risk badge row */}
      <RiskBadge tier={event.riskTier} emergency={event.emergencyReportable} />

      {/* Countdown */}
      <div className="cw__countdown__label">Time to Closest Approach (TCA)</div>
      <CountdownCell tcaMs={event.tcaMs} />

      {/* Miss distance */}
      <div className="cw__metaRow">
        <div className="cw__metaItem">
          <span className="cw__metaLabel">Predicted Miss Distance</span>
          <span
            className="cw__metaValue"
            style={{ color: dist.urgent ? "var(--accent-amber)" : undefined }}
          >
            {dist.text}
          </span>
        </div>

        {/* Probability */}
        <div className="cw__metaItem">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="cw__metaLabel">Pc</span>
            <div className="tooltipContainer" onClick={(e) => e.stopPropagation()}>
              <span className="infoIcon" tabIndex={0} aria-label="Pc definition">ⓘ</span>
              <div className="tooltipText">
                <a href="#what-is-pc">Click to view the definition of Pc</a>
              </div>
            </div>
          </div>
          <span className="cw__metaValue cw__pc">{pcFormatted}</span>
        </div>
      </div>

      {/* Plain-English odds */}
      <div className="cw__odds">
        {event.pc === null ? (
          "Not publicly disclosed"
        ) : (
          <>≈ {event.oddsString} chance of collision</>
        )}
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="card cw__card cw__card--skeleton" aria-hidden="true">
      <div className="cw__skeleton cw__skeleton--title" />
      <div className="cw__skeleton cw__skeleton--badge" />
      <div className="cw__skeleton cw__skeleton--countdown" />
      <div className="cw__skeleton cw__skeleton--meta" />
      <div className="cw__skeleton cw__skeleton--odds" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const FALLBACK_RESPONSE: ConjunctionResponse = {
  events: [],
  count: 0,
  fromCache: true,
  isFresh: false,
  lastUpdatedAt: null,
};

// MAGNETIC BUTTON AUDIT: "Try the Impact Calculator →" button uses magnetic effect
export default function CollisionWatchPage() {
  useDocumentMetadata(
    "Collision Watch | Conjunction Alerts | Orbital Watch",
    "Predicted close approaches between tracked objects in orbit, updated 3x daily and sourced from the U.S. Space Force's public conjunction data feed (CDM Public class).",
  );

  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<ConjunctionResponse>(FALLBACK_RESPONSE);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [sortMode, setSortMode] = useState<"SOONEST" | "HIGHEST_RISK">("SOONEST");
  const [timeTick, setTimeTick] = useState(Date.now());
  const isMountedRef = useRef(true);
  const gridRef = useRef<HTMLDivElement>(null);
  const physicsButtonRef = useRef<HTMLAnchorElement>(null);

  useMagneticButton(physicsButtonRef);

  useCardSpotlight(gridRef);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
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

  // Scroll-reveal IntersectionObserver — identical pattern to CrisisPage
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(".reveal-item");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.1 },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading]); // re-run after loading resolves so newly mounted cards are observed

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const response = await fetchConjunctions((freshResponse) => {
          if (!isCancelled && isMountedRef.current) {
            setPayload(freshResponse);
          }
        });
        if (!isCancelled) {
          setPayload(response);
        }
      } catch {
        if (!isCancelled) {
          setPayload(FALLBACK_RESPONSE);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Ensure anchor links to #what-is-pc scroll the heading to center of viewport
  useEffect(() => {
    const selector = 'a[href="#what-is-pc"]';
    const handler = (e: Event) => {
      e.preventDefault();
      const el = document.getElementById("what-is-pc");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // update the hash without jumping
        if (history && typeof history.replaceState === "function") {
          history.replaceState(null, "", "#what-is-pc");
        }
      }
    };

    const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>(selector));
    anchors.forEach((a) => a.addEventListener("click", handler));

    // If page loaded with hash, scroll to center
    if (window.location.hash === "#what-is-pc") {
      setTimeout(() => {
        const el = document.getElementById("what-is-pc");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 120);
    }

    return () => anchors.forEach((a) => a.removeEventListener("click", handler));
  }, []);

  const hasEvents = payload.events.length > 0;

  // Filter out events whose TCA has already passed (client-side, real-time)
  const activeEvents = useMemo(
    () => payload.events.filter((e) => e.tcaMs > Date.now()),
    [payload.events, timeTick],
  );

  // Periodic tick to force activeEvents re-evaluation (same 60s interval as CountdownCell)
  useEffect(() => {
    const id = window.setInterval(() => {
      setTimeTick(Date.now());
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  // Memoize to avoid re-sorting on every render; support client-side sort modes
  const sortedEvents = useMemo(() => {
    const events = [...activeEvents];
    if (sortMode === "SOONEST") {
      return events.sort((a, b) => a.tcaMs - b.tcaMs);
    }

    // HIGHEST_RISK: sort by pc descending, treating null pc as lowest priority (sent to end). Tie-break by soonest TCA.
    return events.sort((a, b) => {
      const pa = a.pc ?? -Infinity;
      const pb = b.pc ?? -Infinity;
      if (pa === pb) return a.tcaMs - b.tcaMs;
      return pb - pa;
    });
  }, [activeEvents, sortMode]);

  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="hero cw__hero">
        <StarfieldCanvas />
        <div className="hero__overlay">
          <div className="container hero__inner">
            <div className="hero__content">
              <div className="hero__label cw__heroLabel">
                UPDATED 3X DAILY · SPACE-TRACK CDM PUBLIC
              </div>

              <h1 className="hero__headline cw__heroHeadline">
                Collision{" "}
                <span style={{ color: "var(--accent-blue)" }}>Watch</span>
              </h1>

              <p className="hero__subheadline">
                Predicted close approaches between tracked objects in orbit
                — updated 3x daily and sourced from the U.S. Space Force's public conjunction
                data feed.
              </p>

              {/* Disclaimer callout */}
              <div className="cw__disclaimer reveal-item">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  style={{ flexShrink: 0, marginTop: 2 }}
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>
                  This shows the <strong>publicly released subset</strong> of
                  conjunction screenings. Some operators opt out of public
                  release, and Pc
                  <span className="tooltipContainer" style={{ marginLeft: 0 }}>
                    <span className="infoIcon" tabIndex={0} aria-label="Pc definition">ⓘ</span>
                    <div className="tooltipText">
                      <a href="#what-is-pc">Click to view the definition of Pc</a>
                    </div>
                  </span>
                  values may be withheld or rounded for
                  sensitive assets. This is a partial picture, not a complete
                  risk map.
                </span>
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

      {/* ── Main Section ────────────────────────────────────────────────────── */}
      <section className="section cw__section">
        <div className="container">

          {/* Section header */}
          <div className="cw__sectionHeader reveal-item">
            <div>
              <span className="cw__sectionLabel">UPCOMING EVENTS</span>
              <h2 className="cw__sectionTitle">Upcoming Close Approaches</h2>
              <div className="cw__sectionSubtitle">
                Default sort: Soonest-first. Toggle to "Highest Risk" to sort by Pc
                <span className="tooltipContainer" style={{ marginLeft: 0 }}>
                  <span className="infoIcon" tabIndex={0} aria-label="Pc definition">ⓘ</span>
                  <div className="tooltipText">
                      <a href="#what-is-pc">Click to view the definition of Pc</a>
                  </div>
                </span>
                . Pc values are from the U.S. Space Surveillance Network.
              </div>
            </div>

            {/* Live / cache badge */}
            <div className="cw__statusBadge">
              {loading ? null : (
                <>
                  {payload.isFresh && !payload.fromCache && (
                    <span className="badge badge--blue">
                      UPDATED 3X DAILY
                    </span>
                  )}
                  {payload.lastUpdatedAt && (
                    <span className="cw__cacheLabel">
                      <span className="cw__liveDot" /> Countdown times are live · Conjunction data last refreshed: {hoursAgo(payload.lastUpdatedAt)}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Error / stale banner */}
          {!loading && payload.error && (
            <div className="cw__errorBanner reveal-item" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              {payload.lastUpdatedAt
                ? `Fetch failed — showing the last refreshed conjunction data, from ${hoursAgo(payload.lastUpdatedAt)}. Countdown times shown are still calculated live against this data.`
                : "No conjunction data currently available — cache may be empty."}
            </div>
          )}

          {/* Card grid */}
          {!loading && hasEvents && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div
                className="cw__summary"
                style={{ color: "var(--text-secondary)", fontSize: "0.9rem", textAlign: "left" }}
              >
                {activeEvents.length} conjunctions tracked · {activeEvents.filter((e) => e.riskTier === "ELEVATED").length} at elevated risk
              </div>

              <div style={{ display: "flex", gap: 8 }} role="tablist" aria-label="Sort events">
                <button
                  type="button"
                  className={sortMode === "SOONEST" ? "btn btn--primary" : "btn btn--secondary"}
                  onClick={() => setSortMode("SOONEST")}
                >
                  Soonest
                </button>
                <button
                  type="button"
                  className={sortMode === "HIGHEST_RISK" ? "btn btn--primary" : "btn btn--secondary"}
                  onClick={() => setSortMode("HIGHEST_RISK")}
                >
                  Highest Risk
                </button>
              </div>
            </div>
          )}
          <div className="cw__grid" ref={gridRef}>
            {loading ? (
              // Skeleton loading state
              Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            ) : !hasEvents ? (
              // Empty state
              <div className="card cw__emptyState">
                <div className="cw__emptyIcon" aria-hidden="true">📡</div>
                <h3>No conjunction data available</h3>
                <p>
                  {payload.lastUpdatedAt
                    ? `Last refreshed conjunction data is from ${hoursAgo(payload.lastUpdatedAt)}. Check back shortly for the next scheduled update.`
                    : "Space-Track.org may be temporarily unreachable. This data updates a few times daily."}
                </p>
              </div>
            ) : (
              sortedEvents.map((event) => (
                <ConjunctionCard key={event.id} event={event} />
              ))
            )}
          </div>

          {/* ── What Is Pc? ───────────────────────────────────────────────── */}
          <div id="what-is-pc" className="card cw__explainerCard reveal-item">
            <div className="cw__explainerHeader">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--accent-blue)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <h3 className="cw__explainerTitle">What Is Pc?</h3>
            </div>
            <p className="cw__explainerBody">
              <strong>Pc (probability of collision)</strong> is not the literal
              chance two objects will collide — it's the modeled probability
              that both objects will pass within a specified combined distance of
              each other at time of closest approach, given known uncertainty in
              their tracked positions. It is deliberately conservative: when in
              doubt, the models overestimate risk rather than underestimate it.
              A Pc of 1×10⁻⁴ (0.01%) is considered operationally significant
              and typically triggers avoidance maneuver planning.
            </p>
            <p className="cw__explainerBody" style={{ marginTop: "16px" }}>
              <strong>A common misconception: a smaller miss distance doesn't
              always mean a higher Pc.</strong> Pc depends on three things
              together — miss distance, the combined physical size of both
              objects, and how *precisely* their positions are actually known.
              An object with a longer tracking history and precise orbit
              determination can have a moderate miss distance but very low Pc,
              because its position is tightly known. An object with sparse or
              older tracking data can have a larger miss distance but higher Pc,
              because its true position could plausibly be anywhere within a
              wider uncertainty region — some of which may overlap the collision
              zone even at a seemingly comfortable distance. Counterintuitively,
              Pc can decrease again at very extreme uncertainty, since the same
              probability gets spread across such a large area that its
              concentration over the actual collision zone thins out. This is
              why sorting by "Highest Risk" (Pc) on this page sometimes surfaces
              an event with a larger miss distance above one with a smaller
              miss distance — that's expected behavior, not an error.
            </p>
            <div style={{ display: "flex", gap: "32px", marginTop: "24px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <svg width="100%" height="120" viewBox="0 0 200 120" aria-hidden="true">
                  <circle cx="60" cy="60" r="20" fill="var(--accent-blue)" opacity="0.2" />
                  <circle cx="140" cy="60" r="20" fill="var(--accent-blue)" opacity="0.2" />
                  <circle cx="60" cy="60" r="4" fill="var(--accent-blue)" />
                  <circle cx="140" cy="60" r="4" fill="var(--accent-blue)" />
                  <text x="100" y="100" textAnchor="middle" fontSize="11" fill="var(--text-secondary)" style={{ fontFamily: "system-ui, sans-serif" }}>Precisely tracked: small uncertainty cloud</text>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <svg width="100%" height="120" viewBox="0 0 200 120" aria-hidden="true">
                  <circle cx="60" cy="60" r="45" fill="var(--accent-amber)" opacity="0.2" />
                  <circle cx="140" cy="60" r="45" fill="var(--accent-amber)" opacity="0.2" />
                  <circle cx="60" cy="60" r="4" fill="var(--accent-amber)" />
                  <circle cx="140" cy="60" r="4" fill="var(--accent-amber)" />
                  <text x="100" y="100" textAnchor="middle" fontSize="11" fill="var(--text-secondary)" style={{ fontFamily: "system-ui, sans-serif" }}>Poorly tracked: large uncertainty cloud</text>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer CTA ──────────────────────────────────────────────────────── */}
      <div className="container crisisCTA" style={{ marginBottom: "60px" }}>
        <h3>Curious about the physics?</h3>
        <p>
          At orbital velocities, even a 10-gram bolt carries the kinetic energy
          of a grenade. Try the impact calculator to understand why miss
          distances of hundreds of metres still matter enormously.
        </p>
        <div className="crisisCTA__actions">
          <Link ref={physicsButtonRef} className="btn btn--primary" to="/physics">
            Try the Impact Calculator →
          </Link>
          <Link className="btn btn--secondary" to="/crisis">
            Back to the Crisis
          </Link>
        </div>
      </div>
    </>
  );
}
