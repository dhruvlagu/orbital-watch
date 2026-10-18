# Orbital Watch

**A space debris policy research site tracking the legal and scientific crisis in low Earth orbit.**

🌐 [orbitalwatch.app](https://orbitalwatch.app)

---

## What This Is

Orbital Watch is an independent research project exploring how decades of Cold War "Frontier Mentality" created today's orbital debris crisis and why international policy has failed to address it.

The central argument: active debris removal technology exists today. The barrier isn't scientific. It's a 1967 treaty clause that nobody intended to become a debris removal prohibition, interpreted by nations that have every geopolitical incentive to keep it ambiguous.

This site was built to make that argument legible through real orbital data, interactive physics tools, and a complete picture of the international policy landscape.

---

## Pages

| Page | What It Does |
|------|-------------|
| **Home** | Live orbital environment dashboard, updated daily from Space-Track.org SATCAT data |
| **The Crisis** | Scrollytelling timeline from Sputnik to today, with a debris growth chart (1957–2025) |
| **Collision Watch** | Upcoming predicted conjunction events between tracked objects, updated 3x daily from Space-Track's public CDM feed |
| **The Physics** | Interactive kinetic energy calculator and Kessler cascade simulation |
| **Policy** | Treaty tracker, country scorecard, policy reform simulator with live projections, and links into a preselected civic action |
| **Solutions** | ADR mission map, Tragedy of the Commons explainer, mock SSR audit |
| **Get Involved** | Organizations, student resources, action links, and the Contact Your Representative workflow |
| **About** | Research methodology, source library, personal reflections, and real implementation code excerpts (`/about#the-code`) |

---

## Key Features

**Live Orbital Data Dashboard**
Satellite catalog metrics (total tracked objects, recent additions, debris-to-active ratio) refreshed once daily via a scheduled job, cached server-side, and served instantly to visitors. See *Data Architecture* below for why this isn't fetched live per-request.

**Collision Watch**
Upcoming predicted close-approach events between tracked objects, including miss distance, probability of collision (with a plain-English odds conversion), and risk tier, sourced from Space-Track's public Conjunction Data Message feed and refreshed three times daily.

**Kinetic Energy Calculator**
User-adjustable mass and velocity sliders compute KE = ½mv² in real time, outputting energy in joules, TNT equivalent, and hand grenade equivalents. Danger classification updates live.

**Kessler Cascade Simulator**
Interactive 3D simulation with adjustable parameters (initial object count, orbital altitude band, inclination spread) demonstrating how collision frequency increases with debris density. Features realistic orbital mechanics using Kepler's third law (higher altitudes move slower), 3D perspective rendering, and real-time collision detection to visualize cascade dynamics and the critical density threshold.

**Treaty Reform Simulator**
Four policy toggles (binding IADC guidelines, ASAT ban, international ADR authority, global 5-year rule) with live recalculation of projected LEO object count by 2050. Baseline: 84,000 objects. Best case with all reforms: 20,200 objects (achieved by enabling all four policy options). Individual reform impacts: binding IADC guidelines reduces by 13,400, ASAT ban reduces by 8,400, international ADR authority reduces by 25,200, global 5-year rule reduces by 16,800. This uses assumption-based estimates informed by published research, not a physical orbital propagation model. Modeled on Liou et al. (2021) and ESA Space Environment Report, Issue 10.1 (2026).

**Country Scorecard**
Sortable table rating USA, Russia, China, ESA, and India on debris mitigation compliance, ASAT test history, and ADR investment. Based on public records from ESA, NASA ODPO, and Secure World Foundation.

**Contact Your Representative**
A three-step civic action flow: select one of five orbital-debris policy asks, enter a ZIP code to find the applicable U.S. House representative, then edit and copy a personalized message. The tool presents an official contact form when available, otherwise the official site or phone/mail details, and requires a personal note before its copy or external-contact actions are enabled. Policy Simulator links can open the same workflow with the relevant ask already selected.

---

## Data Architecture

Orbital data is not fetched live on every page load. Space-Track.org enforces strict API usage limits (SATCAT: at most once daily; public CDM: at most 3x daily), and fetching per-visitor would scale request volume with site traffic. That caused a temporary account suspension during development.

Instead:
- A **Vercel Cron Job** queries SATCAT once daily (18:12 UTC, offset from the hour per Space-Track's traffic guidance) and stores the result in Redis.
- A **Cloudflare Worker**, running independently on its own schedule (13:14 / 21:14 / 05:14 UTC), triggers the CDM refresh. This works around Vercel's free-tier limit of one cron job per project while still respecting Space-Track's 3x/day cap.
- SATCAT refreshes use Space-Track's file-number delta, fetching entries newer than the last stored file number. Decayed objects (those with a DECAY date) are filtered out when computing metrics. A full catalog fetch is blocked unless `SATCAT_ALLOW_BOOTSTRAP=true` is explicitly set.
- CDM refreshes query records created in the last 24 hours, then merge them with cached records, deduplicate by satellite pair and TCA rounded to the nearest hour, and discard past events (TCA already passed).
- Redis guards limit SATCAT to one refresh attempt per UTC day and CDM to three attempts per UTC day, with a seven-hour minimum interval between CDM attempts. Failed attempts consume their slot so retries do not exceed those limits.
- User-facing endpoints (`/api/spacetrack/satcat`, `/api/spacetrack/conjunctions`) only ever read from this cached store. They never call Space-Track directly, regardless of how much traffic the site gets. Production endpoints use a 5-minute edge cache (s-maxage=300) to balance freshness with performance.
- If Space-Track is down or returns an error, the scheduled job logs the failure and exits. The cached data remains available to users with its last-updated timestamp visible.

The Contact Your Representative workflow uses a separate server-side lookup endpoint. It sends the entered ZIP code to Geocodio only from the server, identifies the House representative for the most likely congressional district, and returns the representative name, district number, and official contact options (contact form URL, official site, phone, mailing address). It does not use or expose a legislator email address.

---

## Limitations

The Kessler cascade simulation caps at 150 objects per cascade. It demonstrates the cascade concept visually but is not a physical orbital propagation model. The treaty reform simulator uses assumption-based estimates informed by published research rather than a full debris environment propagation model.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Routing | React Router DOM |
| Data Visualization | Chart.js + react-chartjs-2 |
| Serverless Functions | JavaScript (ES Modules, `.mjs`) via Vercel |
| Caching / Storage | Redis (Vercel Marketplace integration, `node-redis` client) |
| Scheduled Jobs | Vercel Cron (SATCAT, daily) + Cloudflare Worker Cron Trigger (CDM, 3x daily) |
| Live Data Sources | Space-Track.org SATCAT + public CDM APIs |
| Representative Lookup | Geocodio congressional-district API (server-side) |
| Deployment | Vercel (auto-deploy on GitHub push) |
| Analytics | Google Analytics 4 |
| Fonts | Space Grotesk, Inter (Google Fonts) |

**Dependencies**
- chart.js (data visualization)
- katex (LaTeX rendering)
- react (UI framework)
- react-chartjs-2 (React wrapper for Chart.js)
- react-dom (React DOM renderer)
- react-katex (React wrapper for KaTeX)
- react-router-dom (client-side routing)
- redis (Redis client for caching)
- dotenv (environment variable loading, dev only)

---

## Data Sources

**Primary Data**
- ESA Annual Space Environment Report, Issue 10.1 (8 September 2026), Space Debris Office, ESOC
- ESA DISCOSweb Environment Statistics (updated 31 July 2026), Space Debris Office, ESOC
- Space-Track.org Satellite Catalog (SATCAT) API, US Space Force / 18th Space Defense Squadron
- Space-Track.org Public Conjunction Data Message (CDM) feed, US Space Force / 18th Space Defense Squadron
- CSET Georgetown Space-Track.org Analysis (April 2025), LEO object distribution by orbital regime
- NASA Orbital Debris Quarterly News, Johnson Space Center

**Policy Documents**
- 1967 Outer Space Treaty, UNOOSA (UN Resolution 2222)
- 1972 Liability Convention, UNOOSA (UN Resolution 2777)
- IADC Space Debris Mitigation Guidelines, Report IADC-02-01 (2002)
- FCC Mitigation of Orbital Debris in the New Space Era, Second Report and Order (FCC 22-74, 2022)

**Academic Papers**
- Kessler, D.J. & Cour-Palais, B.G. (1978). "Collision Frequency of Artificial Satellites: The Creation of a Debris Belt." *Journal of Geophysical Research*, Vol. 83, No. A6.
- Liou, J.-C. et al. (2021). "Active Debris Removal: Stabilization of the LEO Environment." *NASA Orbital Debris Research and Science Reports.*
- ESA Space Debris User's Handbook, ESOC Technical Reference Document

---

## Environment Variables

This project uses the following environment variables:
SPACE_TRACK_USER=your_space_track_username
SPACE_TRACK_PASS=your_space_track_password
STORAGE_REDIS_URL=your_redis_connection_string
CRON_SECRET=a_random_secret_used_to_authenticate_scheduled_jobs
GEOCODIO_API_KEY=your_geocodio_api_key
SATCAT_ALLOW_BOOTSTRAP=true (optional; only for an explicitly approved initial full catalog fetch)
PORT=5173 (optional; dev server port)

A free Space-Track.org account is required. Register at [space-track.org](https://www.space-track.org). `STORAGE_REDIS_URL` is provisioned automatically when connecting a Redis store via Vercel's Marketplace integration. `CRON_SECRET` must also be set identically in the separate Cloudflare Worker responsible for triggering the CDM refresh. `GEOCODIO_API_KEY` is used only by the server-side representative lookup endpoint and is never exposed to visitors.

---

## Project Background

This site began as a history research project asking one question: can international policy evolve faster than orbital debris multiplies? What started as a classroom inquiry became an independent research project connecting historical decision-making, orbital physics, and international law.

**Research by Dhruv Lagu**, high school student, independent researcher.
Not affiliated with any space agency, military, or government body.

---

*Data sources: ESA DISCOS, Space-Track.org, NASA Orbital Debris Program Office*
