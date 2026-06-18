import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * RouteProgressBar — thin blue line at the top of the viewport.
 * Fires on every route change: rushes to ~80%, then completes on next tick.
 */
export default function RouteProgressBar() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  const clear = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  useEffect(() => {
    // Start bar
    setVisible(true);
    setProgress(0);

    // Animate to ~80% quickly, then hold
    let current = 0;
    const tick = () => {
      current = Math.min(current + (80 - current) * 0.12 + 0.4, 80);
      setProgress(current);
      if (current < 79.5) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    // Complete the bar shortly after
    timerRef.current = setTimeout(() => {
      setProgress(100);
      // Fade out after completion
      timerRef.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
    }, 250);

    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="routeProgress"
      style={{ width: `${progress}%`, opacity: progress === 100 ? 0 : 1 }}
      aria-hidden="true"
    />
  );
}
