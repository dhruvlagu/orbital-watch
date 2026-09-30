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
  const mobileNavRef = useRef<HTMLDivElement | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);
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

  // Trap focus and manage inert attribute for mobile nav
  useEffect(() => {
    const mainContent = document.querySelector('main');
    const footer = document.querySelector('.footer');
    const skipLink = document.querySelector('.skip-link');

    const setInert = (inert: boolean) => {
      if (mainContent) {
        if (inert) {
          mainContent.setAttribute('inert', '');
        } else {
          mainContent.removeAttribute('inert');
        }
      }
      if (footer) {
        if (inert) {
          footer.setAttribute('inert', '');
        } else {
          footer.removeAttribute('inert');
        }
      }
      if (skipLink) {
        if (inert) {
          skipLink.setAttribute('inert', '');
        } else {
          skipLink.removeAttribute('inert');
        }
      }
    };

    if (mobileOpen) {
      setInert(true);
      // Move focus to first link in dialog
      setTimeout(() => {
        firstLinkRef.current?.focus();
      }, 0);
    } else {
      setInert(false);
      // Return focus to menu button
      setTimeout(() => {
        menuButtonRef.current?.focus();
      }, 0);
    }

    return () => {
      setInert(false);
    };
  }, [mobileOpen]);

  // Close mobile nav on route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close mobile nav when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileOpen && mobileNavRef.current && !mobileNavRef.current.contains(event.target as Node) && !menuButtonRef.current?.contains(event.target as Node)) {
        setMobileOpen(false);
      }
    };

    if (mobileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [mobileOpen]);

  // Close mobile nav on Escape key
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

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
        <div id="mobileNav" ref={mobileNavRef} className="mobileNav" role="dialog" aria-label="Navigation menu">
          <nav className="mobileNav__links" aria-label="Mobile Navigation">
            {NAV_LINKS.map((link, index) => (
              <NavLink
                key={link.path}
                to={link.path}
                ref={index === 0 ? firstLinkRef : undefined}
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
