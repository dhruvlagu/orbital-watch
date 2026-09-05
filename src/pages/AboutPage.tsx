import { useRef, useState } from "react";
import { useRevealOnScroll } from "../hooks/useRevealOnScroll";
import { Link } from "react-router-dom";
import StarfieldCanvas from "../components/StarfieldCanvas";
import { useDocumentMetadata } from "../hooks/useDocumentMetadata";
import { useCardSpotlight } from "../hooks/useCardSpotlight";

const reflectionText =
  "When I began this project, I thought the issue of space debris was mainly a technical one and that the technology needed for debris removal did not yet exist. Instead, I discovered that the technology for removing debris already exists. Technologies such as robotic capture arms, magnetic docking systems, and electrodynamic tethers have already been successfully demonstrated. The technology is already in place and continues to improve. The obstacle is not scientific in nature but instead lies in a clause of the 1967 Outer Space Treaty. That realization completely changed how I viewed the problem. Rather than waiting for better technology, the real challenge is determining whether international law can adapt quickly enough to address problems it was never designed to handle.";

const questionsText =
  "What I would most like to know is whether growing public awareness of orbital debris has any meaningful impact on shaping space policy. While public opinion may play a role, industry lobbying, bilateral agreements, and regulatory pressure may influence policy independently of what the public knows or cares about. For example, the FCC’s Five-Year Rule was adopted with little public attention, and the 1967 Outer Space Treaty was negotiated exclusively between governments. If that pattern continues, awareness campaigns alone may not be enough to drive legal reform. Instead, it may be more important to understand which institutional levers shape space legislation and who has access to them. To answer that question, I would like to study the history of the FCC’s decision in greater detail, including who advocated for the rule, which arguments proved most persuasive, and whether a similar approach could be applied at the international level.";

export default function AboutPage() {
  useDocumentMetadata(
    "About | Research Methodology & Sources",
    "Read about the research behind Orbital Watch, the data sources used, and the methodology behind the site."
  );

  const methodGridRef = useRef<HTMLDivElement>(null);
  const reflectionGridRef = useRef<HTMLDivElement>(null);

  const [expandedBlocks, setExpandedBlocks] = useState<{ [key: string]: boolean }>({
    block1: false,
    block2: false,
    civicAction: false,
    block3: false,
  });

  const toggleBlock = (blockId: string) => {
    setExpandedBlocks((prev) => ({ ...prev, [blockId]: !prev[blockId] }));
  };

  useCardSpotlight(methodGridRef);
  useCardSpotlight(reflectionGridRef);

  // Scroll Reveal Hook
  useRevealOnScroll(".reveal-item", null, 0.1);

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
                <span className="disclaimerIcon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </span>
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

          <div className="methodGrid" ref={methodGridRef}>
            {[
              {
                title: "Primary Data Sources",
                body: "Orbital debris statistics drawn from ESA Annual Space Environment Report and the Space-Track.org satellite catalog. Data cached via Space-Track.org API.",
                icon: (
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                  </svg>
                ),
              },
              {
                title: "Policy Documents",
                body: "Treaty text and legal analysis sourced from UNOOSA original documents, FCC ruling records, and UN COPUOS reports.",
                icon: (
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                ),
              },
              {
                title: "Academic Papers",
                body: "Physics calculations validated against Kessler & Cour-Palais (1978) and updated with NASA Orbital Debris Quarterly News data.",
                icon: (
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                ),
              },
              {
                title: "Journalism & Context",
                body: "Background context drawn from Wall Street Journal, Ars Technica, and The Planetary Society, cross-referenced with primary sources.",
                icon: (
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" />
                    <polyline points="14 2 14 8 20 8" />
                    <path d="M2 15h10" /><path d="M2 18h10" /><path d="M2 12h10" />
                  </svg>
                ),
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

      {/* SECTION 3 — The Code Behind It */}
      {/* ⚠️ MAINTENANCE NOTE: Code blocks below are STATIC COPIES of actual source files.
           When updating the actual source code, you MUST update the corresponding
           code block here to keep them in sync. This section's value depends on
           the code being verbatim matches to the live implementation. */}
      <div id="the-code" className="aboutSection aboutSection--code">
        <div className="container">
          <div className="aboutSection__header reveal-item">
            <div className="hero__label">Section 03</div>
            <h2>The Code Behind It</h2>
            <p className="aboutSection__subtitle">
              For anyone who wants to verify the logic itself, not just the results.
            </p>
          </div>

          {/* BLOCK 1: Scheduled Data Refresh */}
          {/* SOURCE: api/cron/_spacetrackAuth.mjs + api/conjunctions.mjs
               UPDATE THIS BLOCK if either file changes */}
          <div className="codeBlock reveal-item">
            <button
              className="codeBlock__header"
              onClick={() => toggleBlock('block1')}
              aria-expanded={expandedBlocks.block1}
              aria-controls="block1-content"
            >
              <div className="codeBlock__title">
                <span>Scheduled Data Refresh</span>
              </div>
              <span className="codeBlock__toggle" aria-hidden="true">
                {expandedBlocks.block1 ? '−' : '+'}
              </span>
            </button>
            <div id="block1-content" role="region" aria-label="Scheduled Data Refresh code">
            {expandedBlocks.block1 && (
              <>
                <pre className="technicalCode">{`// api/cron/_spacetrackAuth.mjs — shared session cookie auth
const AUTH_URL = "https://www.space-track.org/ajaxauth/login";
const COOKIE_TTL_MS = 90 * 60 * 1000; // 90 minutes

let cachedCookieHeader = null;
let cachedCookieIssuedAt = 0;

function getCookieHeaderValue(headers) {
  const rawCookies = typeof headers.getSetCookie === "function" 
    ? headers.getSetCookie() : null;
  return rawCookies
    ? rawCookies.map((cookie) => cookie.split(";")[0]).join("; ")
    : headers.get("set-cookie")?.split(";")[0] ?? null;
}

async function authenticateWithSpaceTrack(user, pass) {
  const authResponse = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ identity: user, password: pass }).toString(),
  });
  const cookieHeader = getCookieHeaderValue(authResponse.headers);
  if (!authResponse.ok || !cookieHeader) {
    throw new Error(\`Space-Track authentication failed (HTTP \${authResponse.status})\`);
  }
  cachedCookieHeader = cookieHeader;
  cachedCookieIssuedAt = Date.now();
  return cookieHeader;
}

export async function getValidSessionCookie() {
  const user = process.env.SPACE_TRACK_USER;
  const pass = process.env.SPACE_TRACK_PASS;
  const hasFreshCookie = Boolean(
    cachedCookieHeader && Date.now() - cachedCookieIssuedAt < COOKIE_TTL_MS,
  );
  if (hasFreshCookie) return cachedCookieHeader;
  return authenticateWithSpaceTrack(user, pass);
}

// api/conjunctions.mjs — user-facing endpoint (Redis read-only)
import { withRedis } from "./_redisClient.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const [cdmJson, lastChecked] = await withRedis((c) =>
      Promise.all([c.get("cdm:latest"), c.get("cdm:lastChecked")]),
    );
    if (!cdmJson) {
      return res.status(503).json({
        error: "Conjunction data not yet available.",
        dataNotYetAvailable: true,
        message: "Data is populated 3x daily by a scheduled job.",
      });
    }
    const records = JSON.parse(cdmJson);
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
    return res.status(200).json({ records, lastUpdatedAt: lastChecked });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error reading cached data";
    console.error("[/api/conjunctions] Redis read error:", message);
    return res.status(500).json({ error: message });
  }
}`}</pre>
                <p className="codeBlock__caption">
                  This endpoint never calls Space-Track directly — Space-Track has strict API usage limits, and fetching per-visitor would scale request volume with site traffic rather than staying fixed. Instead, a separate scheduled job (triggered 3x daily by an external Cloudflare Worker, since Vercel's free tier only allows once-daily cron jobs) does the actual fetching and session management, storing results in Redis. This function only ever reads that cached result — guaranteeing a fixed, compliant request volume regardless of how much traffic the site gets.
                </p>
              </>
            )}
            </div>
          </div>

          {/* BLOCK 2: Kessler Cascade Simulation */}
          {/* SOURCE: src/components/KesslerSimulation.tsx (triggerCascade function)
               UPDATE THIS BLOCK if that function changes */}
          <div className="codeBlock reveal-item">
            <button
              className="codeBlock__header"
              onClick={() => toggleBlock('block2')}
              aria-expanded={expandedBlocks.block2}
              aria-controls="block2-content"
            >
              <div className="codeBlock__title">
                <span>Kessler Cascade Simulation</span>
              </div>
              <span className="codeBlock__toggle" aria-hidden="true">
                {expandedBlocks.block2 ? '−' : '+'}
              </span>
            </button>
            <div id="block2-content" role="region" aria-label="Kessler Cascade Simulation code">
            {expandedBlocks.block2 && (
              <>
                <pre className="technicalCode">{`const triggerCascade = () => {
  setIsRunning(true);
  rippleRef.current = { radius: 0, opacity: 0.6, active: true };
  currentDebrisRef.current = [...currentDebrisRef.current];
  isAnimatingRef.current = true;
  let time = 0;
  const duration = 2500; // 2.5 seconds
  const maxDebrisCount = 150; // Cap per cascade
  let debrisAddedInCascade = 0; // Track debris added during this cascade

  const animate = () => {
    time += 16;
    const progress = Math.min(time / duration, 1);

    // Update ripple
    if (rippleRef.current.active) {
      const rippleProgress = Math.min((time) / 600, 1);
      rippleRef.current = {
        radius: rippleProgress * 0.5,
        opacity: 0.6 * (1 - rippleProgress),
        active: rippleProgress < 1
      };
    }

    if (progress < 1) {
      // Add new debris randomly every few frames (respect per-cascade cap)
      let spawnedThisFrame = 0;
      if (Math.random() < 0.4 && debrisAddedInCascade < maxDebrisCount) {
        const newRadius = 0.25 + Math.random() * 0.15;
        const newAngle = Math.random() * Math.PI * 2;
        const newInclination = (Math.random() - 0.5) * 0.8;
        
        // Calculate 3D position using spherical coordinates with inclination
        const cosAngle = Math.cos(newAngle);
        const sinAngle = Math.sin(newAngle);
        const cosInc = Math.cos(newInclination);
        const sinInc = Math.sin(newInclination);
        
        // 3D coordinates centered at origin
        const x3d = newRadius * cosAngle;
        const y3d = newRadius * sinAngle * cosInc;
        const z3d = newRadius * sinAngle * sinInc;
        
        // Calculate orbital velocity (tangential to orbit)
        const orbitalSpeed = 0.02;
        const vx = -orbitalSpeed * sinAngle;
        const vy = orbitalSpeed * cosAngle * cosInc;
        const vz = orbitalSpeed * cosAngle * sinInc;
        
        const newDebris: Debris = {
          id: \`d-\${Date.now()}-\${Math.random()}\`,
          angle: newAngle,
          radius: newRadius,
          inclination: newInclination,
          x: 0.5 + x3d,
          y: 0.5 + y3d,
          z: z3d,
          vx,
          vy,
          vz,
          size: 2 + Math.random() * 2,
        };
        currentDebrisRef.current = [...currentDebrisRef.current, newDebris];
        debrisAddedInCascade++;
        spawnedThisFrame++;
      }

      // Update positions with stable orbital mechanics and detect collisions
      const collisionThreshold = 0.04; // Distance threshold for collision
      const newFragments: Debris[] = [];
      
      // Update positions using stable orbital mechanics (angle-based)
      currentDebrisRef.current = currentDebrisRef.current.map((d: Debris) => {
        const nextAngle = (d.angle + 0.02) % (Math.PI * 2);
        // Calculate 3D position using spherical coordinates with inclination
        const cosAngle = Math.cos(nextAngle);
        const sinAngle = Math.sin(nextAngle);
        const cosInc = Math.cos(d.inclination);
        const sinInc = Math.sin(d.inclination);

        // 3D coordinates centered at origin
        const x3d = d.radius * cosAngle;
        const y3d = d.radius * sinAngle * cosInc;
        const z3d = d.radius * sinAngle * sinInc;

        return {
          ...d,
          angle: nextAngle,
          x: 0.5 + x3d,
          y: 0.5 + y3d,
          z: z3d,
        };
      });

      // Collision detection (optimized with early exit)
      const maxDebrisToCheck = Math.min(currentDebrisRef.current.length, 50); // Limit to prevent lag
      for (let i = 0; i < maxDebrisToCheck; i++) {
        for (let j = i + 1; j < maxDebrisToCheck; j++) {
          const d1 = currentDebrisRef.current[i];
          const d2 = currentDebrisRef.current[j];

          // Calculate 3D distance
          const dx = d1.x - d2.x;
          const dy = d1.y - d2.y;
          const dz = d1.z - d2.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (distance < collisionThreshold) {
            const fragmentCount = 2;
            const remainingCap = maxDebrisCount - debrisAddedInCascade - newFragments.length;
            if (
              remainingCap < fragmentCount ||
              currentDebrisRef.current[i].size === 0 ||
              currentDebrisRef.current[j].size === 0
            ) {
              continue;
            }

            for (let f = 0; f < fragmentCount; f++) {
              newFragments.push({
                id: \`frag-\${Date.now()}-\${Math.random()}\`,
                x: d1.x,
                y: d1.y,
                z: d1.z,
                vx: 0, vy: 0, vz: 0, // Not used in orbital mechanics
                angle: d1.angle + (Math.random() - 0.5) * 0.5,
                radius: d1.radius * (0.9 + Math.random() * 0.2),
                inclination: d1.inclination + (Math.random() - 0.5) * 0.1,
                size: Math.max(1, d1.size * 0.7),
              });
            }

            currentDebrisRef.current[i] = { ...currentDebrisRef.current[i], size: 0 };
            currentDebrisRef.current[j] = { ...currentDebrisRef.current[j], size: 0 };
          }
        }
      }

      // Remove collided debris and add fragments (respect per-cascade cap)
      const fragmentsToAdd = newFragments;
      currentDebrisRef.current = [...currentDebrisRef.current.filter((d: Debris) => d.size > 0), ...fragmentsToAdd];
      debrisAddedInCascade += fragmentsToAdd.length;

      drawCanvas(currentDebrisRef.current, rippleRef.current);
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setIsRunning(false);
      isAnimatingRef.current = false;
      setDebris(currentDebrisRef.current); // Sync state only when animation ends
      drawCanvas(currentDebrisRef.current, rippleRef.current);
    }
  };

  animationRef.current = requestAnimationFrame(animate);
};`}</pre>
                <p className="codeBlock__caption">
                  Debris orbits in 3D space with inclination, using spherical coordinates for realistic orbital mechanics. Collision detection runs between debris pieces — when they collide, they fragment into smaller pieces with modified orbital parameters, creating an exponential chain reaction characteristic of Kessler syndrome. A per-cascade cap of 150 debris prevents runaway performance issues while still demonstrating the cascade effect.
                </p>
              </>
            )}
            </div>
          </div>

          {/* CIVIC ACTION: Contact Your Representative */}
          {/* SOURCES: src/components/CivicActionSection.tsx + api/representative.mjs
               UPDATE THIS BLOCK if either implementation changes */}
          <div className="codeBlock reveal-item">
            <button
              className="codeBlock__header"
              onClick={() => toggleBlock('civicAction')}
              aria-expanded={expandedBlocks.civicAction}
              aria-controls="civicAction-content"
            >
              <div className="codeBlock__title">
                <span>Contact Your Representative</span>
              </div>
              <span className="codeBlock__toggle" aria-hidden="true">
                {expandedBlocks.civicAction ? '−' : '+'}
              </span>
            </button>
            <div id="civicAction-content" role="region" aria-label="Contact Your Representative code">
            {expandedBlocks.civicAction && (
              <>
                <pre className="technicalCode">{`// src/components/CivicActionSection.tsx
const ask = policyAsks[selectedAskId];
const generated = \`Dear Representative \${repName},

\${ask.opening}

\${ask.issueParagraph}

\${ask.supportingStat || ""}

I hope you'll \${ask.repCanDo}.
\${ask.closingSentence}

As someone who cares about the long-term sustainability of space, I hope Congress continues treating orbital debris as an issue worthy of bipartisan attention.
[Add one sentence about why this matters to you personally — messages with a personal note are far more likely to be read as genuine by congressional staff than a form letter.]

Thank you,
\${nameFormatted}
\${zip.trim()}\`;

const hasPlaceholder = messageText.includes(
  "[Add a sentence"
);

const handleCopyMessage = () => {
  if (!selectedAskId) return;

  navigator.clipboard.writeText(messageText).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  });

  // GA4 Event: representative_contact_sent
  trackGA4Event("representative_contact_sent", {
    ask_id: selectedAskId,
    action_type: "copy",
  });
};

// api/representative.mjs
const rep = legislators.find((l) => l.type === "representative");

return res.status(200).json({
  representativeName,
  district: districtNumber,
  matchProportion,
  isAmbiguousMatch,
  contact: {
    contactForm: contact.contact_form || null,
    officialSite: contact.url || null,
    phone: contact.phone || null,
    mailingAddress: contact.address || null,
  },
});`}</pre>
                <p className="codeBlock__caption">
                  This tool turns a selected policy ask and a constituent&apos;s district into an editable message. The browser calls a server-side representative lookup, which selects the House representative from Geocodio&apos;s congressional-district data and returns official contact options only. The copy and contact actions track analytics events for each generated message and completed action.
                </p>
              </>
            )}
            </div>
          </div>

          {/* BLOCK 3: Kinetic Energy Calculator */}
          {/* SOURCE: src/pages/PhysicsPage.tsx (KE calculation + getDangerLevel function)
               UPDATE THIS BLOCK if that code changes */}
          <div className="codeBlock reveal-item">
            <button
              className="codeBlock__header"
              onClick={() => toggleBlock('block3')}
              aria-expanded={expandedBlocks.block3}
              aria-controls="block3-content"
            >
              <div className="codeBlock__title">
                <span>Kinetic Energy Calculator</span>
              </div>
              <span className="codeBlock__toggle" aria-hidden="true">
                {expandedBlocks.block3 ? '−' : '+'}
              </span>
            </button>
            <div id="block3-content" role="region" aria-label="Kinetic Energy Calculator code">
            {expandedBlocks.block3 && (
              <>
                <pre className="technicalCode">{`// Calculate kinetic energy in joules
const massKg = mass / 1000;
const velocityMs = velocity * 1000;
const kineticEnergy = 0.5 * massKg * velocityMs * velocityMs;

// Derived values
const tntEquivalent = kineticEnergy / 4184;
const grenadesEquivalent = kineticEnergy / 32000;

// Danger level calculation
const getDangerLevel = () => {
  if (kineticEnergy < 1000) return { level: "Low", label: "Sensor damage likely", color: "#00d464", badge: "green" };
  if (kineticEnergy < 100000) return { level: "Moderate", label: "Structural penetration", color: "#f5a623", badge: "amber" };
  if (kineticEnergy < 10000000) return { level: "Severe", label: "Satellite destruction", color: "#ff3b3b", badge: "red" };
  return { level: "Catastrophic", label: "Cascade trigger risk", color: "#ff3b3b", badge: "red", pulsing: true };
};`}</pre>
                <p className="codeBlock__caption">
                  Mass and velocity inputs are converted to SI units before applying KE = ½mv². The resulting energy maps directly to the danger tier and badge color shown in the calculator's results panel — the same object drives both the number and the styling.
                </p>
              </>
            )}
            </div>
          </div>

          {/* Final paragraph */}
          <p className="codeBehindSection__footer">
            Every snippet below comes from the production version of Orbital Watch. They’re excerpts from the real implementation, not example code written just for this page.
          </p>

        </div>
      </div>

      {/* SECTION 4 & 5 — Interactive Reflective Notes */}
      <div className="aboutSection aboutSection--reflection">
        <div className="container">
          <div className="reflectionGrid" ref={reflectionGridRef}>
            {/* Section 4: What I Found Surprising */}
            <div className="card reflectPanel reflectPanel--amber reveal-item">
              <div className="reflectPanel__header">
                <div className="reflectPanel__meta">
                  <span className="reflectPanel__num">04</span>
                  <h3>What Surprised Me</h3>
                </div>
              </div>

              <div className="reflectPanel__body">
                <blockquote className="reflectPanel__quote">
                  {reflectionText}
                </blockquote>
              </div>
            </div>

            {/* Section 5: Open Questions */}
            <div className="card reflectPanel reflectPanel--amber reveal-item">
              <div className="reflectPanel__header">
                <div className="reflectPanel__meta">
                  <span className="reflectPanel__num">05</span>
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

      {/* SECTION 6 — Full Source Library */}
      <div id="sources" className="aboutSection aboutSection--sources">
        <div className="container">
          <div className="aboutSection__header reveal-item">
            <div className="hero__label">Section 06</div>
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
                  <span className="sourceItem__title">European Space Agency (ESA)</span>
                  <span className="sourceItem__details">
                    <em>DISCOSweb Environment Statistics.</em> Space Debris Office, ESOC. Updated 31 July 2025.
                  </span>
                </li>
                <li className="sourceItem">
                  <span className="sourceItem__title">Space-Track.org</span>
                  <span className="sourceItem__details">
                    <em>Satellite Catalog (SATCAT) API.</em> Joint Force Space Component Command (JFSCC). Cached daily.
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

      {/* Page Navigation CTA */}
      <div className="container crisisCTA" style={{ marginBottom: "60px" }}>
        <h3>Explore the Space Commons</h3>
        <p>
          Re-examine the live low Earth orbit environment and active debris trackers.
          Return to the home dashboard to analyze other pillars.
        </p>
        <div className="crisisCTA__actions">
          <Link 
            className="btn btn--primary" 
            to="/#"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = "/";
              window.scrollTo(0, 0);
            }}
          >
            Return to Dashboard →
          </Link>
          <Link className="btn btn--secondary" to="/get-involved">
            Back to Get Involved
          </Link>
        </div>
      </div>
    </section>
  );
}
