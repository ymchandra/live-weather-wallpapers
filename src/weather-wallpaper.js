const canvas = document.getElementById("wallpaper");
const ctx = canvas.getContext("2d");
const conditionEl = document.getElementById("condition");
const metaEl = document.getElementById("meta");

const QUERY_CONDITION = new URLSearchParams(window.location.search).get("condition");
const COLD_TEMP_THRESHOLD = 8;
const HOT_TEMP_THRESHOLD = 30;
const WIND_SPEED_THRESHOLD = 25;
const GEOLOCATION_TIMEOUT = 10000;
const GEOLOCATION_MAX_AGE = 600000;
const PARTICLE_DENSITY_DIVISOR = 10;
const OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast";
const OPEN_METEO_CURRENT_FIELDS = "temperature_2m,weather_code,wind_speed_10m";
const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);
const CLOUD_CODES = new Set([1, 2, 3, 45, 48]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);
const WIND_SWIRL_COUNT = 120;
const HAZE_LINE_COUNT = 70;
const CALM_SWIRL_COUNT = 28;
const RAIN_RIPPLE_TRIGGER_CHANCE = 0.08;
const RAIN_RIPPLE_Y_OFFSET = 8;
const RAIN_RIPPLE_INITIAL_RADIUS = 2;
const RAIN_RIPPLE_INITIAL_ALPHA = 0.4;
const SUN_X_RATIO = 0.8;
const SUN_Y_RATIO = 0.2;
const SUN_INNER_RADIUS = 8;
const SUN_OUTER_RADIUS_RATIO = 0.4;

const THEMES = {
  hot: { label: "Hot", top: "#3a1f1c", bottom: "#e2853c", accent: "#ffd37a" },
  cold: { label: "Cold", top: "#0e1a2f", bottom: "#4d6f96", accent: "#d9efff" },
  rain: { label: "Rain", top: "#182030", bottom: "#506070", accent: "#c7dfff" },
  wind: { label: "Windy", top: "#1b2430", bottom: "#7a8ca3", accent: "#eef4ff" },
  calm: { label: "Calm", top: "#1a2d4a", bottom: "#93b5dc", accent: "#f6f1d3" },
};

const state = {
  condition: "calm",
  particles: [],
  swirls: [],
  ripples: [],
  haze: [],
  t: 0,
};

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function weatherCodeToCondition({ weatherCode, tempC, windKmh }) {
  if (RAIN_CODES.has(weatherCode)) return "rain";
  if (tempC <= COLD_TEMP_THRESHOLD || SNOW_CODES.has(weatherCode)) return "cold";
  if (windKmh >= WIND_SPEED_THRESHOLD) return "wind";
  if (tempC >= HOT_TEMP_THRESHOLD && !CLOUD_CODES.has(weatherCode)) return "hot";
  return "calm";
}

function rounded(value, fallback = 0) {
  return Math.round(Number(value ?? fallback));
}

function resetScene(condition) {
  state.condition = THEMES[condition] ? condition : "calm";
  state.particles = [];
  state.swirls = [];
  state.ripples = [];
  state.haze = [];
  conditionEl.textContent = `${THEMES[state.condition].label} Weather`;

  const count = Math.floor((canvas.width + canvas.height) / PARTICLE_DENSITY_DIVISOR);
  if (state.condition === "rain") {
    for (let i = 0; i < count; i++) {
      state.particles.push({
        x: random(0, canvas.width),
        y: random(-canvas.height, canvas.height),
        l: random(10, 24),
        v: random(9, 16),
      });
    }
  } else if (state.condition === "cold") {
    for (let i = 0; i < count / 2; i++) {
      state.particles.push({
        x: random(0, canvas.width),
        y: random(-canvas.height, canvas.height),
        r: random(0.8, 2.4),
        vx: random(-0.4, 0.4),
        vy: random(0.5, 1.6),
      });
    }
  } else if (state.condition === "wind") {
    for (let i = 0; i < WIND_SWIRL_COUNT; i++) {
      state.swirls.push({
        x: random(0, canvas.width),
        y: random(0, canvas.height),
        len: random(30, 120),
        speed: random(0.8, 2.4),
        alpha: random(0.08, 0.22),
      });
    }
  } else if (state.condition === "hot") {
    for (let i = 0; i < HAZE_LINE_COUNT; i++) {
      state.haze.push({
        y: random(0, canvas.height),
        amp: random(4, 14),
        freq: random(0.004, 0.012),
        phase: random(0, Math.PI * 2),
      });
    }
  } else {
    for (let i = 0; i < CALM_SWIRL_COUNT; i++) {
      state.swirls.push({
        x: random(0, canvas.width),
        y: random(0, canvas.height * 0.7),
        len: random(80, 180),
        speed: random(0.2, 0.7),
        alpha: random(0.05, 0.12),
      });
    }
  }
}

function paintBackground() {
  const theme = THEMES[state.condition];
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, theme.top);
  grad.addColorStop(1, theme.bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawRain() {
  ctx.strokeStyle = "rgba(220,235,255,0.45)";
  ctx.lineWidth = 1.2;
  for (const p of state.particles) {
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - 2.5, p.y + p.l);
    ctx.stroke();
    p.y += p.v;
    if (p.y > canvas.height) {
      if (Math.random() < RAIN_RIPPLE_TRIGGER_CHANCE) {
        state.ripples.push({
          x: p.x,
          y: canvas.height - RAIN_RIPPLE_Y_OFFSET,
          r: RAIN_RIPPLE_INITIAL_RADIUS,
          a: RAIN_RIPPLE_INITIAL_ALPHA,
        });
      }
      p.y = random(-80, -20);
      p.x = random(0, canvas.width);
    }
  }

  for (const rp of state.ripples) {
    ctx.strokeStyle = `rgba(190,220,255,${rp.a})`;
    ctx.beginPath();
    ctx.ellipse(rp.x, rp.y, rp.r * 2, rp.r, 0, 0, Math.PI * 2);
    ctx.stroke();
    rp.r += 0.35;
    rp.a -= 0.013;
  }
  state.ripples = state.ripples.filter((r) => r.a > 0);
}

function drawCold() {
  for (const p of state.particles) {
    ctx.fillStyle = "rgba(240,248,255,0.65)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    p.x += p.vx + Math.sin(state.t * 0.008 + p.y * 0.01) * 0.2;
    p.y += p.vy;
    if (p.y > canvas.height + 4) {
      p.y = -4;
      p.x = random(0, canvas.width);
    }
    if (p.x < -4) p.x = canvas.width + 4;
    if (p.x > canvas.width + 4) p.x = -4;
  }
}

function drawWind(strong) {
  for (const s of state.swirls) {
    const yOffset = Math.sin(state.t * 0.005 + s.x * 0.01) * (strong ? 9 : 5);
    const x2 = s.x + s.len;
    const y2 = s.y + yOffset;
    ctx.strokeStyle = `rgba(255,255,255,${s.alpha})`;
    ctx.lineWidth = strong ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.quadraticCurveTo(s.x + s.len * 0.5, s.y + yOffset * 0.5, x2, y2);
    ctx.stroke();
    s.x += s.speed;
    if (s.x > canvas.width + s.len) {
      s.x = -s.len;
      s.y = random(0, strong ? canvas.height : canvas.height * 0.7);
    }
  }
}

function drawHot() {
  const sunX = canvas.width * SUN_X_RATIO;
  const sunY = canvas.height * SUN_Y_RATIO;
  const sunOuterRadius = canvas.width * SUN_OUTER_RADIUS_RATIO;
  const sun = ctx.createRadialGradient(sunX, sunY, SUN_INNER_RADIUS, sunX, sunY, sunOuterRadius);
  sun.addColorStop(0, "rgba(255,220,150,0.55)");
  sun.addColorStop(1, "rgba(255,220,150,0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255,240,200,0.06)";
  for (const h of state.haze) {
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += 24) {
      const y = h.y + Math.sin(x * h.freq + state.t * 0.02 + h.phase) * h.amp;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function render() {
  state.t += 1;
  paintBackground();
  if (state.condition === "rain") drawRain();
  if (state.condition === "cold") drawCold();
  if (state.condition === "wind") drawWind(true);
  if (state.condition === "calm") drawWind(false);
  if (state.condition === "hot") drawHot();
  requestAnimationFrame(render);
}

async function detectWeatherCondition() {
  if (QUERY_CONDITION && THEMES[QUERY_CONDITION]) {
    metaEl.textContent = "Preview mode from query parameter.";
    return QUERY_CONDITION;
  }

  if (!navigator.geolocation) {
    metaEl.textContent = "Geolocation unavailable, showing calm fallback.";
    return "calm";
  }

  const position = await new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: GEOLOCATION_TIMEOUT, maximumAge: GEOLOCATION_MAX_AGE })
  ).catch(() => null);

  if (!position) {
    metaEl.textContent = "Location permission denied, showing calm fallback.";
    return "calm";
  }

  const { latitude, longitude } = position.coords;
  const url = `${OPEN_METEO_BASE_URL}?latitude=${latitude}&longitude=${longitude}&current=${OPEN_METEO_CURRENT_FIELDS}`;
  const response = await fetch(url).catch(() => null);
  if (!response || !response.ok) {
    metaEl.textContent = "Weather API unavailable, showing calm fallback.";
    return "calm";
  }

  const data = await response.json();
  const current = data.current || {};
  const next = weatherCodeToCondition({
    weatherCode: Number(current.weather_code ?? 0),
    tempC: Number(current.temperature_2m ?? 20),
    windKmh: Number(current.wind_speed_10m ?? 0),
  });

  const roundedTemp = rounded(current.temperature_2m);
  const roundedWind = rounded(current.wind_speed_10m);
  metaEl.textContent = `${roundedTemp}°C · wind ${roundedWind} km/h`;
  return next;
}

async function start() {
  resize();
  const detected = await detectWeatherCondition();
  resetScene(detected);
  render();
}

window.addEventListener("resize", () => {
  resize();
  resetScene(state.condition);
});

start();
