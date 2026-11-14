import * as THREE from "../viewer/app/lib/three.module.min.js";
import { OrbitControls } from "../viewer/app/lib/OrbitControls.js";

const APP = new URL("../viewer/app/", location.href).href;
const $ = id => document.getElementById(id);
const Q = new URLSearchParams(location.search);
const CATALOGUE = new URL(Q.get("catalogue") || "studies.json", APP).href;
const BASES = {
  sat: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  topo: "https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png",
};
const DEM_URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";
const EXS = [1, 1.5, 2, 3, 5, 10, 20];
const ICE = { layer: "layer colours", white: "white ice", removed: "ice removed" };

let CMAPS = {}, CAT = [], STUDY = null, META = null, BASE = "", SUFFIX = "", map = null, boxLayer = null;
let scen = "", region = null, field = null, k = 0, ice = "layer", playing = false, playTimer = null, M = null;

const sleep = ms => new Promise(r => setTimeout(r, ms));
const fmt = v => Math.abs(v) >= 1000 || v === 0 ? v.toFixed(0) : (+v.toPrecision(3)).toString();
function busy(t) { $("busy").textContent = t || ""; $("busy").style.display = t ? "block" : "none"; }

const BUDGET = { remaining: null, reset: 0, n: 0 };
async function budgetFetch(url, init) {
  for (let a = 0; ; a++) {
    const now = Date.now() / 1000;
    if (BUDGET.remaining !== null && BUDGET.remaining < 4 && now < BUDGET.reset) {
      busy("Data server limit reached, resuming in a few seconds…");
      await sleep((BUDGET.reset - now + 1) * 1000); BUDGET.remaining = null;
    }
    let r = null;
    try { r = await fetch(url, init); } catch (e) { if (a >= 5) throw e; }
    if (r) {
      BUDGET.n++;
      const rem = r.headers.get("X-RateLimit-Remaining"), rs = r.headers.get("X-RateLimit-Reset");
      if (rem !== null) BUDGET.remaining = +rem;
      if (rs !== null) BUDGET.reset = +rs;
      $("net").textContent = `data requests: ${BUDGET.n}`;
      if (r.status !== 429) return r;
      BUDGET.remaining = 0; if (BUDGET.reset < Date.now() / 1000) BUDGET.reset = Date.now() / 1000 + 60;
      if (a >= 5) throw new Error("data server busy");
      continue;
    }
    await sleep(2000 * 2 ** a);
  }
}
class OffsetClient {
  constructor(url, offset, size) { this.url = url; this.offset = offset || 0; this.size = size; }
  async request({ headers = {}, signal } = {}) {
    const m = /bytes=(\d+)-(\d+)?/.exec(headers.Range || headers.range || "");
    if (!m || this.size === undefined) {
      const r = await budgetFetch(this.url, { headers, signal });
      return { ok: r.ok, status: r.status, getHeader: n => r.headers.get(n), getData: () => r.arrayBuffer() };
    }
    const a = +m[1], b = Math.min(m[2] !== undefined ? +m[2] : this.size - 1, this.size - 1);
    const r = await budgetFetch(this.url, { headers: { Range: `bytes=${a + this.offset}-${b + this.offset}` }, signal });
    return { ok: r.ok, status: r.status, getHeader: n => /content-range/i.test(n) ? `bytes ${a}-${b}/${this.size}` : r.headers.get(n), getData: () => r.arrayBuffer() };
  }
}
const TIFFS = {}, CHUNKS = new Map();
const chunkUrl = c => BASE + "/" + (c.bin || c.file) + SUFFIX;
function tiffOf(c) {
  const key = chunkUrl(c) + "@" + (c.offset || 0);
  return TIFFS[key] || (TIFFS[key] = GeoTIFF.fromCustomClient(new OffsetClient(chunkUrl(c), c.offset, c.size)));
}
function readChunk(c, bbox, w, h) {
  const key = [chunkUrl(c), c.offset || 0, bbox.map(v => Math.round(v)).join(","), w, h].join("|");
  if (!CHUNKS.has(key)) {
    const p = tiffOf(c).then(t => t.readRasters({ bbox, width: w, height: h, resampleMethod: "nearest" }));
    p.catch(() => CHUNKS.delete(key));
    CHUNKS.set(key, p);
    while (CHUNKS.size > 80) CHUNKS.delete(CHUNKS.keys().next().value);
  }
  return CHUNKS.get(key);
}
const times = () => META.data[scen][region].time;
const lay = (f = field, s = scen) => META.data[s] && META.data[s][region] && META.data[s][region].layers[f];
const disp = (f = field) => Object.assign({}, META.layers[f], lay(f) || {});
const regionInfo = (r = region) => META.regions.find(x => x.key === r);
function chunkAt(L, i) {
  if (L.static) return [L.chunks[0], 0];
  for (const c of L.chunks) if (i >= c.t0 && i < c.t0 + c.n) return [c, i - c.t0];
  const c = L.chunks[L.chunks.length - 1]; return [c, c.n - 1];
}
async function stepArray(f, i, bbox, w, h, s = scen) {
  const L = lay(f, s); if (!L) return null;
  const [c, j] = chunkAt(L, i);
  return { a: (await readChunk(c, bbox, w, h))[j], scale: L.scale || 1, nodata: L.nodata };
}
async function readBox(f, i, E, w, h) {
  const st = await stepArray(f, i, E, w, h); if (!st) return null;
  const out = new Float32Array(st.a.length);
  for (let p = 0; p < out.length; p++) out[p] = st.a[p] === st.nodata ? NaN : st.a[p] / st.scale;
  return out;
}

const hexRgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
function makeLut(m) {
  const cols = (CMAPS[m.colormap] || CMAPS.viridis).map(hexRgb), n = cols.length, lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255 * (n - 1), j = Math.min(Math.floor(t), n - 2), f = t - j;
    for (let c = 0; c < 3; c++) lut[3 * i + c] = cols[j][c] * (1 - f) + cols[j + 1][c] * f;
  }
  return lut;
}
function paint(img, s, m, white) {
  const d = img.data, lut = makeLut(m), lo = m.vmin, hi = m.vmax, lg = m.log && lo > 0;
  const L0 = lg ? Math.log(lo) : lo, span = (lg ? Math.log(hi) : hi) - L0, a = s.a, sc = s.scale, nd = s.nodata;
  for (let p = 0, q = 0; p < a.length; p++, q += 4) {
    const v = a[p];
    if (v === nd || v !== v || (white && v <= 0 && white === "thk")) { d[q + 3] = 0; continue; }
    if (white) { d[q] = 244; d[q + 1] = 248; d[q + 2] = 252; d[q + 3] = 255; continue; }
    const t = ((lg ? Math.log(Math.max(v / sc, 1e-30)) : v / sc) - L0) / span, j = 3 * Math.round(255 * (t < 0 ? 0 : t > 1 ? 1 : t));
    d[q] = lut[j]; d[q + 1] = lut[j + 1]; d[q + 2] = lut[j + 2]; d[q + 3] = 255;
  }
}

function baseLayer() {
  const v = $("base").value;
  return v === "none" ? null : new ol.layer.Tile({ source: new ol.source.XYZ({ url: BASES[v], maxZoom: 18, crossOrigin: "anonymous" }) });
}
function registerCrs(ri) {
  if (ri.crs !== "EPSG:3857" && ri.crs !== "EPSG:4326" && !proj4.defs(ri.crs)) { proj4.defs(ri.crs, ri.crs_proj4); ol.proj.proj4.register(proj4); }
}
function renderLayer(bl, E, tw, th) {
  return new Promise(done => {
    const div = document.createElement("div");
    div.style.cssText = `position:absolute;left:-100000px;top:0;width:${tw}px;height:${th}px`;
    document.body.appendChild(div);
    const m2 = new ol.Map({ target: div, layers: [bl], controls: [], interactions: [], pixelRatio: 1, view: new ol.View({ projection: regionInfo().crs }) });
    m2.getView().fit(E, { size: [tw, th] });
    let ended = false;
    const finish = () => {
      if (ended) return; ended = true;
      const c = document.createElement("canvas"); c.width = tw; c.height = th;
      const g = c.getContext("2d");
      div.querySelectorAll("canvas").forEach(cv => { if (cv.width) g.drawImage(cv, 0, 0, tw, th); });
      m2.setTarget(null); div.remove(); done(c);
    };
    m2.once("rendercomplete", finish); setTimeout(finish, 20000);
  });
}
async function demBox(E, w, h) {
  const src = new ol.source.XYZ({ url: DEM_URL, maxZoom: 15, crossOrigin: "anonymous", interpolate: false });
  const c = await renderLayer(new ol.layer.Tile({ source: src }), E, w, h);
  const d = c.getContext("2d").getImageData(0, 0, w, h).data, z = new Float32Array(w * h);
  for (let i = 0; i < z.length; i++) z[i] = d[4 * i + 3] ? d[4 * i] * 256 + d[4 * i + 1] + d[4 * i + 2] / 256 - 32768 : NaN;
  return z;
}

function readHash() { return Object.fromEntries(new URLSearchParams(location.hash.slice(1)).entries()); }
function writeHash(E) {
  if (!STUDY || !META) return;
  const h = new URLSearchParams({ study: STUDY.id });
  if (META.scenarios.length > 1) h.set("scenario", scen);
  h.set("region", region); h.set("layer", field);
  if (times().length > 1) h.set("t", times()[k]);
  if (E) h.set("bbox", E.map(v => Math.round(v)).join(","));
  history.replaceState(null, "", "#" + h.toString());
}

async function selectStudy(id, want = {}) {
  STUDY = CAT.find(s => s.id === id) || CAT[0]; $("study").value = STUDY.id;
  BASE = new URL(STUDY.base_url, CATALOGUE).href.replace(/\/$/, ""); SUFFIX = STUDY.url_suffix || "";
  for (const key in TIFFS) delete TIFFS[key]; CHUNKS.clear();
  const r = await budgetFetch(BASE + "/igm_viewer.json" + SUFFIX);
  if (!r.ok) throw new Error(`${r.status} on igm_viewer.json`);
  META = await r.json();
  META.regions.forEach(registerCrs);
  const st = Object.assign({}, META.study || {}, STUDY), au = Array.isArray(st.authors) ? st.authors.join(", ") : st.authors;
  $("studyinfo").innerHTML = [st.title && `<b>${st.title}</b>`, au && au + (st.year ? ` (${st.year})` : ""),
    st.doi && `<a target="_blank" href="https://doi.org/${st.doi}">doi:${st.doi}</a>`].filter(Boolean).join(" · ");
  const sk = META.scenarios.map(s => s.key);
  scen = sk.includes(want.scenario) ? want.scenario : sk[0];
  $("scen").innerHTML = META.scenarios.map(s => `<option value="${s.key}">${s.label || s.key}</option>`).join("");
  $("scen").value = scen; $("scenbox").style.display = sk.length > 1 ? "" : "none";
  const regs = META.regions.filter(x => !x.overview);
  $("region").innerHTML = regs.map(ri => `<option value="${ri.key}">${ri.label || ri.key}</option>`).join("");
  $("regionbox").style.display = regs.length > 1 ? "" : "none";
  goRegion(regs.some(x => x.key === want.region) ? want.region : regs[0].key, want);
}
function goRegion(r, want = {}) {
  region = r; $("region").value = r;
  const fs = Object.keys(META.layers).filter(f => lay(f));
  field = fs.includes(want.layer) ? want.layer : fs.includes(field) ? field : fs.includes("thk") ? "thk" : fs[0];
  $("field").innerHTML = fs.map(f => `<option value="${f}">${META.layers[f].label || f}${META.layers[f].unit ? ` (${META.layers[f].unit})` : ""}</option>`).join("");
  $("field").value = field;
  const t = times();
  k = want.t !== undefined && t.length ? t.reduce((b, x, i) => Math.abs(x - want.t) < Math.abs(t[b] - want.t) ? i : b, 0) : t.length - 1;
  const ri = regionInfo();
  if (map) map.setTarget(null);
  const bl = baseLayer();
  map = new ol.Map({ target: "map", layers: bl ? [bl] : [], view: new ol.View({ projection: ri.crs, maxZoom: 19 }) });
  const [x0, y0, x1, y1] = ri.bounds;
  boxLayer = new ol.layer.Vector({ source: new ol.source.Vector({ features: [new ol.Feature(ol.geom.Polygon.fromExtent(ri.bounds))] }),
    style: new ol.style.Style({ stroke: new ol.style.Stroke({ color: "rgba(70,103,164,.9)", width: 1.5 }) }) });
  map.addLayer(boxLayer);
  const bb = want.bbox ? want.bbox.split(",").map(Number) : null;
  map.getView().fit(bb && bb.length === 4 ? bb : [x0, y0, x1, y1], { padding: [20, 20, 20, $("panel").offsetWidth + 30] });
  writeHash();
}
function modelExtent() {
  const ri = regionInfo(), size = map.getSize(), pw = $("panel").offsetWidth + 20;
  const a = map.getCoordinateFromPixel([Math.min(pw, size[0] / 2), size[1]]), b = map.getCoordinateFromPixel([size[0], 0]);
  return ol.extent.getIntersection([a[0], a[1], b[0], b[1]], ri.bounds);
}

class Panel {
  constructor() {
    this.W = 1024; this.H = 640;
    this.canvas = document.createElement("canvas"); this.canvas.width = this.W; this.canvas.height = this.H;
    this.tex = new THREE.CanvasTexture(this.canvas); this.tex.colorSpace = THREE.SRGBColorSpace;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.35), new THREE.MeshBasicMaterial({ map: this.tex, transparent: true }));
    this.buttons = []; this.hover = null;
  }
  draw() {
    const g = this.canvas.getContext("2d"), W = this.W, m = disp(), t = times();
    g.clearRect(0, 0, W, this.H);
    g.fillStyle = "rgba(255,255,255,0.94)"; g.beginPath(); g.roundRect(0, 0, W, this.H, 28); g.fill();
    g.fillStyle = "#4667a4"; g.font = "600 34px system-ui, sans-serif"; g.fillText(STUDY.id, 32, 56);
    g.fillStyle = "#4b5a72"; g.font = "26px system-ui, sans-serif";
    g.fillText(((regionInfo().label || region) + " · " + (m.label || field) + (m.unit ? ` (${m.unit})` : "")).slice(0, 62), 32, 96);
    g.fillStyle = "#1d2738"; g.font = "600 64px ui-monospace, monospace";
    g.fillText(t.length ? String(Math.round(t[k])) : "", 32, 178);
    this.buttons = [];
    const btn = (id, label, x, y, w, on) => {
      this.buttons.push({ id, x, y, w, h: 64 });
      g.fillStyle = on ? "#4667a4" : this.hover === id ? "#e3e9f4" : "#fff"; g.strokeStyle = "#b5c3d9"; g.lineWidth = 3;
      g.beginPath(); g.roundRect(x, y, w, 64, 12); g.fill(); g.stroke();
      g.fillStyle = on ? "#fff" : "#4667a4"; g.font = "28px system-ui, sans-serif"; g.textAlign = "center";
      g.fillText(label, x + w / 2, y + 42, w - 16); g.textAlign = "left";
    };
    if (t.length > 1) { btn("prev", "◀", 300, 124, 100); btn("play", playing ? "pause" : "play", 412, 124, 100, playing); btn("next", "▶", 524, 124, 100); }
    btn("reset", "reset position", 700, 124, 292);
    const sc = META.scenarios;
    if (sc.length > 1) {
      const w = Math.min(312, (W - 64 - 12 * (sc.length - 1)) / sc.length);
      sc.forEach((s, i) => btn("scen:" + s.key, s.label || s.key, 32 + i * (w + 12), 216, w, s.key === scen));
    }
    btn("layer", "layer ▸", 32, 300, 300); btn("ice", ICE[ice], 344, 300, 300); btn("ex", "relief ×" + M.ex, 656, 300, 336);
    const lut = makeLut(m);
    for (let i = 0; i < 256; i++) { g.fillStyle = `rgb(${lut[3 * i]},${lut[3 * i + 1]},${lut[3 * i + 2]})`; g.fillRect(32 + i * 960 / 256, 400, 960 / 256 + 1, 36); }
    g.fillStyle = "#1d2738"; g.font = "26px ui-monospace, monospace";
    g.fillText(fmt(m.vmin), 32, 470); g.textAlign = "right"; g.fillText(fmt(m.vmax) + " " + (m.unit || ""), 992, 470); g.textAlign = "left";
    g.fillStyle = "#6b7891"; g.font = "22px system-ui, sans-serif";
    g.fillText("trigger: press a button · grip: grab and move the model, both grips: scale", 32, 540);
    g.fillText("thumbstick left / right: time step", 32, 576);
    this.tex.needsUpdate = true;
  }
  hit(uv) {
    const x = uv.x * this.W, y = (1 - uv.y) * this.H;
    const b = this.buttons.find(b => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h);
    return b ? b.id : null;
  }
}

class Model {
  constructor(Z) {
    this.Z = Z; this.ex = Z.ex;
    this.r = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.r.setPixelRatio(window.devicePixelRatio); this.r.xr.enabled = true; this.r.xr.setReferenceSpaceType("local-floor");
    $("stage").appendChild(this.r.domElement);
    this.scene = new THREE.Scene(); this.bg = new THREE.Color(0xdfe8f2); this.scene.background = this.bg;
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a8a, 2.0));
    const sun = new THREE.DirectionalLight(0xffffff, 1.5); sun.position.set(-1, 1.4, 0.6); this.scene.add(sun);
    this.floor = new THREE.GridHelper(10, 20, 0x9aa8bf, 0xc3cdda); this.scene.add(this.floor);
    this.cam = new THREE.PerspectiveCamera(50, 1, 0.01, 100); this.cam.position.set(-0.3, 1.75, 0.85);
    this.controls = new OrbitControls(this.cam, this.r.domElement); this.controls.target.set(-0.25, 0.9, -0.7); this.controls.update();
    this.holder = new THREE.Group(); this.scene.add(this.holder);
    const { w, h, sx, sy } = Z, s = 1.2 / Math.max(sx, sy);
    this.relief = new THREE.Group(); this.relief.scale.setScalar(s); this.holder.add(this.relief);
    this.canvas = document.createElement("canvas"); this.canvas.width = Z.tw; this.canvas.height = Z.th;
    this.tex = new THREE.CanvasTexture(this.canvas); this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = this.r.capabilities.getMaxAnisotropy();
    this.mat = new THREE.MeshLambertMaterial({ map: this.tex });
    this.geo = new THREE.PlaneGeometry(sx, sy, w - 1, h - 1);
    this.mesh = new THREE.Mesh(this.geo, this.mat); this.mesh.rotation.x = -Math.PI / 2; this.relief.add(this.mesh);
    this.slab = new THREE.Mesh(new THREE.BoxGeometry(sx, 1, sy), new THREE.MeshLambertMaterial({ color: 0x59606b }));
    this.slab.scale.y = 0.025 / s; this.slab.position.y = -this.slab.scale.y / 2; this.relief.add(this.slab);
    this.panel = new Panel(); this.scene.add(this.panel.mesh);
    this.home();
    this.ray = new THREE.Raycaster(); this.hands = []; this.grab = null; this.stickT = 0;
    for (let i = 0; i < 2; i++) {
      const c = this.r.xr.getController(i);
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]),
        new THREE.LineBasicMaterial({ color: 0x4667a4 }));
      line.scale.z = 2; c.add(line); c.userData.line = line;
      c.addEventListener("selectstart", () => this.select(c));
      c.addEventListener("squeezestart", () => this.squeeze(c, true));
      c.addEventListener("squeezeend", () => this.squeeze(c, false));
      c.addEventListener("connected", e => { c.userData.source = e.data; });
      c.addEventListener("disconnected", () => { c.userData.source = null; });
      this.scene.add(c); this.hands.push(c);
    }
    this.r.domElement.addEventListener("click", e => {
      const b = this.r.domElement.getBoundingClientRect();
      this.ray.setFromCamera(new THREE.Vector2((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1), this.cam);
      this.press();
    });
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe($("stage")); this.resize();
    this.r.setAnimationLoop((t, frame) => this.loop(t, frame));
  }
  home() {
    this.holder.position.set(0, 0.85, -0.75); this.holder.quaternion.identity(); this.holder.scale.setScalar(1);
    this.panel.mesh.position.set(-0.62, 1.15, -0.55); this.panel.mesh.rotation.set(-0.15, 0.55, 0);
  }
  resize() {
    const w = $("stage").clientWidth, h = $("stage").clientHeight;
    if (!w || !h || this.r.xr.isPresenting) return;
    this.r.setSize(w, h); this.cam.aspect = w / h; this.cam.updateProjectionMatrix();
  }
  setHeights(z) {
    const p = this.geo.attributes.position, z0 = this.Z.z0, ex = this.ex;
    for (let i = 0; i < z.length; i++) p.setZ(i, ((z[i] === z[i] ? z[i] : z0) - z0) / 1000 * ex);
    p.needsUpdate = true; this.geo.computeVertexNormals(); this.geo.computeBoundingSphere();
  }
  setTexture(over) {
    const g = this.canvas.getContext("2d"), Z = this.Z;
    g.fillStyle = "#c9ced6"; g.fillRect(0, 0, Z.tw, Z.th);
    if (Z.base) g.drawImage(Z.base, 0, 0);
    if (over) { g.imageSmoothingEnabled = false; g.globalAlpha = ice === "white" ? 1 : 0.85; g.drawImage(over, 0, 0, Z.tw, Z.th); g.globalAlpha = 1; }
    this.tex.needsUpdate = true;
  }
  aim(c) {
    const m = new THREE.Matrix4().extractRotation(c.matrixWorld);
    this.ray.ray.origin.setFromMatrixPosition(c.matrixWorld); this.ray.ray.direction.set(0, 0, -1).applyMatrix4(m);
  }
  select(c) { this.aim(c); this.press(); }
  press() {
    const hit = this.ray.intersectObject(this.panel.mesh)[0];
    if (hit) action(this.panel.hit(hit.uv));
  }
  squeeze(c, on) {
    c.userData.grip = on;
    const held = this.hands.filter(h => h.userData.grip);
    this.scene.attach(this.holder);
    if (held.length === 1) { held[0].attach(this.holder); this.two = null; }
    else if (held.length === 2) {
      const a = held[0].position, b = held[1].position;
      this.two = { d0: a.distanceTo(b), s0: this.holder.scale.x, p0: this.holder.position.clone(), m0: a.clone().add(b).multiplyScalar(0.5) };
    } else this.two = null;
  }
  loop(t, frame) {
    if (this.two) {
      const [a, b] = this.hands.map(h => h.position), d = a.distanceTo(b), mid = a.clone().add(b).multiplyScalar(0.5);
      const f = Math.min(20, Math.max(0.05, this.two.s0 * d / this.two.d0)) / this.two.s0;
      this.holder.scale.setScalar(this.two.s0 * f);
      this.holder.position.copy(this.two.p0.clone().sub(this.two.m0).multiplyScalar(f).add(mid));
    }
    if (frame) {
      let hov = null;
      for (const c of this.hands) {
        const src = c.userData.source;
        if (src && src.gamepad && t - this.stickT > 300) {
          const x = src.gamepad.axes[2] || 0;
          if (Math.abs(x) > 0.7) { this.stickT = t; action(x > 0 ? "next" : "prev"); }
        }
        if (src && src.handedness !== "left") { this.aim(c); const h = this.ray.intersectObject(this.panel.mesh)[0]; if (h) hov = this.panel.hit(h.uv); }
      }
      if (hov !== this.panel.hover) { this.panel.hover = hov; this.panel.draw(); }
    } else this.controls.update();
    this.r.render(this.scene, this.cam);
  }
  async enter(mode) {
    const s = await navigator.xr.requestSession(mode, { optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"] });
    const ar = mode === "immersive-ar";
    this.scene.background = ar ? null : this.bg; this.floor.visible = !ar;
    this.home();
    s.addEventListener("end", () => { this.scene.background = this.bg; this.floor.visible = true; this.resize(); });
    await this.r.xr.setSession(s);
  }
  dispose() {
    this.r.setAnimationLoop(null); this.ro.disconnect(); this.controls.dispose();
    this.tex.dispose(); this.panel.tex.dispose(); this.geo.dispose(); this.r.dispose(); $("stage").innerHTML = "";
  }
}

async function surface(i) {
  const { w, h, E, bed } = M.Z;
  if (ice === "removed") return bed;
  if (lay("usurf")) return readBox("usurf", i, E, w, h);
  if (lay("thk") && bed) return readBox("thk", i, E, w, h).then(t => t.map((v, p) => bed[p] + (v === v ? v : 0)));
  return bed;
}
async function overlay(i) {
  const Z = M.Z, icef = lay("usurf") ? "usurf" : "thk";
  const f = ice === "white" ? icef : field, st = lay(f) ? await stepArray(f, i, Z.E, Z.dw, Z.dh) : null;
  if (!st) return null;
  const c = document.createElement("canvas"); c.width = Z.dw; c.height = Z.dh;
  const g = c.getContext("2d"), img = g.createImageData(Z.dw, Z.dh);
  paint(img, st, disp(f), ice === "white" ? (f === "thk" ? "thk" : "any") : null); g.putImageData(img, 0, 0);
  return c;
}
let upd = 0;
async function update() {
  if (!M) return;
  const id = ++upd, Mi = M;
  const [surf, over] = await Promise.all([surface(k), overlay(k)]);
  if (Mi !== M || id !== upd) return;
  if (surf) {
    const bed = M.Z.bed, z = new Float32Array(surf.length);
    for (let i = 0; i < z.length; i++) z[i] = surf[i] === surf[i] ? surf[i] : bed ? bed[i] : NaN;
    M.setHeights(z);
  }
  M.setTexture(over); M.panel.draw(); writeHash(M.Z.E);
}
function prefetch() {
  const todo = [];
  for (let i = 0; i < times().length; i++) todo.push(() => surface(i), () => overlay(i));
  const Mi = M, run = async () => { while (todo.length && M === Mi) await todo.shift()().catch(() => null); };
  return Promise.all([run(), run()]);
}
function setPlay(on) {
  playing = on && times().length > 1; clearInterval(playTimer);
  if (playing) playTimer = setInterval(() => action(k + 1 >= times().length ? "first" : "next"), 600);
  if (M) M.panel.draw();
}
function action(id) {
  if (!id || !M) return;
  const n = times().length;
  if (id === "next") { k = Math.min(n - 1, k + 1); update(); }
  else if (id === "prev") { k = Math.max(0, k - 1); update(); }
  else if (id === "first") { k = 0; update(); }
  else if (id === "play") setPlay(!playing);
  else if (id === "reset") M.home();
  else if (id.startsWith("scen:")) { scen = id.slice(5); $("scen").value = scen; update(); prefetch(); }
  else if (id === "layer") {
    const fs = Object.keys(META.layers).filter(f => lay(f));
    field = fs[(fs.indexOf(field) + 1) % fs.length]; $("field").value = field; update(); prefetch();
  }
  else if (id === "ice") { const ks = Object.keys(ICE); ice = ks[(ks.indexOf(ice) + 1) % ks.length]; update(); }
  else if (id === "ex") { M.ex = EXS[(EXS.indexOf(M.ex) + 1) % EXS.length]; update(); }
}

async function build() {
  if (M) { M.dispose(); M = null; }
  setPlay(false);
  $("build").disabled = true; busy("Reading the data…");
  try {
    const ri = regionInfo(), E = modelExtent(), dx = ri.resolution_m || 100, lim = +$("detail").value;
    if (!E || E[2] <= E[0] || E[3] <= E[1]) throw new Error("the map does not show this region");
    const cw = (E[2] - E[0]) / dx, ch = (E[3] - E[1]) / dx, big = Math.max(cw, ch);
    const n = (l, up) => [Math.max(2, Math.round(cw * Math.min(up, l / big))), Math.max(2, Math.round(ch * Math.min(up, l / big)))];
    const [w, h] = n(lim, 1), [dw, dh] = n(2 * lim, 1), [tw, th] = n(2048, 16);
    const Z = { E, w, h, dw, dh, tw, th, sx: (E[2] - E[0]) / 1000, sy: (E[3] - E[1]) / 1000 };
    const bl = baseLayer();
    const [bed, dem, base] = await Promise.all([lay("topg") ? readBox("topg", 0, E, w, h) : null, demBox(E, w, h).catch(() => null),
      bl ? renderLayer(bl, E, tw, th) : null]);
    if (bed && dem) for (let i = 0; i < bed.length; i++) if (bed[i] !== bed[i]) bed[i] = dem[i];
    Z.bed = bed || dem; Z.base = base;
    let lo = Infinity, hi = -Infinity;
    for (const v of Z.bed || []) if (v === v) { if (v < lo) lo = v; if (v > hi) hi = v; }
    if (!isFinite(lo)) { lo = 0; hi = 1000; }
    if (lay("usurf") || lay("thk")) hi += 300;
    Z.z0 = lo;
    const auto = 0.03 * Math.max(Z.sx, Z.sy) / Math.max(0.2, (hi - lo) / 1000);
    Z.ex = EXS.reduce((b, x) => Math.abs(Math.log(x / auto)) < Math.abs(Math.log(b / auto)) ? x : b, 1);
    $("map").style.display = "none"; $("stage").style.display = "block";
    M = new Model(Z);
    await update();
    $("back").classList.remove("hidden"); $("build").classList.add("hidden");
    $("vr").disabled = !XR.vr; $("ar").disabled = !XR.ar;
    busy(""); prefetch();
  } catch (e) { busy(""); back(); $("hint").textContent = "Could not build the model: " + e.message; }
  finally { $("build").disabled = false; }
}
function back() {
  setPlay(false);
  if (M) { M.dispose(); M = null; }
  $("stage").style.display = "none"; $("map").style.display = "block";
  $("back").classList.add("hidden"); $("build").classList.remove("hidden");
  $("vr").disabled = $("ar").disabled = true;
  if (map) map.updateSize();
}

const XR = { vr: false, ar: false };
$("study").onchange = () => { back(); selectStudy($("study").value).catch(e => $("hint").textContent = e.message); };
$("scen").onchange = () => { scen = $("scen").value; if (M) { update(); prefetch(); } };
$("region").onchange = () => { back(); goRegion($("region").value, { layer: field }); };
$("field").onchange = () => { field = $("field").value; if (M) { update(); prefetch(); } };
$("base").onchange = () => { if (!M) goRegion(region, { layer: field, bbox: map.getView().calculateExtent(map.getSize()).join(",") }); };
$("build").onclick = build;
$("back").onclick = back;
$("vr").onclick = () => M && M.enter("immersive-vr").catch(e => $("xrnote").textContent = e.message);
$("ar").onclick = () => M && M.enter("immersive-ar").catch(e => $("xrnote").textContent = e.message);
document.addEventListener("keydown", e => {
  if (!M || /INPUT|SELECT/.test(e.target.tagName)) return;
  if (e.key === "ArrowRight") action("next");
  if (e.key === "ArrowLeft") action("prev");
  if (e.key === " ") { e.preventDefault(); action("play"); }
});

window.igmvr = { action, model: () => M };
(async () => {
  if (navigator.xr) {
    XR.vr = await navigator.xr.isSessionSupported("immersive-vr").catch(() => false);
    XR.ar = await navigator.xr.isSessionSupported("immersive-ar").catch(() => false);
  }
  $("xrnote").textContent = XR.vr ? "" : "No VR headset found: the model can be viewed here in 3D. Open this page in the browser of a headset (e.g. Meta Quest) for VR.";
  try {
    CMAPS = await fetch(APP + "colormaps.json").then(r => r.json());
    CAT = ((await fetch(CATALOGUE).then(r => r.json())).studies || []).sort((a, b) => b.id.localeCompare(a.id));
  } catch (e) { $("hint").textContent = "Could not read the catalogue of studies (" + e.message + ")."; return; }
  if (!CAT.length) { $("hint").textContent = "No study is published yet."; return; }
  $("study").innerHTML = CAT.map(s => `<option value="${s.id}">${s.id}</option>`).join("");
  const h = readHash(); if (h.t !== undefined) h.t = +h.t;
  try { await selectStudy(h.study, h); } catch (e) { $("hint").textContent = "Could not load the study: " + e.message; return; }
  if (h.bbox) { await sleep(300); build(); }
})();
