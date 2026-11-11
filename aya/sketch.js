// noprotect
// ---------- איה גולשת — a tiny surf game in p5.js ----------

// 10 surf spots: time zone, water colour, sand, how big its waves are, what's on the horizon
const BEACHES = [
  { name:'Pipeline, הוואי',          tz:'Pacific/Honolulu',      water:'#1d9fc4', sand:'#e9d3a3', big:1.25, land:'volcano' },
  { name:'Nazaré, פורטוגל',          tz:'Europe/Lisbon',         water:'#2c6f8e', sand:'#d9c39a', big:1.45, land:'lighthouse' },
  { name:'Teahupoʻo, טהיטי',    tz:'Pacific/Tahiti',        water:'#14b3c6', sand:'#d6c8a8', big:1.35, land:'peaks' },
  { name:'Bondi, סידני',             tz:'Australia/Sydney',      water:'#2a8fc0', sand:'#f0dcae', big:0.95, land:'city' },
  { name:'Jeffreys Bay, דרום אפריקה', tz:'Africa/Johannesburg',   water:'#2a7d9f', sand:'#e6d2a6', big:1.1,  land:'hills' },
  { name:'Uluwatu, באלי',            tz:'Asia/Makassar',         water:'#17a8b4', sand:'#efe0bb', big:1.15, land:'temple' },
  { name:'Malibu, קליפורניה',        tz:'America/Los_Angeles',   water:'#3a8db5', sand:'#e8d6ad', big:0.8,  land:'pier' },
  { name:'Puerto Escondido, מקסיקו', tz:'America/Mexico_City',   water:'#259fb7', sand:'#e3c995', big:1.3,  land:'palms' },
  { name:'Hossegor, צרפת',           tz:'Europe/Paris',          water:'#3a7b95', sand:'#ecdcb4', big:1.05, land:'dunes' },
  { name:'חוף הפיק, חיפה',            tz:'Asia/Jerusalem',        water:'#2a98bf', sand:'#efdcb0', big:0.85, land:'haifa' }
];
const SEA_STATES = {
  calm:  { label:'רגוע',      amp:0.035, speed:0.7,  chop:0.15, foam:0.2 },
  mid:   { label:'בינוני',    amp:0.06,  speed:1.0,  chop:0.3,  foam:0.5 },
  big:   { label:'גלים גדולים', amp:0.095, speed:1.3,  chop:0.45, foam:0.8 },
  storm: { label:'סוער',      amp:0.13,  speed:1.7,  chop:0.8,  foam:1.0 }
};
const WEATHERS = {
  sun:    { label:'☀︎ שמש',    dim:1.0,  gray:0.0,  clouds:2,  rain:0,   fog:0 },
  cloudy: { label:'☁︎ מעונן',   dim:0.85, gray:0.3,  clouds:8,  rain:0,   fog:0 },
  rain:   { label:'☂︎ גשם',    dim:0.7,  gray:0.45, clouds:10, rain:140, fog:0.1 },
  fog:    { label:'≋ ערפל',    dim:0.88, gray:0.35, clouds:3,  rain:0,   fog:0.55 },
  storm:  { label:'⚡︎ סערה',   dim:0.55, gray:0.55, clouds:12, rain:260, fog:0.15 }
};
// sky colours through the day [hour, top, bottom]
const SKY_KEYS = [
  [0,   '#0b1030', '#1c2552'], [5,   '#151d48', '#4b4a80'], [6.5, '#4a72b6', '#f6b48a'],
  [8,   '#3c8fe0', '#a8d8f5'], [12,  '#2a86e6', '#c2e7ff'], [16,  '#3989d8', '#d2e6f2'],
  [18.5,'#3a4e99', '#f59a62'], [19.6,'#25295c', '#b3597c'], [21,  '#0f1438', '#2a2d5e'],
  [24,  '#0b1030', '#1c2552']
];
const NIGHT_TINT = [12, 18, 52];

const S = {
  beach: 9, sea: 'mid', weather: 'sun', hourVal: 12, live: true,
  W: 800, H: 480, t: 0, scroll: 0,
  ax: 300, ay: 0, vy: 0, air: false, rot: 0, airTime: 0, spun: 0, wipe: 0,
  score: 0, best: 0, combo: 1,
  stars: [], fx: [], pops: [], clouds: [], drops: [], skyStars: [],
  nextStar: 1, flash: 0, jumpQueued: false, lastMouseX: null
};
const $ = id => document.getElementById(id);

// ---------- colour helpers ----------
function hexRGB(h){ const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mixC(a, b, k){ return [a[0] + (b[0]-a[0])*k, a[1] + (b[1]-a[1])*k, a[2] + (b[2]-a[2])*k]; }
function desatC(c, k){ const g = 0.3*c[0] + 0.59*c[1] + 0.11*c[2]; return mixC(c, [g, g, g], k); }
function sstep(a, b, x){ const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
function css(c, a){ return a === undefined ? `rgb(${c[0]|0},${c[1]|0},${c[2]|0})` : `rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`; }

// time of day → sky colours, light level, sun height
function skyAt(h){
  for(let i = 1; i < SKY_KEYS.length; i++){
    if(h <= SKY_KEYS[i][0]){
      const [h0, t0, b0] = SKY_KEYS[i-1], [h1, t1, b1] = SKY_KEYS[i];
      const k = (h - h0) / (h1 - h0);
      return { top: mixC(hexRGB(t0), hexRGB(t1), k), bot: mixC(hexRGB(b0), hexRGB(b1), k) };
    }
  }
  return { top: hexRGB(SKY_KEYS[0][1]), bot: hexRGB(SKY_KEYS[0][2]) };
}
function sunElev(h){ return Math.sin(Math.PI * (h - 6) / 12); }

// the palette for this frame: everything (time, weather, sea, beach) feeds the colours
function makePalette(){
  const wx = WEATHERS[S.weather];
  const h = S.hourVal;
  const sky = skyAt(h);
  const elev = sunElev(h);
  const light = (0.22 + 0.78 * sstep(-0.18, 0.35, elev)) * wx.dim;
  const warm = sstep(0.35, 0.02, Math.abs(elev)) * (elev > -0.2 ? 1 : 0); // sunrise / sunset glow
  let top = desatC(sky.top, wx.gray), bot = desatC(sky.bot, wx.gray);
  const dark = 1 - wx.dim;
  top = mixC(top, [40, 44, 60], dark * 0.7); bot = mixC(bot, [70, 74, 90], dark * 0.6);
  if(wx.fog){ const fogC = mixC([215, 220, 228], NIGHT_TINT, 1 - light); top = mixC(top, fogC, wx.fog * 0.6); bot = mixC(bot, fogC, wx.fog * 0.8); }
  const beach = BEACHES[S.beach];
  let water = hexRGB(beach.water);
  if(S.sea === 'storm'){ water = mixC(water, [70, 95, 95], 0.45); }
  water = desatC(water, wx.gray * 0.8);
  water = mixC(water, bot, 0.25);
  // shade(): applies night + weather to any scene colour
  const shade = (hex, extra) => {
    let c = typeof hex === 'string' ? hexRGB(hex) : hex;
    c = desatC(c, wx.gray * 0.7);
    if(warm > 0){ c = mixC(c, [255, 150, 110], warm * 0.18); }
    c = mixC(c, NIGHT_TINT, (1 - light) * 0.72 + (extra || 0));
    if(wx.fog){ c = mixC(c, [205, 210, 218], wx.fog * 0.35 * light); }
    return c;
  };
  return { top, bot, light, elev, warm, water, shade, wx };
}

// native canvas path (same on every p5 version): cmds = [['M',x,y],['L',x,y],['C',x1,y1,x2,y2,x,y]]
function nativeShape(cmds, fillC, strokeC, lw){
  const ctx = drawingContext;
  ctx.beginPath();
  for(const c of cmds){
    if(c[0] === 'M'){ ctx.moveTo(c[1], c[2]); }
    else if(c[0] === 'L'){ ctx.lineTo(c[1], c[2]); }
    else { ctx.bezierCurveTo(c[1], c[2], c[3], c[4], c[5], c[6]); }
  }
  if(fillC){ ctx.closePath(); ctx.fillStyle = css(fillC); ctx.fill(); }
  if(strokeC){ ctx.strokeStyle = css(strokeC); ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.stroke(); }
}

// ---------- the sea surface ----------
function seaLevel(){
  const st = SEA_STATES[S.sea];
  // the tide: the whole sea slowly rises and falls
  return S.H * 0.66 + Math.sin(S.t * 0.18) * S.H * 0.05 + Math.sin(S.t * 0.07 + 1) * S.H * 0.015 * (1 + st.chop);
}
function surfaceY(x){
  const st = SEA_STATES[S.sea], big = BEACHES[S.beach].big;
  const A = S.H * st.amp * big;
  const u = (x + S.scroll) / S.W;
  const swell = Math.sin(u * 6.0 - S.t * 0.6) * A + Math.sin(u * 13.7 + 1.3 - S.t * 0.9) * A * 0.33;
  const chop = Math.sin(u * 41 + S.t * 3.1) * A * 0.08 * st.chop + Math.sin(u * 77 - S.t * 4.2) * A * 0.04 * st.chop;
  return seaLevel() - swell - chop;
}

// ---------- setup / loop ----------
function setup(){
  ensureUI(); initUI();
  const c = createCanvas(10, 10);
  c.parent('stage');
  pixelDensity(Math.min(2, displayDensity()));
  sizeCanvas();
  c.elt.addEventListener('pointerdown', e => { e.preventDefault(); S.jumpQueued = true; });
  S.ax = S.W * 0.4;
  for(let i = 0; i < 90; i++){ S.skyStars.push({ x: Math.random(), y: Math.random() * 0.4, s: Math.random() * 1.6 + 0.4, p: Math.random() * 6 }); }
  rebuildClouds();
  syncLiveHour();
}

function sizeCanvas(){
  const stage = $('stage');
  const cs = getComputedStyle(stage);
  const inner = (stage.clientWidth || windowWidth) - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0);
  const w = Math.max(300, Math.min(1400, Math.floor(inner)));
  const h = Math.round(Math.min(w * 0.6, window.innerHeight * 0.78));
  S.W = w; S.H = Math.max(300, h);
  resizeCanvas(S.W, S.H);
}
function windowResized(){ sizeCanvas(); rebuildClouds(); }

function keyPressed(){
  if(key === ' ' || keyCode === UP_ARROW){ S.jumpQueued = true; return false; }
}

function draw(){
  const dt = Math.min(0.05, deltaTime / 1000 || 0.016);
  S.t += dt;
  if(S.live && frameCount % 30 === 0){ syncLiveHour(); }
  const st = SEA_STATES[S.sea];
  S.scroll += dt * S.W * 0.22 * st.speed;
  const P = makePalette();
  drawingContext.direction = 'ltr';

  drawSky(P);
  drawCelestial(P);
  drawClouds(P, dt);
  drawLandmark(P);
  drawFarSea(P);
  drawSand(P);
  drawSwell(P);
  updateGame(dt);
  drawCollectibles(P, dt);
  drawAya(P);
  drawFx(P, dt);
  drawRain(P, dt);
  drawWeatherOverlay(P, dt);
  drawHUD(P);
}

// ---------- sky ----------
function drawSky(P){
  const g = drawingContext.createLinearGradient(0, 0, 0, S.H * 0.45);
  g.addColorStop(0, css(P.top)); g.addColorStop(1, css(P.bot));
  drawingContext.fillStyle = g;
  drawingContext.fillRect(0, 0, S.W, S.H);
}

function drawCelestial(P){
  const ctx = drawingContext, h = S.hourVal, horizon = S.H * 0.42;
  const night = 1 - sstep(-0.25, 0.1, P.elev);
  const veil = Math.max(0, 1 - P.wx.clouds / 14 - P.wx.fog);
  // stars
  if(night > 0.02){
    noStroke();
    for(const s of S.skyStars){
      const tw = 0.6 + 0.4 * Math.sin(S.t * 2 + s.p);
      fill(255, 255, 240, 255 * night * tw * veil);
      circle(s.x * S.W, s.y * S.H, s.s);
    }
  }
  // sun travels left → right between 6:00 and 18:00
  const placeOnArc = (hh) => {
    const k = (hh - 6) / 12;
    return [S.W * (0.08 + 0.84 * k), horizon - Math.sin(Math.PI * k) * S.H * 0.34];
  };
  if(P.elev > -0.15){
    const [sx, sy] = placeOnArc(h);
    const sunC = mixC([255, 244, 200], [255, 140, 80], P.warm);
    const r = S.H * 0.05;
    const glow = ctx.createRadialGradient(sx, sy, r * 0.5, sx, sy, r * 4);
    glow.addColorStop(0, css(sunC, 0.55 * veil + 0.1)); glow.addColorStop(1, css(sunC, 0));
    ctx.fillStyle = glow; ctx.fillRect(sx - r*4, sy - r*4, r*8, r*8);
    noStroke(); fill(sunC[0], sunC[1], sunC[2], 255 * (0.35 + 0.65 * veil)); circle(sx, sy, r * 2);
    S.sunX = sx; S.sunGlow = sunC;
  } else { S.sunX = null; }
  // moon on the opposite arc
  const mh = (h + 12) % 24;
  if(mh > 5.6 && mh < 18.4){
    const [mx, my] = placeOnArc(mh);
    const r = S.H * 0.032;
    noStroke(); fill(245, 242, 225, 255 * (0.3 + 0.7 * veil) * night);
    circle(mx, my, r * 2);
    fill(P.top[0], P.top[1], P.top[2], 255 * night * 0.9); circle(mx + r * 0.55, my - r * 0.25, r * 1.7); // crescent
    if(night > 0.5){ S.moonX = mx; } else { S.moonX = null; }
  } else { S.moonX = null; }
}

function rebuildClouds(){
  const wx = WEATHERS[S.weather];
  S.clouds = [];
  for(let i = 0; i < wx.clouds; i++){
    S.clouds.push({ x: Math.random() * 1.2 - 0.1, y: 0.04 + Math.random() * 0.26, s: 0.6 + Math.random() * 0.9, v: 0.004 + Math.random() * 0.01 });
  }
  S.drops = [];
  for(let i = 0; i < wx.rain; i++){ S.drops.push({ x: Math.random(), y: Math.random(), v: 0.8 + Math.random() * 0.6 }); }
}

function drawClouds(P, dt){
  const heavy = S.weather === 'storm' || S.weather === 'rain';
  let base = heavy ? [120, 125, 140] : [250, 250, 252];
  if(P.warm > 0){ base = mixC(base, [255, 175, 160], P.warm * 0.6); }
  const c = P.shade(base, -0.15);
  noStroke();
  for(const cl of S.clouds){
    cl.x += cl.v * dt * (S.weather === 'storm' ? 3 : 1);
    if(cl.x > 1.25){ cl.x = -0.25; }
    const x = cl.x * S.W, y = cl.y * S.H, r = S.H * 0.06 * cl.s;
    fill(c[0], c[1], c[2], heavy ? 235 : 215);
    ellipse(x, y, r * 3.2, r * 1.3);
    ellipse(x - r * 0.9, y + r * 0.1, r * 1.8, r * 1.2);
    ellipse(x + r * 0.2, y - r * 0.45, r * 1.9, r * 1.5);
    ellipse(x + r * 1.1, y + r * 0.05, r * 1.6, r * 1.05);
  }
}

// ---------- the landmark on the horizon (one per beach) ----------
function drawLandmark(P){
  const b = BEACHES[S.beach], W = S.W, H = S.H, hz = H * 0.42;
  const haze = (hex, k) => mixC(P.shade(hex), P.bot, k === undefined ? 0.45 : k);
  const poly = (c, pts) => { noStroke(); fill(c[0], c[1], c[2]); beginShape(); for(const [x, y] of pts){ vertex(x * W, y); } endShape(CLOSE); };
  const ridge = (c, y0, amp, f, ph) => {
    noStroke(); fill(c[0], c[1], c[2]); beginShape(); vertex(0, hz + 2);
    for(let x = 0; x <= W; x += W / 60){ vertex(x, y0 - amp * (0.5 + 0.5 * Math.sin(x / W * f + ph)) * (0.6 + 0.4 * Math.sin(x / W * f * 2.3 + ph * 2))); }
    vertex(W, hz + 2); endShape(CLOSE);
  };
  const palm = (x, y, s, c) => {
    nativeShape([['M', x, y], ['C', x + s * 0.1, y - s * 0.5, x - s * 0.05, y - s * 0.8, x + s * 0.15, y - s]], null, c, s * 0.08);
    noStroke(); fill(c[0], c[1], c[2]);
    for(let k = 0; k < 6; k++){
      const a = -Math.PI / 2 + (k - 2.5) * 0.55;
      push(); translate(x + s * 0.15, y - s); rotate(a + Math.PI / 2);
      ellipse(0, -s * 0.22, s * 0.12, s * 0.5); pop();
    }
  };
  switch(b.land){
    case 'volcano':
      ridge(haze('#4e7d55', 0.55), hz, H * 0.16, 5, 0.4);
      poly(haze('#3f6a47', 0.35), [[0.55, hz], [0.72, hz - H * 0.2], [0.78, hz - H * 0.21], [0.95, hz]]);
      palm(W * 0.15, hz, H * 0.14, haze('#2f4f35', 0.25));
      palm(W * 0.21, hz, H * 0.11, haze('#2f4f35', 0.25));
      break;
    case 'lighthouse': {
      poly(haze('#a99878', 0.3), [[0.58, hz], [0.62, hz - H * 0.13], [0.86, hz - H * 0.15], [1, hz - H * 0.1], [1, hz]]);
      const c = haze('#c9473f', 0.3), wc = haze('#f1ede4', 0.3);
      noStroke(); fill(wc[0], wc[1], wc[2]); rect(W * 0.7, hz - H * 0.22, W * 0.03, H * 0.08);
      fill(c[0], c[1], c[2]); rect(W * 0.695, hz - H * 0.24, W * 0.04, H * 0.025);
      if(P.light < 0.6){ fill(255, 240, 170, 200 * (1 - P.light)); circle(W * 0.715, hz - H * 0.205, H * 0.02); }
      break;
    }
    case 'peaks':
      ridge(haze('#3e7f5c', 0.55), hz, H * 0.1, 4, 1);
      poly(haze('#2f6b4c', 0.3), [[0.45, hz], [0.55, hz - H * 0.18], [0.6, hz - H * 0.1], [0.66, hz - H * 0.24], [0.74, hz - H * 0.12], [0.85, hz]]);
      break;
    case 'city': {
      const tall = false;
      ridge(haze(tall ? '#d9c8a0' : '#c7a879', 0.4), hz, H * 0.03, 3, 0);
      noStroke();
      for(let i = 0; i < 22; i++){
        const x = W * (0.08 + i * 0.04), bh = H * (0.04 + ((i * 37) % 11) / 11 * (tall ? 0.15 : 0.09));
        const c = haze(i % 3 ? '#9aa6b8' : '#b8c0cc', 0.4);
        fill(c[0], c[1], c[2]); rect(x, hz - bh, W * 0.032, bh);
        if(P.light < 0.55){ fill(255, 220, 140, 180 * (1 - P.light)); for(let k = 0; k < 4; k++){ rect(x + W * 0.006 + (k % 2) * W * 0.013, hz - bh + H * 0.012 + Math.floor(k / 2) * H * 0.02, W * 0.006, H * 0.008); } }
      }
      if(tall){ const c = haze('#8f9bb0', 0.3); fill(c[0], c[1], c[2]); rect(W * 0.6, hz - H * 0.24, W * 0.035, H * 0.24); rect(W * 0.65, hz - H * 0.21, W * 0.03, H * 0.21); }
      break;
    }
    case 'haifa': {
      // Mount Carmel sloping into the sea, terraced gardens with the golden dome, port cranes
      const carmel = haze('#5d7f4f', 0.4);
      noStroke(); fill(carmel[0], carmel[1], carmel[2]);
      beginShape(); vertex(W * 0.28, hz + 2);
      for(let k = 0; k <= 40; k++){ const x = 0.28 + k * 0.018; vertex(W * x, hz - H * 0.24 * sstep(0.28, 0.75, x) - Math.sin(x * 40) * H * 0.006); }
      vertex(W, hz - H * 0.25); vertex(W, hz + 2); endShape(CLOSE);
      // terraces
      const ter = haze('#8fae6a', 0.35); fill(ter[0], ter[1], ter[2]);
      for(let k = 0; k < 7; k++){ const yy = hz - H * (0.03 + k * 0.022); rect(W * (0.6 - k * 0.004), yy, W * (0.07 - k * 0.006), H * 0.012, 3); }
      const dome = haze('#e5b94a', 0.2); fill(dome[0], dome[1], dome[2]);
      const wall = haze('#efe6d4', 0.25);
      fill(wall[0], wall[1], wall[2]); rect(W * 0.618, hz - H * 0.15, W * 0.03, H * 0.035);
      fill(dome[0], dome[1], dome[2]); arc(W * 0.633, hz - H * 0.15, W * 0.024, H * 0.04, Math.PI, 0, CHORD);
      // houses dotting the slope
      for(let k = 0; k < 18; k++){
        const x = 0.4 + ((k * 37) % 50) / 100, y = hz - H * 0.24 * sstep(0.28, 0.75, x) * (0.25 + ((k * 13) % 7) / 10);
        const hc = haze(k % 2 ? '#e8e2d6' : '#d6cfc0', 0.35); fill(hc[0], hc[1], hc[2]); rect(W * x, y, W * 0.012, H * 0.012);
        if(P.light < 0.55){ fill(255, 220, 140, 220 * (1 - P.light)); rect(W * x + W * 0.003, y + H * 0.003, W * 0.004, H * 0.005); }
      }
      // port cranes on the left
      const cr = haze('#c2563f', 0.35); stroke(cr[0], cr[1], cr[2]); strokeWeight(Math.max(1.5, H * 0.004));
      for(let k = 0; k < 3; k++){ const x = W * (0.08 + k * 0.06); line(x, hz, x, hz - H * 0.09); line(x - W * 0.01, hz - H * 0.09, x + W * 0.035, hz - H * 0.09); line(x, hz - H * 0.06, x + W * 0.02, hz - H * 0.09); }
      noStroke();
      break;
    }
    case 'hills':
      ridge(haze('#7b8d5a', 0.55), hz, H * 0.08, 3, 2);
      ridge(haze('#5f7446', 0.35), hz, H * 0.045, 6, 0.5);
      break;
    case 'temple': {
      poly(haze('#c8b48a', 0.3), [[0.5, hz], [0.53, hz - H * 0.14], [1, hz - H * 0.15], [1, hz]]);
      const c = haze('#6e5a48', 0.3);
      noStroke(); fill(c[0], c[1], c[2]);
      for(let k = 0; k < 4; k++){ rect(W * (0.7 - k * 0.006), hz - H * (0.16 + k * 0.025), W * (0.04 + k * 0.012), H * 0.025); }
      ridge(haze('#4f7a48', 0.3), hz - H * 0.14, H * 0.02, 9, 1);
      break;
    }
    case 'pier': {
      ridge(haze('#a69a6e', 0.55), hz, H * 0.09, 3.4, 0.3);
      const c = haze('#5e4b3c', 0.3);
      stroke(c[0], c[1], c[2]); strokeWeight(H * 0.008); line(W * 0.45, hz - H * 0.03, W * 0.98, hz - H * 0.03);
      strokeWeight(H * 0.004); for(let x = W * 0.46; x < W * 0.98; x += W * 0.03){ line(x, hz - H * 0.03, x, hz + 2); }
      break;
    }
    case 'palms':
      ridge(haze('#8a7a5a', 0.5), hz, H * 0.05, 4, 1.4);
      for(let k = 0; k < 5; k++){ palm(W * (0.6 + k * 0.08), hz, H * (0.1 + (k % 2) * 0.04), haze('#2e5236', 0.25)); }
      break;
    case 'dunes': {
      ridge(haze('#e3d1a6', 0.4), hz, H * 0.05, 2.5, 0.2);
      const c = haze('#2f4a35', 0.3); noStroke(); fill(c[0], c[1], c[2]);
      for(let k = 0; k < 14; k++){ const x = W * (0.05 + k * 0.07), s = H * (0.05 + (k % 3) * 0.015); triangle(x - s * 0.4, hz - H * 0.02, x + s * 0.4, hz - H * 0.02, x, hz - H * 0.02 - s); }
      break;
    }
  }
}

// ---------- sea ----------
function drawFarSea(P){
  const ctx = drawingContext, hz = S.H * 0.42;
  const top = P.shade(mixC(P.water, P.bot, 0.45), -0.1), deep = P.shade(P.water);
  const g = ctx.createLinearGradient(0, hz, 0, S.H);
  g.addColorStop(0, css(top)); g.addColorStop(1, css(deep));
  ctx.fillStyle = g; ctx.fillRect(0, hz, S.W, S.H - hz);
  // sun / moon glitter on the water
  const gx = S.sunX !== null && S.sunX !== undefined ? S.sunX : S.moonX;
  if(gx !== null && gx !== undefined){
    const gc = S.sunX !== null && S.sunX !== undefined ? S.sunGlow : [235, 235, 220];
    noStroke();
    for(let i = 0; i < 26; i++){
      const y = hz + 4 + i * (S.H * 0.012);
      const w = (8 + i * 2.2) * (0.6 + 0.4 * Math.sin(S.t * 3 + i * 1.7));
      fill(gc[0], gc[1], gc[2], 120 * (1 - i / 26) * (0.4 + 0.6 * (1 - P.wx.gray)));
      rect(gx - w / 2 + Math.sin(S.t * 2 + i) * 6, y, w, 2);
    }
  }
}

function drawSand(P){
  const c = P.shade(BEACHES[S.beach].sand), wet = P.shade(mixC(hexRGB(BEACHES[S.beach].sand), [120, 100, 70], 0.3));
  const W = S.W, H = S.H;
  nativeShape([['M', 0, H * 0.7], ['C', W * 0.12, H * 0.74, W * 0.26, H * 0.86, W * 0.4, H], ['L', 0, H]], wet);
  nativeShape([['M', 0, H * 0.72], ['C', W * 0.1, H * 0.76, W * 0.2, H * 0.86, W * 0.32, H], ['L', 0, H]], c);
}

function drawSwell(P){
  const ctx = drawingContext, st = SEA_STATES[S.sea];
  const step = Math.max(4, S.W / 220);
  const pts = [];
  for(let x = -step; x <= S.W + step; x += step){ pts.push([x, surfaceY(x)]); }
  const crestC = P.shade(mixC(P.water, [170, 240, 235], 0.35));
  const deepC = P.shade(mixC(P.water, [10, 40, 70], 0.45));
  const g = ctx.createLinearGradient(0, seaLevel() - S.H * 0.12, 0, S.H);
  g.addColorStop(0, css(crestC, 0.96)); g.addColorStop(1, css(deepC, 0.98));
  ctx.beginPath(); ctx.moveTo(pts[0][0], S.H);
  for(const [x, y] of pts){ ctx.lineTo(x, y); }
  ctx.lineTo(S.W + step, S.H); ctx.closePath();
  ctx.fillStyle = g; ctx.fill();
  // foam along the top, thicker where the wave is steep or high
  const foam = P.shade([250, 252, 255], -0.2);
  ctx.lineCap = 'round';
  for(let i = 1; i < pts.length; i++){
    const [x0, y0] = pts[i-1], [x1, y1] = pts[i];
    const high = sstep(seaLevel() - S.H * 0.02, seaLevel() - S.H * st.amp, y1);
    const w = 1.5 + (high * 5 + Math.abs(y1 - y0) * 0.6) * st.foam;
    ctx.strokeStyle = css(foam, 0.35 + 0.6 * high * st.foam);
    ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x0, y0 + w * 0.3); ctx.lineTo(x1, y1 + w * 0.3); ctx.stroke();
  }
  // a few lines of texture in the water
  ctx.strokeStyle = css(foam, 0.18);
  ctx.lineWidth = 1.2;
  for(let k = 1; k <= 4; k++){
    ctx.beginPath();
    for(let x = 0; x <= S.W; x += step * 3){
      const y = surfaceY(x) + k * S.H * 0.05 + Math.sin(x * 0.03 + S.t * 1.5 + k) * 3;
      if(x === 0){ ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
    }
    ctx.stroke();
  }
  // spray in big / stormy seas
  if(st.foam > 0.7 && Math.random() < st.foam * 0.5){
    const x = Math.random() * S.W;
    S.fx.push({ x, y: surfaceY(x), vx: -40 - Math.random() * 60, vy: -80 - Math.random() * 120, life: 0.8, c: [255, 255, 255], r: 2 + Math.random() * 2 });
  }
}

// ---------- game ----------
function updateGame(dt){
  const st = SEA_STATES[S.sea];
  // steer with the mouse
  if(mouseX > 0 && mouseX < S.W && mouseY > 0 && mouseY < S.H){
    const tx = Math.min(S.W * 0.88, Math.max(S.W * 0.12, mouseX));
    S.ax += (tx - S.ax) * Math.min(1, dt * 5);
  }
  const sy = surfaceY(S.ax);
  const slope = (surfaceY(S.ax + 6) - surfaceY(S.ax - 6)) / 12;
  const ang = Math.atan(slope);

  if(S.wipe > 0){
    S.wipe -= dt;
    S.ay = sy; S.rot += dt * 9; S.air = false; S.jumpQueued = false;
    if(S.wipe <= 0){ S.rot = ang; }
    return;
  }
  if(!S.air){
    S.ay = sy;
    S.rot += (ang - S.rot) * Math.min(1, dt * 10);
    S.score += dt * 4 * st.speed * BEACHES[S.beach].big;
    if(S.jumpQueued){
      S.air = true; S.airTime = 0; S.spun = 0;
      S.vy = -S.H * (0.95 + st.amp * 4 * BEACHES[S.beach].big);
      splash(S.ax, sy, 10, [255, 255, 255]);
    }
  } else {
    S.airTime += dt;
    S.vy += S.H * 2.6 * dt;
    S.ay += S.vy * dt;
    // spin: move the mouse fast while in the air
    if(S.lastMouseX !== null){
      const d = (mouseX - S.lastMouseX) * 0.012;
      S.rot += d; S.spun += d;
    }
    if(keyIsDown(LEFT_ARROW)){ S.rot -= dt * 8; S.spun -= dt * 8; }
    if(keyIsDown(RIGHT_ARROW)){ S.rot += dt * 8; S.spun += dt * 8; }
    if(S.ay >= sy && S.vy > 0){
      S.air = false; S.ay = sy;
      let diff = (S.rot - ang) % (Math.PI * 2);
      if(diff > Math.PI){ diff -= Math.PI * 2; }
      if(diff < -Math.PI){ diff += Math.PI * 2; }
      if(Math.abs(diff) < 0.8){
        const spins = Math.floor(Math.abs(S.spun) / (Math.PI * 2) + 0.15);
        const pts = Math.round((S.airTime * 30 + spins * 120) * S.combo);
        S.score += pts;
        S.combo = Math.min(5, S.combo + 1);
        popText(spins ? `סיבוב ×${spins}!  +${pts}` : `+${pts}`, S.ax, sy - S.H * 0.18);
        S.rot = ang;
        splash(S.ax, sy, 14, [255, 255, 255]);
      } else {
        S.wipe = 1.1; S.combo = 1;
        popText('אופס! 🌊', S.ax, sy - S.H * 0.18);
        splash(S.ax, sy, 40, [255, 255, 255]);
      }
    }
  }
  S.jumpQueued = false;
  S.lastMouseX = mouseX;
  S.best = Math.max(S.best, Math.floor(S.score));
}

function splash(x, y, n, c){
  for(let i = 0; i < n; i++){
    S.fx.push({ x, y, vx: (Math.random() - 0.5) * 220, vy: -Math.random() * 260, life: 0.6 + Math.random() * 0.5, c, r: 1.5 + Math.random() * 3 });
  }
}
function popText(s, x, y){ S.pops.push({ s, x, y, life: 1.3 }); }

function drawCollectibles(P, dt){
  const st = SEA_STATES[S.sea];
  S.nextStar -= dt;
  if(S.nextStar <= 0){
    S.nextStar = 0.9 + Math.random() * 1.2;
    const x = S.W + 30;
    S.stars.push({ x, h: S.H * (0.05 + Math.random() * 0.3), spin: Math.random() * 6 });
  }
  const c = P.shade([255, 214, 70], -0.3);
  for(let i = S.stars.length - 1; i >= 0; i--){
    const s = S.stars[i];
    s.x -= dt * S.W * 0.22 * st.speed;
    s.spin += dt * 2;
    const y = surfaceY(s.x) - s.h + Math.sin(S.t * 3 + s.spin) * 4;
    const r = S.H * 0.022;
    // collected?
    const ayTop = S.ay - S.H * 0.08;
    if(Math.hypot(s.x - S.ax, y - ayTop) < S.H * 0.09 && S.wipe <= 0){
      S.score += 25 * S.combo;
      splash(s.x, y, 16, [255, 220, 90]);
      popText(`+${25 * S.combo} ✦`, s.x, y - 14);
      S.stars.splice(i, 1);
      continue;
    }
    if(s.x < -40){ S.stars.splice(i, 1); continue; }
    push(); translate(s.x, y); rotate(s.spin);
    noStroke(); fill(c[0], c[1], c[2], 60); circle(0, 0, r * 3.2);
    fill(c[0], c[1], c[2]);
    beginShape();
    for(let k = 0; k < 10; k++){ const a = k * Math.PI / 5 - Math.PI / 2, rr = k % 2 ? r * 0.45 : r; vertex(Math.cos(a) * rr, Math.sin(a) * rr); }
    endShape(CLOSE);
    pop();
  }
}

// ---------- Aya: modern flat style (no outlines, flat colour shapes, tiny navy details) ----------
// sporty surfer, long blonde hair, black wetsuit, blue 6'6" fish board
function drawAya(P){
  const u = S.H * 0.0095;
  const U = (pts) => pts.map(c => [c[0]].concat(c.slice(1).map(v => v * u)));
  const C = (hex) => P.shade(hex);
  const flat = (pts, hex) => nativeShape(U(pts), C(hex));
  const ln = (pts, hex, w) => nativeShape(U(pts), null, C(hex), w * u);
  const limb = (pts, hex, w) => { const p = U(pts.map(q => ['L', q[0], q[1]])); p[0][0] = 'M'; nativeShape(p, null, C(hex), w * u); };
  const dot = (x, y, r, hex) => { const ctx = drawingContext; ctx.beginPath(); ctx.arc(x * u, y * u, r * u, 0, Math.PI * 2); ctx.fillStyle = css(C(hex)); ctx.fill(); };
  const wind = S.t * 7, sw = Math.sin(wind) * 0.5;
  const SKIN = '#ef9274', SKIN_D = '#d9735b', HAIR = '#f6c945', HAIR_D = '#e2a72f', SUIT = '#1d2028', SUIT_L = '#353a46', NAVY = '#24304a', BOARD = '#2f7fd6';
  const armY = Math.sin(S.t * 2.2) * 0.4;
  drawingContext.lineJoin = 'round';
  push();
  translate(S.ax, S.ay - u * 0.6);
  rotate(S.rot);
  if(S.wipe > 0){ translate(0, u * 3); }

  // blue fish board: wide, short, swallow tail, twin fins
  flat([['M', -6.4, -0.1], ['L', -5.2, 0.15], ['L', -6.2, 0.75],
        ['C', -2, 1.25, 4, 1.15, 6.6, 0.1], ['C', 5.6, -0.7, -1, -1, -6.4, -0.1]], BOARD);
  flat([['M', -5.6, 0.25], ['C', -2, 0.55, 3.6, 0.5, 6.2, 0.05], ['C', 3.6, 0.85, -2, 1.05, -5.9, 0.62]], '#1f5fae');
  ln([['M', -5, -0.15], ['C', -1, -0.55, 3, -0.5, 5.6, -0.05]], '#9cc8f2', 0.14);
  flat([['M', -5.2, 0.8], ['L', -4.6, 0.8], ['L', -5.1, 1.8]], NAVY);
  flat([['M', -4.1, 0.95], ['L', -3.5, 0.95], ['L', -4, 1.9]], NAVY);

  // long blonde hair flowing back (flat, brushy edges)
  for(let k = 2; k >= 0; k--){
    const y0 = -18.2 + k * 2, s1 = Math.sin(wind + k * 1.3) * 0.7;
    flat([['M', -2.4, y0], ['C', -4.6, y0 - 1 + s1, -6.6, y0 + s1, -8.4 + s1, y0 + 1.1],
          ['L', -7.4, y0 + 1.5], ['L', -8 + s1 * 0.6, y0 + 2.1], ['C', -6, y0 + 2.4, -4, y0 + 2.2, -2.4, y0 + 1.9]], k % 2 ? HAIR_D : HAIR);
  }
  flat([
    ['M', -2.3, -19.2],
    ['C', -4.4, -18.8, -4.9, -16.2, -4.6 + sw * 0.4, -13.8],
    ['L', -4.9, -12.6], ['L', -4.2, -12.9], ['L', -4, -11.6], ['L', -3.2, -12.2],
    ['C', -2.4, -11.6, -1.4, -11.8, -1.2, -12.4],
    ['L', 1.4, -12.4],
    ['C', 2, -11.6, 3.2, -11.8, 3.4, -12.6],
    ['C', 4.3, -13.6, 4.2, -15.2, 3.5, -15.8],
    ['C', 4, -17.8, 3.2, -19.8, 1, -20.1],
    ['C', -0.4, -20.4, -1.5, -20.1, -2.3, -19.2]
  ], HAIR);
  ln([['M', -3.8, -16.8], ['C', -4.2, -15.4, -4.1, -14.2, -3.7, -13.2]], HAIR_D, 0.22);
  ln([['M', 3.1, -17.4], ['C', 3.5, -16.4, 3.4, -15.2, 3, -14.4]], HAIR_D, 0.22);

  // legs: athletic crouch, black wetsuit, bare feet on the board
  limb([[-2.6, -0.9], [-2.9, -4.2], [-0.8, -7]], SUIT, 1.35);
  limb([[2.4, -0.9], [2.9, -4.3], [0.8, -7]], SUIT, 1.35);
  flat([['M', -3.5, -0.4], ['C', -3.4, -1.2, -1.9, -1.3, -1.6, -0.6], ['L', -1.6, -0.3], ['L', -3.4, -0.3]], SKIN);
  flat([['M', 1.5, -0.4], ['C', 1.6, -1.2, 3.1, -1.3, 3.4, -0.6], ['L', 3.4, -0.3], ['L', 1.6, -0.3]], SKIN);
  ln([['M', -2.9, -4.2], ['L', -2.4, -3.5], ['M', 2.9, -4.3], ['L', 2.4, -3.6]], SUIT_L, 0.16);

  // arms out for balance (wetsuit sleeves, coral hands)
  limb([[-1.9, -10.8], [-3.8, -9.4 + armY], [-5.1, -8.8 + armY]], SUIT, 1);
  limb([[1.9, -10.8], [4, -11.8 - armY], [5.3, -12.4 - armY]], SUIT, 1);
  dot(-5.55, -8.6 + armY, 0.55, SKIN);
  dot(5.8, -12.6 - armY, 0.55, SKIN);

  // torso: slim, sporty, black wetsuit with a little blue chest panel and back zip
  flat([['M', -2, -11.6], ['L', 2, -11.6], ['C', 2.4, -10.2, 1.9, -8, 1.6, -6.6], ['L', -1.6, -6.6], ['C', -1.9, -8, -2.4, -10.2, -2, -11.6]], SUIT);
  flat([['M', -2, -11.6], ['L', 2, -11.6], ['L', 1.95, -10.6], ['L', -1.95, -10.6]], BOARD);
  ln([['M', -1.6, -9.2], ['C', -0.6, -9.5, 0.6, -9.5, 1.6, -9.2]], SUIT_L, 0.14);

  // long neck (a signature of this style)
  flat([['M', -0.5, -13.6], ['L', 0.55, -13.6], ['L', 0.6, -11.5], ['L', -0.55, -11.5]], SKIN_D);
  flat([['M', -0.8, -11.9], ['L', 0.8, -11.9], ['L', 0.9, -11.4], ['L', -0.9, -11.4]], SUIT);

  // head: soft oval, slightly asymmetric, ear on the right
  dot(2.45, -15.4, 0.55, SKIN);
  dot(2.5, -15.4, 0.25, SKIN_D);
  flat([['M', -2.3, -16.4], ['C', -2.4, -19.3, 2.6, -19.4, 2.4, -16.4], ['C', 2.3, -14.6, 1.4, -13, 0.1, -12.9], ['C', -1.3, -13, -2.2, -14.6, -2.3, -16.4]], SKIN);

  // hair on top: swept side part, long side lock
  flat([
    ['M', -2.6, -15.4],
    ['C', -3.1, -19.6, 3.3, -20.2, 2.8, -16.2],
    ['C', 2.2, -17.6, 0.4, -18.2, -0.6, -17.4],
    ['C', -1.4, -17.6, -2.2, -16.8, -2.6, -15.4]
  ], HAIR);
  flat([['M', -2.4, -16.6], ['C', -3.4, -15.2, -3.2, -13.2, -2.5 + sw * 0.2, -12], ['C', -2.2, -13.2, -2.1, -14.6, -2.05, -15.6]], HAIR_D);
  ln([['M', -1.6, -18.4], ['C', -0.6, -18.9, 0.8, -18.8, 1.8, -18.2]], '#fff1b8', 0.22);

  // face: small almond eyes, soft brows, thin glasses, big friendly smile
  flat([['M', -1.75, -16], ['C', -1.4, -16.45, -0.6, -16.45, -0.35, -16], ['C', -0.6, -15.6, -1.4, -15.6, -1.75, -16]], '#ffffff');
  flat([['M', 0.45, -16], ['C', 0.8, -16.45, 1.6, -16.45, 1.85, -16], ['C', 1.6, -15.6, 0.8, -15.6, 0.45, -16]], '#ffffff');
  dot(-0.9, -16, 0.24, NAVY);
  dot(1.3, -16, 0.24, NAVY);
  ln([['M', -1.85, -16.1], ['C', -1.4, -16.6, -0.5, -16.6, -0.25, -16.15], ['M', 0.35, -16.15], ['C', 0.7, -16.6, 1.6, -16.6, 1.95, -16.1]], NAVY, 0.14);
  ln([['M', -1.8, -17.05], ['C', -1.3, -17.3, -0.6, -17.25, -0.35, -17.1], ['M', 0.45, -17.1], ['C', 0.8, -17.25, 1.5, -17.3, 2, -17.05]], '#b9862c', 0.24);
  // glasses: thin navy rims with a blue cat-eye top
  ln([['M', -2.1, -16.2], ['C', -2.1, -15.2, -0.15, -15.2, -0.1, -16.1], ['C', -0.15, -16.7, -1.7, -16.75, -2.3, -16.6]], NAVY, 0.13);
  ln([['M', 2.25, -16.2], ['C', 2.25, -15.2, 0.25, -15.2, 0.2, -16.1], ['C', 0.25, -16.7, 1.8, -16.75, 2.45, -16.6]], NAVY, 0.13);
  ln([['M', -2.3, -16.6], ['C', -1.6, -16.85, -0.6, -16.8, -0.1, -16.4], ['M', 0.2, -16.4], ['C', 0.7, -16.8, 1.8, -16.85, 2.45, -16.6]], '#3d8fe0', 0.26);
  ln([['M', -0.1, -16.1], ['L', 0.2, -16.1]], NAVY, 0.12);
  // nose
  ln([['M', 0.15, -15.4], ['C', 0.5, -14.9, 0.5, -14.6, 0, -14.55]], SKIN_D, 0.2);
  // smile: open, warm
  flat([['M', -0.85, -14.05], ['C', -0.4, -13.95, 0.6, -13.95, 1.05, -14.1], ['C', 0.85, -13.35, -0.6, -13.3, -0.85, -14.05]], NAVY);
  flat([['M', -0.7, -14.0], ['C', -0.3, -13.92, 0.5, -13.92, 0.9, -14.04], ['L', 0.8, -13.82], ['L', -0.6, -13.82]], '#ffffff');
  ln([['M', -1.05, -14.3], ['L', -0.9, -14.02], ['M', 1.25, -14.35], ['L', 1.1, -14.06]], SKIN_D, 0.14);
  // cheeks + freckles
  noStroke(); const bl = C(SKIN_D); fill(bl[0], bl[1], bl[2], 150);
  ellipse(-1.6 * u, -14.9 * u, 0.9 * u, 0.5 * u); ellipse(1.8 * u, -14.9 * u, 0.9 * u, 0.5 * u);
  dot(-1.3, -15.25, 0.06, '#b5573f'); dot(-1.0, -15.1, 0.05, '#b5573f'); dot(1.3, -15.25, 0.06, '#b5573f'); dot(1.0, -15.1, 0.05, '#b5573f');
  pop();
}

function drawFx(P, dt){
  noStroke();
  for(let i = S.fx.length - 1; i >= 0; i--){
    const f = S.fx[i];
    f.life -= dt; if(f.life <= 0){ S.fx.splice(i, 1); continue; }
    f.vy += 500 * dt; f.x += f.vx * dt; f.y += f.vy * dt;
    const c = P.shade(f.c, -0.2);
    fill(c[0], c[1], c[2], 255 * Math.min(1, f.life * 2));
    circle(f.x, f.y, f.r * 2);
  }
  textAlign(CENTER, CENTER); textStyle(BOLD); textSize(Math.max(14, S.H * 0.04));
  for(let i = S.pops.length - 1; i >= 0; i--){
    const p = S.pops[i];
    p.life -= dt; p.y -= dt * 40;
    if(p.life <= 0){ S.pops.splice(i, 1); continue; }
    fill(255, 255, 255, 255 * Math.min(1, p.life)); stroke(20, 40, 90, 200 * Math.min(1, p.life)); strokeWeight(3);
    text(p.s, p.x, p.y);
  }
  noStroke();
}

function drawRain(P, dt){
  if(!S.drops.length){ return; }
  const c = P.shade([210, 220, 235], -0.25);
  stroke(c[0], c[1], c[2], 150); strokeWeight(1.2);
  const slant = S.weather === 'storm' ? 0.35 : 0.15;
  for(const d of S.drops){
    d.y += d.v * dt * 1.6; d.x -= slant * d.v * dt;
    if(d.y > 1){ d.y = -0.05; d.x = Math.random() * 1.1; }
    if(d.x < -0.05){ d.x = 1.05; }
    const x = d.x * S.W, y = d.y * S.H;
    line(x, y, x - slant * S.H * 0.03, y + S.H * 0.03);
  }
  noStroke();
}

function drawWeatherOverlay(P, dt){
  if(P.wx.fog){
    const g = drawingContext.createLinearGradient(0, S.H * 0.3, 0, S.H);
    const fc = mixC([220, 224, 230], NIGHT_TINT, 1 - P.light);
    g.addColorStop(0, css(fc, P.wx.fog * 0.7)); g.addColorStop(1, css(fc, P.wx.fog * 0.25));
    drawingContext.fillStyle = g; drawingContext.fillRect(0, 0, S.W, S.H);
  }
  if(S.weather === 'storm'){
    if(Math.random() < 0.006){ S.flash = 1; }
    if(S.flash > 0){
      fill(255, 255, 255, 170 * S.flash); noStroke(); rect(0, 0, S.W, S.H);
      S.flash -= dt * 3;
    }
  }
}

function drawHUD(P){
  noStroke();
  fill(255, 255, 255, 215); rect(12, 12, Math.max(150, S.W * 0.2), 52, 14);
  fill(20, 50, 110); textAlign(LEFT, TOP); textStyle(BOLD); textSize(18);
  text(`✦ ${Math.floor(S.score)}`, 26, 20);
  textStyle(NORMAL); textSize(12);
  text(`שיא ${S.best}  ·  קומבו ${S.combo}`, 26, 44);
  textAlign(RIGHT, TOP); textSize(13);
  fill(255, 255, 255, 220); stroke(20, 40, 90, 140); strokeWeight(3);
  text(BEACHES[S.beach].name + ' · ' + fmtHour(S.hourVal), S.W - 14, 16);
  noStroke();
}

function fmtHour(h){
  const hh = Math.floor(h) % 24, mm = Math.floor((h - Math.floor(h)) * 60);
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}

// the real local time at the chosen beach
function beachLocalHour(){
  try{
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: BEACHES[S.beach].tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    const hh = +parts.find(p => p.type === 'hour').value, mm = +parts.find(p => p.type === 'minute').value;
    return hh + mm / 60;
  }catch(e){ return 12; }
}
function syncLiveHour(){
  if(!S.live){ return; }
  S.hourVal = beachLocalHour();
  $('hour').value = S.hourVal;
  $('hourVal').textContent = fmtHour(S.hourVal);
}

// ---------- UI ----------
const UI_CSS = `
  *{box-sizing:border-box}
  html,body{margin:0;background:#eef5f7;color:#163a5f;font-family:Heebo,system-ui,sans-serif}
  header{padding:16px 20px 6px;display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
  h1{margin:0;font-size:26px;font-weight:800}
  header small{opacity:.7;font-size:14px}
  .panel{display:flex;flex-wrap:wrap;gap:14px 22px;align-items:center;padding:8px 20px 12px}
  .grp{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
  .grp b{font-size:13px;font-weight:700;margin-inline-end:4px}
  select{font:inherit;font-size:14px;padding:7px 10px;border-radius:10px;border:1px solid #b9d3dd;background:#fff;color:#163a5f}
  .chip{font:inherit;font-size:13px;padding:6px 12px;border-radius:999px;border:1px solid #b9d3dd;background:#fff;color:#163a5f;cursor:pointer}
  .chip.on{background:#163a5f;color:#fff;border-color:#163a5f}
  input[type=range]{accent-color:#1d7fae;width:170px}
  #hourVal{font-variant-numeric:tabular-nums;min-width:3.2em;display:inline-block;font-weight:700}
  label.live{font-size:13px;display:flex;align-items:center;gap:4px}
  #stage{padding:0 20px 10px}
  #stage canvas{display:block;width:100%;height:auto;border-radius:16px;touch-action:none;cursor:pointer;box-shadow:0 8px 24px rgba(22,58,95,.15)}
  .help{padding:0 20px 24px;font-size:13px;opacity:.75}
`;
function chipGroup(id, obj, current){
  return Object.keys(obj).map(k => `<button class="chip${k === current ? ' on' : ''}" data-g="${id}" data-k="${k}">${obj[k].label}</button>`).join('');
}
function buildUIHtml(){
  return `
<header><h1>איה גולשת 🏄‍♀️</h1><small>בחרי חוף, ים, מזג אוויר ושעה — ותגלשי!</small></header>
<div class="panel">
  <div class="grp"><b>חוף</b><select id="beachSel">${BEACHES.map((b, i) => `<option value="${i}"${i === S.beach ? ' selected' : ''}>${b.name}</option>`).join('')}</select></div>
  <div class="grp"><b>ים</b>${chipGroup('sea', SEA_STATES, S.sea)}</div>
  <div class="grp"><b>מזג אוויר</b>${chipGroup('weather', WEATHERS, S.weather)}</div>
  <div class="grp"><b>שעה</b><input type="range" id="hour" min="0" max="23.99" step="0.05" value="12"><span id="hourVal" dir="ltr">12:00</span>
    <label class="live"><input type="checkbox" id="live" checked> השעה האמיתית בחוף</label></div>
</div>
<div id="stage"></div>
<div class="help">🖱️ הזיזי את העכבר כדי לגלוש · לחיצה / רווח = קפיצה · באוויר הזיזי מהר את העכבר (או חיצים) לסיבוב · אספי כוכבים ✦ · נחיתה עקומה = אופס!</div>`;
}

function ensureUI(){
  if(document.getElementById('stage') && document.getElementById('beachSel')){ return; }
  document.documentElement.setAttribute('lang', 'he');
  document.body.setAttribute('dir', 'rtl');
  const st = document.createElement('style'); st.textContent = UI_CSS; document.head.appendChild(st);
  const lk = document.createElement('link'); lk.rel = 'stylesheet';
  lk.href = 'https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800&display=swap';
  document.head.appendChild(lk);
  const wrap = document.createElement('div'); wrap.innerHTML = buildUIHtml();
  while(wrap.firstChild){ document.body.appendChild(wrap.firstChild); }
}

function initUI(){
  $('beachSel').onchange = e => { S.beach = +e.target.value; S.stars = []; syncLiveHour(); };
  document.querySelectorAll('.chip').forEach(el => {
    el.onclick = () => {
      const g = el.dataset.g;
      S[g] = el.dataset.k;
      document.querySelectorAll(`.chip[data-g="${g}"]`).forEach(o => o.classList.toggle('on', o === el));
      if(g === 'weather'){ rebuildClouds(); }
      el.blur();
    };
  });
  $('hour').addEventListener('input', () => {
    S.hourVal = +$('hour').value; S.live = false; $('live').checked = false;
    $('hourVal').textContent = fmtHour(S.hourVal);
  });
  $('live').onchange = () => { S.live = $('live').checked; syncLiveHour(); };
}
