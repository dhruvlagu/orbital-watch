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
    let centerX: number;
    let centerY: number;

    const updateMagneticPosition = (clientX: number, clientY: number) => {
      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;

      // Apply magnetic strength and clamp to max movement
      const magneticX = Math.max(-maxMovement, Math.min(maxMovement, deltaX * strength));
      const magneticY = Math.max(-maxMovement, Math.min(maxMovement, deltaY * strength));

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
      centerX = rect.left + rect.width / 2;
      centerY = rect.top + rect.height / 2;
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
