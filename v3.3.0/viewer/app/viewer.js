"use strict";
const $ = id => document.getElementById(id);
const Q = new URLSearchParams(location.search);
const CATALOGUE = new URL(Q.get("catalogue") || "studies.json", location.href).href;
const BASES = {
  sat: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  topo: "https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png",
  osm: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
};
const ATTR = {
  sat: "Imagery © Esri, Maxar, Earthstar Geographics",
  topo: "© OpenStreetMap contributors, SRTM · style © OpenTopoMap (CC-BY-SA)",
  osm: "© OpenStreetMap contributors",
};
const SCOL = ["#4667a4", "#d1495b", "#2a9d8f", "#e9a03b", "#7b5ea7", "#5c6b73"];
const DEM_URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";

let CMAPS = {}, CAT = [], STUDY = null, META = null, BASE = "", SUFFIX = "";
let scen = "", region = null, field = null, k = 0, world = false, customRange = null, lastCoord = null;
let map = null, frameLayer = null, FR = null, playing = false, playTimer = null;
let V3 = null, Z3 = null;

const sleep = ms => new Promise(r => setTimeout(r, ms));
function msg(html) { $("msg").innerHTML = html; $("msg").style.display = html ? "block" : "none"; }
function fmt(v) { return Math.abs(v) >= 1000 || v === 0 ? v.toFixed(0) : (+v.toPrecision(3)).toString(); }
function readHash() { return Object.fromEntries(new URLSearchParams(location.hash.slice(1)).entries()); }
function writeHash() {
  if (!STUDY || !META) return;
  const h = new URLSearchParams({ study: STUDY.id });
  if (META.scenarios.length > 1) h.set("scenario", scen);
  h.set("region", world ? "world" : region); h.set("layer", field);
  if (!world && times().length > 1) h.set("t", times()[k]);
  if (V3) h.set("view", "3d");
  history.replaceState(null, "", "#" + h.toString());
  try { if (window.parent !== window) window.parent.history.replaceState(null, "", "#" + h.toString()); } catch (e) { }
}
window.addEventListener("error", e => { $("net").textContent = "JS error: " + e.message; });
window.addEventListener("unhandledrejection", e => { $("net").textContent = "error: " + (e.reason && e.reason.message || e.reason); });

const BUDGET = { remaining: null, reset: 0, n: 0 };
function showNet(note) {
  $("net").textContent = `data requests: ${BUDGET.n}` + (BUDGET.remaining !== null ? ` · server budget left this minute: ${BUDGET.remaining}` : "") + (note ? " · " + note : "");
}
async function budgetFetch(url, init) {
  for (let a = 0; ; a++) {
    const now = Date.now() / 1000;
    if (BUDGET.remaining !== null && BUDGET.remaining < 4 && now < BUDGET.reset) {
      showNet("waiting for the data server"); $("busy").textContent = "Data server limit reached, resuming in a few seconds…";
      await sleep((BUDGET.reset - now + 1) * 1000); BUDGET.remaining = null; $("busy").textContent = "";
    }
    let r = null;
    try { r = await fetch(url, init); } catch (e) { if (a >= 5) throw e; }
    if (r) {
      BUDGET.n++;
      const rem = r.headers.get("X-RateLimit-Remaining"), rs = r.headers.get("X-RateLimit-Reset");
      if (rem !== null) BUDGET.remaining = +rem;
      if (rs !== null) BUDGET.reset = +rs;
      showNet();
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
const TIFFS = {};
function chunkUrl(c) { return BASE + "/" + (c.bin || c.file) + SUFFIX; }
function tiffOf(c) {
  const key = chunkUrl(c) + "@" + (c.offset || 0);
  return TIFFS[key] || (TIFFS[key] = GeoTIFF.fromCustomClient(new OffsetClient(chunkUrl(c), c.offset, c.size)));
}
const CHUNKS = new Map();
function readChunk(c, bbox, w, h) {
  const key = [chunkUrl(c), c.offset || 0, bbox.map(v => Math.round(v)).join(","), w, h].join("|");
  if (!CHUNKS.has(key)) {
    const p = tiffOf(c).then(t => t.readRasters({ bbox, width: w, height: h, resampleMethod: "nearest" }));
    p.catch(() => CHUNKS.delete(key));
    CHUNKS.set(key, p);
    while (CHUNKS.size > 60) CHUNKS.delete(CHUNKS.keys().next().value);
  }
  return CHUNKS.get(key);
}

function times(s = scen, r = region) { return META.data[s][r].time; }
function lay(f = field, s = scen, r = region) { return META.data[s] && META.data[s][r] && META.data[s][r].layers[f]; }
function disp(f = field) { return Object.assign({}, META.layers[f], lay(f) || {}); }
function regionInfo(r = region) { return META.regions.find(x => x.key === r); }
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

function cmap(m) { return CMAPS[m.colormap] || CMAPS.viridis; }
function range(m) { return customRange || [m.vmin, m.vmax]; }
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function makeLut(m) {
  const cols = cmap(m).map(hexRgb), n = cols.length, lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255 * (n - 1), j = Math.min(Math.floor(t), n - 2), f = t - j;
    for (let c = 0; c < 3; c++) lut[3 * i + c] = cols[j][c] * (1 - f) + cols[j + 1][c] * f;
  }
  return lut;
}
function paint(img, s, m) {
  const d = img.data, lut = makeLut(m), [lo, hi] = range(m), lg = m.log && lo > 0;
  const L0 = lg ? Math.log(lo) : lo, span = (lg ? Math.log(hi) : hi) - L0, a = s.a, sc = s.scale, nd = s.nodata;
  for (let p = 0, q = 0; p < a.length; p++, q += 4) {
    const v = a[p];
    if (v === nd || v !== v) { d[q + 3] = 0; continue; }
    const t = ((lg ? Math.log(Math.max(v / sc, 1e-30)) : v / sc) - L0) / span, j = 3 * Math.round(255 * (t < 0 ? 0 : t > 1 ? 1 : t));
    d[q] = lut[j]; d[q + 1] = lut[j + 1]; d[q + 2] = lut[j + 2]; d[q + 3] = 255;
  }
}
function legend(m) {
  const [a, b] = range(m), mid = m.log && a > 0 ? Math.sqrt(a * b) : (a + b) / 2;
  $("grad").style.background = `linear-gradient(90deg,${cmap(m).join(",")})`;
  $("ticks").innerHTML = `<span>${fmt(a)}</span><span>${fmt(mid)}${m.log ? " (log)" : ""}</span><span>${fmt(b)} ${m.unit}</span>`;
  $("vmin").value = a; $("vmax").value = b;
}

function baseLayer() {
  const v = $("base").value;
  return v === "none" ? null : new ol.layer.Tile({
    className: "base", source: new ol.source.XYZ({ url: BASES[v], maxZoom: 18, crossOrigin: "anonymous", attributions: ATTR[v] }) });
}
function registerCrs(ri) {
  if (ri.crs !== "EPSG:3857" && ri.crs !== "EPSG:4326" && !proj4.defs(ri.crs)) { proj4.defs(ri.crs, ri.crs_proj4); ol.proj.proj4.register(proj4); }
}
let moveTimer = null;
function makeMap(proj) {
  if (map) map.setTarget(null);
  const bl = baseLayer();
  map = new ol.Map({ target: "map", layers: bl ? [bl] : [], view: new ol.View({ projection: proj, maxZoom: 19 }) });
  frameLayer = null; FR = null; outlineLayer = null;
  map.on("moveend", () => { clearTimeout(moveTimer); moveTimer = setTimeout(() => { if (!V3) render(); }, 200); });
  map.on("pointermove", ev => {
    if (ev.dragging || !META) return;
    const v = valueAt(map.getCoordinateFromPixel(ev.pixel)), m = disp(), r = world ? regionAt(ev.pixel) : null;
    $("val").textContent = (r ? r.label + (v === null ? "" : " · ") : "") + (v === null ? "" : `${m.label}: ${fmt(v)} ${m.unit}`);
    map.getTargetElement().style.cursor = r ? "pointer" : "";
  });
  map.on("singleclick", ev => {
    if (world) { const r = regionAt(ev.pixel); if (r) goRegion(r.key, { layer: field }); return; }
    timeSeries(ev.coordinate);
  });
}
function viewExtent() { return map.getView().calculateExtent(map.getSize()); }

function frameFor() {
  const ri = regionInfo(), E = ol.extent.getIntersection(viewExtent(), ri.bounds);
  if (ol.extent.isEmpty(E) || E[2] <= E[0] || E[3] <= E[1]) return null;
  const res = map.getView().getResolution(), dx = ri.resolution_m;
  const w = Math.max(1, Math.min(2048, Math.ceil((E[2] - E[0]) / Math.max(res, dx))));
  const h = Math.max(1, Math.min(2048, Math.ceil((E[3] - E[1]) / Math.max(res, dx))));
  return { bbox: E, w, h, res };
}
function needNewFrame() {
  const f = frameFor(); if (!f) return null;
  if (!FR || FR.region !== region) return f;
  const contained = ol.extent.containsExtent(FR.bbox, f.bbox);
  if (!contained || f.res < FR.res / 1.5 || f.res > FR.res * 3) return f;
  return null;
}
let renderId = 0;
async function render() {
  if (!META || !field) return;
  const nf = needNewFrame();
  if (nf) {
    FR = Object.assign(nf, { region, canvas: document.createElement("canvas") });
    FR.canvas.width = FR.w; FR.canvas.height = FR.h; FR.img = FR.canvas.getContext("2d").createImageData(FR.w, FR.h);
  }
  if (!FR) return;
  const id = ++renderId, fr = FR, m = disp();
  const s = await stepArray(field, k, fr.bbox, fr.w, fr.h).catch(e => { $("net").textContent = "error: " + e.message; return null; });
  if (!s || id !== renderId || fr !== FR) return;
  fr.cur = s; paint(fr.img, s, m); fr.canvas.getContext("2d").putImageData(fr.img, 0, 0);
  if (!frameLayer) {
    frameLayer = new ol.layer.Image({ opacity: $("opacity").value / 100, source: new ol.source.ImageCanvas({
      ratio: 1, projection: regionInfo().crs,
      canvasFunction: (ext, res, pr, size) => {
        const c = document.createElement("canvas"); c.width = size[0]; c.height = size[1];
        const g = c.getContext("2d"), b = FR && FR.bbox; if (!b) return c;
        g.imageSmoothingEnabled = false;
        const sx = size[0] / (ext[2] - ext[0]), sy = size[1] / (ext[3] - ext[1]);
        g.drawImage(FR.canvas, (b[0] - ext[0]) * sx, (ext[3] - b[3]) * sy, (b[2] - b[0]) * sx, (b[3] - b[1]) * sy);
        return c;
      } }) });
    map.addLayer(frameLayer);
  }
  frameLayer.getSource().changed();
  legend(m); writeHash();
}
function valueAt(c) {
  const fr = FR; if (!fr || !fr.cur) return null;
  const b = fr.bbox, col = Math.floor((c[0] - b[0]) / (b[2] - b[0]) * fr.w), row = Math.floor((b[3] - c[1]) / (b[3] - b[1]) * fr.h);
  if (col < 0 || row < 0 || col >= fr.w || row >= fr.h) return null;
  const v = fr.cur.a[row * fr.w + col]; return v === fr.cur.nodata || v !== v ? null : v / fr.cur.scale;
}

function setupTime() {
  const t = times(), n = t.length;
  $("timebox").style.display = n > 1 ? "block" : "none";
  $("tlabel").textContent = META.time_label || "time";
  $("time").max = Math.max(n - 1, 0);
  if (k > n - 1) k = n - 1; if (k < 0) k = 0;
  $("time").value = k; showTime();
}
function showTime() {
  const t = times();
  $("tval").textContent = t.length ? `${fmt(t[k])}${META.time_unit && META.time_unit !== "yr" ? " " + META.time_unit : ""}` : "";
}
function setStep(i) {
  const n = times().length; k = (i + n) % n; $("time").value = k; showTime();
  if (V3) { writeHash(); update3d(); return; }
  render();
}
async function preloadView() {
  if (!FR) return;
  const L = lay(), fr = FR;
  for (const c of L.chunks) { if (!playing || fr !== FR) return; await readChunk(c, fr.bbox, fr.w, fr.h); }
}
function play(on) {
  playing = on; $("play").textContent = on ? "❚❚" : "▶"; clearInterval(playTimer);
  if (!on) return;
  if (times().length < 2) { play(false); return; }
  (V3 ? prefetch3d() : preloadView()).then(() => {
    if (!playing) return;
    playTimer = setInterval(() => setStep(k + 1), 1000 / +$("fps").value);
  });
}
$("fps").onchange = () => { if (playing) play(true); };

async function pixelSeries(L, coord) {
  const out = [];
  for (const c of L.chunks) {
    const img = await (await tiffOf(c)).getImage(0), [ox, oy] = img.getOrigin(), [rx, ry] = img.getResolution();
    const px = Math.floor((coord[0] - ox) / rx), py = Math.floor((coord[1] - oy) / ry);
    if (px < 0 || py < 0 || px >= img.getWidth() || py >= img.getHeight()) return null;
    const r = await img.readRasters({ window: [px, py, px + 1, py + 1] });
    for (const b of r) out.push(b[0] === L.nodata ? NaN : b[0] / (L.scale || 1));
  }
  return out;
}
async function timeSeries(coord) {
  if (world || !META || times().length < 2) return;
  lastCoord = coord;
  const m = disp(), series = [];
  $("tsbox").style.display = "block"; $("tstitle").textContent = "reading the time series…";
  await Promise.all(META.scenarios.map(async (s, i) => {
    const L = lay(field, s.key); if (!L || L.static) return;
    const ys = await pixelSeries(L, coord).catch(() => null);
    if (ys) series.push({ xs: times(s.key).slice(0, ys.length), ys, label: s.label || s.key, color: SCOL[i % SCOL.length], on: s.key === scen, i });
  }));
  if (lastCoord !== coord) return;
  if (!series.length) { $("tstitle").textContent = "no time series for this layer"; return; }
  series.sort((a, b) => a.i - b.i);
  drawSeries(series, m);
}
function drawSeries(series, m) {
  const c = $("ts"), g = c.getContext("2d"), W = c.width, H = c.height, L = 70, R = 12, T = 14, B = 34;
  g.clearRect(0, 0, W, H);
  const ok = series.flatMap(s => s.ys.filter(isFinite));
  $("tstitle").textContent = ok.length ? `${m.label} (${m.unit}) at the clicked cell` : "no data at the clicked cell";
  if (!ok.length) return;
  let y0 = Math.min(...ok), y1 = Math.max(...ok); if (y0 === y1) { y0 -= 1; y1 += 1; }
  const xa = series.flatMap(s => s.xs), x0 = Math.min(...xa), x1 = Math.max(...xa);
  let T2 = T;
  if (series.length > 1) {
    g.font = "18px system-ui"; let lx = L, ly = T + 2;
    for (const s of series) {
      const wd = 24 + g.measureText(s.label).width;
      if (lx + wd > W - R && lx > L) { lx = L; ly += 22; }
      g.fillStyle = s.color; g.fillRect(lx, ly, 14, 14); g.fillStyle = "#4b5a72"; g.fillText(s.label, lx + 18, ly + 13); lx += wd + 12;
    }
    T2 = ly + 26;
  }
  const X = x => L + (x - x0) / (x1 - x0 || 1) * (W - L - R), Y = y => T2 + (1 - (y - y0) / (y1 - y0)) * (H - T2 - B);
  g.font = "20px system-ui"; g.fillStyle = "#4b5a72"; g.strokeStyle = "#dde4ef"; g.lineWidth = 1;
  for (const y of [y0, (y0 + y1) / 2, y1]) { g.beginPath(); g.moveTo(L, Y(y)); g.lineTo(W - R, Y(y)); g.stroke(); g.fillText(fmt(y), 4, Y(y) + 7); }
  g.fillText(fmt(x0), L, H - 6); const s1 = fmt(x1); g.fillText(s1, W - R - g.measureText(s1).width, H - 6);
  for (const s of series) {
    g.strokeStyle = s.color; g.lineWidth = s.on ? 4 : 2; g.beginPath(); let pen = false;
    s.ys.forEach((y, i) => { if (!isFinite(y)) { pen = false; return; } pen ? g.lineTo(X(s.xs[i]), Y(y)) : g.moveTo(X(s.xs[i]), Y(y)); pen = true; });
    g.stroke();
  }
  const cur = series.find(s => s.on) || series[0], t = times()[k], kk = cur.xs.indexOf(t);
  if (kk >= 0 && isFinite(cur.ys[kk])) { g.fillStyle = "#222"; g.beginPath(); g.arc(X(t), Y(cur.ys[kk]), 6, 0, 7); g.fill(); }
}

let outlineLayer = null;
function addOutlines() {
  const feats = [];
  for (const ri of META.regions) {
    if (ri.overview) continue;
    const [x0, y0, x1, y1] = ri.bounds, n = 16, ring = [];
    for (let i = 0; i <= n; i++) ring.push([x0 + (x1 - x0) * i / n, y0]);
    for (let i = 0; i <= n; i++) ring.push([x1, y0 + (y1 - y0) * i / n]);
    for (let i = 0; i <= n; i++) ring.push([x1 - (x1 - x0) * i / n, y1]);
    for (let i = 0; i <= n; i++) ring.push([x0, y1 - (y1 - y0) * i / n]);
    const g = new ol.geom.Polygon([ring.map(c => ol.proj.transform(c, ri.crs, "EPSG:3857"))]);
    feats.push(new ol.Feature({ geometry: g, key: ri.key, label: ri.label || ri.key }));
  }
  outlineLayer = new ol.layer.Vector({ source: new ol.source.Vector({ features: feats }),
    style: new ol.style.Style({ stroke: new ol.style.Stroke({ color: "rgba(70,103,164,.9)", width: 1.2 }), fill: new ol.style.Fill({ color: "rgba(70,103,164,.04)" }) }) });
  map.addLayer(outlineLayer);
}
function regionAt(pixel) {
  let best = null;
  map.forEachFeatureAtPixel(pixel, f => { const ri = regionInfo(f.get("key")); const a = ri.grid[0] * ri.grid[1]; if (!best || a < best.a) best = { key: ri.key, label: ri.label, a }; }, { layerFilter: l => l === outlineLayer });
  return best;
}

function studyInfo() {
  const st = Object.assign({}, META.study || {}, STUDY), bits = [];
  if (st.title) bits.push(`<b>${st.title}</b>`);
  const au = Array.isArray(st.authors) ? st.authors.join(", ") : st.authors;
  if (au) bits.push(au + (st.year ? ` (${st.year})` : "") + (st.journal ? `, ${st.journal}` : ""));
  if (st.doi) bits.push(`data <a target="_blank" href="https://doi.org/${st.doi}">doi:${st.doi}</a>`);
  if (st.paper) bits.push(`<a target="_blank" href="${st.paper}">paper</a>`);
  if (st.licence) bits.push(st.licence);
  if (st.igm_version) bits.push("IGM " + st.igm_version);
  $("studyinfo").innerHTML = bits.join(" · ");
}
async function selectStudy(id, want = {}) {
  play(false); close3d();
  STUDY = CAT.find(s => s.id === id) || CAT[0]; $("study").value = STUDY.id;
  BASE = new URL(STUDY.base_url, CATALOGUE).href.replace(/\/$/, ""); SUFFIX = STUDY.url_suffix || "";
  for (const key in TIFFS) delete TIFFS[key]; CHUNKS.clear();
  const r = await budgetFetch(BASE + "/igm_viewer.json" + SUFFIX);
  if (!r.ok) throw new Error(`${r.status} on igm_viewer.json`);
  META = await r.json();
  if (META.schema !== "igm_viewer/2") throw new Error("this study uses an old format (" + META.schema + ")");
  META.regions.forEach(registerCrs);
  studyInfo();
  const sk = META.scenarios.map(s => s.key);
  scen = sk.includes(want.scenario) ? want.scenario : sk[0];
  $("scenarios").innerHTML = META.scenarios.map(s => `<button data-s="${s.key}">${s.label || s.key}</button>`).join("");
  $("scenbox").style.display = sk.length > 1 ? "block" : "none";
  document.querySelectorAll("#scenarios button").forEach(b => b.onclick = () => goScenario(b.dataset.s));
  markScen();
  const regs = META.regions.map(x => x.key), many = regs.length > 8;
  const name = ri => ri.overview ? "all (overview)" : many ? (ri.label || ri.key) : ri.key;
  $("regions").innerHTML = many ? "" : META.regions.map(ri => `<button data-r="${ri.key}" title="${ri.label || ri.key}">${name(ri)}</button>`).join("");
  $("regionsel").innerHTML = many ? META.regions.map(ri => `<option value="${ri.key}">${name(ri)}</option>`).join("") : "";
  $("regionsel").style.display = many ? "" : "none";
  $("regionbox").style.display = regs.length > 1 ? "block" : "none";
  document.querySelectorAll("#regions button").forEach(b => b.onclick = () => goRegion(b.dataset.r, { layer: field }));
  await goRegion(regs.includes(want.region) ? want.region : regs[0], want);
}
function markScen() { document.querySelectorAll("#scenarios button").forEach(b => b.classList.toggle("on", b.dataset.s === scen)); }
function nearest(t, v) { return t.reduce((best, x, i) => Math.abs(x - v) < Math.abs(t[best] - v) ? i : best, 0); }
function fillFields(want) {
  const fs = Object.keys(META.layers).filter(f => lay(f));
  $("field").innerHTML = fs.map(f => `<option value="${f}">${META.layers[f].label} (${META.layers[f].unit})</option>`).join("");
  field = fs.includes(want) ? want : fs.includes(field) ? field : fs.includes("thk") ? "thk" : fs[0];
  $("field").value = field;
}
async function goScenario(s) {
  if (s === scen) return;
  const p = playing; play(false);
  const tv = times()[k];
  scen = s; markScen(); fillFields(field);
  k = nearest(times(), tv); setupTime();
  if (V3) await update3d(); else { FR = null; await render(); }
  if (lastCoord && $("tsbox").style.display !== "none") timeSeries(lastCoord);
  if (p) play(true);
}
async function goRegion(r, want = {}) {
  close3d(); play(false); region = r; customRange = null; world = !!regionInfo(r).overview;
  fillFields(want.layer);
  const t = times();
  k = want.t !== undefined && t.length ? nearest(t, want.t) : t.length - 1;
  setupTime();
  document.querySelectorAll("#regions button").forEach(b => b.classList.toggle("on", b.dataset.r === r));
  $("regionsel").value = r;
  const ri = regionInfo();
  makeMap(ri.crs);
  map.getView().fit(ri.bounds, { padding: [20, 20, 20, $("panel").offsetWidth + 30] });
  $("tsbox").style.display = "none"; lastCoord = null;
  $("hint").textContent = world ? `Overview at ${fmt(ri.resolution_m / 1000)} km. Click a region outline to open it at full resolution.`
    : t.length > 1 ? "Click a cell for its time series · ← → step · space play" : "";
  $("b3d").style.display = world ? "none" : "";
  if (world) addOutlines();
  await render();
}
async function readBox(f, i, E, w, h, s = scen) {
  const st = await stepArray(f, i, E, w, h, s); if (!st) return null;
  const out = new Float32Array(st.a.length);
  for (let p = 0; p < out.length; p++) out[p] = st.a[p] === st.nodata ? NaN : st.a[p] / st.scale;
  return out;
}
function surface3d(i) {
  const { w, h, E } = Z3;
  if (lay("usurf")) return readBox("usurf", i, E, w, h);
  if (lay("thk") && Z3.bed) return readBox("thk", i, E, w, h).then(t => t.map((v, p) => Z3.bed[p] + (v === v ? v : 0)));
  return Promise.resolve(Z3.bed);
}
function prefetch3d() {
  if (!V3) return Promise.resolve();
  const todo = [];
  for (let i = 0; i < times().length; i++) todo.push(() => surface3d(i), () => stepArray(field, i, Z3.E, Z3.dw, Z3.dh));
  const run = async () => { while (todo.length && V3) await todo.shift()(); };
  return Promise.all(Array.from({ length: 2 }, run));
}
function colorize(st, m, w, h) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d"), img = g.createImageData(w, h); paint(img, st, m); g.putImageData(img, 0, 0);
  return c;
}
function iceMask(st, w, h, isThk) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d"), img = g.createImageData(w, h), d = img.data;
  for (let p = 0, q = 0; p < st.a.length; p++, q += 4) {
    const v = st.a[p];
    if (v !== st.nodata && v === v && (!isThk || v > 0)) { d[q] = 244; d[q + 1] = 248; d[q + 2] = 252; d[q + 3] = 255; }
  }
  g.putImageData(img, 0, 0);
  return c;
}
function renderBase3d() { const bl = baseLayer(); return bl ? renderLayer3d(bl, Z3.tw, Z3.th) : Promise.resolve(null); }
async function dem3d() {
  const src = new ol.source.XYZ({ url: DEM_URL, maxZoom: 15, crossOrigin: "anonymous", interpolate: false });
  const c = await renderLayer3d(new ol.layer.Tile({ source: src }), Z3.w, Z3.h);
  const d = c.getContext("2d").getImageData(0, 0, Z3.w, Z3.h).data, z = new Float32Array(Z3.w * Z3.h);
  for (let i = 0; i < z.length; i++) z[i] = d[4 * i + 3] ? d[4 * i] * 256 + d[4 * i + 1] + d[4 * i + 2] / 256 - 32768 : NaN;
  return z;
}
function renderLayer3d(bl, tw, th) {
  const { E } = Z3;
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
let upd3d = 0;
async function update3d() {
  if (!V3) return;
  const id = ++upd3d, Z = Z3, white = $("ice3d").value === "white", icef = lay("usurf") ? "usurf" : "thk";
  const removed = $("ice3d").value === "removed" && Z.bed;
  const [surf, st] = await Promise.all([removed ? Z.bed : surface3d(k), white ? (lay(icef) ? stepArray(icef, k, Z.E, Z.dw, Z.dh) : null) : stepArray(field, k, Z.E, Z.dw, Z.dh)]);
  if (!V3 || Z3 !== Z || id !== upd3d) return;
  if (surf) {
    const z = new Float32Array(surf.length);
    for (let i = 0; i < z.length; i++) z[i] = surf[i] === surf[i] ? surf[i] : Z.bed ? Z.bed[i] : NaN;
    V3.setHeights(z);
  }
  const c = document.createElement("canvas"); c.width = Z.tw; c.height = Z.th;
  const g = c.getContext("2d");
  g.fillStyle = "#c9ced6"; g.fillRect(0, 0, Z.tw, Z.th);
  if (Z.base) g.drawImage(Z.base, 0, 0);
  g.imageSmoothingEnabled = false;
  if (white) { if (st) g.drawImage(iceMask(st, Z.dw, Z.dh, icef === "thk"), 0, 0, Z.tw, Z.th); }
  else if (st) { g.globalAlpha = $("opacity").value / 100; g.drawImage(colorize(st, disp(), Z.dw, Z.dh), 0, 0, Z.tw, Z.th); }
  V3.setTexture(c);
  legend(disp());
}
async function open3d() {
  if (world || V3 || !META) return;
  play(false); $("b3d").disabled = true; $("b3d").textContent = "loading…";
  try {
    const { View3D } = await import("./view3d.js");
    const ri = regionInfo(), E = ol.extent.getIntersection(viewExtent(), ri.bounds), dx = ri.resolution_m || 100;
    const cw = (E[2] - E[0]) / dx, ch = (E[3] - E[1]) / dx, big = Math.max(cw, ch);
    const n = (lim, up) => [Math.max(2, Math.round(cw * Math.min(up, lim / big))), Math.max(2, Math.round(ch * Math.min(up, lim / big)))];
    const [w, h] = n(768, 1), [dw, dh] = n(1024, 1), [tw, th] = n(2048, 16);
    Z3 = { E, w, h, dw, dh, tw, th };
    const [bed, dem, base] = await Promise.all([lay("topg") ? readBox("topg", 0, E, w, h) : null, dem3d().catch(() => null), renderBase3d()]);
    if (bed && dem) for (let i = 0; i < bed.length; i++) if (bed[i] !== bed[i]) bed[i] = dem[i];
    Z3.bed = bed || dem; Z3.base = base;
    $("v3attr").textContent = [ATTR[$("base").value], dem ? "terrain outside the glaciers: Terrain Tiles (AWS Open Data, Mapzen)" : ""].filter(Boolean).join(" · ");
    $("view3d").style.display = "block";
    V3 = new View3D($("v3host"));
    V3.ex = +$("ex3d").value;
    V3.setGrid(w, h, (E[2] - E[0]) / 1000, (E[3] - E[1]) / 1000);
    await update3d(); writeHash();
    $("hint").textContent = "3D: drag to move, right drag (or ctrl + drag) to rotate and tilt, wheel to zoom · ← → step · space play";
  } catch (e) { close3d(); msg("3D view failed: " + e.message); setTimeout(() => msg(""), 5000); }
  finally { $("b3d").disabled = false; $("b3d").textContent = "3D view"; }
}
function close3d() {
  const was = !!V3;
  if (V3) V3.dispose();
  V3 = null; Z3 = null; $("view3d").style.display = "none";
  if (was) { writeHash(); $("hint").textContent = times().length > 1 ? "Click a cell for its time series · ← → step · space play" : ""; render(); }
}

$("study").onchange = () => selectStudy($("study").value).catch(e => msg(e.message));
$("field").onchange = () => { play(false); field = $("field").value; customRange = null; $("tsbox").style.display = "none"; if (V3) update3d(); else render(); };
$("regionsel").onchange = () => goRegion($("regionsel").value, { layer: field });
$("time").oninput = () => setStep(+$("time").value);
$("play").onclick = () => play(!playing);
$("base").onchange = () => {
  const old = map.getLayers().item(0), nl = baseLayer();
  if (old && old instanceof ol.layer.Tile) map.removeLayer(old);
  if (nl) map.getLayers().insertAt(0, nl);
  if (V3) { const Z = Z3; renderBase3d().then(c => { if (Z3 === Z) { Z.base = c; update3d(); } }); }
};
$("opacity").oninput = e => { $("opv").textContent = e.target.value + "%"; if (frameLayer) frameLayer.setOpacity(e.target.value / 100); update3d(); };
function restyle() {
  if (V3) update3d();
  else if (FR && FR.cur) { paint(FR.img, FR.cur, disp()); FR.canvas.getContext("2d").putImageData(FR.img, 0, 0); if (frameLayer) frameLayer.getSource().changed(); legend(disp()); }
}
const rescale = () => { const a = +$("vmin").value, b = +$("vmax").value; if (isFinite(a) && isFinite(b) && b > a) { customRange = [a, b]; restyle(); } };
$("vmin").onchange = rescale; $("vmax").onchange = rescale;
$("vreset").onclick = () => { customRange = null; restyle(); };
$("tsclose").onclick = () => { $("tsbox").style.display = "none"; lastCoord = null; };
$("collapse").onclick = () => { $("panel").classList.toggle("collapsed"); $("collapse").textContent = $("panel").classList.contains("collapsed") ? "show" : "hide"; };
$("b3d").onclick = () => V3 ? close3d() : open3d();
$("close3d").onclick = close3d;
$("ex3d").onchange = () => V3 && V3.setExaggeration(+$("ex3d").value);
$("home3d").onclick = () => V3 && V3.home();
$("ice3d").onchange = () => update3d();
document.addEventListener("keydown", e => {
  if (/INPUT|SELECT/.test(e.target.tagName) && e.target.type !== "range") return;
  if (!META || world || times().length < 2) return;
  if (e.key === "ArrowRight" && e.target.type !== "range") setStep(k + 1);
  if (e.key === "ArrowLeft" && e.target.type !== "range") setStep(k - 1);
  if (e.key === " ") { e.preventDefault(); play(!playing); }
});

(async () => {
  try {
    CMAPS = await fetch("colormaps.json").then(r => r.json());
    CAT = (await fetch(CATALOGUE).then(r => r.json())).studies || [];
  } catch (e) { msg("Could not read the catalogue of studies (" + e.message + ")."); return; }
  if (!CAT.length) {
    makeMap("EPSG:3857"); map.getView().setCenter(ol.proj.fromLonLat([8, 46.5])); map.getView().setZoom(5);
    $("body").style.display = "none";
    msg('No study is published in the viewer yet.<br>See <a target="_top" href="../publishing/">Publishing a study</a> to add yours.');
    return;
  }
  CAT.sort((a, b) => b.id.localeCompare(a.id));
  $("study").innerHTML = CAT.map(s => `<option value="${s.id}" title="${s.title || ""}">${s.id}</option>`).join("");
  const h = readHash(); if (h.t !== undefined) h.t = +h.t;
  try { await selectStudy(h.study, h); } catch (e) { msg("Could not load the study: " + e.message); return; }
  if (h.view === "3d" && !world) { await sleep(500); open3d(); }
})();
