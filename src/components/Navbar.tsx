import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { NAV_LINKS } from "./nav";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
          onClick={() => setMobileOpen(true)}
        >
          <span className="hamburger" aria-hidden="true">
            <span />
          </span>
        </button>
      </div>

      {!mobileOpen ? null : (
        <div className="mobileNav" id="mobileNav">
          <button
            className="icon-button mobileNav__close"
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
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
                onClick={() => setMobileOpen(false)}
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
