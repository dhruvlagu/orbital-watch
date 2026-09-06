import { useEffect, useRef } from "react";

interface UseMagneticButtonOptions {
  strength?: number;
  maxMovement?: number;
}

export function useMagneticButton(
  ref: React.RefObject<HTMLElement>,
  options: UseMagneticButtonOptions = {}
) {
  const { strength = 0.3, maxMovement = 8 } = options;
  const rafRef = useRef<number | null>(null);
  const isActiveRef = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Check for fine pointer (mouse) and respect reduced motion preference
    const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!hasFinePointer || prefersReducedMotion) return;

    let rect: DOMRect;

    const updateMagneticPosition = (clientX: number, clientY: number) => {
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;
      const normalizedX = (localX / rect.width) * 2 - 1;
      const normalizedY = (localY / rect.height) * 2 - 1;

      const magneticX = Math.max(-maxMovement, Math.min(maxMovement, normalizedX * maxMovement * strength));
      const magneticY = Math.max(-maxMovement, Math.min(maxMovement, normalizedY * maxMovement * strength));

      element.style.setProperty("--magnetic-x", `${magneticX}px`);
      element.style.setProperty("--magnetic-y", `${magneticY}px`);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isActiveRef.current) return;

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        updateMagneticPosition(e.clientX, e.clientY);
        rafRef.current = null;
      });
    };

    const handlePointerEnter = () => {
      rect = element.getBoundingClientRect();
      isActiveRef.current = true;
      element.style.willChange = "transform";
    };

    const handlePointerLeave = () => {
      isActiveRef.current = false;
      
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      // Reset position
      element.style.setProperty("--magnetic-x", "0px");
      element.style.setProperty("--magnetic-y", "0px");
      
      // Remove will-change after transition completes
      setTimeout(() => {
        element.style.removeProperty("will-change");
      }, 550); // Matches the CSS transition duration
    };

    element.addEventListener("pointermove", handlePointerMove);
    element.addEventListener("pointerenter", handlePointerEnter);
    element.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      element.removeEventListener("pointermove", handlePointerMove);
      element.removeEventListener("pointerenter", handlePointerEnter);
      element.removeEventListener("pointerleave", handlePointerLeave);

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      element.style.removeProperty("--magnetic-x");
      element.style.removeProperty("--magnetic-y");
      element.style.removeProperty("will-change");
    };
  }, [ref, strength, maxMovement]);
}
