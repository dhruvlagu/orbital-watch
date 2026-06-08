import { useEffect, useRef, useState } from "react";

type UseCountUpOptions = {
  durationMs?: number;
  formatter?: (value: number) => string;
  startFromZero?: boolean;
};

export function useCountUp(target: number, options: UseCountUpOptions = {}) {
  const { durationMs = 2000, formatter, startFromZero = true } = options;
  const [display, setDisplay] = useState("0");
  const formatterRef = useRef(formatter);
  const prevTargetRef = useRef(startFromZero ? 0 : target);

  useEffect(() => {
    formatterRef.current = formatter;
  }, [formatter]);

  useEffect(() => {
    let frameId: number;
    const start = performance.now();
    const startVal = startFromZero ? 0 : prevTargetRef.current;
    const diff = target - startVal;

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(startVal + diff * eased);

      if (formatterRef.current) {
        setDisplay(formatterRef.current(value));
      } else {
        setDisplay(String(value));
      }

      if (t < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        prevTargetRef.current = target;
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frameId);
  }, [target, durationMs, startFromZero]);

  return display;
}


