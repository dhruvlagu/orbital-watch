import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { NAV_LINKS } from "../services/navLinks";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Only set body overflow on client-side to avoid hydration issues
    if (typeof window !== 'undefined') {
      document.body.style.overflow = mobileOpen ? "hidden" : "unset";
    }
    return () => {
      if (typeof window !== 'undefined') {
        document.body.style.overflow = "unset";
      }
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobileNav();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const closeMobileNav = () => {
    setIsClosing(true);
    setTimeout(() => {
      setMobileOpen(false);
      setIsClosing(false);
    }, 200);
  };

  return (
    <header className="navbar" role="banner">
      <div className="container navbar__inner">
        <NavLink className="navbar__logo" to="/" aria-label="Go to home">
          ORBITAL WATCH
        </NavLink>

        <nav className="navbar__nav" aria-label="Primary">
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
        </nav>

        <button
          className="icon-button navbar__menuButton"
          type="button"
          aria-label="Open menu"
          aria-controls="mobileNav"
          aria-expanded={mobileOpen}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMobileOpen(true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            setMobileOpen(true);
          }}
        >
          <span className="hamburger" aria-hidden="true">
            <span />
          </span>
        </button>
      </div>

      {!mobileOpen ? null : (
        <div className={`mobileNav ${isClosing ? "mobileNav--closing" : ""}`} id="mobileNav">
          <button
            className="icon-button mobileNav__close"
            type="button"
            aria-label="Close menu"
            onClick={closeMobileNav}
          >
            <span className="closeIcon" aria-hidden="true" />
          </button>

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
      )}
    </header>
  );
}
