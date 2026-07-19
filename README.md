# Orbital Watch

**A space debris policy research site tracking the legal and scientific crisis in low Earth orbit.**

🌐 [orbitalwatch.vercel.app](https://orbitalwatch.vercel.app)

---

## What This Is

Orbital Watch is an independent research project exploring how decades of Cold War "Frontier Mentality" created today's orbital debris crisis — and why international policy has failed to address it.

The central argument: active debris removal technology exists today. The barrier isn't scientific. It's a 1967 treaty clause that nobody intended to become a debris removal prohibition, interpreted by nations that have every geopolitical incentive to keep it ambiguous.

This site was built to make that argument legible — through real orbital data, interactive physics tools, and a complete picture of the international policy landscape.

---

## Pages

| Page | What It Does |
|------|-------------|
| **Home** | Live orbital environment dashboard, updated daily from Space-Track.org SATCAT data |
| **The Crisis** | Scrollytelling timeline from Sputnik to today, with a debris growth chart (1957–2025) |
| **Collision Watch** | Upcoming predicted conjunction events between tracked objects, updated 3x daily from Space-Track's public CDM feed |
| **The Physics** | Interactive kinetic energy calculator and Kessler cascade simulation |
| **Policy** | Treaty tracker, country scorecard, and a policy reform simulator with live projections |
| **Solutions** | ADR mission map, Tragedy of the Commons explainer, mock SSR audit |
| **Get Involved** | Organizations, student resources, and action links |
| **About** | Research methodology, source library, personal reflections, and real implementation code excerpts (`/about#the-code`) |

---

## Key Features

**Live Orbital Data Dashboard**
Satellite catalog metrics (total tracked objects, recent additions, debris-to-active ratio) refreshed once daily via a scheduled job, cached server-side, and served instantly to visitors — see *Data Architecture* below for why this isn't fetched live per-request.

**Collision Watch**
Upcoming predicted close-approach events between tracked objects, including miss distance, probability of collision (with a plain-English odds conversion), and risk tier, sourced from Space-Track's public Conjunction Data Message feed and refreshed three times daily.

**Kinetic Energy Calculator**
User-adjustable mass and velocity sliders compute KE = ½mv² in real time, outputting energy in joules, TNT equivalent, and hand grenade equivalents. Danger classification updates live.

**Kessler Cascade Simulator**
Animated simulation showing debris multiplication. Each click represents one uncontrolled collision event — fragments spawn and orbit outward, visualizing how a cascade becomes self-sustaining above a critical density threshold.

**Treaty Reform Simulator**
Four policy toggles (binding IADC guidelines, ASAT ban, international ADR authority, global 5-year rule) with live recalculation of projected LEO object count by 2050. Baseline: 50,000. Best case with all reforms: 12,000. Modeled on Liou et al. (2021) and ESA Space Environment Report, Issue 9.1 (2025).

**Country Scorecard**
Sortable table rating USA, Russia, China, ESA, and India on debris mitigation compliance, ASAT test history, and ADR investment. Based on public records from ESA, NASA ODPO, and Secure World Foundation.

---

## Data Architecture

Orbital data isn't fetched live on every page load. Space-Track.org enforces strict API usage limits (SATCAT: at most once daily; public CDM: at most 3x daily), and fetching per-visitor would scale request volume with site traffic — which caused a temporary account suspension during development.

Instead:
- A **Vercel Cron Job** queries SATCAT once daily (18:12 UTC, offset from the hour per Space-Track's traffic guidance) and stores the result in Redis.
- A **Cloudflare Worker**, running independently on its own schedule (13:14 / 21:14 / 05:14 UTC), triggers the CDM refresh — this works around Vercel's free-tier limit of one cron job per project while still respecting Space-Track's 3x/day cap.
- Both scheduled jobs use delta queries (fetching only records changed since the last run) rather than re-downloading full datasets.
- User-facing endpoints (`/api/spacetrack`, `/api/conjunctions`) only ever read from this cached store — they never call Space-Track directly, regardless of how much traffic the site gets.

This guarantees a fixed, compliant request volume (4 requests/day total) no matter how many people visit the site. The real implementation — including the session-caching auth logic and the cascade animation's spawn logic — is shown directly on the About page under [The Code Behind It](https://orbitalwatch.vercel.app/about#the-code).

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
| Deployment | Vercel (auto-deploy on GitHub push) |
| Analytics | Google Analytics 4 |
| Fonts | Space Grotesk, Inter (Google Fonts) |

**Dependencies**

---

## Data Sources

**Primary Data**
- ESA Annual Space Environment Report, Issue 9.1 (October 2025) — Space Debris Office, ESOC
- Space-Track.org Satellite Catalog (SATCAT) API — US Space Force / 18th Space Defense Squadron
- Space-Track.org Public Conjunction Data Message (CDM) feed — US Space Force / 18th Space Defense Squadron
- CSET Georgetown Space-Track.org Analysis (April 2025) — LEO object distribution by orbital regime
- NASA Orbital Debris Quarterly News — Johnson Space Center

**Policy Documents**
- 1967 Outer Space Treaty — UNOOSA (UN Resolution 2222)
- 1972 Liability Convention — UNOOSA (UN Resolution 2777)
- IADC Space Debris Mitigation Guidelines, Report IADC-02-01 (2002)
- FCC Mitigation of Orbital Debris in the New Space Era, Second Report and Order (FCC 22-74, 2022)

**Academic Papers**
- Kessler, D.J. & Cour-Palais, B.G. (1978). "Collision Frequency of Artificial Satellites: The Creation of a Debris Belt." *Journal of Geophysical Research*, Vol. 83, No. A6.
- Liou, J.-C. et al. (2021). "Active Debris Removal: Stabilization of the LEO Environment." *NASA Orbital Debris Research and Science Reports.*
- ESA Space Debris User's Handbook — ESOC Technical Reference Document

---

## Environment Variables

This project requires the following environment variables set in Vercel:
SPACE_TRACK_USER=your_space_track_username
SPACE_TRACK_PASS=your_space_track_password
STORAGE_REDIS_URL=your_redis_connection_string
CRON_SECRET=a_random_secret_used_to_authenticate_scheduled_jobs

A free Space-Track.org account is required. Register at [space-track.org](https://www.space-track.org). `STORAGE_REDIS_URL` is provisioned automatically when connecting a Redis store via Vercel's Marketplace integration. `CRON_SECRET` must also be set identically in the separate Cloudflare Worker responsible for triggering the CDM refresh.

---

## Project Background

This site began as a history research project asking one question: can international policy evolve faster than orbital debris multiplies? What started as a classroom inquiry became an independent research project connecting historical decision-making, orbital physics, and international law.

**Research by Dhruv Lagu** — high school student, independent researcher.
Not affiliated with any space agency, military, or government body.

---

*Data sources: ESA DISCOS, Space-Track.org, NASA Orbital Debris Program Office*