// ===== NAV: hamburger toggle =====
const hamburger = document.querySelector('.hamburger');
const navCollapse = document.querySelector('.nav-collapse');

if (hamburger && navCollapse) {
  hamburger.addEventListener('click', () => {
    const expanded = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', String(!expanded));
    navCollapse.classList.toggle('open');
  });
}

// ===== Scroll-spy highlight =====
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

// Close mobile menu on link click
links.forEach(a => a.addEventListener('click', () => {
  navCollapse?.classList.remove('open');
  hamburger?.setAttribute('aria-expanded', 'false');
}));

// ===== Hide navbar on scroll down, show on scroll up =====
const navbar = document.querySelector('.navbar');
let lastY = window.scrollY;
let ticking = false;

const SHOW_AT_TOP = 40;  // always show near top
const DELTA = 6;         // minimal scroll delta to trigger

function handleHideOnScroll() {
  const y = window.scrollY;

  if (y <= SHOW_AT_TOP) {
    navbar?.classList.remove('navbar--hidden');
    lastY = y;
    return;
  }

  const menuOpen = navCollapse?.classList.contains('open');
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
    window.requestAnimationFrame(() => {
      handleHideOnScroll();
      ticking = false;
    });
    ticking = true;
  }
});

hamburger?.addEventListener('click', () => {
  navbar?.classList.remove('navbar--hidden');
});

// ===== Strava "Recent Run" =====
// Force time rendering in Boston/NY regardless of viewer's timezone
const STRAVA_TIMEZONE = 'America/New_York';

document.addEventListener('DOMContentLoaded', async () => {
  const card = document.getElementById('strava-card');
  if (!card) return;

  try {
    const res = await fetch('/.netlify/functions/strava');
    if (!res.ok) throw new Error('Failed to reach function');
    const data = await res.json();
    const a = data.latest;

    if (!a) {
      card.innerHTML = '<p class="muted">No recent public runs found.</p>';
      return;
    }

    // Helpers
    const mToMi = m => (m / 1609.344);
    const secToMinSec = s => {
      const m = Math.floor(s / 60);
      const sec = Math.round(s % 60);
      return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    const distanceMi = mToMi(a.distance || 0);
    const timeSec = a.moving_time || 0;
    const paceSecPerMi = distanceMi > 0 ? timeSec / distanceMi : 0;

    // Use UTC 'start_date' and format in America/New_York
    const whenUTC = new Date(a.start_date);
    const whenText = new Intl.DateTimeFormat(undefined, {
      timeZone: STRAVA_TIMEZONE,
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(whenUTC);

    card.innerHTML = `
      <div class="strava-row">
        <div class="strava-title">${a.name || 'Recent activity'}</div>
        <div class="strava-badges">
          <span class="badge--pill">${distanceMi.toFixed(2)} mi</span>
          <span class="badge--pill">${secToMinSec(timeSec)} moving</span>
          <span class="badge--pill">${secToMinSec(paceSecPerMi)}/mi</span>
        </div>
      </div>
      <p class="muted">${whenText} · ${a.type || 'Run'}</p>
    `;
  } catch (err) {
    console.error(err);
    card.innerHTML = '<p class="muted">Couldn’t load Strava right now.</p>';
  }
});

// ---- Weather (Open-Meteo, no API key) ----
(async function initWeather() {
  const card = document.getElementById('weather-card');
  if (!card) return;

  // Amherst, MA fallback
  const FALLBACK = { lat: 42.3732, lon: -72.5199, name: 'Amherst, MA' };

  // Helpers
  const tz = 'America/New_York';
  const fmt = (n) => Math.round(Number(n)); // round °F
  const wmoLabel = (code) => ({
    0: 'Clear',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Rime fog',
    51: 'Light drizzle',
    53: 'Drizzle',
    55: 'Heavy drizzle',
    61: 'Light rain',
    63: 'Rain',
    65: 'Heavy rain',
    66: 'Freezing rain',
    67: 'Freezing rain',
    71: 'Light snow',
    73: 'Snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Light showers',
    81: 'Showers',
    82: 'Heavy showers',
    85: 'Snow showers',
    86: 'Snow showers',
    95: 'Thunderstorm',
    96: 'Thunder + hail',
    99: 'Thunder + hail'
  }[code] ?? '—');

  const wmoIcon = (code) => {
    if ([0,1].includes(code)) return '☀️';
    if ([2].includes(code)) return '⛅';
    if ([3].includes(code)) return '☁️';
    if ([45,48].includes(code)) return '🌫️';
    if ([51,53,55].includes(code)) return '🌦️';
    if ([61,63,65,80,81,82].includes(code)) return '🌧️';
    if ([71,73,75,85,86,77].includes(code)) return '🌨️';
    if ([95,96,99].includes(code)) return '⛈️';
    if ([66,67].includes(code)) return '🌧️❄️';
    return '🌤️';
  };

  // get today’s high/low from hourly temps
  function getTodayHiLo(hourly, timezone) {
    try {
      const times = hourly.time;
      const temps = hourly.temperature_2m;
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year:'numeric', month:'2-digit', day:'2-digit' })
        .format(new Date());
      const dayTemps = [];

      for (let i = 0; i < times.length; i++) {
        const t = new Date(times[i]);
        const day = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year:'numeric', month:'2-digit', day:'2-digit' })
          .format(t);
        if (day === today) dayTemps.push(temps[i]);
      }
      const hi = Math.max(...dayTemps);
      const lo = Math.min(...dayTemps);
      return { hi, lo };
    } catch {
      return { hi: null, lo: null };
    }
  }

  async function fetchWeather(lat, lon, label) {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.search = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current_weather: 'true',
      hourly: 'temperature_2m,weathercode',
      temperature_unit: 'fahrenheit',
      timezone: tz
    });

    const res = await fetch(url);
    if (!res.ok) throw new Error('weather fetch failed');
    const data = await res.json();

    const cur = data.current_weather;
    const { hi, lo } = getTodayHiLo(data.hourly, tz);

    const icon = wmoIcon(cur.weathercode);
    const labelText = wmoLabel(cur.weathercode);
    const when = new Intl.DateTimeFormat(undefined, {
      timeZone: tz, hour: 'numeric', minute: '2-digit'
    }).format(new Date(cur.time));

    card.innerHTML = `
      <div class="weather-row">
        <div class="weather-main">
          <span>${icon}</span>
          <span>${fmt(cur.temperature)}°F</span>
        </div>
        <div>
          <div><strong>${labelText}</strong></div>
          <div class="weather-meta">
            <span class="weather-badge">H: ${hi !== null ? fmt(hi) : '—'}°F</span>
            <span class="weather-badge">L: ${lo !== null ? fmt(lo) : '—'}°F</span>
            <span class="muted">Updated ${when} (${label})</span>
          </div>
        </div>
      </div>
    `;
  }

  function start(lat, lon, label) {
    fetchWeather(lat, lon, label).catch(() => {
      card.innerHTML = `<p class="muted">Couldn’t load weather right now.</p>`;
    });
  }

  // Try geolocation; fall back to Amherst
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => start(pos.coords.latitude, pos.coords.longitude, 'your location'),
      ()   => start(FALLBACK.lat, FALLBACK.lon, FALLBACK.name),
      { enableHighAccuracy: false, timeout: 6000 }
    );
  } else {
    start(FALLBACK.lat, FALLBACK.lon, FALLBACK.name);
  }
})();
