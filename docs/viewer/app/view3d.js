import * as THREE from "./lib/three.module.min.js";
import { MapControls } from "./lib/MapControls.js";

export class View3D {
  constructor(host) {
    this.host = host;
    this.r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.r.setPixelRatio(window.devicePixelRatio);
    host.appendChild(this.r.domElement);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xdfe8f2);
    this.cam = new THREE.PerspectiveCamera(40, 1, 0.01, 1e4);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a8a, 2.0));
    const sun = new THREE.DirectionalLight(0xffffff, 1.5);
    sun.position.set(-1, 1.4, 0.6);
    this.scene.add(sun);
    this.mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    this.mesh = null; this.z = null; this.ex = 1.5; this.z0 = null; this.dirty = true;
    this.controls = new MapControls(this.cam, this.r.domElement);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.12, zoomToCursor: true,
      maxPolarAngle: 0.47 * Math.PI, minDistance: 0.2, rotateSpeed: 0.6 });
    this.controls.addEventListener("change", () => { this.dirty = true; });
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(host);
    this.resize();
    this.r.setAnimationLoop(() => {
      this.controls.update();
      if (this.dirty) { this.dirty = false; this.r.render(this.scene, this.cam); }
    });
  }
  setGrid(w, h, sx, sy) {
    if (this.mesh) { this.scene.remove(this.mesh); this.mesh.geometry.dispose(); }
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(sx, sy, w - 1, h - 1), this.mat);
    this.mesh.rotation.x = -Math.PI / 2;
    this.scene.add(this.mesh);
    this.sx = sx; this.sy = sy;
    this.controls.maxDistance = 6 * Math.max(sx, sy);
  }
  home() {
    const d = 1.25 * Math.max(this.sx, this.sy), y = this.zmid || 0;
    this.controls.target.set(0, y, 0);
    this.cam.position.set(0, y + d * Math.sin(0.75), d * Math.cos(0.75));
    this.controls.update(); this.dirty = true;
  }
  setHeights(z) {
    this.z = z;
    let lo = Infinity, hi = -Infinity;
    for (const v of z) if (v === v) { if (v < lo) lo = v; if (v > hi) hi = v; }
    const first = this.z0 === null;
    if (first) this.z0 = lo;
    const p = this.mesh.geometry.attributes.position;
    for (let i = 0; i < z.length; i++) p.setZ(i, ((z[i] === z[i] ? z[i] : lo) - this.z0) / 1000 * this.ex);
    p.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();
    this.mesh.geometry.computeBoundingSphere();
    if (first) { this.zmid = (hi - lo) / 2000 * this.ex; this.home(); }
    this.dirty = true;
  }
  setExaggeration(ex) {
    const f = ex / this.ex; this.ex = ex;
    this.controls.target.y *= f; this.cam.position.y *= f; if (this.zmid) this.zmid *= f;
    if (this.z) this.setHeights(this.z);
  }
  setTexture(canvas) {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = this.r.capabilities.getMaxAnisotropy();
    if (this.mat.map) this.mat.map.dispose();
    this.mat.map = t; this.mat.needsUpdate = true; this.dirty = true;
  }
  resize() {
    const w = this.host.clientWidth, h = this.host.clientHeight;
    if (!w || !h) return;
    this.r.setSize(w, h); this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); this.dirty = true;
  }
  dispose() {
    this.r.setAnimationLoop(null); this.controls.dispose(); this.ro.disconnect();
    if (this.mat.map) this.mat.map.dispose();
    this.r.dispose(); this.host.innerHTML = "";
  }
}
