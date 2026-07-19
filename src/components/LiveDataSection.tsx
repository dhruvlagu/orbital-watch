import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchLiveOrbitalEnvironment,
  type LiveOrbitalResponse,
} from "../services/liveOrbitalData";
import { useCountUp } from "../hooks/useCountUp";
import { useCardSpotlight } from "../hooks/useCardSpotlight";

function hoursAgo(timestamp: number | null) {
  if (!timestamp) return "unknown";
  const diffMs = Date.now() - timestamp;
  if (diffMs < 60 * 1000) return "just now";
  const hours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
  return `${hours} hour${hours === 1 ? "" : "s"} ago`;
}

function WarningIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="liveData__warningIcon">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

const FALLBACK: LiveOrbitalResponse = {
  data: {
    totalTracked: 27000,
    addedLast30Days: 420,
    debrisToActiveRatio: "3:1",
    highestRiskShell: "LEO 800–1000km",
  },
  isFresh: false,
  fromCache: true,
  lastUpdatedAt: null,
};

interface LiveDataSectionProps {
  /** "hero" renders without the outer <section> wrapper, for embedding inside the hero */
  variant?: "hero" | "standalone";
}

export default function LiveDataSection({ variant = "standalone" }: LiveDataSectionProps) {
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<LiveOrbitalResponse>(FALLBACK);
  const isMountedRef = useRef(true);
  const gridRef = useRef<HTMLDivElement>(null);

  useCardSpotlight(gridRef);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const response = await fetchLiveOrbitalEnvironment((freshResponse) => {
          if (!isCancelled) {
            setPayload(freshResponse);
          }
        });
        if (!isCancelled) {
          setPayload(response);
        }
      } catch {
        if (!isCancelled) {
          setPayload(FALLBACK);
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

  const totalTrackedTarget = loading ? 0 : payload.data.totalTracked;
  const added30DaysTarget = loading ? 0 : payload.data.addedLast30Days;

  const animatedTotalTracked = useCountUp(totalTrackedTarget, {
    formatter: (val) => val.toLocaleString(),
  });

  const animatedAddedLast30Days = useCountUp(added30DaysTarget, {
    formatter: (val) => val.toLocaleString(),
  });

  const metricCards = useMemo(
    () => [
      {
        label: "Total tracked objects across all orbital regimes",
        value: animatedTotalTracked,
      },
      {
        label: "Objects added in last 30 days",
        value: animatedAddedLast30Days,
      },
      {
        label: "Current debris-to-active-satellite ratio",
        value: payload.data.debrisToActiveRatio,
      },
      {
        label: "Highest risk orbital shell",
        value: payload.data.highestRiskShell,
      },
    ],
    [animatedTotalTracked, animatedAddedLast30Days, payload],
  );

  const inner = (
    <>
      <div className="liveData__header">
        <div>
          <h2 className="liveData__title">Orbital Environment</h2>
          <p className="liveData__subtitle">
            Real data from Space-Track.org, updated daily.
          </p>
        </div>
        <div className="liveData__headerActions">
          <div className="liveData__metaRow" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="badge badge--blue">
              UPDATED DAILY
            </span>
            {payload.lastUpdatedAt ? (
              <div className="liveData__meta" style={{ margin: 0 }}>
                Last updated: {hoursAgo(payload.lastUpdatedAt)}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="liveData__grid" ref={gridRef}>
        {loading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <div className="card liveDataCard liveDataCard--skeleton" key={idx}>
                <div className="liveDataCard__skeletonValue" />
                <div className="liveDataCard__skeletonLabel" />
              </div>
            ))
          : metricCards.map((metric) => (
              <div className="card liveDataCard" key={metric.label}>
                <div className="liveDataCard__value">{metric.value}</div>
                <div className="liveDataCard__label">{metric.label}</div>
              </div>
            ))}
      </div>

      {/* Error banner - shown below cards when there's an error and NO cached data */}
      {!loading && payload.error && !payload.lastUpdatedAt && (
        <div className="liveData__errorBanner" role="alert">
          <WarningIcon />
          <p className="liveData__errorBannerText">
            {payload.error}
          </p>
        </div>
      )}
    </>
  );

  if (variant === "hero") {
    return <div className="liveData liveData--hero">{inner}</div>;
  }

  return (
    <section className="liveData">
      <div className="container">{inner}</div>
    </section>
  );
}
