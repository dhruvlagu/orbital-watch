# Orbital Watch

**A space debris policy research site tracking the legal and scientific crisis in low Earth orbit.**

🌐 [orbitalwatch.vercel.app](https://orbitalwatch.vercel.app)

---

## What This Is

Orbital Watch is an independent research project exploring how decades of Cold War "Frontier Mentality" created today's orbital debris crisis — and why international policy has failed to address it.

The central argument: active debris removal technology exists today. The barrier isn't scientific. It's a 1967 treaty clause that nobody intended to become a debris removal prohibition, interpreted by nations that have every geopolitical incentive to keep it ambiguous.

This site was built to make that argument legible — through live data, interactive physics tools, and a complete picture of the international policy landscape.

---

## Pages

| Page | What It Does |
|------|-------------|
| **Home** | Live orbital environment dashboard pulling real-time data from Space-Track.org API |
| **The Crisis** | Scrollytelling timeline from Sputnik to today, with a debris growth chart (1957–2025) |
| **The Physics** | Interactive kinetic energy calculator and Kessler cascade simulation |
| **Policy** | Treaty tracker, country scorecard, and a policy reform simulator with live projections |
| **Solutions** | ADR mission map, Tragedy of the Commons explainer, mock SSR audit |
| **Get Involved** | Organizations, student resources, and action links |
| **About** | Research methodology, source library, and personal reflections |

---

## Key Features

**Live Data Integration**
Real-time orbital object counts pulled from the Space-Track.org SATCAT API via a Vercel serverless function (required to handle CORS restrictions). Data cached for 24 hours with a timestamp fallback if the API is unavailable.

**Kinetic Energy Calculator**
User-adjustable mass and velocity sliders compute KE = ½mv² in real time, outputting energy in joules, TNT equivalent, and hand grenade equivalents. Danger classification updates live.

**Kessler Cascade Simulator**
Animated SVG simulation showing debris multiplication. Each click represents one uncontrolled collision event — dots spawn and scatter, visualizing how a cascade becomes self-sustaining above a critical density threshold.

**Treaty Reform Simulator**
Four policy toggles (binding IADC guidelines, ASAT ban, international ADR authority, global 5-year rule) with live recalculation of projected LEO object count by 2050. Baseline: 50,000. Best case with all reforms: 12,000. Modeled on Liou et al. (2021) and ESA Space Environment Report, Issue 9.1 (2025).

**Country Scorecard**
Sortable table rating USA, Russia, China, ESA, and India on debris mitigation compliance, ASAT test history, and ADR investment. Based on public records from ESA, NASA ODPO, and Secure World Foundation.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Routing | React Router DOM |
| Data Visualization | Chart.js + react-chartjs-2 |
| Serverless Functions | JavaScript (ES Modules, `.mjs`) via Vercel |
| Live Data | Space-Track.org SATCAT API |
| Deployment | Vercel (auto-deploy on GitHub push) |
| Analytics | Google Analytics 4 |
| Fonts | Space Grotesk, Inter (Google Fonts) |

**Dependencies**
```
react, react-dom, react-router-dom, chart.js, react-chartjs-2, dotenv
```

---

## Data Sources

**Primary Data**
- ESA Annual Space Environment Report, Issue 9.1 (October 2025) — Space Debris Office, ESOC
- Space-Track.org Satellite Catalog (SATCAT) API — US Space Force / 18th Space Defense Squadron
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

```
SPACE_TRACK_USER=your_space_track_username
SPACE_TRACK_PASS=your_space_track_password
```

A free Space-Track.org account is required. Register at [space-track.org](https://www.space-track.org).

---

## Project Background

This site began as a history research project asking one question: can international policy evolve faster than orbital debris multiplies? What started as a classroom inquiry became an independent research project connecting historical decision-making, orbital physics, and international law.

**Research by Dhruv Lagu** — high school student, independent researcher.
Not affiliated with any space agency, military, or government body.

---

## Contests

- NASA Space Apps Challenge 2025
- Congressional App Challenge 2025

---

*Data sources: ESA DISCOS, Space-Track.org, NASA Orbital Debris Program Office*
