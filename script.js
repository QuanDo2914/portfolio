const hamburger = document.querySelector('.hamburger');
const navCollapse = document.querySelector('.nav-collapse');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');
const navbar = document.querySelector('.navbar');

if (hamburger && navCollapse) {
  hamburger.addEventListener('click', () => {
    const expanded = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', String(!expanded));
    navCollapse.classList.toggle('open');
    navbar?.classList.remove('navbar--hidden');
  });
}

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    navCollapse?.classList.remove('open');
    hamburger?.setAttribute('aria-expanded', 'false');
  });
});

function updateActiveLink() {
  const marker = window.scrollY + window.innerHeight * 0.45;
  sections.forEach(section => {
    const active = marker >= section.offsetTop && marker < section.offsetTop + section.offsetHeight;
    navLinks.forEach(link => {
      const isTarget = link.getAttribute('href') === `#${section.id}`;
      link.classList.toggle('active', active && isTarget);
    });
  });
}

window.addEventListener('scroll', updateActiveLink, { passive: true });
window.addEventListener('load', updateActiveLink);

let lastY = window.scrollY;
let ticking = false;

function handleNavbar() {
  const y = window.scrollY;
  const menuOpen = navCollapse?.classList.contains('open');

  if (y < 50 || menuOpen) {
    navbar?.classList.remove('navbar--hidden');
  } else if (Math.abs(y - lastY) > 8) {
    navbar?.classList.toggle('navbar--hidden', y > lastY);
  }

  lastY = y;
}

window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      handleNavbar();
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });

document.getElementById('year').textContent = new Date().getFullYear();

const STRAVA_TIMEZONE = 'America/Chicago';

document.addEventListener('DOMContentLoaded', renderStrava);

async function renderStrava() {
  const card = document.getElementById('strava-card');
  const mapDiv = document.getElementById('run-map');
  if (!card) return;

  try {
    const response = await fetch('/.netlify/functions/strava');
    if (!response.ok) throw new Error('Failed to reach Strava function');

    const data = await response.json();
    const activity = data.latest;

    if (!activity) {
      card.innerHTML = '<p class="muted">No recent public activity found.</p>';
      mapDiv?.classList.add('hidden');
      return;
    }

    const distanceMi = (activity.distance || 0) / 1609.344;
    const movingTime = activity.moving_time || 0;
    const pace = distanceMi > 0 ? movingTime / distanceMi : 0;
    const when = new Intl.DateTimeFormat(undefined, {
      timeZone: STRAVA_TIMEZONE,
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(activity.start_date));

    card.innerHTML = `
      <div class="strava-row">
        <div>
          <div class="strava-title">${escapeHtml(activity.name || 'Recent activity')}</div>
          <p class="muted">${when} · ${escapeHtml(activity.type || 'Run')}</p>
        </div>
        <div class="strava-badges">
          <span class="badge--pill">${distanceMi.toFixed(2)} mi</span>
          <span class="badge--pill">${formatTime(movingTime)}</span>
          <span class="badge--pill">${formatTime(pace)}/mi</span>
        </div>
      </div>
    `;

    const polyline = activity.map?.summary_polyline;
    if (!polyline || typeof L === 'undefined' || !mapDiv) {
      mapDiv?.classList.add('hidden');
      return;
    }

    const coordinates = decodePolyline(polyline);
    if (coordinates.length < 2) {
      mapDiv.classList.add('hidden');
      return;
    }

    const map = L.map(mapDiv, { zoomControl: false, scrollWheelZoom: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const line = L.polyline(coordinates, {
      color: '#9df56b',
      weight: 4,
      opacity: 0.9
    }).addTo(map);

    map.fitBounds(line.getBounds(), { padding: [24, 24] });
  } catch (error) {
    console.error(error);
    card.innerHTML = '<p class="muted">Latest activity is temporarily unavailable.</p>';
    mapDiv?.classList.add('hidden');
  }
}

function formatTime(totalSeconds) {
  const safe = Math.max(0, Math.round(totalSeconds || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function decodePolyline(encoded) {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates = [];

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    coordinates.push([lat * 1e-5, lng * 1e-5]);
  }

  return coordinates;
}
