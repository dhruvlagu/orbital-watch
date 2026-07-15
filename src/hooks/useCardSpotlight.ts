import { useEffect } from "react";

export function useCardSpotlight(containerRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Skip on touch devices and when reduced motion is preferred —
    // this is a pure hover/mouse effect, not meaningful on touch
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (!isFinePointer || prefersReducedMotion) return;

    const handlers: Array<{ el: HTMLElement; fn: (e: PointerEvent) => void }> = [];

    const attachHandlers = () => {
      // Remove existing handlers first
      handlers.forEach(({ el, fn }) => el.removeEventListener("pointermove", fn));
      handlers.length = 0;

      const cards = container.querySelectorAll<HTMLElement>(".card");

      cards.forEach((card) => {
        const handleMove = (e: PointerEvent) => {
          const rect = card.getBoundingClientRect();
          const mx = ((e.clientX - rect.left) / rect.width) * 100;
          const my = ((e.clientY - rect.top) / rect.height) * 100;
          card.style.setProperty("--mx", `${mx}%`);
          card.style.setProperty("--my", `${my}%`);
        };
        card.addEventListener("pointermove", handleMove);
        handlers.push({ el: card, fn: handleMove });
      });
    };

    // Initial attachment
    attachHandlers();

    // Use MutationObserver to watch for dynamically added cards
    const observer = new MutationObserver((mutations) => {
      let shouldReattach = false;
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          // Check if any .card elements were added or removed
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.classList.contains("card") || element.querySelector(".card")) {
                shouldReattach = true;
                break;
              }
            }
          }
          for (const node of mutation.removedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.classList.contains("card") || element.querySelector(".card")) {
                shouldReattach = true;
                break;
              }
            }
          }
        }
        if (shouldReattach) break;
      }
      if (shouldReattach) {
        attachHandlers();
      }
    });

    observer.observe(container, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      handlers.forEach(({ el, fn }) => el.removeEventListener("pointermove", fn));
    };
  }, [containerRef]);
}
