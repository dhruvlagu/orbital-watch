import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * RouteProgressBar — thin blue line at the top of the viewport.
 * Fires on every route change: rushes to ~80% via CSS transition, then completes.
 * Animation is CSS-driven to avoid main thread blocking on pages with heavy canvas animations.
 */
export default function RouteProgressBar() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [transitionEnabled, setTransitionEnabled] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const isCompletingRef = useRef(false);

  const clear = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  useEffect(() => {
    // Reset completion flag on new route
    isCompletingRef.current = false;
    
    // Start bar: reset to 0 with no transition
    setVisible(true);
    setProgress(0);
    setTransitionEnabled(false);

    // In the next frame, enable transition and animate to 80%
    rafRef.current = requestAnimationFrame(() => {
      setTransitionEnabled(true);
      setProgress(80);
    });

    // Complete the bar after a short delay
    timerRef.current = setTimeout(() => {
      if (isCompletingRef.current) return;
      isCompletingRef.current = true;
      setProgress(100);
      // Fade out after completion
      timerRef.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
        setTransitionEnabled(false);
      }, 300);
    }, 350);

    return clear;
  }, [location.pathname]);

  // Fallback: if bar is stuck visible for too long, force completion
  useEffect(() => {
    if (visible && progress < 100 && !isCompletingRef.current) {
      const fallbackTimer = setTimeout(() => {
        if (isCompletingRef.current) return;
        isCompletingRef.current = true;
        setProgress(100);
        setTimeout(() => {
          setVisible(false);
          setProgress(0);
          setTransitionEnabled(false);
        }, 300);
      }, 2000);
      return () => clearTimeout(fallbackTimer);
    }
  }, [visible, progress]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="routeProgress"
      style={{
        width: `${progress}%`,
        opacity: progress === 100 ? 0 : 1,
        transition: transitionEnabled ? 'width 250ms ease-out' : 'none'
      }}
      aria-hidden="true"
    />
  );
}
