import { NavLink } from "react-router-dom";
import { NAV_LINKS } from "../lib/navLinks";

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="container footer__grid">
        <div className="footer__col">
          <div className="footer__logo">ORBITAL WATCH</div>
          <div className="footer__tagline">Tracking the orbital debris crisis.</div>
        </div>

        <div className="footer__col">
          <div className="footer__heading">Quick links</div>
          <div className="footer__links">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.path} to={link.path}>
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="footer__col footer__col--right">
          <div className="footer__heading">Research</div>
          <div className="footer__meta">Research by Dhruv Lagu</div>
          <a className="footer__iconLink" href="#" aria-label="LinkedIn (placeholder link)">
            <span className="linkedinIcon" aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="container footer__bottom">
        Data sources: <a href="/about#sources" className="footer__sourcesLink">ESA, Space-Track.org, NASA ODPO, UNOOSA, IADC, and more →</a>
      </div>
    </footer>
  );
}
