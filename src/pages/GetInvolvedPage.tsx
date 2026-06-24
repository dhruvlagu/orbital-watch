import { useEffect, useState } from "react";
import StarfieldCanvas from "../components/StarfieldCanvas";
import { useDocumentMetadata } from "../hooks/useDocumentMetadata";

export default function GetInvolvedPage() {
  useDocumentMetadata(
    "Get Involved | STEM Education & Advocacy | Orbital Watch",
    "Discover how citizens, students, and policymakers can collaborate on space stewardship, advocacy, and STEM-focused educational initiatives."
  );

  const [copied, setCopied] = useState(false);
  const [showInstaTip, setShowInstaTip] = useState(false);

  // Scroll Reveal Hook
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(".reveal-item");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.15 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleCopyLink = () => {
    const shareUrl = window.location.origin;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleInstaClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowInstaTip(true);
    setTimeout(() => setShowInstaTip(false), 4000);
  };

  const shareText = "Check out Orbital Watch — Tracking the orbital debris crisis and active debris removal solutions.";
  const shareUrl = "https://orbital-watch.vercel.app";

  return (
    <section className="getInvolvedPage">
      <StarfieldCanvas />

      {/* Hero */}
      <div className="container involvedHero">
        <div className="hero__label reveal-item">TAKE ACTION</div>
        <h1 className="involvedHero__title reveal-item">
          The Orbit <span className="involvedHero__title--highlight">Needs You</span>
        </h1>
        <p className="involvedHero__subtitle reveal-item">
          What you can do — right now and long term.
        </p>
        <div className="involvedHero__pills reveal-item">
          <span className="badge badge--blue">Individual Actions</span>
          <span className="badge badge--amber">Treaty Reform</span>
          <span className="badge badge--green">Student Resources</span>
        </div>
      </div>

      {/* SECTION A — Short Term (Individual Actions) */}
      <div className="involvedSection involvedSection--actions">
        <div className="container">
          <div className="involvedSection__header reveal-item">
            <div className="hero__label">Section 01</div>
            <h2>Immediate Impact</h2>
            <p className="involvedSection__subtitle">
              Small steps you can take today to help safeguard LEO.
            </p>
          </div>

          <div className="actionsGrid">
            {/* Card 1 */}
            <article className="card actionCard reveal-item">
              <div className="actionCard__iconWrapper star-icon">
                <svg viewBox="0 0 24 24" width="36" height="36" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </div>
              <h3 className="actionCard__title">Support Responsible Operators</h3>
              <p className="actionCard__body">
                Before supporting commercial space companies, check their Space Sustainability Rating.
                Companies with high SSR scores have committed to responsible orbital practices.
              </p>
              <a
                href="https://spacesustainabilityrating.org"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--primary actionCard__btn"
              >
                Check SSR Ratings →
              </a>
            </article>

            {/* Card 2 */}
            <article className="card actionCard reveal-item">
              <div className="actionCard__iconWrapper gov-icon">
                <svg viewBox="0 0 24 24" width="36" height="36" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1">
                  <path d="M4 22h16"></path>
                  <path d="M20 22V8l-8-6-8 6v14"></path>
                  <path d="M12 22V12"></path>
                  <circle cx="12" cy="7" r="1"></circle>
                </svg>
              </div>
              <h3 className="actionCard__title">Contact Your Representatives</h3>
              <p className="actionCard__body">
                The 5-Year Rule passed because of FCC regulatory pressure. International treaty reform requires
                Congressional awareness. A five-minute email to your senator about ASAT test bans costs nothing.
              </p>
              <a
                href="https://www.congress.gov/members/find-your-member"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--primary actionCard__btn"
              >
                Find Your Representative →
              </a>
            </article>

            {/* Card 3 */}
            <article className="card actionCard actionCard--share reveal-item">
              <div className="actionCard__iconWrapper share-icon">
                <svg viewBox="0 0 24 24" width="36" height="36" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
              </div>
              <h3 className="actionCard__title">Share This Research</h3>
              <p className="actionCard__body">
                Orbital debris is undercovered in mainstream media. Sharing this research with students,
                educators, or policymakers creates the public awareness that drives political will.
              </p>

              <div className="shareWidget">
                <div className="shareButtons">
                  {/* Twitter/X */}
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shareBtn shareBtn--twitter"
                    aria-label="Share on X"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>

                  {/* LinkedIn */}
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shareBtn shareBtn--linkedin"
                    aria-label="Share on LinkedIn"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>

                  {/* Instagram (Visual Hint) */}
                  <button
                    onClick={handleInstaClick}
                    className="shareBtn shareBtn--instagram"
                    aria-label="Share on Instagram"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </button>

                  {/* Copy Link */}
                  <button
                    onClick={handleCopyLink}
                    className="shareBtn shareBtn--copy"
                    aria-label="Copy link"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                  </button>
                </div>

                {/* Notifications */}
                {copied && <div className="shareWidget__status shareWidget__status--success">Link copied to clipboard!</div>}
                {showInstaTip && (
                  <div className="shareWidget__status shareWidget__status--info">
                    Copy the link and add it to your Instagram bio or share in your Stories!
                  </div>
                )}
              </div>
            </article>
          </div>
        </div>
      </div>

      {/* SECTION B — Organizations */}
      <div className="involvedSection involvedSection--orgs">
        <div className="container">
          <div className="involvedSection__header reveal-item">
            <div className="hero__label">Section 02</div>
            <h2>Who&apos;s Working on This</h2>
            <p className="involvedSection__subtitle">
              Key coalitions, space agencies, and advocacy groups dedicating resources to space safety.
            </p>
          </div>

          <div className="orgsGrid">
            {[
              {
                name: "ESA Space Debris Office",
                desc: "The European Space Agency's dedicated team tracking, modeling, and developing solutions for the orbital debris environment.",
                url: "https://sdo.esoc.esa.int",
                displayUrl: "sdo.esoc.esa.int",
              },
              {
                name: "Secure World Foundation",
                desc: "A non-partisan think tank promoting cooperative solutions for space sustainability and peaceful uses of outer space.",
                url: "https://swfound.org",
                displayUrl: "swfound.org",
              },
              {
                name: "Space Safety Coalition",
                desc: "An industry alliance of satellite operators committed to debris mitigation best practices and responsible orbital behavior.",
                url: "https://spacesafetycoalition.org",
                displayUrl: "spacesafetycoalition.org",
              },
              {
                name: "The Planetary Society",
                desc: "The world's largest nonprofit space advocacy organization, campaigning for science-based space policy including orbital sustainability.",
                url: "https://planetary.org",
                displayUrl: "planetary.org",
              },
            ].map((org, i) => (
              <div key={org.name} className="card orgCard reveal-item" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="orgCard__header">
                  <h3 className="orgCard__name">{org.name}</h3>
                </div>
                <p className="orgCard__desc">{org.desc}</p>
                <div className="orgCard__footer">
                  <a
                    href={org.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--secondary orgCard__btn"
                  >
                    Visit {org.displayUrl} ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION C — For Students */}
      <div className="involvedSection involvedSection--students">
        <div className="container">
          <div className="involvedSection__header reveal-item">
            <div className="hero__label">Section 03</div>
            <h2>Go Deeper</h2>
            <p className="involvedSection__subtitle">
              Resources, programs, and pathways for students who want to take this further.
            </p>
          </div>

          <div className="studentsGrid reveal-item">
            {/* Column 1 */}
            <div className="studentCol">
              <div className="studentCol__header">
                <span className="studentCol__badge">Competitions &amp; Programs</span>
              </div>
              <ul className="studentCol__list">
                <li>
                  <strong>IOAA</strong>
                  <span>International Olympiad on Astronomy and Astrophysics</span>
                </li>
                <li>
                  <strong>NASA Internships</strong>
                  <span>Opportunities for high school and college students at <a href="https://intern.nasa.gov" target="_blank" rel="noopener noreferrer">intern.nasa.gov</a></span>
                </li>
                <li>
                  <strong>ESA Trainee Program</strong>
                  <span>Young Graduate Trainee positions at the European Space Agency</span>
                </li>
                <li>
                  <strong>Conrad Challenge</strong>
                  <span>Global student technology and innovation startup competition</span>
                </li>
              </ul>
            </div>

            {/* Column 2 */}
            <div className="studentCol">
              <div className="studentCol__header">
                <span className="studentCol__badge">Academic Papers to Read</span>
              </div>
              <ul className="studentCol__list">
                <li>
                  <strong>Kessler &amp; Cour-Palais (1978)</strong>
                  <span>"Collision Frequency of Artificial Satellites: The Creation of a Debris Belt" (JGR)</span>
                </li>
                <li>
                  <strong>Liou et al. (2021)</strong>
                  <span>"Active Debris Removal: Stabilization of LEO Environment" (NASA Space Debris Research)</span>
                </li>
                <li>
                  <strong>ESA Space Environment Report 2023</strong>
                  <span>Annual statistical analysis of all objects registered in Earth orbit</span>
                </li>
                <li>
                  <strong>UN COPUOS Technical Reports</strong>
                  <span>Scientific findings presented to the Committee on the Peaceful Uses of Outer Space</span>
                </li>
              </ul>
            </div>

            {/* Column 3 */}
            <div className="studentCol">
              <div className="studentCol__header">
                <span className="studentCol__badge">Organizations to Join</span>
              </div>
              <ul className="studentCol__list">
                <li>
                  <strong>SEDS</strong>
                  <span>Students for the Exploration and Development of Space</span>
                </li>
                <li>
                  <strong>AIAA Student Chapter</strong>
                  <span>American Institute of Aeronautics and Astronautics student sections</span>
                </li>
                <li>
                  <strong>Model UN Space Committee</strong>
                  <span>Roleplay simulations of the UN COPUOS committee sessions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
