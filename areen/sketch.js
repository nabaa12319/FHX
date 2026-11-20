// noprotect
// ---------- عرين الأسد — boxing game (p5.js) ----------
// Areen always wins. On punch #4 the opponent's eye turns purple.

const PAD_W = 300, PAD_H = 340, PAD_RES = 2;          // drawing pad (logical px) and its resolution
const PAD_HEAD = { cx: 150, cy: 180, rx: 95, ry: 118 }; // the head guide inside the pad
const PAD_EYES = [[112, 168], [188, 168]];              // eye guides (left / right on screen)
const HEIGHTS = { short: { label: 'قصير', k: 0.88 }, mid: { label: 'متوسط', k: 1 }, tall: { label: 'طويل', k: 1.13 } };
const WEIGHTS = { light: { label: 'خفيف', k: 0.84, hp: 8 }, mid: { label: 'متوسط', k: 1.05, hp: 10 }, heavy: { label: 'ثقيل', k: 1.32, hp: 12 } };
const HAIR_COLORS = ['#1d1a1f', '#5a3a24', '#c98d3a', '#f2cf63', '#b8452f', '#9a9aa6', '#e46aa6', '#3b6fd6'];
const FACE_COLORS = ['#1d1a1f', '#7a3b2a', '#c4384a', '#ffffff', '#3b6fd6', '#2e8a57'];

const G = {
  mode: 'design',                   // design → fight → ko → win
  opp: { name: 'الخصم', gender: 'male', height: 'mid', weight: 'mid' },
  W: 900, H: 520, t: 0,
  areenHP: 100, oppHP: 10, oppMax: 10, punches: 0, purpleEye: false,
  a: { punchT: 0, arm: 'front', dodge: 0, hit: 0, win: 0 },
  o: { hit: 0, atk: 'idle', atkT: 0, next: 2.5, punch: 0, ko: 0 },
  shake: 0, msgs: [], sparks: [], confetti: [], koT: 0, crowd: []
};
const PAD = { mode: 'hair', color: HAIR_COLORS[0], size: 8, eraser: false, hair: null, face: null, view: null, undo: [], drawing: false, last: null };
const $ = id => document.getElementById(id);

// ---------- helpers ----------
function hexRGB(h){ const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function css(c, a){ if(typeof c === 'string'){ c = hexRGB(c); } return a === undefined ? `rgb(${c[0]|0},${c[1]|0},${c[2]|0})` : `rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`; }
function ease(x){ return x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x); }
// native canvas path: [['M',x,y],['L',x,y],['C',x1,y1,x2,y2,x,y]] in units of u
function shapeU(cmds, u, fillC, strokeC, lw){
  const ctx = drawingContext;
  ctx.beginPath();
  for(const c of cmds){
    if(c[0] === 'M'){ ctx.moveTo(c[1] * u, c[2] * u); }
    else if(c[0] === 'L'){ ctx.lineTo(c[1] * u, c[2] * u); }
    else { ctx.bezierCurveTo(c[1] * u, c[2] * u, c[3] * u, c[4] * u, c[5] * u, c[6] * u); }
  }
  if(fillC){ ctx.closePath(); ctx.fillStyle = css(fillC); ctx.fill(); }
  if(strokeC){ ctx.strokeStyle = css(strokeC); ctx.lineWidth = lw * u; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); }
}
function limbU(pts, u, col, w){ shapeU(pts.map((p, i) => [i ? 'L' : 'M', p[0], p[1]]), u, null, col, w); }
function dotU(x, y, r, u, col){ const ctx = drawingContext; ctx.beginPath(); ctx.ellipse(x * u, y * u, r * u, r * u, 0, 0, Math.PI * 2); ctx.fillStyle = css(col); ctx.fill(); }
function ovalU(x, y, rx, ry, u, col){ const ctx = drawingContext; ctx.beginPath(); ctx.ellipse(x * u, y * u, rx * u, ry * u, 0, 0, Math.PI * 2); ctx.fillStyle = css(col); ctx.fill(); }

// ---------- sound (tiny WebAudio blips) ----------
let AC = null;
function audio(){ try{ if(!AC){ AC = new (window.AudioContext || window.webkitAudioContext)(); } }catch(e){} return AC; }
function thump(strong){
  const ac = audio(); if(!ac){ return; }
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(strong ? 140 : 180, ac.currentTime); o.frequency.exponentialRampToValueAtTime(50, ac.currentTime + 0.15);
  g.gain.setValueAtTime(0.5, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.18);
  o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.2);
}
function bell(){
  const ac = audio(); if(!ac){ return; }
  [880, 1320].forEach((f, i) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.value = f; g.gain.setValueAtTime(0.18 / (i + 1), ac.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 1.2);
    o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + 1.3);
  });
}

// ---------- setup / loop ----------
function setup(){
  ensureUI(); initUI(); initPad();
  const c = createCanvas(10, 10);
  c.parent('stage');
  pixelDensity(Math.min(2, displayDensity()));
  sizeCanvas();
  c.elt.addEventListener('pointerdown', e => { if(G.mode === 'fight'){ e.preventDefault(); doPunch(); } });
  for(let i = 0; i < 70; i++){ G.crowd.push({ x: Math.random(), r: 0.5 + Math.random() * 0.5, c: Math.floor(Math.random() * 6), p: Math.random() * 6 }); }
  G.crowd.sort((a, b) => a.r - b.r);
}
function sizeCanvas(){
  const st = $('stage'), cs = getComputedStyle(st);
  const inner = st.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0);
  G.W = Math.max(300, Math.min(1300, Math.floor(inner)));
  G.H = Math.round(Math.min(G.W * 0.58, window.innerHeight * 0.72));
  G.H = Math.max(280, G.H);
  resizeCanvas(G.W, G.H);
}
function windowResized(){ sizeCanvas(); }

function keyPressed(){
  if(G.mode !== 'fight'){ return; }
  if(key === ' ' || key === 'j' || key === 'J' || keyCode === RIGHT_ARROW){ doPunch(); return false; }
  if(keyCode === LEFT_ARROW || keyCode === DOWN_ARROW || key === 'a' || key === 'A'){ doDodge(); return false; }
}

function draw(){
  const dt = Math.min(0.05, deltaTime / 1000 || 0.016);
  G.t += dt;
  update(dt);
  drawingContext.direction = 'rtl';
  push();
  if(G.shake > 0){ translate((Math.random() - 0.5) * G.shake * 14, (Math.random() - 0.5) * G.shake * 10); G.shake = Math.max(0, G.shake - dt * 3); }
  drawArena();
  const floorY = G.H * 0.86, u = G.H * 0.0092;
  const ax = G.W * 0.4, ox = G.W * 0.6;
  G.gap = (ox - ax) / u;
  drawOpponent(ox, floorY, u);
  drawAreen(ax, floorY, u);
  drawRopesFront();
  drawSparks(dt);
  pop();
  drawHUD();
  drawMessages(dt);
  if(G.mode === 'design'){ drawDesignOverlay(); }
  if(G.mode === 'ko' || G.mode === 'win'){ drawKO(dt); }
}

// ---------- game logic ----------
function startFight(){
  G.oppMax = WEIGHTS[G.opp.weight].hp; G.oppHP = G.oppMax;
  G.areenHP = 100; G.punches = 0; G.purpleEye = false;
  G.a = { punchT: 0, arm: 'front', dodge: 0, hit: 0, win: 0 };
  G.o = { hit: 0, atk: 'idle', atkT: 0, next: 2.2, punch: 0, ko: 0 };
  G.msgs = []; G.sparks = []; G.confetti = []; G.koT = 0;
  G.mode = 'fight';
  bell();
  say('الجولة الأولى! 🔔', 1.6, true);
  setScreen();
}

function doPunch(){
  if(G.mode !== 'fight' || G.a.punchT > 0){ return; }
  audio();
  G.a.punchT = 0.3;
  G.a.arm = G.a.arm === 'front' ? 'back' : 'front';
  G.a.landed = false;
}
function doDodge(){
  if(G.mode !== 'fight'){ return; }
  G.a.dodge = 0.5;
}

function landPunch(){
  G.punches++;
  G.oppHP = Math.max(0, G.oppHP - 1);
  G.o.hit = 1;
  G.o.atk = 'idle'; G.o.next = Math.max(G.o.next, 0.9);   // a hit interrupts the opponent's attack
  thump(G.punches % 3 === 0);
  const hx = G.W * 0.6 - G.H * 0.03, hy = G.H * 0.86 - G.H * 0.0092 * (40 * HEIGHTS[G.opp.height].k + 6);
  for(let i = 0; i < 14; i++){ G.sparks.push({ x: hx, y: hy, vx: (Math.random() - 0.3) * 260, vy: (Math.random() - 0.6) * 240, life: 0.5, c: i % 2 ? '#ffe066' : '#ffffff' }); }
  if(G.punches === 4){
    G.purpleEye = true;
    say('عين بنفسجية! 💜', 1.6);
  } else {
    const words = ['بوم!', 'طاخ!', 'واو!', 'ضربة!', 'قوية!'];
    say(words[G.punches % words.length], 0.7);
  }
  if(G.oppHP <= 0){
    G.mode = 'ko'; G.koT = 0;
    thump(true);
    setScreen();
  }
}

function update(dt){
  const a = G.a, o = G.o;
  a.dodge = Math.max(0, a.dodge - dt);
  a.hit = Math.max(0, a.hit - dt * 3);
  o.hit = Math.max(0, o.hit - dt * 2.5);
  if(a.punchT > 0){
    a.punchT -= dt;
    if(!a.landed && a.punchT < 0.17 && G.mode === 'fight'){ a.landed = true; landPunch(); }
    if(a.punchT < 0){ a.punchT = 0; }
  }
  if(G.mode === 'fight'){
    // the opponent winds up ("!"), then throws — dodge in time!
    if(o.atk === 'idle'){
      o.next -= dt;
      if(o.next <= 0){ o.atk = 'wind'; o.atkT = 0.55; }
    } else if(o.atk === 'wind'){
      o.atkT -= dt;
      if(o.atkT <= 0){ o.atk = 'strike'; o.atkT = 0.28; o.struck = false; }
    } else if(o.atk === 'strike'){
      o.atkT -= dt;
      if(!o.struck && o.atkT < 0.14){
        o.struck = true;
        if(a.dodge > 0){ say('تفادي! ✨', 0.8); }
        else { G.areenHP = Math.max(60, G.areenHP - 7); a.hit = 1; G.shake = 0.6; thump(false); say('آخ!', 0.6); }
      }
      if(o.atkT <= 0){ o.atk = 'idle'; o.next = 1.6 + Math.random() * 1.6; }
    }
  }
  if(G.mode === 'ko' || G.mode === 'win'){
    G.koT += dt;
    o.ko = Math.min(1, o.ko + dt * 1.6);
    if(G.mode === 'ko' && G.koT > 3.3){
      G.mode = 'win'; bell();
      for(let i = 0; i < 160; i++){ G.confetti.push({ x: Math.random() * G.W, y: -Math.random() * G.H, vy: 80 + Math.random() * 140, r: Math.random() * 6, c: ['#f2b632', '#e0445a', '#3b6fd6', '#ffffff', '#7a3fb0'][i % 5], s: Math.random() * 6 }); }
      setScreen();
    }
    if(G.mode === 'win'){ a.win = Math.min(1, a.win + dt * 2); }
  }
}

function say(txt, life, big){ G.msgs.push({ txt, life, max: life, big: !!big }); }

// ---------- arena ----------
function drawArena(){
  const ctx = drawingContext, W = G.W, H = G.H;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#141a33'); g.addColorStop(0.55, '#241b3d'); g.addColorStop(1, '#0f1224');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // spotlights
  for(const sx of [0.3, 0.7]){
    const lg = ctx.createRadialGradient(W * sx, 0, 10, W * sx, H * 0.6, H * 0.9);
    lg.addColorStop(0, 'rgba(255,240,200,0.25)'); lg.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(W * sx - 20, 0); ctx.lineTo(W * sx + 20, 0); ctx.lineTo(W * (sx + 0.22), H); ctx.lineTo(W * (sx - 0.22), H); ctx.closePath(); ctx.fill();
  }
  // crowd
  const cols = ['#2c3466', '#3b2d5c', '#4a3a6e', '#283c5e', '#5a3550', '#33406e'];
  noStroke();
  for(const p of G.crowd){
    const x = p.x * W, y = H * (0.42 + (1 - p.r) * 0.08) + Math.sin(G.t * 5 + p.p) * (G.mode === 'win' ? 6 : 1.5);
    const c = hexRGB(cols[p.c]);
    fill(c[0], c[1], c[2]); ellipse(x, y, H * 0.05 * p.r, H * 0.06 * p.r); rect(x - H * 0.035 * p.r, y + H * 0.025 * p.r, H * 0.07 * p.r, H * 0.08 * p.r, 6);
    if(G.mode === 'win' && p.c % 2){ fill(255, 230, 120); ellipse(x + 8 * Math.sin(G.t * 6 + p.p), y - H * 0.04, 6, 6); }
  }
  // ring apron + mat
  fill(18, 24, 48); rect(0, H * 0.6, W, H * 0.4);
  const mat = ctx.createLinearGradient(0, H * 0.62, 0, H * 0.92);
  mat.addColorStop(0, '#3a6fd0'); mat.addColorStop(1, '#2a56aa');
  ctx.fillStyle = mat; ctx.beginPath(); ctx.moveTo(W * 0.06, H * 0.64); ctx.lineTo(W * 0.94, H * 0.64); ctx.lineTo(W, H * 0.92); ctx.lineTo(0, H * 0.92); ctx.closePath(); ctx.fill();
  fill(255, 255, 255, 40); rect(0, H * 0.92, W, H * 0.02);
  // back posts + ropes
  fill(200, 200, 210); rect(W * 0.055, H * 0.36, W * 0.012, H * 0.29, 3); rect(W * 0.933, H * 0.36, W * 0.012, H * 0.29, 3);
  const ropes = ['#e0445a', '#ffffff', '#3b6fd6'];
  ropes.forEach((rc, i) => { stroke(rc); strokeWeight(Math.max(2, H * 0.006)); line(W * 0.06, H * (0.4 + i * 0.075), W * 0.94, H * (0.4 + i * 0.075)); });
  noStroke();
}
function drawRopesFront(){
  const W = G.W, H = G.H;
  const ropes = ['#e0445a', '#ffffff', '#3b6fd6'];
  fill(220, 220, 230); rect(0, H * 0.5, W * 0.022, H * 0.45, 3); rect(W * 0.978, H * 0.5, W * 0.022, H * 0.45, 3);
  ropes.forEach((rc, i) => { stroke(rc); strokeWeight(Math.max(3, H * 0.009)); noFill(); line(0, H * (0.58 + i * 0.1), W, H * (0.58 + i * 0.1)); });
  noStroke();
}

// ---------- shared body ----------
// draws a boxer standing on floorY, facing +1 (right) or -1 (left). Units: u. hk = height factor, wk = width factor.
function drawBody(look, x, floorY, u, hk, wk, facing, pose){
  push();
  translate(x, floorY);
  if(pose.ko > 0){ rotate(-facing * ease(pose.ko) * 1.45); }
  rotate(-facing * pose.lean);
  translate(0, Math.sin(G.t * 4 + (facing > 0 ? 0 : 1.5)) * 0.5 * u * (pose.ko > 0 ? 0 : 1));
  const f = facing;
  const hipY = -19 * hk, shY = -33.5 * hk, neckY = -35 * hk;
  const sh = (look.female ? 8.4 : 10) * wk, waist = (look.female ? 7 : 8.6) * wk, hips = (look.female ? 8.8 : 8.6) * wk;

  // legs
  const legW = 2.6 * wk + 0.6;
  limbU([[-f * 1.2 * wk, hipY], [-f * 3.6, -9], [-f * 4.6, -1.2]], u, look.legs, legW);
  limbU([[f * 1.2 * wk, hipY], [f * 3.4, -9.5], [f * 4.8, -1.2]], u, look.legs, legW);
  ovalU(-f * 4.8, -0.8, 2.3, 1.1, u, look.shoes); ovalU(f * 5.2, -0.8, 2.3, 1.1, u, look.shoes);
  if(look.shorts){
    shapeU([['M', -hips / 2, hipY - 3], ['L', hips / 2, hipY - 3], ['L', hips / 2 + 0.8, hipY + 5], ['L', 0.6, hipY + 4.4], ['L', -0.6, hipY + 4.4], ['L', -hips / 2 - 0.8, hipY + 5]], u, look.shorts);
    shapeU([['M', -hips / 2 - 0.2, hipY - 3], ['L', hips / 2 + 0.2, hipY - 3], ['L', hips / 2 + 0.2, hipY - 1.8], ['L', -hips / 2 - 0.2, hipY - 1.8]], u, look.band || '#ffffff');
  }

  // arm geometry (guard ⇄ punch)
  const pFront = pose.arm === 'front' ? pose.punch : 0, pBack = pose.arm === 'back' ? pose.punch : 0;
  const reach = Math.max(8, (G.gap || 22) - sh * 0.45 - 5.5);
  const frontSh = [f * sh * 0.45, shY + 1], backSh = [-f * sh * 0.45, shY + 1];
  const guardUp = pose.guard || 0;
  const frontGlove = [f * (sh * 0.45 + 4 + pFront * reach), shY - 2.5 - guardUp * 2 + pFront * 0.5];
  const frontElbow = [f * (sh * 0.45 + 2.6 + pFront * reach * 0.5), shY + 4 - pFront * 3.5];
  const backGlove = [f * (1.5 + pBack * (sh * 0.45 + 2.5 + reach)), shY - 3.2 - guardUp * 2 + pBack * 0.8];
  const backElbow = [-f * (sh * 0.2) + f * pBack * (reach * 0.5), shY + 4.5 - pBack * 3.5];
  if(pose.win > 0){
    // victory: both gloves raised high
    const w = ease(pose.win);
    const lerpP = (p, q) => [p[0] + (q[0] - p[0]) * w, p[1] + (q[1] - p[1]) * w];
    frontGlove.splice(0, 2, ...lerpP(frontGlove, [f * (sh * 0.45 + 2), shY - 15]));
    frontElbow.splice(0, 2, ...lerpP(frontElbow, [f * (sh * 0.45 + 3.2), shY - 6.5]));
    backGlove.splice(0, 2, ...lerpP(backGlove, [-f * (sh * 0.45 + 2), shY - 15]));
    backElbow.splice(0, 2, ...lerpP(backElbow, [-f * (sh * 0.45 + 3.2), shY - 6.5]));
  }
  const drawArm = (s, e, g) => {
    limbU([s, e, g], u, look.sleeve, 2.5 * Math.min(1.25, wk) + 0.4);
    if(look.forearm){ limbU([[e[0] + (g[0] - e[0]) * 0.55, e[1] + (g[1] - e[1]) * 0.55], g], u, look.forearm, 2.2 * Math.min(1.25, wk) + 0.3); }
    const gr = 2.6 + 0.4 * wk;
    ovalU(g[0], g[1], gr, gr * 1.05, u, look.glove);
    ovalU(g[0] - f * gr * 0.35, g[1] - gr * 0.35, gr * 0.35, gr * 0.25, u, '#ffffff');
    shapeU([['M', g[0] - gr * 0.9, g[1] + gr * 0.6], ['L', g[0] + gr * 0.9, g[1] + gr * 0.6]], u, null, look.cuff || '#ffffff', 0.9);
  };
  // back arm behind the body unless it is punching
  if(pBack < 0.2 && !(pose.win > 0)){ drawArm(backSh, backElbow, backGlove); }

  // torso
  shapeU([['M', -sh / 2, shY], ['L', sh / 2, shY], ['C', sh / 2 + 0.4, shY + 6, waist / 2 + 0.3, hipY - 6, hips / 2, hipY - 2],
          ['L', -hips / 2, hipY - 2], ['C', -waist / 2 - 0.3, hipY - 6, -sh / 2 - 0.4, shY + 6, -sh / 2, shY]], u, look.top);
  if(look.midriff){ shapeU([['M', -waist / 2 + 0.3, shY + 7.5], ['L', waist / 2 - 0.3, shY + 7.5], ['L', hips / 2, hipY - 2.2], ['L', -hips / 2, hipY - 2.2]], u, look.skin); }
  if(look.lace){ for(let yy = shY + 1.5; yy < hipY - 3; yy += 2.2){ for(let xx = -sh / 2 + 1.5; xx < sh / 2 - 1; xx += 2.2){ dotU(xx + ((yy * 7) % 1.1), yy, 0.42, u, look.lace); } } }
  if(look.neckline){ shapeU([['M', -1.8, shY - 0.1], ['C', -1.2, shY + 2.2, 1.2, shY + 2.2, 1.8, shY - 0.1]], u, look.skin); }
  // neck
  shapeU([['M', -1, neckY - 1], ['L', 1, neckY - 1], ['L', 1.1, shY + 0.5], ['L', -1.1, shY + 0.5]], u, look.skinD || look.skin);

  // head (callback draws the face/hair) — knocked back when hit
  push();
  translate((f * 0.6 - f * pose.headBack * 2.2) * u, (neckY - 6.3) * u);
  rotate(-f * pose.headBack * 0.25);
  look.head(u, pose);
  pop();

  if(pBack >= 0.2 || pose.win > 0){ drawArm(backSh, backElbow, backGlove); }
  drawArm(frontSh, frontElbow, frontGlove);
  pop();
}

// ---------- Areen ----------
const AREEN_LOOK = {
  female: true, skin: '#d9a07a', skinD: '#c78a66', top: '#4a1f2e', lace: '#33141f', sleeve: '#4a1f2e', forearm: null,
  legs: '#1b1b22', shoes: '#f4f4f6', glove: '#f2b632', cuff: '#ffffff', shorts: null, neckline: true,
  head: (u, pose) => drawAreenHead(u, pose)
};
function drawAreenHead(u, pose){
  const HAIR = '#2a1d1a', HAIR_L = '#4a3530', SKIN = '#d9a07a', NAVY = '#1f1a24';
  const wind = Math.sin(G.t * 3) * 0.3;
  // hair behind: dark, wavy, shoulder length
  shapeU([['M', -4.6, -2], ['C', -6.4, -6, -4, -9.4, 0, -9.2], ['C', 4.4, -9.4, 6.4, -5.8, 5.4, -1],
          ['C', 6.2, 2, 5.6, 5, 4.4, 6.4], ['C', 3.6, 5.4, 3, 6.6, 2.4, 6], ['L', -2.6, 6], ['C', -3.2, 6.8, -4.2, 5.8, -5 + wind, 6.6],
          ['C', -6.4, 4.4, -6, 1.6, -4.6, -2]], u, HAIR);
  // face
  ovalU(0, 0.2, 4.4, 5.4, u, SKIN);
  ovalU(4.2, 0.6, 0.8, 1.1, u, SKIN);
  // side-swept front hair (falls over her right side, like the photo)
  shapeU([['M', -4.6, -1], ['C', -5, -6.8, 1.6, -8.4, 4.6, -4.4], ['C', 2.6, -6, -0.6, -6.2, -2.4, -4], ['C', -3.4, -3, -3.8, -1.6, -4.1, 0.6]], u, HAIR);
  shapeU([['M', 4.4, -3.6], ['C', 5.6, -1.6, 5.2, 2, 4.4, 4.4], ['C', 4.2, 2.2, 4.1, -0.6, 3.6, -2.6]], u, HAIR_L);
  shapeU([['M', -1.6, -7.4], ['C', 0, -8, 1.8, -7.6, 3, -6.6]], u, null, HAIR_L, 0.35);
  const fierce = G.mode === 'fight' ? 1 : 0, happy = G.mode === 'win' ? 1 : 0;
  const hurt = G.a.hit > 0.3;
  // brows (determined in the fight)
  shapeU([['M', -2.7, -2.5 + fierce * 0.1], ['L', -0.7, -2.1 + fierce * 0.4]], u, null, NAVY, 0.45);
  shapeU([['M', 0.9, -2.1 + fierce * 0.4], ['L', 2.9, -2.5 + fierce * 0.1]], u, null, NAVY, 0.45);
  // eyes with an eyeliner wing
  if(hurt || happy){
    shapeU([['M', -2.5, -0.9], ['C', -2, -1.6, -1.2, -1.6, -0.8, -0.9]], u, null, NAVY, 0.35);
    shapeU([['M', 1, -0.9], ['C', 1.5, -1.6, 2.3, -1.6, 2.7, -0.9]], u, null, NAVY, 0.35);
  } else {
    shapeU([['M', -2.6, -1], ['C', -2.1, -1.8, -1.1, -1.8, -0.7, -1], ['C', -1.1, -0.4, -2.1, -0.4, -2.6, -1]], u, '#ffffff');
    shapeU([['M', 0.9, -1], ['C', 1.4, -1.8, 2.4, -1.8, 2.8, -1], ['C', 2.4, -0.4, 1.4, -0.4, 0.9, -1]], u, '#ffffff');
    dotU(-1.45, -1, 0.42, u, '#3a2418'); dotU(2.05, -1, 0.42, u, '#3a2418');
    shapeU([['M', -2.7, -1.1], ['C', -2.2, -1.9, -1.1, -1.9, -0.6, -1.15], ['L', -0.2, -1.5]], u, null, NAVY, 0.28);
    shapeU([['M', 0.8, -1.15], ['C', 1.3, -1.9, 2.4, -1.9, 2.9, -1.1], ['L', 3.4, -1.55]], u, null, NAVY, 0.28);
  }
  // nose + the nose ring
  shapeU([['M', 0.3, -0.2], ['C', 0.7, 0.8, 0.9, 1.3, 0.3, 1.5]], u, null, '#b47a58', 0.3);
  const ctx = drawingContext; ctx.beginPath(); ctx.arc(0.95 * u, 1.35 * u, 0.32 * u, -0.6, Math.PI * 1.1); ctx.strokeStyle = '#e6e6ee'; ctx.lineWidth = 0.18 * u; ctx.stroke();
  // mouth
  if(happy){
    shapeU([['M', -1.5, 2.6], ['C', -0.6, 2.4, 1, 2.4, 1.8, 2.6], ['C', 1.2, 4.2, -0.9, 4.2, -1.5, 2.6]], u, '#7a2a35');
    shapeU([['M', -1.2, 2.65], ['L', 1.5, 2.65], ['L', 1.3, 3], ['L', -1, 3]], u, '#ffffff');
  } else if(hurt){
    ovalU(0.2, 3, 0.7, 0.45, u, '#7a2a35');
  } else {
    shapeU([['M', -1.2, 2.8], ['C', -0.4, 3.1, 0.8, 3.1, 1.4, 2.7]], u, null, '#9a4a50', 0.45);
  }
  ovalU(-2.4, 1.4, 0.9, 0.5, u, [214, 120, 100]);
}
function drawAreen(x, floorY, u){
  const a = G.a;
  const pt = a.punchT > 0 ? 1 - a.punchT / 0.3 : 0;
  const punch = pt > 0 ? Math.sin(Math.min(1, pt * 1.15) * Math.PI) : 0;
  const pose = { punch, arm: a.arm, lean: a.dodge > 0 ? 0.22 * ease(Math.min(1, a.dodge * 4)) : 0, headBack: a.hit * 0.8, ko: 0, guard: G.o.atk === 'wind' ? 0.6 : 0 };
  pose.win = a.win;
  drawBody(AREEN_LOOK, x - (a.dodge > 0 ? u * 2 : 0), floorY, u, 1, 0.95, 1, pose);
  if(G.mode === 'win'){
    // crown of glory
    const hy = floorY - u * (35 + 13), hx = x + u * 0.6;
    push(); translate(hx, hy - Math.sin(G.t * 3) * u * 0.4);
    shapeU([['M', -3, 0], ['L', -3, -3], ['L', -1.5, -1.4], ['L', 0, -3.8], ['L', 1.5, -1.4], ['L', 3, -3], ['L', 3, 0]], u, '#f2b632');
    pop();
  }
  // name tag
  if(G.mode !== 'win'){ nameTag('عرين الأسد', x, floorY - u * 52, '#f2b632'); }
}

// ---------- the opponent (designed by the player) ----------
function oppLook(){
  const female = G.opp.gender === 'female';
  return {
    female, skin: '#e3a985', skinD: '#cf9372',
    top: female ? '#e0445a' : '#e0445a', sleeve: '#e3a985', forearm: null, midriff: female,
    legs: '#e3a985', shoes: '#26262e', glove: '#d6283c', cuff: '#ffffff',
    shorts: female ? '#26305e' : '#1d1d26', band: female ? '#f2b632' : '#e0445a',
    head: (u, pose) => drawOppHead(u, pose)
  };
}
function drawOppHead(u, pose){
  // the pad is mapped onto the head: pad head rx 95 px = 4.6 u
  const k = 4.6 * u / PAD_HEAD.rx;
  ovalU(0, 0, 4.6, 4.6 * PAD_HEAD.ry / PAD_HEAD.rx, u, '#e3a985');
  ovalU(-4.5, 0.6, 0.8, 1.1, u, '#e3a985');
  const ctx = drawingContext;
  const x0 = -PAD_HEAD.cx * k, y0 = -PAD_HEAD.cy * k;
  // the purple eye from punch #4 — under the drawn lines so their eye still shows
  if(G.purpleEye){
    const [ex, ey] = PAD_EYES[0];
    const g = ctx.createRadialGradient(x0 + ex * k, y0 + ey * k, 2, x0 + ex * k, y0 + ey * k, 34 * k);
    g.addColorStop(0, 'rgba(110,40,170,0.95)'); g.addColorStop(0.6, 'rgba(140,60,200,0.75)'); g.addColorStop(1, 'rgba(160,90,220,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x0 + ex * k, y0 + ey * k, 34 * k, 28 * k, 0, 0, Math.PI * 2); ctx.fill();
  }
  if(PAD.faceEmpty){ drawDefaultFace(ctx, x0, y0, k, pose); }
  else { ctx.drawImage(PAD.face, x0, y0, PAD_W * k, PAD_H * k); }
  ctx.drawImage(PAD.hair, x0, y0, PAD_W * k, PAD_H * k);
  // dizzy stars when knocked out
  if(G.o.ko > 0.5){
    for(let i = 0; i < 4; i++){
      const a = G.t * 4 + i * Math.PI / 2;
      push(); translate(Math.cos(a) * 5 * u, -7 * u + Math.sin(a) * 1.3 * u); rotate(a);
      fill(255, 224, 80); noStroke(); textAlign(CENTER, CENTER); textSize(2.6 * u); text('★', 0, 0); pop();
    }
  }
}
function drawDefaultFace(ctx, x0, y0, k, pose){
  ctx.strokeStyle = '#1d1a1f'; ctx.fillStyle = '#1d1a1f'; ctx.lineWidth = 7 * k; ctx.lineCap = 'round';
  const ko = G.o.ko > 0.3;
  for(const [ex, ey] of PAD_EYES){
    if(ko){ ctx.beginPath(); ctx.moveTo(x0 + (ex - 12) * k, y0 + (ey - 12) * k); ctx.lineTo(x0 + (ex + 12) * k, y0 + (ey + 12) * k); ctx.moveTo(x0 + (ex + 12) * k, y0 + (ey - 12) * k); ctx.lineTo(x0 + (ex - 12) * k, y0 + (ey + 12) * k); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(x0 + ex * k, y0 + ey * k, 9 * k, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.beginPath(); ctx.moveTo(x0 + 150 * k, y0 + 185 * k); ctx.lineTo(x0 + 140 * k, y0 + 215 * k); ctx.lineTo(x0 + 155 * k, y0 + 215 * k); ctx.stroke();
  ctx.beginPath();
  if(G.o.hit > 0.2 || ko){ ctx.ellipse(x0 + 150 * k, y0 + 250 * k, 16 * k, 12 * k, 0, 0, Math.PI * 2); ctx.stroke(); }
  else { ctx.moveTo(x0 + 125 * k, y0 + 248 * k); ctx.quadraticCurveTo(x0 + 150 * k, y0 + 262 * k, x0 + 178 * k, y0 + 246 * k); ctx.stroke(); }
}
function drawOpponent(x, floorY, u){
  const o = G.o;
  let punch = 0;
  if(o.atk === 'strike'){ punch = Math.sin((1 - o.atkT / 0.28) * Math.PI); }
  const pose = { punch, arm: 'front', lean: (o.atk === 'wind' ? -0.08 : 0) + o.hit * 0.2, headBack: o.hit, ko: o.ko, guard: 0, win: 0 };
  const hk = HEIGHTS[G.opp.height].k, wk = WEIGHTS[G.opp.weight].k;
  drawBody(oppLook(), x, floorY, u * (0.92 + hk * 0.08), hk, wk, -1, pose);
  if(o.atk === 'wind' && G.mode === 'fight'){
    fill(255, 224, 80); noStroke(); textAlign(CENTER, CENTER); textStyle(BOLD); textSize(u * 6);
    text('!', x, floorY - u * (52 * hk + 2) + Math.sin(G.t * 30) * 2);
  }
  if(o.ko < 0.5){ nameTag(G.opp.name || 'الخصم', x, floorY - u * (52 * hk + (o.atk === 'wind' ? 9 : 0)), '#e0445a'); }
}

function nameTag(txt, x, y, col){
  textAlign(CENTER, CENTER); textStyle(BOLD); textSize(Math.max(13, G.H * 0.032)); textFont('Cairo, Heebo, system-ui, sans-serif');
  const w = textWidth(txt) + 22, h = Math.max(22, G.H * 0.05);
  const c = hexRGB(col);
  noStroke(); fill(c[0], c[1], c[2], 235); rect(x - w / 2, y - h / 2, w, h, h / 2);
  fill(255); text(txt, x, y + 1);
}

// ---------- effects, HUD, screens ----------
function drawSparks(dt){
  noStroke();
  for(let i = G.sparks.length - 1; i >= 0; i--){
    const s = G.sparks[i]; s.life -= dt; if(s.life <= 0){ G.sparks.splice(i, 1); continue; }
    s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 300 * dt;
    const c = hexRGB(s.c); fill(c[0], c[1], c[2], 255 * s.life * 2); circle(s.x, s.y, 4 + s.life * 8);
  }
}
function bar(x, y, w, h, frac, col, label, rightAlign){
  noStroke(); fill(0, 0, 0, 120); rect(x, y, w, h, h / 2);
  const c = hexRGB(col); fill(c[0], c[1], c[2]);
  const fw = Math.max(0, w * frac);
  if(rightAlign){ rect(x + w - fw, y, fw, h, h / 2); } else { rect(x, y, fw, h, h / 2); }
  fill(255); textStyle(BOLD); textSize(Math.max(12, h * 0.62)); textAlign(rightAlign ? RIGHT : LEFT, CENTER);
  text(label, rightAlign ? x + w - 10 : x + 10, y + h / 2 + 1);
}
function drawHUD(){
  if(G.mode === 'design'){ return; }
  const W = G.W, H = G.H, bw = W * 0.36, bh = Math.max(20, H * 0.05);
  bar(W * 0.04, H * 0.04, bw, bh, G.areenHP / 100, '#f2b632', 'عرين الأسد', false);
  bar(W * 0.6, H * 0.04, bw, bh, G.oppHP / G.oppMax, '#e0445a', G.opp.name || 'الخصم', true);
  fill(255); textAlign(CENTER, CENTER); textStyle(BOLD); textSize(Math.max(13, H * 0.035));
  text('لكمات: ' + G.punches, W / 2, H * 0.065);
}
function drawMessages(dt){
  for(let i = G.msgs.length - 1; i >= 0; i--){
    const m = G.msgs[i]; m.life -= dt; if(m.life <= 0){ G.msgs.splice(i, 1); continue; }
    const k = 1 - m.life / m.max;
    const s = (m.big ? 0.09 : 0.065) * G.H * (1 + 0.25 * Math.sin(Math.min(1, k * 4) * Math.PI));
    textAlign(CENTER, CENTER); textStyle(BOLD); textSize(s);
    stroke(30, 20, 60, 230 * (m.life / m.max)); strokeWeight(6); fill(255, 236, 120, 255 * Math.min(1, m.life * 2));
    text(m.txt, G.W / 2, G.H * (0.24 - k * 0.05) - i * s * 1.1);
    noStroke();
  }
}
function drawDesignOverlay(){
  fill(255); textAlign(CENTER, CENTER); textStyle(BOLD); textSize(Math.max(18, G.H * 0.08));
  stroke(20, 20, 50); strokeWeight(6);
  text('VS', G.W / 2, G.H * 0.36);
  noStroke();
}
function drawKO(dt){
  const W = G.W, H = G.H;
  if(G.mode === 'ko'){
    const n = Math.min(3, Math.floor((G.koT - 0.6) / 0.8) + 1);
    if(n >= 1){
      textAlign(CENTER, CENTER); textStyle(BOLD); textSize(H * 0.2);
      stroke(30, 20, 60); strokeWeight(8); fill(255);
      text(String(n), W / 2, H * 0.36); noStroke();
    }
    return;
  }
  // win
  for(const c of G.confetti){
    c.y += c.vy * dt; c.s += dt * 4; if(c.y > H){ c.y = -10; }
    const col = hexRGB(c.c); fill(col[0], col[1], col[2]);
    push(); translate(c.x + Math.sin(c.s) * 8, c.y); rotate(c.s); rect(-4, -2 - c.r * 0.3, 8, 4 + c.r * 0.6); pop();
  }
  const bw = Math.min(W * 0.86, 640), bh = H * 0.26;
  fill(20, 16, 40, 220); rect(W / 2 - bw / 2, H * 0.14, bw, bh, 22);
  textAlign(CENTER, CENTER); textStyle(BOLD);
  fill(242, 182, 50); textSize(Math.max(22, H * 0.075)); text('🏆 عرين الأسد تفوز! 🏆', W / 2, H * 0.21);
  fill(255); textSize(Math.max(14, H * 0.04)); text(`بالضربة القاضية على ${G.opp.name || 'الخصم'} بعد ${G.punches} لكمات`, W / 2, H * 0.31);
}

// ---------- drawing pad (hair + features, by hand) ----------
function initPad(){
  const mk = () => { const c = document.createElement('canvas'); c.width = PAD_W * PAD_RES; c.height = PAD_H * PAD_RES; const g = c.getContext('2d'); g.scale(PAD_RES, PAD_RES); return c; };
  PAD.hair = mk(); PAD.face = mk(); PAD.faceEmpty = true;
  PAD.view = $('pad');
  PAD.view.width = PAD_W * PAD_RES; PAD.view.height = PAD_H * PAD_RES;
  const pos = e => { const r = PAD.view.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * PAD_W, (e.clientY - r.top) / r.height * PAD_H]; };
  PAD.view.addEventListener('pointerdown', e => {
    e.preventDefault(); PAD.view.setPointerCapture(e.pointerId);
    const layer = PAD[PAD.mode];
    PAD.undo.push({ mode: PAD.mode, data: layer.getContext('2d').getImageData(0, 0, layer.width, layer.height), faceEmpty: PAD.faceEmpty });
    if(PAD.undo.length > 25){ PAD.undo.shift(); }
    PAD.drawing = true; PAD.last = pos(e); PAD.mid = PAD.last;
    stroke2(PAD.last, PAD.last, PAD.last);
  });
  PAD.view.addEventListener('pointermove', e => {
    if(!PAD.drawing){ return; }
    const p = pos(e), m = [(PAD.last[0] + p[0]) / 2, (PAD.last[1] + p[1]) / 2];
    stroke2(PAD.mid, PAD.last, m);
    PAD.last = p; PAD.mid = m;
  });
  const end = () => { PAD.drawing = false; };
  PAD.view.addEventListener('pointerup', end); PAD.view.addEventListener('pointercancel', end);
  renderPad();
}
function stroke2(a, ctrl, b){
  const g = PAD[PAD.mode].getContext('2d');
  g.save();
  g.globalCompositeOperation = PAD.eraser ? 'destination-out' : 'source-over';
  g.strokeStyle = PAD.color; g.lineWidth = PAD.size; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(ctrl[0], ctrl[1], b[0], b[1]);
  if(a === b && a === ctrl){ g.lineTo(b[0] + 0.01, b[1]); }
  g.stroke(); g.restore();
  if(PAD.mode === 'face' && !PAD.eraser){ PAD.faceEmpty = false; }
  renderPad();
}
function renderPad(){
  const v = PAD.view.getContext('2d');
  v.setTransform(PAD_RES, 0, 0, PAD_RES, 0, 0);
  v.clearRect(0, 0, PAD_W, PAD_H);
  v.fillStyle = '#f6f1ea'; v.fillRect(0, 0, PAD_W, PAD_H);
  // head guide
  v.fillStyle = '#e3a985'; v.beginPath(); v.ellipse(PAD_HEAD.cx, PAD_HEAD.cy, PAD_HEAD.rx, PAD_HEAD.ry, 0, 0, Math.PI * 2); v.fill();
  v.beginPath(); v.ellipse(PAD_HEAD.cx - PAD_HEAD.rx + 6, PAD_HEAD.cy + 12, 16, 22, 0, 0, Math.PI * 2); v.fill();
  v.beginPath(); v.ellipse(PAD_HEAD.cx + PAD_HEAD.rx - 6, PAD_HEAD.cy + 12, 16, 22, 0, 0, Math.PI * 2); v.fill();
  // eye guides (faint) — the purple eye appears on the left one
  if(PAD.mode === 'face'){
    v.setLineDash([4, 4]); v.strokeStyle = 'rgba(80,60,60,0.35)'; v.lineWidth = 1.5;
    for(const [ex, ey] of PAD_EYES){ v.beginPath(); v.arc(ex, ey, 16, 0, Math.PI * 2); v.stroke(); }
    v.setLineDash([]);
  }
  v.setTransform(1, 0, 0, 1, 0, 0);
  if(PAD.mode === 'hair' && PAD.faceEmpty){ v.globalAlpha = 0.35; }
  if(!PAD.faceEmpty){ v.drawImage(PAD.face, 0, 0); }
  v.globalAlpha = PAD.mode === 'face' ? 0.45 : 1;
  v.drawImage(PAD.hair, 0, 0);
  v.globalAlpha = 1;
}
function padUndo(){
  const u = PAD.undo.pop(); if(!u){ return; }
  PAD[u.mode].getContext('2d').putImageData(u.data, 0, 0);
  PAD.faceEmpty = u.faceEmpty;
  renderPad();
}
function padClear(){
  const layer = PAD[PAD.mode];
  PAD.undo.push({ mode: PAD.mode, data: layer.getContext('2d').getImageData(0, 0, layer.width, layer.height), faceEmpty: PAD.faceEmpty });
  layer.getContext('2d').clearRect(0, 0, PAD_W, PAD_H);
  if(PAD.mode === 'face'){ PAD.faceEmpty = true; }
  renderPad();
}
function setPadMode(m){
  PAD.mode = m; PAD.eraser = false;
  PAD.color = (m === 'hair' ? HAIR_COLORS : FACE_COLORS)[0];
  PAD.size = m === 'hair' ? 10 : 5;
  buildSwatches(); syncTools(); renderPad();
}
function buildSwatches(){
  const list = PAD.mode === 'hair' ? HAIR_COLORS : FACE_COLORS;
  $('swatches').innerHTML = list.map(c => `<button class="sw${c === PAD.color && !PAD.eraser ? ' on' : ''}" data-c="${c}" style="background:${c}"></button>`).join('');
  document.querySelectorAll('#swatches .sw').forEach(b => { b.onclick = () => { PAD.color = b.dataset.c; PAD.eraser = false; buildSwatches(); syncTools(); }; });
}
function syncTools(){
  document.querySelectorAll('[data-padmode]').forEach(b => b.classList.toggle('on', b.dataset.padmode === PAD.mode));
  document.querySelectorAll('[data-size]').forEach(b => b.classList.toggle('on', +b.dataset.size === PAD.size));
  $('eraser').classList.toggle('on', PAD.eraser);
  $('padHint').textContent = PAD.mode === 'hair' ? 'ارسمي الشعر حول الرأس وفوقه ✏️' : 'ارسمي العيون (داخل الدوائر) والأنف والفم ✏️';
}

// ---------- UI ----------
const UI_CSS = `
  *{box-sizing:border-box}
  html,body{margin:0;background:#120f22;color:#f5f0ff;font-family:Cairo,Heebo,system-ui,sans-serif}
  header{padding:16px 20px 4px;display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
  h1{margin:0;font-size:28px;font-weight:900;color:#f2b632}
  header small{opacity:.75;font-size:14px}
  #designer{display:flex;flex-wrap:wrap;gap:18px;padding:10px 20px 6px;align-items:flex-start}
  .card{background:#1d1936;border:1px solid #2f2a52;border-radius:18px;padding:14px}
  #padCard{flex:0 0 auto}
  #pad{width:300px;height:340px;display:block;border-radius:14px;touch-action:none;cursor:crosshair;background:#f6f1ea}
  #padHint{font-size:13px;opacity:.85;margin:8px 0 0}
  .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px}
  .row b{font-size:14px;min-width:68px}
  .chip{font:inherit;font-size:14px;font-weight:700;padding:7px 14px;border-radius:999px;border:1px solid #3d3766;background:#262046;color:#f5f0ff;cursor:pointer}
  .chip.on{background:#f2b632;color:#1d1936;border-color:#f2b632}
  .sw{width:28px;height:28px;border-radius:50%;border:2px solid #1d1936;box-shadow:0 0 0 1px #4a4478;cursor:pointer;padding:0}
  .sw.on{box-shadow:0 0 0 3px #f2b632}
  #swatches{display:flex;gap:6px;flex-wrap:wrap}
  input[type=text]{font:inherit;font-size:16px;padding:8px 12px;border-radius:12px;border:1px solid #3d3766;background:#120f22;color:#fff;width:200px}
  #opts{flex:1 1 280px}
  .go{font:inherit;font-size:20px;font-weight:900;padding:12px 26px;border:0;border-radius:999px;background:#e0445a;color:#fff;cursor:pointer;box-shadow:0 6px 0 #9c2436}
  .go:active{transform:translateY(3px);box-shadow:0 3px 0 #9c2436}
  #fightBar{display:flex;gap:10px;flex-wrap:wrap;padding:8px 20px;align-items:center}
  .big{font:inherit;font-size:18px;font-weight:900;padding:12px 22px;border:0;border-radius:16px;color:#1d1936;background:#f2b632;cursor:pointer;touch-action:manipulation}
  .big.alt{background:#7fb2ff}
  .big.ghost{background:transparent;color:#f5f0ff;border:1px solid #3d3766}
  #stage{padding:4px 20px 10px}
  #stage canvas{display:block;width:100%;height:auto;border-radius:18px;touch-action:none}
  .help{padding:0 20px 24px;font-size:13px;opacity:.7}
  .hidden{display:none !important}
`;
function chips(group, obj, cur){ return Object.keys(obj).map(k => `<button class="chip${k === cur ? ' on' : ''}" data-g="${group}" data-k="${k}">${obj[k].label}</button>`).join(''); }
function buildUIHtml(){
  return `
<header><h1>🦁 عرين الأسد</h1><small>صمّمي الخصم… وعرين دايمًا بتفوز 🥊</small></header>
<div id="designer">
  <div class="card" id="padCard">
    <div class="row">
      <button class="chip on" data-padmode="hair">✏️ رسم الشعر</button>
      <button class="chip" data-padmode="face">👀 رسم الملامح</button>
    </div>
    <canvas id="pad"></canvas>
    <p id="padHint"></p>
    <div class="row" style="margin-top:8px"><div id="swatches"></div></div>
    <div class="row">
      <button class="chip" data-size="3">رفيع</button><button class="chip" data-size="6">وسط</button><button class="chip" data-size="12">عريض</button>
      <button class="chip" id="eraser">ممحاة</button><button class="chip" id="undo">↶ تراجع</button><button class="chip" id="clear">مسح</button>
    </div>
  </div>
  <div class="card" id="opts">
    <div class="row"><b>الاسم</b><input type="text" id="oppName" maxlength="18" placeholder="اسم الخصم"></div>
    <div class="row"><b>الجنس</b>${chips('gender', { male: { label: 'ذكر' }, female: { label: 'أنثى' } }, G.opp.gender)}</div>
    <div class="row"><b>الطول</b>${chips('height', HEIGHTS, G.opp.height)}</div>
    <div class="row"><b>الوزن</b>${chips('weight', WEIGHTS, G.opp.weight)}</div>
    <div class="row" style="margin-top:14px"><button class="go" id="goFight">🥊 يلا نتلاكم!</button></div>
  </div>
</div>
<div id="fightBar" class="hidden">
  <button class="big" id="btnPunch">🥊 لكمة</button>
  <button class="big alt" id="btnDodge">↩️ تفادي</button>
  <button class="big ghost hidden" id="btnAgain">🔁 جولة جديدة</button>
  <button class="big ghost" id="btnDesign">✏️ خصم جديد</button>
</div>
<div id="stage"></div>
<div class="help" id="help">لما تبدأ الجولة: كبسة على الحلبة أو مسافة = لكمة · سهم يسار = تفادي (لما يطلع "!" فوق الخصم)</div>`;
}
function ensureUI(){
  if(document.getElementById('pad')){ return; }
  document.documentElement.setAttribute('lang', 'ar');
  document.body.setAttribute('dir', 'rtl');
  const st = document.createElement('style'); st.textContent = UI_CSS; document.head.appendChild(st);
  const lk = document.createElement('link'); lk.rel = 'stylesheet';
  lk.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap'; document.head.appendChild(lk);
  const wrap = document.createElement('div'); wrap.innerHTML = buildUIHtml();
  while(wrap.firstChild){ document.body.appendChild(wrap.firstChild); }
}
function setScreen(){
  const design = G.mode === 'design';
  $('designer').classList.toggle('hidden', !design);
  $('fightBar').classList.toggle('hidden', design);
  $('btnPunch').classList.toggle('hidden', G.mode !== 'fight');
  $('btnDodge').classList.toggle('hidden', G.mode !== 'fight');
  $('btnAgain').classList.toggle('hidden', G.mode !== 'win');
  setTimeout(sizeCanvas, 0);
}
function initUI(){
  document.querySelectorAll('.chip[data-g]').forEach(el => {
    el.onclick = () => {
      G.opp[el.dataset.g] = el.dataset.k;
      document.querySelectorAll(`.chip[data-g="${el.dataset.g}"]`).forEach(o => o.classList.toggle('on', o === el));
    };
  });
  $('oppName').addEventListener('input', e => { G.opp.name = e.target.value.trim() || 'الخصم'; });
  document.querySelectorAll('[data-padmode]').forEach(b => { b.onclick = () => setPadMode(b.dataset.padmode); });
  document.querySelectorAll('[data-size]').forEach(b => { b.onclick = () => { PAD.size = +b.dataset.size; syncTools(); }; });
  $('eraser').onclick = () => { PAD.eraser = !PAD.eraser; buildSwatches(); syncTools(); };
  $('undo').onclick = padUndo;
  $('clear').onclick = padClear;
  $('goFight').onclick = () => { audio(); startFight(); window.scrollTo({ top: $('fightBar').offsetTop - 10, behavior: 'smooth' }); };
  $('btnPunch').addEventListener('pointerdown', e => { e.preventDefault(); doPunch(); });
  $('btnDodge').addEventListener('pointerdown', e => { e.preventDefault(); doDodge(); });
  $('btnAgain').onclick = () => startFight();
  $('btnDesign').onclick = () => { G.mode = 'design'; G.o.ko = 0; G.purpleEye = false; G.punches = 0; setScreen(); };
  buildSwatches(); syncTools();
}
