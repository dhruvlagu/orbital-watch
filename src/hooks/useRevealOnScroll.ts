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
    let intersectionObserver: IntersectionObserver | null = null;

    const revealExisting = () => {
      const elements = document.querySelectorAll<HTMLElement>(selector);
      if (elements.length === 0) return;

      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // Immediately reveal elements already near or above the viewport
        if (rect.top < window.innerHeight + 100) {
          el.classList.add("is-visible");
        }
      });

      if (intersectionObserver) {
        intersectionObserver.disconnect();
      }

      intersectionObserver = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              obs.unobserve(entry.target);
            }
          });
        },
        {
          threshold,
          rootMargin: "150px 0px 150px 0px",
        }
      );

      elements.forEach((el) => {
        if (!el.classList.contains("is-visible")) {
          intersectionObserver!.observe(el);
        }
      });
    };

    revealExisting();

    // Watch for dynamically appended nodes (e.g. clicking "Show All Conjunctions")
    const mutationObserver = new MutationObserver(() => {
      revealExisting();
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (intersectionObserver) {
        intersectionObserver.disconnect();
      }
      mutationObserver.disconnect();
    };
  }, [selector, dependency, threshold]);
}
