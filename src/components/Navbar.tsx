import { useEffect, useLayoutEffect, useState, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { NAV_LINKS } from "../services/navLinks";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [indicatorLeft, setIndicatorLeft] = useState(0);
  const [indicatorWidth, setIndicatorWidth] = useState(0);
  const navRef = useRef<HTMLElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const location = useLocation();

  const measureActiveLink = () => {
    const navEl = navRef.current;
    if (!navEl) return;

    const activeLink = navEl.querySelector<HTMLAnchorElement>(".navlink.is-active");
    if (!activeLink) return;

    const navRect = navEl.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    setIndicatorLeft(linkRect.left - navRect.left);
    setIndicatorWidth(linkRect.width);
  };

  // Lock body scroll while mobile panel is open, restore on close or unmount
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close mobile nav on route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close mobile nav on Escape key
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useLayoutEffect(() => {
    measureActiveLink();
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let frame: number | null = null;
    const handleResize = () => {
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }
      frame = window.requestAnimationFrame(() => {
        measureActiveLink();
        frame = null;
      });
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <header className={`navbar ${isScrolled ? "navbar--scrolled" : ""}`} role="banner">
        <div className="container navbar__inner">
          <NavLink className="navbar__logo" to="/" aria-label="Go to home">
            ORBITAL WATCH
          </NavLink>

          {/* Desktop Nav - untouched */}
          <nav ref={navRef} className="navbar__nav" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  isActive ? "navlink is-active" : "navlink"
                }
              >
                {link.label}
              </NavLink>
            ))}
            <span
              className="navbar__activeIndicator"
              style={{ left: indicatorLeft, width: indicatorWidth }}
              aria-hidden="true"
            />
          </nav>

          {/* Mobile Hamburger/X Toggle */}
          <button
            ref={menuButtonRef}
            className="icon-button navbar__menuButton"
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-controls="mobileNav"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {mobileOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Nav Panel rendered outside header to span full viewport */}
      {mobileOpen && (
        <div id="mobileNav" className="mobileNav" role="dialog" aria-label="Mobile Navigation">
          <nav className="mobileNav__links" aria-label="Mobile Navigation">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  isActive ? "mobileNav__link is-active" : "mobileNav__link"
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
