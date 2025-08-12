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

// Tweakables
const SHOW_AT_TOP = 40;  // always show nav near top
const DELTA = 6;         // minimal scroll delta to trigger

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

  // Ignore tiny scrolls to avoid jitter
  if (Math.abs(y - lastY) < DELTA) return;

  const scrollingDown = y > lastY;

  if (!menuOpen) {
    if (scrollingDown) {
      navbar?.classList.add('navbar--hidden');
    } else {
      navbar?.classList.remove('navbar--hidden');
    }
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

// Ensure navbar shows after toggling hamburger
hamburger?.addEventListener('click', () => {
  navbar?.classList.remove('navbar--hidden');
});

// ---- Strava "Recent Run" ----
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
  
      const when = new Date(a.start_date_local || a.start_date).toLocaleString([], {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
      });
  
      card.innerHTML = `
        <div class="strava-row">
          <div class="strava-title">${a.name || 'Recent activity'}</div>
          <div class="strava-badges">
            <span class="badge--pill">${distanceMi.toFixed(2)} mi</span>
            <span class="badge--pill">${secToMinSec(timeSec)} moving</span>
            <span class="badge--pill">${secToMinSec(paceSecPerMi)}/mi</span>
          </div>
        </div>
        <p class="muted">${when} · ${a.type || 'Run'}</p>
      `;
    } catch (err) {
      console.error(err);
      card.innerHTML = '<p class="muted">Couldn’t load Strava right now.</p>';
    }
  });
  