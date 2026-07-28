import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { NAV_LINKS } from "../services/navLinks";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const closeMobileNav = () => {
    setIsClosing(true);
    setTimeout(() => {
      setMobileOpen(false);
      setIsClosing(false);
    }, 200);
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
