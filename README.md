# Quan Do — Portfolio

Personal portfolio for Quan Do, focused on software engineering, systems, machine learning, embedded computing, and running.

## Live site

https://quanportfolio.netlify.app/

## Featured work

- **RunRoute** — running route generation using graph search, OpenStreetMap data, route-quality constraints, terrain estimates, and explainable ranking.
- **PiCar-X Mapping** — Raspberry Pi robotics work that maps sensor distance/angle readings into a 2D occupancy grid.
- **Typing Speed Test** — lightweight web application for measuring typing speed in real time.

## Stack

The deployed portfolio intentionally stays lightweight:

- HTML
- CSS
- JavaScript
- Netlify Functions
- Leaflet / OpenStreetMap for the live Strava route map

The `src/` directory contains an older React experiment and is not used by the current Netlify deployment.

## Local preview

Because the site is static, you can serve the repository root with any local HTTP server. For example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

The Strava card depends on the deployed Netlify function, so it may not populate in a basic local preview.
