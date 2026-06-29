import { useEffect } from "react";
import StarfieldCanvas from "../components/StarfieldCanvas";
import { useDocumentMetadata } from "../hooks/useDocumentMetadata";

const reflectionText =
  "I started this project assuming the orbital debris crisis was fundamentally a technical problem — that the barrier to cleaning up low Earth orbit was that we simply hadn't invented the right tools yet. What I found was almost the opposite. Active debris removal technology exists today. Robotic capture arms, magnetic docking systems, electrodynamic tethers — the engineering is real, demonstrated, and improving. The barrier isn't scientific. It's a 1967 treaty clause that nobody intended to become a debris removal prohibition, interpreted by nations that have every geopolitical incentive to keep it ambiguous. That gap between what engineering can do and what international law allows was genuinely surprising to me — and it reframed the entire project. This isn't a story about waiting for technology. It's a story about whether legal institutions can evolve faster than the problems they were never designed to anticipate.";

const questionsText =
  "The question I'd most want to pursue is one this research kept raising without answering: does public awareness of orbital debris actually change space policy, or does space law move through different channels entirely — industry lobbying, bilateral agreements, regulatory pressure — largely independent of what the public knows or cares about? The FCC's 5-Year Rule passed with almost no public attention. The 1967 Outer Space Treaty was negotiated entirely between governments. If that pattern holds, then awareness campaigns like this site may matter less than understanding which specific institutional levers actually move space law — and who has access to them. I'd want to study the political history of the FCC ruling in detail: who pushed for it, what arguments worked, and whether that model could be replicated internationally. That feels like the more honest question about how change actually happens.";

export default function AboutPage() {
  useDocumentMetadata(
    "About & Methodology | Orbital Watch",
    "Review our development methodology, meet the creators of Orbital Watch, and access our comprehensive library of peer-reviewed data sources."
  );

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
      { threshold: 0.1 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="aboutPage">
      <StarfieldCanvas />

      {/* Hero */}
      <div className="container aboutHero">
        <div className="hero__label reveal-item">METRICS &amp; ORIGINS</div>
        <h1 className="aboutHero__title reveal-item">About This Research</h1>
        <div className="aboutHero__decor reveal-item">
          <div className="aboutHero__line" />
          <span className="badge badge--blue">Independent Study</span>
          <div className="aboutHero__line" />
        </div>
      </div>

      {/* SECTION 1 — Project Origin */}
      <div className="aboutSection aboutSection--origin">
        <div className="container">
          <div className="originGrid reveal-item">
            <div className="originText">
              <p className="lead">
                This site began as a history research project exploring how Cold War &quot;Frontier Mentality&quot;
                created today&apos;s orbital debris crisis. What started as a classroom question — can
                international policy evolve faster than debris multiplies? — became an independent research
                project connecting historical decision-making, orbital physics, and international law.
              </p>
              <div className="originCredits">
                <div className="creditsItem">
                  <span className="creditsLabel">Lead Researcher</span>
                  <span className="creditsVal">Dhruv Lagu</span>
                </div>
                <div className="creditsItem">
                  <span className="creditsLabel">Academic Level</span>
                  <span className="creditsVal">High School Student</span>
                </div>
                <div className="creditsItem">
                  <span className="creditsLabel">Location</span>
                  <span className="creditsVal">California, USA</span>
                </div>
              </div>
              <div className="disclaimerBanner">
                <span className="disclaimerIcon">⚠️</span>
                <span>This website is an independent academic project. It is not affiliated with any space agency, military, or government body.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2 — Research Methodology */}
      <div className="aboutSection aboutSection--method">
        <div className="container">
          <div className="aboutSection__header reveal-item">
            <div className="hero__label">Section 02</div>
            <h2>Research Methodology</h2>
            <p className="aboutSection__subtitle">
              How data was collected, cross-checked, and integrated across orbital disciplines.
            </p>
          </div>

          <div className="methodGrid">
            {[
              {
                title: "Primary Data Sources",
                body: "Orbital debris statistics drawn from ESA Annual Space Environment Report and the Space-Track.org satellite catalog. Live data fetched via Space-Track.org API.",
                icon: "📊",
              },
              {
                title: "Policy Documents",
                body: "Treaty text and legal analysis sourced from UNOOSA original documents, FCC ruling records, and UN COPUOS reports.",
                icon: "📜",
              },
              {
                title: "Academic Papers",
                body: "Physics calculations validated against Kessler & Cour-Palais (1978) and updated with NASA Orbital Debris Quarterly News data.",
                icon: "📚",
              },
              {
                title: "Journalism & Context",
                body: "Background context drawn from Wall Street Journal, Ars Technica, and The Planetary Society, cross-referenced with primary sources.",
                icon: "📰",
              },
            ].map((card, i) => (
              <div key={card.title} className="card methodCard reveal-item" style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="methodCard__icon" aria-hidden="true">{card.icon}</span>
                <h3 className="methodCard__title">{card.title}</h3>
                <p className="methodCard__body">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 3 & 4 — Interactive Reflective Notes */}
      <div className="aboutSection aboutSection--reflection">
        <div className="container">
          <div className="reflectionGrid">
            {/* Section 3: What I Found Surprising */}
            <div className="card reflectPanel reflectPanel--amber reveal-item">
              <div className="reflectPanel__header">
                <div className="reflectPanel__meta">
                  <span className="reflectPanel__num">03</span>
                  <h3>What Surprised Me</h3>
                </div>
              </div>

              <div className="reflectPanel__body">
                <blockquote className="reflectPanel__quote">
                  {reflectionText}
                </blockquote>
              </div>
            </div>

            {/* Section 4: Open Questions */}
            <div className="card reflectPanel reflectPanel--amber reveal-item">
              <div className="reflectPanel__header">
                <div className="reflectPanel__meta">
                  <span className="reflectPanel__num">04</span>
                  <h3>Open Questions</h3>
                </div>
              </div>

              <div className="reflectPanel__body">
                <blockquote className="reflectPanel__quote">
                  {questionsText}
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5 — Full Source Library */}
      <div id="sources" className="aboutSection aboutSection--sources">
        <div className="container">
          <div className="aboutSection__header reveal-item">
            <div className="hero__label">Section 05</div>
            <h2>Full Source Library</h2>
            <p className="aboutSection__subtitle">
              Academic bibliography of references and catalogs used in this project.
            </p>
          </div>

          <div className="sourcesLibrary reveal-item">
            {/* Primary Data */}
            <div className="sourceCategory">
              <h3 className="sourceCategory__title">Primary Data &amp; Satellite Catalogs</h3>
              <ul className="sourceList">
                <li className="sourceItem">
                  <span className="sourceItem__title">European Space Agency (ESA)</span>
                  <span className="sourceItem__details">
                    <em>Annual Space Environment Report.</em> Space Debris Office. Published annually.
                  </span>
                </li>
                <li className="sourceItem">
                  <span className="sourceItem__title">Space-Track.org</span>
                  <span className="sourceItem__details">
                    <em>Satellite Catalog (SATCAT) API.</em> Joint Force Space Component Command (JFSCC). Live query interface.
                  </span>
                </li>
                <li className="sourceItem">
                  <span className="sourceItem__title">NASA Orbital Debris Program Office</span>
                  <span className="sourceItem__details">
                    <em>Orbital Debris Quarterly News.</em> NASA Johnson Space Center. Periodic reports.
                  </span>
                </li>
                <li className="sourceItem">
                  <span className="sourceItem__title">LeoLabs Inc.</span>
                  <span className="sourceItem__details">
                    <em>Public Conjunction and Collision Avoidance Analytics.</em> Web data dashboard.
                  </span>
                </li>
              </ul>
            </div>

            {/* Policy Documents */}
            <div className="sourceCategory">
              <h3 className="sourceCategory__title">Treaties &amp; Policy Documents</h3>
              <ul className="sourceList">
                <li className="sourceItem">
                  <span className="sourceItem__title">United Nations Office for Outer Space Affairs (UNOOSA)</span>
                  <span className="sourceItem__details">
                    <em>Treaty on Principles Governing the Activities of States in the Exploration and Use of Outer Space, including the Moon and Other Celestial Bodies (1967).</em> Resolution 2222 (XXI).
                  </span>
                </li>
                <li className="sourceItem">
                  <span className="sourceItem__title">United Nations (UNOOSA)</span>
                  <span className="sourceItem__details">
                    <em>Convention on International Liability for Damage Caused by Space Objects (1972).</em> General Assembly Resolution 2777 (XXVI).
                  </span>
                </li>
                <li className="sourceItem">
                  <span className="sourceItem__title">Inter-Agency Space Debris Coordination Committee (IADC)</span>
                  <span className="sourceItem__details">
                    <em>Space Debris Mitigation Guidelines.</em> Report IADC-02-01. Formulated 2002.
                  </span>
                </li>
                <li className="sourceItem">
                  <span className="sourceItem__title">Federal Communications Commission (FCC)</span>
                  <span className="sourceItem__details">
                    <em>Mitigation of Orbital Debris in the New Space Era.</em> Second Report and Order (FCC 22-74), 2022.
                  </span>
                </li>
              </ul>
            </div>

            {/* Academic Papers */}
            <div className="sourceCategory">
              <h3 className="sourceCategory__title">Academic Papers &amp; Handbooks</h3>
              <ul className="sourceList">
                <li className="sourceItem">
                  <span className="sourceItem__title">Kessler, Donald J. and Burton G. Cour-Palais</span>
                  <span className="sourceItem__details">
                    &quot;Collision Frequency of Artificial Satellites: The Creation of a Debris Belt.&quot; <em>Journal of Geophysical Research</em>, Vol. 83, No. A6, pp. 2637–2646 (1978).
                  </span>
                  <p className="sourceItem__annotation">
                    Foundational paper establishing the mathematical basis for collision cascades (Kessler Syndrome) in LEO.
                  </p>
                </li>
                <li className="sourceItem">
                  <span className="sourceItem__title">Liou, J.-C., et al.</span>
                  <span className="sourceItem__details">
                    &quot;Active Debris Removal: Stabilization of the LEO Environment.&quot; <em>NASA Orbital Debris Research and Science Reports</em> (2021).
                  </span>
                  <p className="sourceItem__annotation">
                    Modeled minimum ADR rate required to stabilize LEO — key source for the Policy Simulator.
                  </p>
                </li>
                <li className="sourceItem">
                  <span className="sourceItem__title">European Space Agency</span>
                  <span className="sourceItem__details">
                    <em>Space Debris User&apos;s Handbook.</em> ESOC. Technical Reference Document.
                  </span>
                </li>
              </ul>
            </div>

            {/* Journalism & Explainers */}
            <div className="sourceCategory">
              <h3 className="sourceCategory__title">Journalism &amp; General Context</h3>
              <ul className="sourceList">
                <li className="sourceItem">
                  <span className="sourceItem__title">The Wall Street Journal</span>
                  <span className="sourceItem__details">
                    &quot;Space Debris: Houston, We Have a Trash Problem.&quot; WSJ Tech Explainer Series (2021).
                  </span>
                </li>
                <li className="sourceItem">
                  <span className="sourceItem__title">Ars Technica</span>
                  <span className="sourceItem__details">
                    <em>Space flight and orbital physics reporting.</em> Eric Berger, Lead Editor.
                  </span>
                </li>
                <li className="sourceItem">
                  <span className="sourceItem__title">The Planetary Society</span>
                  <span className="sourceItem__details">
                    <em>Space policy analysis and orbital sustainability blogs.</em> Casey Dreier, Chief Advocate.
                  </span>
                </li>
                <li className="sourceItem">
                  <span className="sourceItem__title">New York Academy of Sciences</span>
                  <span className="sourceItem__details">
                    &quot;Trashing the Final Frontier: The Geopolitics of LEO Cleaning.&quot; <em>Science and Society Journal</em> (2023).
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
