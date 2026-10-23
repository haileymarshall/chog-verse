"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { chogImage } from "@/lib/verse/chogs";
import { rng } from "@/lib/verse/format";

// Monad City at dusk: a slow drive down the avenue toward the Bank, under a burning sky.
// Everything is procedural: shader sky + sun, shader-lit towers, light-trail traffic, Chog billboards, bloom.

const PERIOD = 420; // the street layout repeats every PERIOD units so the drive loops seamlessly
const FOG = new THREE.Color("#3a1238");
const FOG_DENSITY = 0.003;

const skyVert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const skyFrag = /* glsl */ `
uniform float uTime;
varying vec3 vDir;
float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 top = vec3(0.012, 0.01, 0.05);
  vec3 high = vec3(0.10, 0.03, 0.22);
  vec3 mid = vec3(0.55, 0.10, 0.42);
  vec3 hor = vec3(1.0, 0.36, 0.38);
  vec3 low = vec3(1.0, 0.62, 0.30);
  vec3 c = mix(low, hor, smoothstep(-0.03, 0.03, h));
  c = mix(c, mid, smoothstep(0.03, 0.16, h));
  c = mix(c, high, smoothstep(0.16, 0.38, h));
  c = mix(c, top, smoothstep(0.38, 0.8, h));

  // The sun sits at the end of the avenue, banded like an old poster
  vec3 sunDir = normalize(vec3(0.0, 0.17, -1.0));
  float sd = distance(d, sunDir);
  float disc = smoothstep(0.125, 0.12, sd);
  float rel = (d.y - sunDir.y) / 0.12;
  float bands = step(0.0, sin((d.y * 140.0) - uTime * 0.6));
  float cut = rel < 0.0 ? mix(1.0, bands, smoothstep(0.05, -0.6, rel)) : 1.0;
  vec3 sunCol = mix(vec3(1.0, 0.25, 0.55), vec3(1.0, 0.9, 0.55), smoothstep(-0.9, 0.8, rel));
  c = mix(c, sunCol * 1.8, disc * cut);
  c += vec3(1.0, 0.35, 0.45) * 0.32 * exp(-sd * 11.0);
  c += vec3(1.0, 0.55, 0.3) * 0.25 * exp(-abs(h) * 30.0);

  // Stars high up
  vec3 sp = floor(d * 380.0);
  float st = step(0.9975, hash(sp));
  float tw = 0.6 + 0.4 * sin(uTime * 2.0 + hash(sp + 1.0) * 30.0);
  c += vec3(1.0) * st * tw * smoothstep(0.25, 0.6, h);

  gl_FragColor = vec4(pow(max(c, 0.0), vec3(2.2)), 1.0);
}`;

const towerVert = /* glsl */ `
attribute float aSeed;
varying vec3 vWorld;
varying vec3 vNormalW;
varying float vSeed;
varying float vDepth;
void main() {
  mat4 m = modelMatrix * instanceMatrix;
  vec4 wp = m * vec4(position, 1.0);
  vWorld = wp.xyz;
  vNormalW = normalize(mat3(m) * normal);
  vSeed = aSeed;
  vec4 mv = viewMatrix * wp;
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const towerFrag = /* glsl */ `
uniform vec3 uFog;
uniform float uFogDensity;
uniform float uTime;
varying vec3 vWorld;
varying vec3 vNormalW;
varying float vSeed;
varying float vDepth;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec3 n = normalize(vNormalW);
  float roof = step(0.5, n.y);
  vec2 uv = abs(n.x) > 0.5 ? vWorld.zy : vWorld.xy;
  vec2 cell = vec2(1.3, 1.9);
  vec2 id = floor(uv / cell);
  vec2 f = fract(uv / cell);
  float win = step(0.28, f.x) * step(f.x, 0.72) * step(0.3, f.y) * step(f.y, 0.7);
  float r = hash(id + vSeed * 17.0);
  float floorOn = step(0.35, hash(vec2(id.y, vSeed * 3.1)));
  float lit = step(0.58, r) * floorOn;
  float flick = 0.75 + 0.25 * sin(uTime * (1.0 + r * 3.0) + r * 40.0);
  vec3 wc = r > 0.94 ? vec3(0.25, 0.85, 1.0) : (r > 0.82 ? vec3(1.0, 0.35, 0.8) : vec3(1.0, 0.72, 0.4));

  vec3 base = mix(vec3(0.05, 0.035, 0.11), vec3(0.1, 0.06, 0.17), vSeed);
  vec3 col = base;
  // Warm rim from the sunset on faces that look back toward the sun
  col += vec3(1.0, 0.35, 0.45) * 0.18 * max(0.0, -n.z);
  col += vec3(0.5, 0.25, 0.9) * 0.06 * max(0.0, n.y);
  // Facade shading: darker toward the street, a little light up high
  col *= 0.6 + 0.4 * smoothstep(0.0, 120.0, vWorld.y);
  col = pow(col, vec3(2.2));
  col += pow(wc, vec3(2.2)) * win * lit * (1.0 - roof) * 2.4 * flick;
  // Street glow at the base
  col += vec3(1.0, 0.06, 0.32) * 0.25 * exp(-vWorld.y * 0.15);
  // Neon bands on some towers
  float edge = step(0.86, vSeed) * (1.0 - roof) * smoothstep(0.93, 1.0, fract(vWorld.y / 9.0));
  col += vec3(1.0, 0.08, 0.7) * edge * 2.0;

  float fog = 1.0 - exp(-uFogDensity * uFogDensity * vDepth * vDepth);
  col = mix(col, uFog, clamp(fog, 0.0, 1.0));
  gl_FragColor = vec4(col, 1.0);
}`;

function roadTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#07040f";
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = "#ffd36a";
  g.fillRect(122, 0, 4, 256);
  g.fillRect(130, 0, 4, 256);
  g.fillStyle = "#ffffff";
  for (const x of [60, 190]) g.fillRect(x, 0, 4, 120);
  g.fillStyle = "#ff4fd8";
  g.fillRect(4, 0, 3, 256);
  g.fillRect(249, 0, 3, 256);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const BILLBOARD_CHOGS = [561, 70, 196, 61, 1, 333];

export function CineCity({ className = "" }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const r = rng(7);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = "width:100%;height:100%;display:block";

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(FOG, FOG_DENSITY);
    const camera = new THREE.PerspectiveCamera(58, 1, 0.5, 3000);

    // Sky dome
    const skyU = { uTime: { value: 0 } };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 48, 24), new THREE.ShaderMaterial({ vertexShader: skyVert, fragmentShader: skyFrag, uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false }));
    scene.add(sky);

    // Towers along the avenue, laid out twice so the loop is seamless
    const towerU = { uFog: { value: FOG }, uFogDensity: { value: FOG_DENSITY }, uTime: { value: 0 } };
    const towerMat = new THREE.ShaderMaterial({ vertexShader: towerVert, fragmentShader: towerFrag, uniforms: towerU });
    const box = new THREE.BoxGeometry(1, 1, 1);
    box.translate(0, 0.5, 0);
    type Spec = { x: number; z: number; w: number; d: number; h: number; s: number };
    const specs: Spec[] = [];
    for (const side of [-1, 1]) {
      for (let row = 0; row < 4; row++) {
        let z = 0;
        while (z > -PERIOD) {
          const w = 10 + r() * 16;
          const d = 12 + r() * 20;
          const near = row === 0;
          const h = (near ? 22 : 35) + r() * (near ? 60 : 130) + row * 18;
          const x = side * (16 + row * 30 + r() * 8 + w / 2);
          specs.push({ x, z: z - d / 2, w, d, h, s: r() });
          z -= d + 2 + r() * 6;
        }
      }
    }
    const towers = new THREE.InstancedMesh(box, towerMat, specs.length * 2);
    const seeds = new Float32Array(specs.length * 2);
    const m4 = new THREE.Matrix4();
    specs.forEach((b, i) => {
      for (let k = 0; k < 2; k++) {
        m4.compose(new THREE.Vector3(b.x, 0, b.z - k * PERIOD), new THREE.Quaternion(), new THREE.Vector3(b.w, b.h, b.d));
        towers.setMatrixAt(i * 2 + k, m4);
        seeds[i * 2 + k] = b.s;
      }
    });
    box.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 1));
    towers.frustumCulled = false;
    scene.add(towers);

    // Chog billboards on the street-facing walls
    const loader = new THREE.TextureLoader();
    const boards: THREE.Object3D[] = [];
    const nearSpecs = specs.filter((b) => Math.abs(b.x) < 40 && b.h > 45);
    const ids = BILLBOARD_CHOGS;
    for (let i = 0; i < Math.min(6, nearSpecs.length); i++) {
      const b = nearSpecs[Math.floor((i * nearSpecs.length) / 6)];
      const side = Math.sign(b.x);
      const tex = loader.load(chogImage(ids[i % ids.length]));
      tex.colorSpace = THREE.SRGBColorSpace;
      for (let k = 0; k < 2; k++) {
        const g = new THREE.Group();
        const frame = new THREE.Mesh(new THREE.PlaneGeometry(15.5, 15.5), new THREE.MeshBasicMaterial({ color: i % 2 ? "#ff3fb4" : "#3fd9ff", toneMapped: false }));
        const pic = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.15, 1.1, 1.15), toneMapped: false }));
        pic.position.z = 0.05;
        g.add(frame, pic);
        g.position.set(b.x - side * (b.w / 2 + 0.3), Math.min(b.h - 12, 26 + (i % 3) * 8), b.z - k * PERIOD);
        g.rotation.y = -side * Math.PI * 0.5;
        scene.add(g);
        boards.push(g);
      }
    }

    // Road that follows the camera, with scrolling lane paint
    const roadTex = roadTexture();
    roadTex.repeat.set(1, 60);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(26, 1200), new THREE.MeshStandardMaterial({ map: roadTex, emissiveMap: roadTex, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.55, roughness: 0.25, metalness: 0.7, color: "#140a22" }));
    road.rotation.x = -Math.PI / 2;
    scene.add(road);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), new THREE.MeshStandardMaterial({ color: "#0b0616", roughness: 0.9 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    scene.add(ground);

    scene.add(new THREE.HemisphereLight("#ff7aa8", "#1a0830", 0.9));
    const sunLight = new THREE.DirectionalLight("#ff9a6a", 1.4);
    sunLight.position.set(0, 20, -200);
    scene.add(sunLight);

    // Traffic: light trails heading to and from the vault
    const CARS = 90;
    const carGeo = new THREE.BoxGeometry(0.5, 0.35, 6);
    const tails = new THREE.InstancedMesh(carGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 0.3, 0.6), toneMapped: false }), CARS);
    const heads = new THREE.InstancedMesh(carGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.8, 2.2), toneMapped: false }), CARS);
    tails.frustumCulled = heads.frustumCulled = false;
    const cars = Array.from({ length: CARS * 2 }, (_, i) => ({ lane: i < CARS ? [-3.2, -8.5][i % 2] : [3.2, 8.5][i % 2], z: -r() * 900, v: 25 + r() * 25 }));
    scene.add(tails, heads);

    // The Bank: a gold-crowned tower always waiting at the end of the road
    const bank = new THREE.Group();
    const bankBody = new THREE.Mesh(new THREE.BoxGeometry(44, 260, 40), new THREE.MeshBasicMaterial({ color: "#12061e", fog: false }));
    bankBody.position.y = 130;
    const crown = new THREE.Mesh(new THREE.TorusGeometry(26, 1.6, 12, 80), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.5, 2.4, 0.7), toneMapped: false, fog: false }));
    crown.position.y = 300;
    const spire = new THREE.Mesh(new THREE.ConeGeometry(10, 60, 4), new THREE.MeshBasicMaterial({ color: "#1a0a2a", fog: false }));
    spire.position.y = 290;
    const coin = new THREE.Mesh(new THREE.CircleGeometry(11, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.2, 0.6), toneMapped: false, fog: false }));
    coin.position.set(0, 210, 20.5);
    const stripes = new THREE.Group();
    for (let i = 0; i < 9; i++) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 180), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 0.5, 1.6), toneMapped: false, fog: false, transparent: true, opacity: 0.55 }));
      s.position.set(-16 + i * 4, 95, 20.2);
      stripes.add(s);
    }
    const beamMat = new THREE.MeshBasicMaterial({ color: "#ffd6f0", transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide });
    const beams = [0, 1].map((i) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(55, 900, 32, 1, true), beamMat);
      cone.geometry.translate(0, -450, 0);
      const pivot = new THREE.Group();
      pivot.position.set(i ? 30 : -30, 270, 0);
      cone.rotation.z = Math.PI;
      pivot.add(cone);
      bank.add(pivot);
      return pivot;
    });
    bank.add(bankBody, crown, spire, coin, stripes);
    scene.add(bank);

    // Floating embers
    const P = 700;
    const pPos = new Float32Array(P * 3);
    for (let i = 0; i < P; i++) {
      pPos[i * 3] = (r() - 0.5) * 120;
      pPos[i * 3 + 1] = r() * 70;
      pPos[i * 3 + 2] = -r() * 300;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const embers = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: new THREE.Color(2.5, 1.2, 1.6), size: 0.35, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    scene.add(embers);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.85, 0.55, 0.62);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    const resize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      camera.aspect = w / h;
      camera.fov = w < 700 ? 72 : 58;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove);

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);

    const clock = new THREE.Clock();
    let travel = 0;
    let raf = 0;
    // Adaptive quality: weak GPUs drop resolution, then bloom, then frame rate
    let slow = 0;
    let quality = 2;
    let lastRender = 0;
    const tmp = new THREE.Object3D();
    const look = new THREE.Vector3();

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const raw = clock.getDelta();
      const t = clock.elapsedTime;
      if (quality === 0 && t - lastRender < 1) return;
      lastRender = t;
      const dt = Math.min(raw, 0.05);
      if (raw > 0.06 && t > 2) slow += raw > 0.25 ? 6 : 1;
      else slow = Math.max(0, slow - 1);
      if (slow > 20 && quality > 0) {
        slow = 0;
        quality--;
        renderer.setPixelRatio(quality === 1 ? 0.75 : 0.5);
        if (quality === 0) bloom.enabled = false;
        resize();
      }
      if (!reduced) travel += dt * 14;
      const camZ = -(travel % PERIOD);

      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      camera.position.set(mouse.x * 4 + Math.sin(t * 0.3) * 0.8, 8.5 - mouse.y * 2 + Math.sin(t * 0.5) * 0.3, camZ);
      look.set(mouse.x * 10, 16 - mouse.y * 4, camZ - 120);
      camera.lookAt(look);
      camera.rotation.z += Math.sin(t * 0.25) * 0.008;

      sky.position.copy(camera.position);
      road.position.set(0, 0, camZ - 500);
      roadTex.offset.y = (camZ / 1200) * 60;
      ground.position.set(0, -0.05, camZ - 500);
      bank.position.set(0, 0, camZ - 760);
      beams[0].rotation.z = Math.sin(t * 0.4) * 0.45;
      beams[1].rotation.z = Math.sin(t * 0.33 + 2) * 0.45;
      crown.rotation.y = t * 0.6;
      embers.position.z = camZ;
      embers.rotation.y = Math.sin(t * 0.1) * 0.05;

      cars.forEach((c, i) => {
        const away = i < CARS;
        if (!reduced) c.z += (away ? -1 : 1) * c.v * dt;
        let rel = c.z - camZ;
        if (rel > 20) c.z -= 900;
        if (rel < -880) c.z += 900;
        rel = c.z - camZ;
        tmp.position.set(c.lane, 0.6, c.z);
        tmp.updateMatrix();
        (away ? tails : heads).setMatrixAt(away ? i : i - CARS, tmp.matrix);
      });
      tails.instanceMatrix.needsUpdate = true;
      heads.instanceMatrix.needsUpdate = true;

      skyU.uTime.value = t;
      towerU.uTime.value = t;
      composer.render();
    };
    frame();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => {
          (x as THREE.MeshBasicMaterial).map?.dispose();
          x.dispose();
        });
      });
      roadTex.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} className={className} aria-hidden />;
}
