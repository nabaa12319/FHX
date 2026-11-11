// noprotect
// ---------- FHX — X halftone with a heartbeat — p5.js ----------
const PALETTE = ['#0545C0', '#FF99CB', '#FFD4ED'];
// the X icon, traced from the reference (512px box, centre 256)
const X_PTS = [[143,30],[254,141],[365,30],[478,143],[367,254],[478,365],[365,478],[254,367],[143,478],[30,365],[141,254],[30,143]]
  .map(p => [(p[0] - 256) / 224, (p[1] - 256) / 224]);
const ALPHA_STEPS = 13; // opacity levels between 40% and 100%

let colorIdx = 0;       // one colour at a time, chosen from the three
let srcImg = null, baseCanvas = null, W = 0, H = 0, cnv = null;
let cells = null;       // cached grid: positions, base size, opacity, distance from centre
let beatOn = false, beatStart = 0;
const $ = id => document.getElementById(id);

function setup(){
  ensureUI(); initUI();
  cnv = createCanvas(10, 10);
  cnv.parent('stage');
  pixelDensity(1);
  frameRate(30);
  noLoop();
  cnv.elt.classList.add('hidden');
}

function draw(){
  if(!srcImg){ clear(); return; }
  if(!cells){ buildCells(); }
  paint(beatOn ? (millis() - beatStart) / 1000 : null);
}

// ---------- image ----------
function loadFile(f){
  setStatus('מעבד…');
  const url = URL.createObjectURL(f);
  const img = new Image();
  img.onerror = () => setStatus('לא הצלחתי לקרוא את הקובץ');
  img.onload = () => {
    srcImg = img;
    const maxSide = 1600, k = maxSide / Math.max(img.width, img.height);
    W = Math.round(img.width * k); H = Math.round(img.height * k);
    baseCanvas = document.createElement('canvas'); baseCanvas.width = W; baseCanvas.height = H;
    baseCanvas.getContext('2d').drawImage(img, 0, 0, W, H);
    resizeCanvas(W, H);
    ['btnReupload','btnColors','btnDownload','controls'].forEach(id => $(id).classList.remove('hidden'));
    $('btnUpload').classList.add('hidden');
    $('empty').classList.add('hidden');
    cnv.elt.classList.remove('hidden');
    cells = null;
    redraw();
    setStatus('');
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

// ---------- analyse the photo into a grid of X ----------
function buildCells(){
  const cols = +$('detail').value;          // amount of detail = how many X across
  const sizeK = +$('size').value / 100;     // icon size relative to its cell
  const vary = +$('vary').value / 100;      // how much darkness / flatness grows the X
  const cell = W / cols, rows = Math.max(1, Math.round(H / cell));
  const cellH = H / rows;

  const c = document.createElement('canvas'); c.width = cols; c.height = rows;
  const cx = c.getContext('2d', {willReadFrequently:true});
  cx.imageSmoothingQuality = 'high';
  cx.drawImage(baseCanvas, 0, 0, cols, rows);
  const d = cx.getImageData(0, 0, cols, rows).data;
  const n = cols * rows, lum = new Float32Array(n);
  let lo = 1, hi = 0;
  for(let i = 0; i < n; i++){
    lum[i] = (0.299*d[i*4] + 0.587*d[i*4+1] + 0.114*d[i*4+2]) / 255;
    if(lum[i] < lo){ lo = lum[i]; }
    if(lum[i] > hi){ hi = lum[i]; }
  }
  const range = Math.max(0.001, hi - lo);

  // local detail: how much a cell differs from its neighbours (edges = lots of detail)
  const edge = new Float32Array(n);
  let emax = 0.001;
  for(let r = 0; r < rows; r++){
    for(let q = 0; q < cols; q++){
      const v = lum[r*cols + q];
      let sum = 0;
      for(let dy = -1; dy <= 1; dy++){
        for(let dx = -1; dx <= 1; dx++){
          const rr = Math.min(rows-1, Math.max(0, r+dy)), qq = Math.min(cols-1, Math.max(0, q+dx));
          sum += Math.abs(lum[rr*cols + qq] - v);
        }
      }
      edge[r*cols + q] = sum;
      if(sum > emax){ emax = sum; }
    }
  }

  const X = new Float32Array(n), Y = new Float32Array(n), HALF = new Float32Array(n);
  const A = new Uint8Array(n), DIST = new Float32Array(n);
  const maxD = Math.hypot(W/2, H/2);
  for(let r = 0; r < rows; r++){
    for(let q = 0; q < cols; q++){
      const i = r*cols + q;
      const b = (lum[i] - lo) / range;                    // 0 = darkest, 1 = brightest
      const e = edge[i] / emax;                           // 0 = flat, 1 = lots of detail
      const f = (1 - vary * b) * (1 - 0.4 * vary * e);    // dark / flat → big X ; bright / detailed → small X
      X[i] = (q + 0.5) * cell; Y[i] = (r + 0.5) * cellH;
      HALF[i] = Math.min(cell, cellH) / 2 * sizeK * 1.15 * f;
      A[i] = Math.round(b * (ALPHA_STEPS - 1));           // opacity bucket
      DIST[i] = Math.hypot(X[i] - W/2, Y[i] - H/2) / maxD; // 0 at the centre → 1 at the corners
    }
  }
  cells = { n, X, Y, HALF, A, DIST };
}

// ---------- heartbeat ----------
// one beat = a strong "lub" and a softer "dub", then rest
function beatShape(p){
  const g = (x, m, s) => Math.exp(-((x - m) * (x - m)) / (2 * s * s));
  return g(p, 0.06, 0.035) + 0.6 * g(p, 0.24, 0.045);
}

function paint(t){
  const ctx = drawingContext;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  if(!cells){ return; }

  const bpm = +$('bpm').value;
  const strength = +$('beatAmp').value / 100;
  const beatsPerSec = bpm / 60;
  const waves = 1.6;  // how many waves fit between the centre and the corner
  const sprites = getSprites();
  const { n, X, Y, HALF, A, DIST } = cells;
  let lastA = -1;
  for(let i = 0; i < n; i++){
    let h = HALF[i];
    if(t !== null){
      // the wave leaves the centre and travels outward, fading with distance
      let p = (t * beatsPerSec - DIST[i] * waves) % 1;
      if(p < 0){ p += 1; }
      const fade = 1 - 0.55 * DIST[i];
      h *= 1 + strength * beatShape(p) * fade;
    }
    if(h < 0.4){ continue; }
    if(A[i] !== lastA){
      lastA = A[i];
      ctx.globalAlpha = 0.4 + 0.6 * lastA / (ALPHA_STEPS - 1);   // brightest 100%, darkest 40%
    }
    const d = 2 * h;
    let sp = sprites[sprites.length - 1];
    for(let k = 0; k < sprites.length; k++){ if(sprites[k].width >= d){ sp = sprites[k]; break; } }
    ctx.drawImage(sp, X[i] - h, Y[i] - h, d, d);
  }
  ctx.globalAlpha = 1;
}

// the X drawn once per size and colour, then stamped (much faster than filling paths)
let spriteCache = { color: null, list: null };
function getSprites(){
  const color = PALETTE[colorIdx];
  if(spriteCache.color === color){ return spriteCache.list; }
  const list = [16, 32, 64, 128, 256, 512].map(sz => {
    const c = document.createElement('canvas'); c.width = sz; c.height = sz;
    const g = c.getContext('2d');
    g.translate(sz/2, sz/2); g.scale(sz/2, sz/2);
    g.beginPath();
    X_PTS.forEach(([x, y], i) => { if(i === 0){ g.moveTo(x, y); } else { g.lineTo(x, y); } });
    g.closePath();
    g.fillStyle = color; g.fill();
    return c;
  });
  spriteCache = { color, list };
  return list;
}

function setBeat(on){
  beatOn = on;
  $('btnBeat').classList.toggle('on', on);
  $('btnBeat').textContent = on ? '♥ עצירת הדופק' : '♥ דופק';
  $('beatControls').classList.toggle('hidden', !on);
  if(on){ beatStart = millis(); loop(); } else { noLoop(); redraw(); }
}

function updateSwatches(){
  document.querySelectorAll('.pick').forEach((el, i) => el.classList.toggle('on', i === colorIdx));
}

function setStatus(t){ $('status').textContent = t; }

// ---------- download ----------
let downloads = null;
(async () => { try{ if(window.claude && claude.use){ downloads = await claude.use('downloads'); } }catch(e){} })();

function downloadPNG(){
  if(!srcImg){ return; }
  cnv.elt.toBlob(async blob => {
    const name = 'fhx.png';
    if(downloads){
      try{ await downloads.save({ filename:name, data:blob }); setStatus('נשמר'); }
      catch(e){ if(e && e.code !== 'declined'){ setStatus('ההורדה לא זמינה כאן'); } }
      setTimeout(() => setStatus(''), 2500);
    } else {
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
    }
  }, 'image/png');
}

// ---------- UI ----------
const UI_CSS = `
  :root{ --blue:#0545C0; --pink:#FF99CB; --blush:#FFD4ED; }
  *{box-sizing:border-box}
  html,body{margin:0;background:#fff;color:var(--blue);font-family:Heebo,system-ui,sans-serif}
  header{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;padding:18px 22px}
  h1{font-size:26px;font-weight:800;letter-spacing:.04em;margin:0;display:flex;align-items:center;gap:10px;direction:ltr}
  h1 svg{width:28px;height:28px}
  .bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
  button{font:inherit;font-size:14px;font-weight:600;color:#fff;background:var(--blue);border:0;border-radius:999px;padding:10px 18px;cursor:pointer}
  button.soft{background:var(--blush);color:var(--blue)}
  button.soft.on{background:var(--pink);color:#fff}
  button:active{transform:scale(.97)}
  .picks{display:inline-flex;align-items:center;gap:8px;font-size:14px;font-weight:600;margin:0 6px}
  .pick{width:30px;height:30px;padding:0;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px rgba(5,69,192,.3)}
  .pick.on{box-shadow:0 0 0 3px var(--blue)}
  .controls{display:flex;flex-wrap:wrap;gap:20px;align-items:center;padding:0 22px 14px;font-size:14px;font-weight:500}
  .controls label{display:flex;align-items:center;gap:8px}
  #beatControls{display:flex;flex-wrap:wrap;gap:20px;align-items:center;padding:6px 14px;border-radius:999px;background:#fff3f9}
  #beatControls.hidden{display:none}
  #bpmVal{min-width:3.5em;display:inline-block;font-variant-numeric:tabular-nums}
  input[type=range]{accent-color:var(--blue);width:130px}
  #stage{padding:0 22px 28px;display:flex;justify-content:center}
  #stage canvas{max-width:100%;height:auto !important;display:block;border-radius:6px;box-shadow:0 0 0 1px var(--blush)}
  #empty{margin:10vh auto;max-width:520px;text-align:center;border:2px dashed var(--pink);border-radius:16px;padding:64px 24px;background:#fff7fb;font-size:26px;font-weight:700}
  #status{font-size:13px;min-height:1em}
  .hidden{display:none !important}
`;
const X_SVG = '<svg viewBox="0 0 512 512"><path fill="#0545C0" d="M143 30L254 141L365 30L478 143L367 254L478 365L365 478L254 367L143 478L30 365L141 254L30 143Z"/></svg>';
const UI_HTML = `
<header>
  <h1>${X_SVG}FHX</h1>
  <div class="bar">
    <button id="btnUpload">העלאת תמונה</button>
    <button id="btnReupload" class="soft hidden">העלאה מחדש</button>
    <span id="btnColors" class="picks hidden">צבע:
      <button class="pick" data-i="0" style="background:#0545C0" aria-label="כחול"></button>
      <button class="pick" data-i="1" style="background:#FF99CB" aria-label="ורוד"></button>
      <button class="pick" data-i="2" style="background:#FFD4ED" aria-label="ורוד בהיר"></button>
    </span>
    <button id="btnDownload" class="hidden">הורדה</button>
    <span id="status"></span>
  </div>
</header>
<div class="controls hidden" id="controls">
  <label>כמות פרטים <input type="range" id="detail" min="12" max="160" value="60"></label>
  <label>גודל האיקס <input type="range" id="size" min="30" max="160" value="100"></label>
  <label>הבדל גודל (כהה = גדול) <input type="range" id="vary" min="0" max="100" value="85"></label>
  <button id="btnBeat" class="soft">♥ דופק</button>
  <span id="beatControls" class="hidden">
    <label>קצב <input type="range" id="bpm" min="40" max="200" value="72"> <span id="bpmVal" dir="ltr">72 BPM</span></label>
    <button id="btnFaster" class="soft">מהר יותר</button>
    <button id="btnSlower" class="soft">לאט יותר</button>
    <label>עוצמה <input type="range" id="beatAmp" min="10" max="150" value="70"></label>
  </span>
</div>
<div id="empty">איה, תעלי תמונה ותראי!!</div>
<div id="stage"></div>
<input type="file" id="file" accept="image/*" class="hidden">
`;

function ensureUI(){
  if(document.getElementById('btnUpload')){ return; }
  document.documentElement.setAttribute('lang', 'he');
  document.body.setAttribute('dir', 'rtl');
  const st = document.createElement('style'); st.textContent = UI_CSS; document.head.appendChild(st);
  const lk = document.createElement('link'); lk.rel = 'stylesheet';
  lk.href = 'https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800&display=swap';
  document.head.appendChild(lk);
  const wrap = document.createElement('div'); wrap.innerHTML = UI_HTML;
  while(wrap.firstChild){ document.body.appendChild(wrap.firstChild); }
}

function setBpm(v){
  v = Math.max(40, Math.min(200, Math.round(v)));
  $('bpm').value = v;
  $('bpmVal').textContent = v + ' BPM';
}

function initUI(){
  $('btnUpload').onclick = () => $('file').click();
  $('btnReupload').onclick = () => { $('file').value = ''; $('file').click(); };
  $('file').onchange = e => { const f = e.target.files[0]; if(f){ loadFile(f); } };
  document.addEventListener('dragover', e => e.preventDefault());
  document.addEventListener('drop', e => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if(f && f.type.startsWith('image/')){ loadFile(f); }
  });
  ['detail','size','vary'].forEach(id => $(id).addEventListener('input', () => { cells = null; if(srcImg && !beatOn){ redraw(); } }));
  document.querySelectorAll('.pick').forEach(el => {
    el.onclick = () => { colorIdx = +el.dataset.i; updateSwatches(); if(srcImg && !beatOn){ redraw(); } };
  });
  $('btnBeat').onclick = () => setBeat(!beatOn);
  // keep the wave continuous when the tempo changes
  const retime = (newBpm) => {
    const oldBps = +$('bpm').value / 60;
    const phase = (millis() - beatStart) / 1000 * oldBps;
    setBpm(newBpm);
    beatStart = millis() - phase / (+$('bpm').value / 60) * 1000;
  };
  $('bpm').addEventListener('input', () => {
    const v = +$('bpm').value;
    $('bpm').value = $('bpm').dataset.prev || 72;
    retime(v);
    $('bpm').dataset.prev = $('bpm').value;
  });
  $('btnFaster').onclick = () => { retime(+$('bpm').value + 20); $('bpm').dataset.prev = $('bpm').value; };
  $('btnSlower').onclick = () => { retime(+$('bpm').value - 20); $('bpm').dataset.prev = $('bpm').value; };
  $('btnDownload').onclick = downloadPNG;
  updateSwatches();
}
