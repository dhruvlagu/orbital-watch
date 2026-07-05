import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchLiveOrbitalEnvironment,
  forceRefreshLiveOrbitalEnvironment,
  type LiveOrbitalResponse,
} from "../services/liveOrbitalData";
import { useCountUp } from "../hooks/useCountUp";

const REFRESH_COOLDOWN_MS = 45 * 1000;
const REFRESH_FEEDBACK_MS = 3500;
const REFRESH_COOLDOWN_STORAGE_KEY = "spaceTrackManualRefreshCooldownV1";

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number>(() => {
    try {
      const raw = Number(localStorage.getItem(REFRESH_COOLDOWN_STORAGE_KEY) ?? "0");
      return Number.isFinite(raw) ? raw : 0;
    } catch {
      return 0;
    }
  });
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const isMountedRef = useRef(true);

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

  useEffect(() => {
    if (!cooldownUntil) return;
    const intervalId = window.setInterval(() => {
      if (cooldownUntil <= Date.now()) {
        setCooldownUntil(0);
        try {
          localStorage.removeItem(REFRESH_COOLDOWN_STORAGE_KEY);
        } catch {
          // ignore storage errors
        }
      }
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [cooldownUntil]);

  useEffect(() => {
    if (!feedbackMessage) return;
    const timeoutId = window.setTimeout(() => setFeedbackMessage(null), REFRESH_FEEDBACK_MS);
    return () => window.clearTimeout(timeoutId);
  }, [feedbackMessage]);

  const totalTrackedTarget = loading ? 0 : payload.data.totalTracked;
  const added30DaysTarget = loading ? 0 : payload.data.addedLast30Days;
  const cooldownActive = cooldownUntil > Date.now();
  const cooldownSeconds = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));

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

  const handleRefresh = async () => {
    if (isRefreshing || cooldownActive || !isMountedRef.current) return;

    setIsRefreshing(true);
    setFeedbackMessage(null);

    const cooldownAt = Date.now() + REFRESH_COOLDOWN_MS;
    setCooldownUntil(cooldownAt);
    try {
      localStorage.setItem(REFRESH_COOLDOWN_STORAGE_KEY, String(cooldownAt));
    } catch {
      // ignore storage errors
    }

    try {
      const response = await forceRefreshLiveOrbitalEnvironment();
      if (!isMountedRef.current) return;
      setPayload(response);
    } catch {
      if (!isMountedRef.current) return;
      setFeedbackMessage("Refresh failed, showing last known data");
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  };

  const inner = (
    <>
      <div className="liveData__header">
        <div>
          <h2 className="liveData__title">Live Orbital Environment</h2>
          <p className="liveData__subtitle">
            Real data from Space-Track.org, updated live.
          </p>
        </div>
        <div className="liveData__headerActions">
          {payload.isFresh && !payload.fromCache ? (
            <span className="badge badge--green liveData__liveBadge">
              <span className="liveData__pulseDot" />
              LIVE
            </span>
          ) : (
            <div className="liveData__metaRow">
              {payload.fromCache ? (
                <div className="liveData__meta">Last updated: {hoursAgo(payload.lastUpdatedAt)}</div>
              ) : null}
              <button
                type="button"
                className={`liveData__refreshButton${isRefreshing ? " liveData__refreshButton--spinning" : ""}`}
                onClick={handleRefresh}
                disabled={isRefreshing || cooldownActive}
                aria-label="Refresh live orbital data"
              >
                <svg viewBox="0 0 24 24" className="liveData__refreshIcon" aria-hidden="true">
                  <path d="M21 12a9 9 0 1 1-2.3-5.7L21 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 3v6h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {cooldownActive ? (
                <span className="liveData__refreshLabel">Refresh in {cooldownSeconds}s</span>
              ) : null}
            </div>
          )}
        </div>
      </div>
      {feedbackMessage ? <p className="liveData__refreshFeedback">{feedbackMessage}</p> : null}

      <div className="liveData__grid">
        {loading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <div className="card liveDataCard liveDataCard--skeleton" key={idx}>
                <div className="liveDataCard__skeletonValue" />
                <div className="liveDataCard__skeletonLabel" />
              </div>
            ))
          : payload.error
            ? (
              <div className="card liveDataCard liveData__errorState">
                <div className="liveData__errorHeader">
                  <WarningIcon />
                  <p className="liveData__errorText">
                    Live data unavailable — displaying last cached data.
                    <br />
                    Space-Track.org may be temporarily unreachable.
                  </p>
                </div>
                {payload.lastUpdatedAt && (
                  <p className="liveData__errorMeta">Last updated: {hoursAgo(payload.lastUpdatedAt)}</p>
                )}
              </div>
            )
            : metricCards.map((metric) => (
              <div className="card liveDataCard" key={metric.label}>
                <div className="liveDataCard__value">{metric.value}</div>
                <div className="liveDataCard__label">{metric.label}</div>
              </div>
            ))}
      </div>
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
