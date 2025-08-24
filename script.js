/* =========================================================
   Quan Do — Portfolio scripts
   What’s inside:
   1) Mobile nav toggle
   2) Scroll-spy active link
   3) Hide navbar on scroll down; show on scroll up
   4) Strava "Recent Activity" (text + optional map)
   5) Local Weather (Open-Meteo, no key)
   ========================================================= */

/* 1) MOBILE NAV TOGGLE ---------------------------------- */
const hamburger = document.querySelector('.hamburger');
const navCollapse = document.querySelector('.nav-collapse');

if (hamburger && navCollapse) {
  hamburger.addEventListener('click', () => {
    const expanded = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', String(!expanded));
    navCollapse.classList.toggle('open');
  });
}

/* 2) SCROLL-SPY ACTIVE LINK ----------------------------- */
const sections = document.querySelectorAll('.section');
const links = document.querySelectorAll('.nav-link');

function updateActiveLink() {
  const mid = window.scrollY + window.innerHeight / 2;
  sections.forEach(sec => {
    const within = mid >= sec.offsetTop && mid < (sec.offsetTop + sec.offsetHeight);
    links.forEach(a => {
      const isTarget = a.getAttribute('href') === `#${sec.id}`;
      a.classList.toggle('active', within && isTarget);
    });
  });
}
window.addEventListener('scroll', updateActiveLink);
window.addEventListener('load', updateActiveLink);

/* Close mobile menu on link click */
links.forEach(a => a.addEventListener('click', () => {
  navCollapse?.classList.remove('open');
  hamburger?.setAttribute('aria-expanded', 'false');
}));

/* 3) HIDE NAVBAR ON SCROLL ------------------------------ */
const navbar = document.querySelector('.navbar');
let lastY = window.scrollY;
let ticking = false;
const SHOW_AT_TOP = 40;   // always show near the top
const DELTA = 6;          // ignore tiny scrolls to reduce jitter

function handleHideOnScroll() {
  const y = window.scrollY;

  // Always show near top
  if (y <= SHOW_AT_TOP) {
    navbar?.classList.remove('navbar--hidden');
    lastY = y;
    return;
  }

  // Keep visible if mobile menu is open
  const menuOpen = navCollapse?.classList.contains('open');

  // Ignore tiny scrolls
  if (Math.abs(y - lastY) < DELTA) return;

  const scrollingDown = y > lastY;
  if (!menuOpen) {
    if (scrollingDown) navbar?.classList.add('navbar--hidden');
    else navbar?.classList.remove('navbar--hidden');
  }
  lastY = y;
}
window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(() => { handleHideOnScroll(); ticking = false; });
    ticking = true;
  }
});
hamburger?.addEventListener('click', () => navbar?.classList.remove('navbar--hidden'));

/* 4) STRAVA: RECENT ACTIVITY ---------------------------------
   - Serverless function path: /.netlify/functions/strava
   - Shows latest activity summary.
   - If map.polyline exists, decodes & draws Leaflet polyline.
   - Time is displayed in America/New_York, regardless of viewer.
*/
const STRAVA_TIMEZONE = 'America/New_York';

document.addEventListener('DOMContentLoaded', async () => {
  await renderStrava();
  await renderWeather();
});

async function renderStrava() {
  const card = document.getElementById('strava-card');
  const mapDiv = document.getElementById('run-map');
  if (!card) return;

  try {
    const res = await fetch('/.netlify/functions/strava');
    if (!res.ok) throw new Error('Failed to reach Strava function');
    const data = await res.json();
    const a = data.latest;

    if (!a) {
      card.innerHTML = '<p class="muted">No recent public runs found.</p>';
      mapDiv?.classList.add('hidden');
      return;
    }

    // Helpers
const mToMi = m => (m / 1609.344);

// Format seconds → h:mm:ss
function secToHMS(totalSec) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.round(totalSec % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  } else {
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}

const distanceMi = mToMi(a.distance || 0);
const timeSec = a.moving_time || 0;
const paceSecPerMi = distanceMi > 0 ? timeSec / distanceMi : 0;

// Render time in Boston/NY
const whenUTC = new Date(a.start_date); // UTC from Strava
const whenText = new Intl.DateTimeFormat(undefined, {
  timeZone: STRAVA_TIMEZONE,
  month: 'short', day: 'numeric',
  hour: 'numeric', minute: '2-digit'
}).format(whenUTC);

// Text summary
card.innerHTML = `
  <div class="strava-row">
    <div class="strava-title">${a.name || 'Recent activity'}</div>
    <div class="strava-badges">
      <span class="badge--pill">${distanceMi.toFixed(2)} mi</span>
      <span class="badge--pill">${secToHMS(timeSec)} moving</span>
      <span class="badge--pill">${secToHMS(paceSecPerMi)}/mi</span>
    </div>
  </div>
  <p class="muted">${whenText} · ${a.type || 'Run'}</p>
`;

    // Map (only if GPS polyline present and Leaflet is loaded)
    const poly = a.map?.summary_polyline;
    if (poly && typeof L !== 'undefined' && mapDiv) {
      const coords = decodePolyline(poly);
      if (coords.length > 1) {
        const map = L.map(mapDiv).setView(coords[0], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        const line = L.polyline(coords, { weight: 4 }).addTo(map);
        map.fitBounds(line.getBounds(), { padding: [20, 20] });
      }
    } else {
      // Hide the map area if no outdoor GPS route (e.g., treadmill)
      mapDiv?.parentNode?.removeChild(mapDiv);
    }
  } catch (err) {
    console.error(err);
    if (card) card.innerHTML = '<p class="muted">Couldn’t load Strava right now.</p>';
    mapDiv?.parentNode?.removeChild(mapDiv);
  }
}

/* Polyline decoder (Google/Strava polyline format) */
function decodePolyline(str) {
  let index = 0, lat = 0, lng = 0, coords = [];
  while (index < str.length) {
    let b, shift = 0, result = 0;
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0; result = 0;
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    coords.push([lat * 1e-5, lng * 1e-5]);
  }
  return coords;
}

/* 5) LOCAL WEATHER (Open-Meteo) -------------------------
   - Tries to use Geolocation; falls back to Amherst, MA.
   - Shows temp, wind, and basic condition text.
*/
/* =============== WEATHER (old-style card) =============== */
/* Renders:  🌤 74°F  Clear   [H: 90°F] [L: 68°F]   Updated 10:45 PM (Amherst, MA)  */

async function renderWeather() {
  const card = document.getElementById('weather-card');
  if (!card) return;

  // Amherst, MA fallback
  const FALLBACK = { lat: 42.3732, lon: -72.5199, label: 'Amherst, MA' };

  const draw = async ({ lat, lon, label }) => {
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,wind_speed_10m,weather_code` +
        `&daily=temperature_2m_max,temperature_2m_min` +
        `&temperature_unit=fahrenheit&wind_speed_unit=mph` +
        `&timezone=America%2FNew_York`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Weather fetch failed');

      const data = await res.json();
      const cur = data.current || {};
      const daily = data.daily || {};

      const temp = Math.round(cur.temperature_2m ?? 0);
      const wind = Math.round(cur.wind_speed_10m ?? 0);
      const code = cur.weather_code ?? 0;
      const text = weatherLabel(code);      // same helper as before
      const emoji = weatherEmoji(code);     // new helper below

      // today’s H/L
      const hi = Math.round(daily.temperature_2m_max?.[0] ?? temp);
      const lo = Math.round(daily.temperature_2m_min?.[0] ?? temp);

      // updated time in Boston/NY
      const updated = new Intl.DateTimeFormat([], {
        timeZone: 'America/New_York',
        hour: 'numeric',
        minute: '2-digit'
      }).format(new Date());

      card.innerHTML = `
        <div class="weather-row">
          <div class="weather-main" style="gap:.6rem">
            <span style="font-size:1.4em; line-height:1">${emoji}</span>
            <span style="font-weight:800; font-size:1.8rem">${temp}°F</span>
            <span class="muted" style="font-weight:700">/ ${text}</span>
          </div>
          <div class="weather-meta">
            <span class="weather-badge">H: ${hi}°F</span>
            <span class="weather-badge">L: ${lo}°F</span>
            <span class="weather-badge">Wind ${wind} mph</span>
            <span class="muted">Updated ${updated} (${label})</span>
          </div>
        </div>
      `;
    } catch (e) {
      console.error(e);
      card.innerHTML = `<p class="muted">Couldn’t load weather right now.</p>`;
    }
  };

  // Try geolocation; fall back to Amherst
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      pos => draw({ lat: pos.coords.latitude, lon: pos.coords.longitude, label: 'Your area' }),
      ()  => draw(FALLBACK),
      { timeout: 6000 }
    );
  } else {
    draw(FALLBACK);
  }
}

/* descriptive text for Open-Meteo weather codes (unchanged) */
function weatherLabel(code) {
  const map = {
    0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Rime fog',
    51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
    56: 'Freezing drizzle', 57: 'Freezing drizzle',
    61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
    66: 'Freezing rain', 67: 'Freezing rain',
    71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Light showers', 81: 'Showers', 82: 'Heavy showers',
    85: 'Light snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm + small hail', 99: 'Thunderstorm + large hail'
  };
  return map[code] ?? '—';
}

/* simple emoji icon for quick visual */
function weatherEmoji(code) {
  if ([0, 1].includes(code)) return '☀️';
  if ([2].includes(code)) return '⛅️';
  if ([3].includes(code)) return '☁️';
  if ([51,53,55,61,63,65,80,81,82].includes(code)) return '🌧️';
  if ([71,73,75,85,86,77].includes(code)) return '🌨️';
  if ([45,48].includes(code)) return '🌫️';
  if ([95,96,99].includes(code)) return '⛈️';
  if ([66,67,56,57].includes(code)) return '🌧️';
  return '🌡️';
}
