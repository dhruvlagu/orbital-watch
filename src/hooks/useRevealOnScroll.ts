import { useEffect } from "react";

/**
 * Standardized IntersectionObserver hook for scroll-reveal animations.
 * @param selector - CSS selector for elements to reveal (default: ".reveal-item")
 * @param dependency - Optional dependency to re-trigger the observer (e.g., loading state)
 * @param threshold - Visibility threshold (0 to 1)
 */
export function useRevealOnScroll(
  selector: string = ".reveal-item",
  dependency: any = null,
  threshold: number = 0.08
) {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(selector);
    if (elements.length === 0) return;

    // Immediately reveal elements already in or above the viewport on mount
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 50) {
        el.classList.add("is-visible");
      }
    });

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            // Performance optimization: stop watching once revealed
            obs.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        // Trigger reveal slightly before the element enters the middle viewport
        rootMargin: "0px 0px -50px 0px",
      }
    );

    elements.forEach((el) => {
      if (!el.classList.contains("is-visible")) {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [selector, dependency, threshold]);
}
