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

let CMAPS = {}, CAT = [], STUDY = null, DATA_BASE = null, META = null, METAS = {};
let region = null, field = null, k = 0, world = false, customRange = null;
let map = null, layer = null, worldLayers = [], playing = false, playTimer = null;
let FR = null, frameLayer = null;
const tiffCache = {};

function msg(html) { $("msg").innerHTML = html; $("msg").style.display = html ? "block" : "none"; }
function fmt(v) { return Math.abs(v) >= 1000 || v === 0 ? v.toFixed(0) : (+v.toPrecision(3)).toString(); }
function readHash() { const h = new URLSearchParams(location.hash.slice(1)); return Object.fromEntries(h.entries()); }
function writeHash() {
  if (!STUDY) return;
  const h = new URLSearchParams({ study: STUDY.id, region: world ? "world" : region, layer: field });
  if (META && META.time.length > 1) h.set("t", META.time[k]);
  history.replaceState(null, "", "#" + h.toString());
  try { if (window.parent !== window) window.parent.history.replaceState(null, "", "#" + h.toString()); } catch (e) { }
}
window.addEventListener("error", e => { $("net").textContent = "JS error: " + e.message; });
window.addEventListener("unhandledrejection", e => { $("net").textContent = "error: " + (e.reason && e.reason.message || e.reason); });

function fileUrl(reg, file) {
  const rel = new URL(file, "http://x/" + reg + "/").pathname.slice(1);   // resolves "../world/a.tif"
  if (STUDY.layout === "zenodo-flat") return DATA_BASE + "/" + rel.replaceAll("/", "__") + (STUDY.url_suffix || "");
  return DATA_BASE + "/" + rel;
}

let nCog = 0, bytesCog = 0;
new PerformanceObserver(l => {
  for (const e of l.getEntries()) if (/\.tif/.test(e.name)) { nCog++; bytesCog += e.transferSize || e.encodedBodySize || 0; }
  showNet();
}).observe({ type: "resource", buffered: true });
function showNet() { $("net").textContent = `COG requests: ${nCog} (${(bytesCog / 1024).toFixed(0)} kB) since last reset [press R to reset]`; }

function cmap(m) { return CMAPS[m.colormap] || CMAPS.viridis; }
function range(m) { return customRange || [m.vmin, m.vmax]; }
function stops(m) {
  const cols = cmap(m), [a, b] = range(m), n = cols.length, sc = m.scale || 1, out = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), v = m.log && a > 0 ? a * Math.pow(b / a, t) : a + (b - a) * t;
    out.push(v * sc, cols[i]);
  }
  return out;
}
function style(m) { return { color: ["case", ["==", ["band", 2], 0], "rgba(0,0,0,0)", ["interpolate", ["linear"], ["band", 1], ...stops(m)]] }; }
function legend(m) {
  const [a, b] = range(m), mid = m.log && a > 0 ? Math.sqrt(a * b) : (a + b) / 2;
  $("grad").style.background = `linear-gradient(90deg,${cmap(m).join(",")})`;
  $("ticks").innerHTML = `<span>${fmt(a)}</span><span>${fmt(mid)}${m.log ? " (log)" : ""}</span><span>${fmt(b)} ${m.unit}</span>`;
  $("vmin").value = a; $("vmax").value = b;
}

function baseLayer() {
  const v = $("base").value;
  return v === "none" ? null : new ol.layer.Tile({
    source: new ol.source.XYZ({ url: BASES[v], maxZoom: 18, crossOrigin: "anonymous", attributions: ATTR[v] }) });
}
function makeMap(proj) {
  if (map) map.setTarget(null);
  const bl = baseLayer();
  map = new ol.Map({ target: "map", layers: bl ? [bl] : [], view: new ol.View({ projection: proj, maxZoom: 19 }) });
  layer = null; worldLayers = []; FR = null; frameLayer = null;
  map.on("moveend", () => { if (FR && FR.viewport && !ol.extent.containsExtent(FR.bbox, viewExtent())) { const p = playing; dropFrames(); show(); if (p) play(true); } });
  map.on("pointermove", ev => {
    if (ev.dragging) return;
    const m = META && META.fields[field]; if (!m) return;
    if (framesOn()) {
      const v = frameValue(map.getCoordinateFromPixel(ev.pixel), k);
      $("val").textContent = v === null ? "" : `${m.label}: ${fmt(v)} ${m.unit}`; return;
    }
    const ls = world ? worldLayers : [layer];
    for (const l of ls) {
      const d = l && l.getData(ev.pixel);
      if (d && d[1] !== 0 && isFinite(d[0])) { $("val").textContent = `${m.label}: ${fmt(d[0] / (m.scale || 1))} ${m.unit}`; return; }
    }
    $("val").textContent = "";
  });
  map.on("singleclick", ev => timeSeries(ev.coordinate));
}
function registerCrs(meta) {
  if (meta.crs !== "EPSG:3857" && meta.crs !== "EPSG:4326" && !proj4.defs(meta.crs)) {
    proj4.defs(meta.crs, meta.crs_proj4); ol.proj.proj4.register(proj4);
  }
}
function band(m) { return Math.min(k, (m.bands || 1) - 1) + 1; }
function cogLayer(url, m, b) {
  const src = new ol.source.GeoTIFF({ sources: [{ url, bands: [b], nodata: m.nodata }], normalize: false, interpolate: false, convertToRGB: false });
  return new ol.layer.WebGLTile({ source: src, style: style(m), opacity: $("opacity").value / 100 });
}
function show() {
  if (!META || !field) return;
  const m = META.fields[field];
  if (world) {
    worldLayers.forEach(l => map.removeLayer(l)); worldLayers = [];
    for (const r of STUDY.regions) {
      const mr = METAS[r], fr = mr && mr.fields[field];
      if (fr && fr.preview) { const l = cogLayer(fileUrl(r, fr.preview), fr, 1); worldLayers.push(l); map.addLayer(l); }
    }
  } else {
    const old = layer;
    if (frameLayer) frameLayer.setVisible(false);
    layer = cogLayer(fileUrl(region, m.file), m, band(m));
    map.addLayer(layer);
    if (old) map.once("rendercomplete", () => map.removeLayer(old));
  }
  legend(m); writeHash();
}
function restyle() {
  const m = META.fields[field];
  (world ? worldLayers : [layer]).forEach(l => l && l.setStyle(style(m)));
  if (FR) { FR.lut = makeLut(m); if (framesOn()) drawFrame(k); }
  legend(m);
}

function setupTime() {
  const t = META.time || [], n = t.length;
  $("timebox").style.display = n > 1 && !world ? "block" : "none";
  $("tlabel").textContent = META.time_label || "time";
  $("time").max = Math.max(n - 1, 0);
  if (k > n - 1) k = n - 1; if (k < 0) k = 0;
  $("time").value = k; showTime();
}
function showTime() {
  const t = META.time || [];
  $("tval").textContent = t.length ? `${fmt(t[k])}${META.time_unit && META.time_unit !== "yr" ? " " + META.time_unit : ""}` : "";
}
function setStep(i) {
  const n = META.time.length; k = (i + n) % n; $("time").value = k; showTime();
  const m = META.fields[field];
  if ((m.bands || 1) < 2) { writeHash(); return; }
  if (framesReady(k)) { drawFrame(k); writeHash(); }
  else { show(); if (!FR) loadFrames(); }
}
function play(on) {
  playing = on; $("play").textContent = on ? "❚❚" : "▶"; clearInterval(playTimer);
  if (!on) return;
  const m = META.fields[field];
  if ((m.bands || 1) < 2) { play(false); return; }
  loadFrames().then(fr => {
    if (!playing || fr !== FR) return;
    playTimer = setInterval(() => setStep(k + 1), 1000 / +$("fps").value);
  });
}
$("fps").onchange = () => { if (playing) play(true); };

function viewExtent() { return map.getView().calculateExtent(map.getSize()); }
function framesOn() { return !!(frameLayer && frameLayer.getVisible()); }
function framesReady(i) { return !!(FR && FR.key === region + "|" + field && FR.frames[i]); }
function dropFrames() {
  FR = null;
  if (frameLayer) { map.removeLayer(frameLayer); frameLayer = null; }
  if (layer) layer.setVisible(true);
}
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function makeLut(m) {
  const cols = cmap(m).map(hexRgb), n = cols.length, lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255 * (n - 1), j = Math.min(Math.floor(t), n - 2), f = t - j;
    for (let c = 0; c < 3; c++) lut[3 * i + c] = cols[j][c] * (1 - f) + cols[j + 1][c] * f;
  }
  return lut;
}
function loadFrames() {
  const m = META.fields[field], key = region + "|" + field;
  if (FR && FR.key === key) return FR.ready;
  const [gh, gw] = META.grid, small = gw * gh <= 2e6;
  let bbox = META.bounds.slice(), w = gw, h = gh;
  if (!small) {
    bbox = ol.extent.getIntersection(viewExtent(), META.bounds);
    const res = map.getView().getResolution();
    w = Math.max(1, Math.min(Math.ceil((bbox[2] - bbox[0]) / res), 1600));
    h = Math.max(1, Math.min(Math.ceil((bbox[3] - bbox[1]) / res), 1600));
  }
  const fr = FR = { key, bbox, w, h, nb: m.bands, frames: new Array(m.bands), n: 0, nodata: m.nodata, scale: m.scale || 1,
                    viewport: !small, lut: makeLut(m), canvas: document.createElement("canvas") };
  fr.canvas.width = w; fr.canvas.height = h; fr.img = fr.canvas.getContext("2d").createImageData(w, h);
  const url = fileUrl(region, m.file);
  fr.ready = (async () => {
    const tiff = tiffCache[url] || (tiffCache[url] = await GeoTIFF.fromUrl(url));
    let next = Math.min(k, fr.nb - 1);
    let todo = fr.nb;
    const worker = async () => {
      while (todo > 0 && FR === fr) {
        const i = next; next = (next + 1) % fr.nb; todo--;
        const r = await tiff.readRasters(small ? { window: [0, 0, w, h], samples: [i] }
                                               : { bbox, width: w, height: h, samples: [i], resampleMethod: "nearest" });
        if (FR !== fr) return;
        fr.frames[i] = r[0]; fr.n++;
        $("tval").textContent = `${fmt(META.time[k])}  · loading ${fr.n}/${fr.nb}`;
        if (fr.n === fr.nb) showTime();
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
    return fr;
  })();
  return fr.ready;
}
function drawFrame(i) {
  const fr = FR, a = fr.frames[i], d = fr.img.data, lut = fr.lut, m = META.fields[field];
  const [lo, hi] = range(m), sc = fr.scale, nd = fr.nodata, lg = m.log && lo > 0;
  const L0 = lg ? Math.log(lo) : lo, span = (lg ? Math.log(hi) : hi) - L0;
  for (let p = 0, q = 0; p < a.length; p++, q += 4) {
    const v = a[p];
    if (v === nd || v !== v) { d[q + 3] = 0; continue; }
    let t = ((lg ? Math.log(Math.max(v / sc, 1e-30)) : v / sc) - L0) / span;
    const j = 3 * Math.round(255 * (t < 0 ? 0 : t > 1 ? 1 : t));
    d[q] = lut[j]; d[q + 1] = lut[j + 1]; d[q + 2] = lut[j + 2]; d[q + 3] = 255;
  }
  fr.canvas.getContext("2d").putImageData(fr.img, 0, 0);
  if (!frameLayer) {
    frameLayer = new ol.layer.Image({ opacity: $("opacity").value / 100, source: new ol.source.ImageCanvas({
      ratio: 1, projection: META.crs,
      canvasFunction: (ext, res, pr, size) => {
        const c = document.createElement("canvas"); c.width = size[0]; c.height = size[1];
        const g = c.getContext("2d"), b = FR ? FR.bbox : null; if (!b) return c;
        g.imageSmoothingEnabled = false;
        const sx = size[0] / (ext[2] - ext[0]), sy = size[1] / (ext[3] - ext[1]);
        g.drawImage(FR.canvas, (b[0] - ext[0]) * sx, (ext[3] - b[3]) * sy, (b[2] - b[0]) * sx, (b[3] - b[1]) * sy);
        return c;
      } }) });
    map.addLayer(frameLayer);
  }
  frameLayer.setVisible(true); frameLayer.getSource().changed();
  if (layer) layer.setVisible(false);
}
function frameValue(c, i) {
  const fr = FR, b = fr.bbox, a = fr.frames[i]; if (!a) return null;
  const col = Math.floor((c[0] - b[0]) / (b[2] - b[0]) * fr.w), row = Math.floor((b[3] - c[1]) / (b[3] - b[1]) * fr.h);
  if (col < 0 || row < 0 || col >= fr.w || row >= fr.h) return null;
  const v = a[row * fr.w + col]; return v === fr.nodata || v !== v ? null : v / fr.scale;
}

async function timeSeries(coord) {
  const m = META && META.fields[field];
  if (world || !m || (m.bands || 1) < 2) return;
  if (FR && FR.key === region + "|" + field && FR.n === FR.nb) {
    const ys = FR.frames.map((_, i) => frameValue(coord, i)).map(v => v === null ? NaN : v);
    $("tsbox").style.display = "block"; drawSeries(META.time.slice(0, ys.length), ys, m); return;
  }
  const url = fileUrl(region, m.file);
  const tiff = tiffCache[url] || (tiffCache[url] = await GeoTIFF.fromUrl(url));
  const img = await tiff.getImage(), [ox, oy] = img.getOrigin(), [rx, ry] = img.getResolution();
  const px = Math.floor((coord[0] - ox) / rx), py = Math.floor((coord[1] - oy) / ry);
  if (px < 0 || py < 0 || px >= img.getWidth() || py >= img.getHeight()) return;
  $("tsbox").style.display = "block"; $("tstitle").textContent = `reading ${m.bands} time steps…`;
  const r = await img.readRasters({ window: [px, py, px + 1, py + 1] });
  const ys = Array.from(r, b => b[0] === m.nodata ? NaN : b[0] / (m.scale || 1));
  drawSeries(META.time.slice(0, ys.length), ys, m);
}
function drawSeries(xs, ys, m) {
  const c = $("ts"), g = c.getContext("2d"), W = c.width, H = c.height, L = 70, R = 12, T = 14, B = 34;
  g.clearRect(0, 0, W, H);
  const ok = ys.filter(isFinite);
  $("tstitle").textContent = ok.length ? `${m.label} (${m.unit}) at the clicked cell` : "no data at the clicked cell";
  if (!ok.length) return;
  let y0 = Math.min(...ok), y1 = Math.max(...ok); if (y0 === y1) { y0 -= 1; y1 += 1; }
  const x0 = xs[0], x1 = xs[xs.length - 1] || x0 + 1;
  const X = x => L + (x - x0) / (x1 - x0 || 1) * (W - L - R), Y = y => T + (1 - (y - y0) / (y1 - y0)) * (H - T - B);
  g.font = "20px system-ui"; g.fillStyle = "#4b5a72"; g.strokeStyle = "#dde4ef"; g.lineWidth = 1;
  for (const y of [y0, (y0 + y1) / 2, y1]) { g.beginPath(); g.moveTo(L, Y(y)); g.lineTo(W - R, Y(y)); g.stroke(); g.fillText(fmt(y), 4, Y(y) + 7); }
  g.fillText(fmt(x0), L, H - 6); const s = fmt(x1); g.fillText(s, W - R - g.measureText(s).width, H - 6);
  g.strokeStyle = "#4667a4"; g.lineWidth = 3; g.beginPath(); let pen = false;
  ys.forEach((y, i) => { if (!isFinite(y)) { pen = false; return; } pen ? g.lineTo(X(xs[i]), Y(y)) : g.moveTo(X(xs[i]), Y(y)); pen = true; });
  g.stroke();
  g.fillStyle = "#d1495b"; const kk = Math.min(k, ys.length - 1);
  if (isFinite(ys[kk])) { g.beginPath(); g.arc(X(xs[kk]), Y(ys[kk]), 6, 0, 7); g.fill(); }
}

async function pickBase(s) {
  const base = new URL(s.base_url, CATALOGUE).href.replace(/\/$/, "");
  if (!s.mirror_url) return base;
  const mirror = new URL(s.mirror_url, CATALOGUE).href.replace(/\/$/, "");
  try {
    const ac = new AbortController(); setTimeout(() => ac.abort(), 2000);
    const r = await fetch(mirror + "/" + s.regions[0] + "/igm_viewer.json", { method: "HEAD", signal: ac.signal });
    if (r.ok) return mirror;
  } catch (e) { }
  return base;
}
async function loadMeta(r) {
  if (!METAS[r]) { METAS[r] = await fetch(fileUrl(r, "igm_viewer.json")).then(x => { if (!x.ok) throw new Error(`${x.status} on igm_viewer.json of ${r}`); return x.json(); }); }
  return METAS[r];
}
function studyInfo(s, meta) {
  const st = Object.assign({}, meta.study || {}, s), bits = [];
  if (st.authors) bits.push(st.authors + (st.year ? ` (${st.year})` : ""));
  if (st.doi) bits.push(`data <a target="_blank" href="https://doi.org/${st.doi}">doi:${st.doi}</a>`);
  if (st.paper) bits.push(`<a target="_blank" href="${st.paper}">paper</a>`);
  if (st.licence) bits.push(st.licence);
  if (st.igm_version) bits.push("IGM " + st.igm_version);
  $("studyinfo").innerHTML = bits.join(" · ");
}
async function selectStudy(id, want = {}) {
  play(false); STUDY = CAT.find(s => s.id === id) || CAT[0]; $("study").value = STUDY.id;
  METAS = {}; DATA_BASE = await pickBase(STUDY);
  const regs = STUDY.regions;
  const r0 = regs.includes(want.region) ? want.region : regs[0];
  await loadMeta(r0);
  const hasPreview = Object.values(METAS[r0].fields).some(f => f.preview);
  $("regions").innerHTML = regs.map(r => `<button data-r="${r}">${r}</button>`).join("") + (hasPreview && regs.length > 1 ? `<button data-r="world">all (1 km)</button>` : "");
  $("regionbox").style.display = regs.length > 1 || hasPreview && regs.length > 1 ? "block" : "none";
  document.querySelectorAll("#regions button").forEach(b => b.onclick = () => b.dataset.r === "world" ? goWorld() : goRegion(b.dataset.r));
  if (want.region === "world" && hasPreview && regs.length > 1) await goWorld(want); else await goRegion(r0, want);
}
function fillFields(want) {
  const fs = META.fields;
  $("field").innerHTML = Object.entries(fs).map(([key, v]) => `<option value="${key}">${v.label} (${v.unit})</option>`).join("");
  field = fs[want] ? want : fs[field] ? field : fs.thk ? "thk" : Object.keys(fs)[0];
  $("field").value = field;
}
async function goRegion(r, want = {}) {
  play(false); world = false; region = r; customRange = null;
  META = await loadMeta(r); registerCrs(META);
  fillFields(want.layer);
  const t = META.time || [];
  k = want.t !== undefined && t.length ? t.reduce((best, v, i) => Math.abs(v - want.t) < Math.abs(t[best] - want.t) ? i : best, 0) : t.length - 1;
  setupTime(); studyInfo(STUDY, META);
  document.querySelectorAll("#regions button").forEach(b => b.classList.toggle("on", b.dataset.r === r));
  makeMap(META.crs);
  map.getView().fit(META.bounds, { padding: [20, 20, 20, $("panel").offsetWidth + 30] });
  $("tsbox").style.display = "none";
  $("hint").textContent = t.length > 1 ? "Click a cell for its time series · ← → step · space play" : "";
  show();
}
async function goWorld(want = {}) {
  play(false); world = true; customRange = null;
  await Promise.all(STUDY.regions.map(loadMeta));
  META = METAS[STUDY.regions[0]]; fillFields(want.layer || field);
  setupTime();
  document.querySelectorAll("#regions button").forEach(b => b.classList.toggle("on", b.dataset.r === "world"));
  makeMap("EPSG:3857");
  const ext = ol.extent.createEmpty();
  for (const r of STUDY.regions) ol.extent.extend(ext, ol.proj.transformExtent(METAS[r].bounds_wgs84, "EPSG:4326", "EPSG:3857"));
  map.getView().fit(ext, { padding: [20, 20, 20, $("panel").offsetWidth + 30] });
  $("hint").textContent = "Overview at 1 km (last time step). Pick a region for full resolution.";
  show();
}

$("study").onchange = () => selectStudy($("study").value).catch(e => msg(e.message));
$("field").onchange = () => { play(false); dropFrames(); field = $("field").value; customRange = null; $("tsbox").style.display = "none"; show(); };
$("time").oninput = () => setStep(+$("time").value);
$("play").onclick = () => play(!playing);
$("base").onchange = () => {
  const old = map.getLayers().item(0), nl = baseLayer();
  if (old && old instanceof ol.layer.Tile && !(old instanceof ol.layer.WebGLTile)) map.removeLayer(old);
  if (nl) map.getLayers().insertAt(0, nl);
};
$("opacity").oninput = e => { $("opv").textContent = e.target.value + "%"; (world ? worldLayers : [layer, frameLayer]).forEach(l => l && l.setOpacity(e.target.value / 100)); };
const rescale = () => { const a = +$("vmin").value, b = +$("vmax").value; if (isFinite(a) && isFinite(b) && b > a) { customRange = [a, b]; restyle(); } };
$("vmin").onchange = rescale; $("vmax").onchange = rescale;
$("vreset").onclick = () => { customRange = null; restyle(); };
$("tsclose").onclick = () => { $("tsbox").style.display = "none"; };
$("collapse").onclick = () => { $("panel").classList.toggle("collapsed"); $("collapse").textContent = $("panel").classList.contains("collapsed") ? "show" : "hide"; };
document.addEventListener("keydown", e => {
  if (/INPUT|SELECT/.test(e.target.tagName) && e.target.type !== "range") return;
  if (e.key === "r" || e.key === "R") { nCog = bytesCog = 0; performance.clearResourceTimings(); showNet(); }
  if (!META || world || META.time.length < 2) return;
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
  $("study").innerHTML = CAT.map(s => `<option value="${s.id}">${s.title}</option>`).join("");
  const h = readHash(); if (h.t !== undefined) h.t = +h.t;
  try { await selectStudy(h.study, h); } catch (e) { msg("Could not load the study: " + e.message); }
})();
