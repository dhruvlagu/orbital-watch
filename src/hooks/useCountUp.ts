import { useEffect, useRef, useState } from "react";

type UseCountUpOptions = {
  durationMs?: number;
  formatter?: (value: number) => string;
};

export function useCountUp(target: number, options: UseCountUpOptions = {}) {
  const { durationMs = 2000, formatter } = options;
  const [display, setDisplay] = useState("0");
  const formatterRef = useRef(formatter);

  useEffect(() => {
    formatterRef.current = formatter;
  }, [formatter]);

  useEffect(() => {
    let frameId: number;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(target * eased);

      if (formatterRef.current) {
        setDisplay(formatterRef.current(value));
      } else {
        setDisplay(String(value));
      }

      if (t < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [target, durationMs]);

  return display;
}

