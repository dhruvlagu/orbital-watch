import { useEffect, useLayoutEffect, useState, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { NAV_LINKS } from "../services/navLinks";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [indicatorLeft, setIndicatorLeft] = useState(0);
  const [indicatorWidth, setIndicatorWidth] = useState(0);
  const navRef = useRef<HTMLElement | null>(null);
  const location = useLocation();

  const closeMobileNav = () => {
    setIsClosing(true);
    setTimeout(() => {
      setMobileOpen(false);
      setIsClosing(false);
    }, 200);
  };

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

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobileNav();
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
    <header className={`navbar ${isScrolled ? "navbar--scrolled" : ""}`} role="banner">
      <div className="container navbar__inner">
        <NavLink className="navbar__logo" to="/" aria-label="Go to home">
          ORBITAL WATCH
        </NavLink>

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

        {!mobileOpen && (
          <button
            className="icon-button navbar__menuButton"
            type="button"
            aria-label="Open menu"
            aria-controls="mobileNav"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <span className="hamburger" aria-hidden="true">
              <span />
            </span>
          </button>
        )}
      </div>

      {!mobileOpen ? null : (
        <>
          <button
            className={`icon-button mobileNav__close ${isClosing ? '' : 'mobileNav__close--visible'}`}
            type="button"
            aria-label="Close menu"
            onClick={closeMobileNav}
          >
            <span className="closeIcon" aria-hidden="true" />
          </button>
          <div className={`mobileNav__backdrop ${isClosing ? '' : 'mobileNav__backdrop--visible'}`} onClick={closeMobileNav} />
          <div className={`mobileNav ${isClosing ? "mobileNav--closing" : "mobileNav--open"}`} id="mobileNav">
            <nav className="mobileNav__links" aria-label="Mobile">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    isActive ? "mobileNav__link is-active" : "mobileNav__link"
                  }
                  onClick={closeMobileNav}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
