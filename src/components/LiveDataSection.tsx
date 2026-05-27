import { useEffect, useMemo, useState } from "react";
import {
  fetchLiveOrbitalEnvironment,
  type LiveOrbitalResponse,
} from "../lib/liveOrbitalData";

function hoursAgo(timestamp: number | null) {
  if (!timestamp) return "unknown";
  const hours = Math.max(1, Math.floor((Date.now() - timestamp) / (1000 * 60 * 60)));
  return `${hours} hour${hours === 1 ? "" : "s"} ago`;
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

export default function LiveDataSection() {
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<LiveOrbitalResponse>(FALLBACK);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const response = await fetchLiveOrbitalEnvironment();
        if (!isCancelled) setPayload(response);
      } catch {
        if (!isCancelled) setPayload(FALLBACK);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    load();
    return () => {
      isCancelled = true;
    };
  }, []);

  const metricCards = useMemo(
    () => [
      {
        label: "Total tracked objects",
        value: payload.data.totalTracked.toLocaleString(),
      },
      {
        label: "Objects added in last 30 days",
        value: payload.data.addedLast30Days.toLocaleString(),
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
    [payload],
  );

  return (
    <section className="liveData">
      <div className="container">
        <div className="liveData__header">
          <div>
            <h2 className="liveData__title">Live Orbital Environment</h2>
            <p className="liveData__subtitle">
              Real data from Space-Track.org, updated daily.
            </p>
          </div>
          {payload.isFresh && !payload.fromCache ? (
            <span className="badge badge--green liveData__liveBadge">
              <span className="liveData__pulseDot" />
              LIVE
            </span>
          ) : null}
        </div>

        {payload.fromCache ? (
          <div className="liveData__meta">Last updated: {hoursAgo(payload.lastUpdatedAt)}</div>
        ) : null}

        <div className="liveData__grid">
          {loading
            ? [1, 2, 3, 4].map((idx) => (
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
      </div>
    </section>
  );
}

