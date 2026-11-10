// Staging for "Sabke Mann Ki Awaaz Suni!" (Raju hears everyone's thoughts): every value is a pure function of the frame number.
import { clamp, lin, smooth, smoother, easeOut, easeIn, easeInOut, back, spring, lerp, lerp3, add3, catmull, camKeys, kick, blinkAt, idle, q } from "./motion.js";
import { groundAt, chanEnd, floorH, terrainH } from "./terrain.js";
import { RAJU, MAA, PITAJI, DUKANDAAR, TEACHER, SEEMA, VIL_1, VIL_2, VIL_3, VIL_4, VIL_5 } from "./castdefs.js";

export const FPS = 30, TOTAL = 1589; // re-timed to the real Kore voiceover: 52.97 s, 12 lines

// ---------------- world layout ----------------
const houses = [];
{
  let s = 5;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const rowL = [[-11, 54, 1], [-12.5, 63, 0], [-11.5, 72, 2], [-13, 82, 1], [-12, 92, 0], [-14, 103, 2], [-12, 114, 1], [-25, 60, 0], [-27, 76, 2], [-26, 95, 1]];
  const rowR = [[11, 58, 0], [12.5, 68, 2], [11.5, 79, 1], [13, 89, 0], [12, 100, 2], [14, 111, 1], [25, 66, 1], [27, 84, 0], [26, 104, 2]];
  for (const [x, z, k] of rowL) houses.push([x, z, 5 + r() * 2.5, 4.2 + r() * 1.5, 2.9 + r() * 0.6, Math.PI / 2, k, r() < 0.45]);
  for (const [x, z, k] of rowR) houses.push([x, z, 5 + r() * 2.5, 4.2 + r() * 1.5, 2.9 + r() * 0.6, -Math.PI / 2, k, r() < 0.45]);
}
export const VILLAGE = {
  houses,
  palms: [[-19, 50, 10], [19, 52, 9], [-6, 120, 11], [33, 72, 9.5], [-35, 88, 10.5], [36, 98, 8.5], [-31, 66, 9], [7, 133, 10], [44, 60, 10], [-46, 74, 9]],
  trees: [[-6.5, 47, 2.6, 2.4], [17, 75, 3, 2.8], [-19, 108, 2.8, 2.6], [40, 118, 3.2, 3], [-42, 120, 3, 2.8], [55, 40, 2.6, 2.4], [-60, 45, 2.8, 2.6], [70, -40, 3, 2.8], [-50, -48, 2.8, 2.6]],
  hay: [[-20, 58, 1], [19.5, 63, 0.9], [-21, 86, 1.1], [33, 79, 1], [-33, 104, 0.9]],
  fields: [[85, 85, 70, 55, 1, 0.05], [-90, 90, 75, 60, 0, -0.04], [80, 150, 60, 45, 0, 0.1], [-85, 160, 70, 50, 1, 0], [40, -95, 80, 55, 1, 0.08], [-70, -100, 90, 60, 0, -0.05], [170, -40, 60, 70, 0, 0.1]],
};
export const LANE = [[0.5, 150], [0.3, 110], [0.2, 70], [0.4, 40], [0.5, 27]];
// main.js imports these to build the world (road ribbon, route lines, clinic); the boy's shots do not use them.
export const CLINIC = [92, -246, 0.3];
export const ROAD = [[2, 82], [40, 87], [90, 82], [138, 68], [174, 44], [190, 12], [192, -22], [180, -58], [158, -98], [132, -142], [110, -186], [96, -228]];
export const MAPCAM = { pos: [92, 520, 44], look: [92, 0, -80], fov: 50 };
export const SHORT = [[0.4, -22], [6, -70], [26, -130], [56, -190], [86, -236]];

// ---------------- light presets ----------------
const LP = {
  day: { az: 112, el: 50, sun: [1.2, 1.12, 0.97], amb: [0.36, 0.37, 0.46], gnd: [0.32, 0.27, 0.2], top: "#3f80d4", mid: "#8fb7e6", hor: "#c4d8ee", fog: [120, 1300], sat: 1.1, lift: [0.02, 0.025, 0.05], gain: [1, 1, 1], card: [1, 1, 1], cloud: [1, 1, 1], disc: 0 },
  morning: { az: 28, el: 20, sun: [1.38, 1.04, 0.74], amb: [0.34, 0.34, 0.47], gnd: [0.3, 0.24, 0.19], top: "#4f8ad8", mid: "#a6c3e4", hor: "#f0dcbc", fog: [110, 1200], sat: 1.12, lift: [0.025, 0.02, 0.05], gain: [1.02, 1, 0.97], card: [1.03, 0.98, 0.93], cloud: [1, 0.93, 0.86], disc: 0.003 },
  golden: { az: 168, el: 10, sun: [1.62, 0.98, 0.52], amb: [0.31, 0.28, 0.48], gnd: [0.27, 0.21, 0.19], top: "#6d7cc4", mid: "#e6a98e", hor: "#ffcf8e", fog: [90, 1100], sat: 1.14, lift: [0.03, 0.02, 0.06], gain: [1.04, 0.99, 0.94], card: [1.06, 0.94, 0.82], cloud: [1, 0.84, 0.72], disc: 0.004 },
  night: { az: 135, el: 42, sun: [0.34, 0.44, 0.72], amb: [0.15, 0.19, 0.34], gnd: [0.08, 0.09, 0.15], top: "#0d1838", mid: "#1f3058", hor: "#34496f", fog: [80, 900], sat: 0.82, lift: [0.01, 0.02, 0.05], gain: [0.95, 1, 1.08], card: [0.56, 0.63, 0.88], cloud: [0.32, 0.4, 0.58], disc: 0 },
  memory: { az: 160, el: 13, sun: [1.0, 0.66, 0.58], amb: [0.23, 0.25, 0.43], gnd: [0.15, 0.14, 0.21], top: "#2a3a72", mid: "#7c6f96", hor: "#d29a84", fog: [80, 900], sat: 0.7, lift: [0.03, 0.03, 0.07], gain: [1, 0.97, 1.02], card: [0.85, 0.79, 0.88], cloud: [0.72, 0.6, 0.7], disc: 0.003 },
};
const hexMix = (a, b, t) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); const ch = (s) => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t).toString(16).padStart(2, "0"); return `#${ch(16)}${ch(8)}${ch(0)}`; };
const blendL = (a, b, t) => {
  const o = {};
  for (const k of Object.keys(a)) {
    const x = a[k], y = b[k];
    o[k] = typeof x === "string" ? hexMix(x, y, t) : Array.isArray(x) ? x.map((v, i) => lerp(v, y[i], t)) : lerp(x, y, t);
  }
  let d = b.az - a.az; if (d > 180) d -= 360; if (d < -180) d += 360; o.az = a.az + d * t;
  return o;
};
/** piecewise light: [[f, preset], ...] with smooth blends */
const lightSeq = (seq, f) => {
  if (f <= seq[0][0]) return LP[seq[0][1]];
  for (let i = 0; i < seq.length - 1; i++) if (f <= seq[i + 1][0]) return blendL(LP[seq[i][1]], LP[seq[i + 1][1]], smooth(lin(seq[i][0], seq[i + 1][0], f)));
  return LP[seq[seq.length - 1][1]];
};

// ---------------- helpers ----------------
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm = (a) => { const l = Math.hypot(...a) || 1; return a.map((v) => v / l); };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dist = (a, b) => Math.hypot(...sub(a, b));
const camRight = (c) => norm(cross(sub(c.look, c.pos), [0, 1, 0]));
const camUp = (c) => norm(cross(camRight(c), sub(c.look, c.pos)));
/** canvas angle the key light comes FROM, for a card seen by camera c (mirror flips x) */
const lightAng = (c, L, mirror = 1) => {
  const d = [Math.cos(L.el * Math.PI / 180) * Math.cos(L.az * Math.PI / 180), Math.sin(L.el * Math.PI / 180), Math.cos(L.el * Math.PI / 180) * Math.sin(L.az * Math.PI / 180)];
  const r = camRight(c), u = camUp(c);
  const sx = (d[0] * r[0] + d[1] * r[1] + d[2] * r[2]) * mirror, sy = d[0] * u[0] + d[1] * u[1] + d[2] * u[2];
  return q(Math.atan2(-Math.max(0.25, sy), sx), 0.35);
};
const mirrorOf = (c, dir) => { const r = camRight(c); return dir[0] * r[0] + dir[1] * r[2] < 0 ? -1 : 1; };
/** hammer cycle: impact at t = 0 (k 1), raise, then swing down at the end of the period */
const hammerCycle = (f, period, off = 0) => {
  const t = ((((f - off) % period) + period) % period) / period;
  if (t < 0.12) return 1;
  if (t < 0.72) return 1 - smooth((t - 0.12) / 0.6);
  return easeIn((t - 0.72) / 0.28);
};
/** one strike landing at fi: wind-up from fi-raise, down in `down` frames, recoil after */
const strike = (f, fi, down = 5, raise = 14, from = 1) => {
  if (f >= fi) return 1 - 0.12 * Math.sin(Math.min(1, (f - fi) / 6) * Math.PI);
  if (f >= fi - down) return easeIn((f - (fi - down)) / down);
  if (f >= fi - down - raise) return lerp(from, 0, smooth((f - (fi - down - raise)) / raise));
  return from;
};
const ext = (f, a, b) => f >= a && f < b;
const ht = (x, z, p) => groundAt(x, z, p);
/** hammer-head world point for a side card at pos (x, y, z), lateral offset along camera right */
const headPt = (c, pos, mirror, fwd = 0.8, up = 0.95) => { const r = camRight(c); return [pos[0] + r[0] * fwd * mirror, pos[1] + up, pos[2] + r[2] * fwd * mirror]; };
let CAMNOW = null;
const pullTo = (p, d = 0.9) => { if (!CAMNOW) return p; const v = sub(CAMNOW.pos, p), l = Math.hypot(...v) || 1; return add3(p, v.map((x) => (x * Math.min(d, l * 0.5)) / l)); };
const fxHit = (out, id, f, fi, p0, size = 1.1, seed = 1) => {
  const p = pullTo(p0);
  if (f >= fi && f < fi + 9) out.push({ id: id + "b", kind: "burst", pos: p, size, t: q((f - fi + 1) / 9, 0.11) });
  if (f >= fi && f < fi + 14) out.push({ id: id + "c", kind: "chips", pos: p, size: size * 1.3, t: q((f - fi + 1) / 14, 0.07), seed });
  if (f >= fi + 1 && f < fi + 22) out.push({ id: id + "p", kind: "puff", pos: [p0[0], p0[1] - 0.55, p0[2]], size: size * 1.0, t: q((f - fi) / 22, 0.05), alpha: 0.75 });
};
const walkPhase = (d) => q(d / 1.25, 1 / 24);

// ---------------- shots ----------------
// "Sabke Mann Ki Awaaz Suni!" — 12 shots, one per line of the Hindi script, re-timed to the
// real Kore voiceover (TOTAL 1589f = 52.97 s); shot cuts fall in the pauses between lines.
// Small town, flat ground (progress 0). Thought reveals are shown as a gold burst above the
// thinker's head + Raju's face doing the talking (no on-screen text, ever).
// STAGING RULES (learned from two stills reviews):
//  - PORTRAIT 9:16: vertical fov 40deg => horizontal fov only ~23deg. At 5 m the frame is just
//    ~2 m wide. So NEVER spread two actors across x — stage them along DEPTH (z): one near the
//    camera, one 2-2.5 m behind, both within ~0.8 m of the camera's look axis.
//  - Every actor and camera stays in the OPEN LANE (|x| <= 4). Never stage against a house wall —
//    the houses are tall and their walls swallow the frame.
const SHOTS = [];
const shot = (id, a, b, fn) => SHOTS.push({ id, a, b, fn });

// Lane positions: home (z 92), shop (z 79), school (z 63), market (z 50), dog spot (z 87.5).
// Second actor in each two-shot stands 2-2.5 m BEHIND the first (smaller z), not beside it.

/** a small gold thought-burst above an actor's head at frame fi */
const thought = (fx, id, f, fi, head, size = 0.7) => {
  if (f >= fi && f < fi + 12) fx.push({ id, kind: "burst", pos: pullTo(head), size, t: q((f - fi + 1) / 12, 0.08), col: "#ffe98a" });
};
const head3 = (A, h = 1.6) => [A[0], A[1] + h, A[2]];

// 1 HOOK (L01): Raju near, mother 2 m behind him; her thought hits him — "ye doodh giraega!"
shot("hook", 0, 141, (f) => {
  const p = 0, A = [0.5, ht(0.5, 92, p), 92];
  const M = [-0.8, ht(-0.8, 90, p), 90];
  const cam = camKeys([
    { f: 0, pos: [0.0, 1.7, 97.0], look: [0.2, 1.15, 91.0], fov: 40 },
    { f: 141, pos: [0.0, 1.55, 96.0], look: [0.2, 1.2, 91.0], fov: 38, ease: (t) => smooth(t) },
  ], f);
  CAMNOW = cam;
  const L = LP.morning, mir = mirrorOf(cam, [0, -1]);
  const hit = f >= 100;
  const actors = [
    { id: "raju", kind: "front", outfit: RAJU, pos: [A[0], A[2]], opts: { expr: hit ? "shock" : "neutral", armR: hit ? "temple" : "hang", blink: blinkAt(f, 3), seed: 3, light: lightAng(cam, L, mir), tilt: q(hit ? -3 * Math.sin(Math.min(1, (f - 100) / 12) * Math.PI) : 0, 0.5) } },
    { id: "maa", kind: "front", outfit: MAA, pos: [M[0], M[2]], opts: { expr: "neutral", armR: "pot", pot: true, blink: blinkAt(f, 9), seed: 9, light: -2.1, tilt: q(idle(f, 9).tilt, 0.5) } },
  ];
  const fx = [];
  thought(fx, "th1", f, 100, head3(A, 1.7), 0.6);
  if (f >= 106 && f < 118) fx.push({ id: "th1c", kind: "chips", pos: pullTo(head3(A, 1.7)), size: 0.9, t: q((f - 105) / 12, 0.08), seed: 5 });
  return { cam, L, actors, fx, p, kicks: [{ f: 100, a: 0.014 }], dof: { focus: dist(cam.pos, add3(A, [0, 1.1, 0])), cInf: 9 }, shadow: { c: A, r: 12 } };
});

// 2 SURPRISE (L02): Raju looks around, hands to his head — "mummy to rasoi me thi, phir ye awaaz kahan se aayi?"
shot("surprise", 141, 267, (f) => {
  const p = 0, A = [0.5, ht(0.5, 92, p), 92];
  const M = [-0.8, ht(-0.8, 90, p), 90];
  const cam = camKeys([
    { f: 141, pos: [2.2, 1.5, 95.5], look: [0.2, 1.15, 91.0], fov: 38 },
    { f: 267, pos: [-2.0, 1.6, 95.2], look: [0.2, 1.15, 91.0], fov: 38, ease: (t) => smooth(t) },
  ], f);
  const L = LP.morning, mir = mirrorOf(cam, [0, -1]);
  const look = q(Math.sin((f - 141) * 0.09) * 0.5, 0.1);
  const actors = [
    { id: "raju", kind: "front", outfit: RAJU, pos: [A[0], A[2]], opts: { expr: f < 231 ? "nervous" : "shock", armL: "temple", armR: "temple", blink: blinkAt(f, 3), seed: 3, light: lightAng(cam, L, mir), look, tilt: q(3 * Math.sin((f - 141) * 0.09), 0.5) } },
    { id: "maa", kind: "front", outfit: MAA, pos: [M[0], M[2]], opts: { expr: "smile", armR: "pot", pot: true, blink: blinkAt(f, 9), seed: 9, light: -2.1 } },
  ];
  return { cam, L, actors, fx: [], p, kicks: [], dof: { focus: dist(cam.pos, add3(A, [0, 1.1, 0])), cInf: 9 }, shadow: { c: A, r: 12 } };
});

// 3 REALISE (L03): Raju grins, finger up — "main sabke mann ki awaaz sun sakta hoon!"
shot("realise", 267, 380, (f) => {
  const p = 0, A = [0.9, ht(0.9, 88.5, p), 88.5];
  const cam = camKeys([
    { f: 267, pos: add3(A, [0.4, 1.3, 3.8]), look: add3(A, [0, 1.1, 0]), fov: 36 },
    { f: 380, pos: add3(A, [0.2, 1.15, 2.9]), look: add3(A, [0, 1.15, 0]), fov: 34, ease: (t) => smooth(t) },
  ], f);
  CAMNOW = cam;
  const L = LP.day, mir = mirrorOf(cam, [0, -1]);
  const up = smoother(lin(297, 319, f));
  const actors = [{ id: "raju", kind: "front", outfit: RAJU, pos: [A[0], A[2]], opts: { expr: "grin", armR: up > 0.4 ? "point" : "hang", blink: blinkAt(f, 3), seed: 3, light: lightAng(cam, L, mir), headTilt: q(lerp(0, -4, up), 1) } }];
  const fx = [];
  thought(fx, "th3a", f, 303, head3(A, 1.75), 0.5);
  thought(fx, "th3b", f, 339, head3(A, 1.9), 0.45);
  thought(fx, "th3c", f, 375, head3(A, 1.75), 0.5);
  return { cam, L, actors, fx, p, kicks: [{ f: 303, a: 0.01 }], dof: { focus: dist(cam.pos, add3(A, [0, 1.1, 0])), cInf: 9 }, shadow: { c: A, r: 10 } };
});

// 4 SHOP (L04): Raju near, shopkeeper 2.5 m behind him, slyly counting — "is bachche se das rupaye zyada loonga"
shot("shop", 380, 519, (f) => {
  const p = 0, S = [-0.3, ht(-0.3, 80.5, p), 80.5];
  const K = [0.6, ht(0.6, 78, p), 78];
  const cam = camKeys([
    { f: 380, pos: [0.0, 1.6, 85.5], look: [0.2, 1.2, 79.0], fov: 38 },
    { f: 519, pos: [0.0, 1.55, 84.8], look: [0.2, 1.2, 79.0], fov: 37, ease: (t) => smooth(t) },
  ], f);
  CAMNOW = cam;
  const L = LP.day, mir = mirrorOf(cam, [0, -1]);
  const sly = f >= 446;
  const actors = [
    { id: "dukandaar", kind: "front", outfit: DUKANDAAR, pos: [K[0], K[2]], opts: { expr: sly ? "grin" : "smile", armL: "hip", armR: sly ? "belly" : "hang", blink: blinkAt(f, 7), seed: 7, light: -2.2, tilt: q(sly ? 2 * Math.sin(f * 0.12) : 0, 0.5) } },
    { id: "raju", kind: "front", outfit: RAJU, pos: [S[0], S[2]], opts: { expr: f < 450 ? "nervous" : "smile", armR: "temple", blink: blinkAt(f, 3), seed: 3, light: lightAng(cam, L, mir), look: q(0.4, 0.1) } },
  ];
  const fx = [];
  thought(fx, "th4", f, 446, head3(K, 2.1), 0.6);
  fx.push({ id: "pot1", kind: "pot", pos: add3(K, [-0.9, 0, 0.9]), size: 0.55, rot: 0.3 });
  fx.push({ id: "pot2", kind: "pot", pos: add3(K, [0.9, 0, 0.8]), size: 0.5, rot: -0.4 });
  return { cam, L, actors, fx, p, kicks: [{ f: 446, a: 0.01 }], dof: { focus: dist(cam.pos, add3(S, [0.2, 1.2, 0])), cInf: 9 }, shadow: { c: [0.2, 0, 79], r: 12 } };
});

// 5 CATCH (L05): Raju laughs and points back at the shopkeeper — "chacha, das rupaye zyada mat lena!"
shot("catch", 519, 679, (f) => {
  const p = 0, S = [-0.3, ht(-0.3, 80.5, p), 80.5];
  const K = [0.6, ht(0.6, 78, p), 78];
  const cam = camKeys([
    { f: 519, pos: [0.0, 1.5, 85.0], look: [0.2, 1.25, 79.0], fov: 36 },
    { f: 679, pos: [0.0, 1.45, 84.2], look: [0.2, 1.3, 79.0], fov: 35, ease: (t) => smooth(t) },
  ], f);
  CAMNOW = cam;
  const L = LP.day, mir = mirrorOf(cam, [0, -1]);
  const laugh = f >= 526;
  const bounce = (s) => (laugh ? q(3 * Math.sin((f - 526) * 1.0 + s), 1) : 0);
  const kb = laugh ? lerp(0, -0.4, smooth(lin(526, 546, f))) : 0;
  const actors = [
    { id: "raju", kind: "front", outfit: RAJU, pos: [S[0], S[2]], opts: { expr: laugh ? "laugh" : "grin", armL: laugh ? "belly" : "hang", armR: "point", blink: blinkAt(f, 3), seed: 3, light: lightAng(cam, L, mir), tilt: bounce(1), bob: laugh ? q(Math.abs(Math.sin((f - 526) * 0.5)) * -4, 1) : 0 } },
    { id: "dukandaar", kind: "front", outfit: DUKANDAAR, pos: [K[0] + kb, K[2]], opts: { expr: laugh ? "shock" : "grin", armL: laugh ? "up" : "hip", armR: laugh ? "up" : "hang", blink: blinkAt(f, 7), seed: 7, light: -2.2, tilt: q(laugh ? -4 : 0, 0.5) } },
  ];
  const fx = [];
  thought(fx, "th5", f, 526, head3(K, 2.1), 0.7);
  fx.push({ id: "pot1", kind: "pot", pos: add3(K, [-0.9, 0, 0.9]), size: 0.55, rot: 0.3 });
  return { cam, L, actors, fx, p, kicks: [{ f: 526, a: 0.016 }], dof: { focus: dist(cam.pos, add3(S, [0.2, 1.2, 0])), cInf: 9 }, shadow: { c: [0.2, 0, 79], r: 12 } };
});

// 6 TEACHER (L06): Raju near, teacher 2.5 m behind pointing at him — "aaj isko fail kar doonga!"
shot("teacher", 679, 790, (f) => {
  const p = 0, C = [-0.3, ht(-0.3, 64.5, p), 64.5];
  const T = [0.6, ht(0.6, 62, p), 62];
  const cam = camKeys([
    { f: 679, pos: [0.0, 1.6, 69.5], look: [0.2, 1.3, 63.0], fov: 38 },
    { f: 790, pos: [0.0, 1.55, 68.8], look: [0.2, 1.3, 63.0], fov: 37, ease: (t) => smooth(t) },
  ], f);
  CAMNOW = cam;
  const L = LP.day, mir = mirrorOf(cam, [0, -1]);
  const stern = f >= 742;
  const actors = [
    { id: "teacher", kind: "front", outfit: TEACHER, pos: [T[0], T[2]], opts: { expr: stern ? "stern" : "neutral", armR: stern ? "point" : "hang", armL: "hip", blink: blinkAt(f, 11), seed: 11, light: -2.2 } },
    { id: "raju", kind: "front", outfit: RAJU, pos: [C[0], C[2]], opts: { expr: stern ? "nervous" : "neutral", armL: "hang", armR: "hang", blink: blinkAt(f, 3), seed: 3, light: lightAng(cam, L, mir), tilt: q(stern ? 2 : 0, 0.5) } },
  ];
  const fx = [];
  thought(fx, "th6", f, 742, head3(T, 2.1), 0.6);
  return { cam, L, actors, fx, p, kicks: [{ f: 742, a: 0.01 }], dof: { focus: dist(cam.pos, add3(C, [0.2, 1.2, 0])), cInf: 9 }, shadow: { c: [0.2, 0, 63], r: 12 } };
});

// 7 PANIC (L07): tight close-up on Raju — "meri to jaan hi nikal gayi!"
shot("panic", 790, 837, (f) => {
  const p = 0, A = [-1.0, ht(-1.0, 64.5, p), 64.5];
  const cam = camKeys([
    { f: 790, pos: add3(A, [0.5, 1.35, 3.0]), look: add3(A, [0, 1.15, 0]), fov: 34 },
    { f: 837, pos: add3(A, [0.3, 1.3, 2.3]), look: add3(A, [0, 1.18, 0]), fov: 32, ease: (t) => smooth(t) },
  ], f);
  const L = LP.day, mir = mirrorOf(cam, [0, -1]);
  const actors = [{ id: "raju", kind: "front", outfit: RAJU, pos: [A[0], A[2]], opts: { expr: f < 880 ? "nervous" : "shock", armL: "temple", armR: "temple", blink: blinkAt(f, 3), seed: 3, light: lightAng(cam, L, mir), look: q(Math.sin((f - 790) * 0.12) * 0.45, 0.1), tilt: q(4 * Math.sin((f - 790) * 0.12), 0.5) } }];
  return { cam, L, actors, fx: [], p, kicks: [{ f: 820, a: 0.012 }], dof: { focus: dist(cam.pos, add3(A, [0, 1.15, 0])), cInf: 6 }, shadow: { c: A, r: 8 } };
});

// 8 GIRL (L08): Raju near, Seema 2 m behind giggling and pointing at his hair — "Raju ke baal aaj kitne ajeeb lag rahe hain!"
shot("girl", 837, 957, (f) => {
  const p = 0, C = [-0.3, ht(-0.3, 64.5, p), 64.5];
  const G = [0.6, ht(0.6, 62.5, p), 62.5];
  const cam = camKeys([
    { f: 837, pos: [0.0, 1.6, 69.5], look: [0.2, 1.25, 63.5], fov: 38 },
    { f: 957, pos: [0.0, 1.5, 68.8], look: [0.2, 1.25, 63.5], fov: 37, ease: (t) => smooth(t) },
  ], f);
  CAMNOW = cam;
  const L = LP.day, mir = mirrorOf(cam, [0, -1]);
  const giggle = f >= 886;
  const bounce = (s) => (giggle ? q(3 * Math.sin((f - 886) * 1.0 + s), 1) : 0);
  const actors = [
    { id: "seema", kind: "front", outfit: SEEMA, pos: [G[0], G[2]], opts: { expr: giggle ? "laugh" : "grin", armL: giggle ? "belly" : "hang", armR: "point", blink: blinkAt(f, 13), seed: 13, light: -2.2, tilt: bounce(1) } },
    { id: "raju", kind: "front", outfit: RAJU, pos: [C[0], C[2]], opts: { expr: "nervous", armR: "chin", blink: blinkAt(f, 3), seed: 3, light: lightAng(cam, L, mir), headTilt: q(6, 1), look: q(-0.3, 0.1) } },
  ];
  const fx = [];
  thought(fx, "th8", f, 886, head3(G, 1.7), 0.5);
  return { cam, L, actors, fx, p, kicks: [{ f: 886, a: 0.01 }], dof: { focus: dist(cam.pos, add3(C, [0.2, 1.2, 0])), cInf: 9 }, shadow: { c: [0.2, 0, 63], r: 12 } };
});

// 9 FATHER (L09): Raju near; father and mother 2 m behind, father slyly hiding money — "paise kahan chhupaun, mummy ko na mile"
shot("father", 957, 1078, (f) => {
  const p = 0, H = [0, ht(0, 90.5, p), 90.5];
  const P = [0.8, ht(0.8, 88.5, p), 88.5];
  const M = [-0.8, ht(-0.8, 88.5, p), 88.5];
  const cam = camKeys([
    { f: 957, pos: [0.0, 1.7, 95.5], look: [0.0, 1.25, 89.5], fov: 38 },
    { f: 1078, pos: [0.0, 1.6, 94.8], look: [0.0, 1.3, 89.5], fov: 37, ease: (t) => smooth(t) },
  ], f);
  CAMNOW = cam;
  const L = LP.day, mir = mirrorOf(cam, [0, -1]);
  const sly = f >= 1008;
  const actors = [
    { id: "pitaji", kind: "front", outfit: PITAJI, pos: [P[0], P[2]], opts: { expr: sly ? "grin" : "neutral", armL: "hip", armR: sly ? "temple" : "hang", blink: blinkAt(f, 15), seed: 15, light: -2.2 } },
    { id: "maa", kind: "front", outfit: MAA, pos: [M[0], M[2]], opts: { expr: "stern", armL: "hip", armR: "hip", blink: blinkAt(f, 9), seed: 9, light: -2.1 } },
    { id: "raju", kind: "front", outfit: RAJU, pos: [H[0], H[2]], opts: { expr: sly ? "grin" : "smile", armR: "chin", blink: blinkAt(f, 3), seed: 3, light: lightAng(cam, L, mir), look: q(-0.6, 0.1) } },
  ];
  const fx = [];
  thought(fx, "th9", f, 1008, head3(P, 2.1), 0.6);
  fx.push({ id: "pot1", kind: "pot", pos: add3(P, [0.9, 0, 0.7]), size: 0.5, rot: 0.5 });
  return { cam, L, actors, fx, p, kicks: [{ f: 1008, a: 0.01 }], dof: { focus: dist(cam.pos, add3(H, [0, 1.2, 0.5])), cInf: 9 }, shadow: { c: [0, 0, 90], r: 12 } };
});

// 10 MARKET CHAOS (L10): camera 8 m back; Raju centre, five villagers tight around him (±1.2 m) — a hundred thoughts at once
shot("market", 1078, 1234, (f) => {
  const p = 0, A = [0.4, ht(0.4, 50, p), 50];
  const cam = camKeys([
    { f: 1078, pos: [0.4, 1.9, 58.0], look: [0.4, 1.3, 50.0], fov: 44 },
    { f: 1234, pos: [0.4, 1.9, 58.0], look: [0.4, 1.3, 50.0], fov: 44, ease: (t) => smooth(t) },
  ], f);
  CAMNOW = cam;
  const L = LP.day, mir = mirrorOf(cam, [0, -1]);
  const spin = Math.sin((f - 1078) * 0.09);
  const crowd = [[VIL_1, -1.2, 48.5, 7], [VIL_2, 1.2, 48.5, 9], [VIL_3, -1.2, 51.5, 11], [VIL_4, 1.2, 51.5, 13], [VIL_5, 0.4, 47.5, 15]];
  const actors = crowd.map(([o, x, z, seed], i) => {
    const P = [x, ht(x, z, p), z];
    return { id: "c" + i, kind: "front", outfit: o, pos: [P[0], P[2]], opts: { expr: i % 2 ? "grin" : "smile", armL: i % 3 === 0 ? "hip" : "hang", armR: i % 2 ? "point" : "hang", blink: blinkAt(f, seed), seed, light: -2.2, tilt: q(2 * Math.sin(f * 0.1 + i), 0.5) } };
  });
  actors.push({ id: "raju", kind: "front", outfit: RAJU, pos: [A[0], A[2]], opts: { expr: "dazed", armL: "temple", armR: "temple", blink: blinkAt(f, 3), seed: 3, light: lightAng(cam, L, mir), tilt: q(4 * spin, 0.5), look: q(0.3 * spin, 0.1) } });
  const fx = [];
  crowd.forEach(([o, x, z], i) => {
    const P = [x, ht(x, z, p), z];
    thought(fx, "thm" + i, f, 1102 + i * 18, head3(P, 2.0), 0.45);
  });
  thought(fx, "thmR", f, 1138, head3(A, 1.7), 0.6);
  return { cam, L, actors, fx, p, kicks: [{ f: 1132, a: 0.012 }], dof: { focus: dist(cam.pos, add3(A, [0, 1.2, 0])), cInf: 10 }, shadow: { c: [0.4, 0, 50], r: 14 } };
});

// 11 DOG (L11): Raju near-left, dog 1.5 m behind-right by the food basket — "bas khana, khana, khana!"
shot("dog", 1234, 1343, (f) => {
  const p = 0, D = [0.8, ht(0.8, 87, p), 87];
  const A = [-0.6, ht(-0.6, 88.5, p), 88.5];
  const cam = camKeys([
    { f: 1234, pos: [0.0, 1.2, 93.0], look: [0.0, 0.8, 87.8], fov: 40 },
    { f: 1343, pos: [-0.2, 1.1, 92.5], look: [0.0, 0.85, 87.8], fov: 39, ease: (t) => smooth(t) },
  ], f);
  CAMNOW = cam;
  const L = LP.day, mir = mirrorOf(cam, [0, -1]);
  const laugh = f >= 1288;
  const actors = [
    { id: "raju", kind: "front", outfit: RAJU, pos: [A[0], A[2]], opts: { expr: laugh ? "laugh" : "grin", armL: laugh ? "belly" : "hang", armR: "point", blink: blinkAt(f, 3), seed: 3, light: lightAng(cam, L, mir), tilt: laugh ? q(3 * Math.sin((f - 1288) * 1.0), 1) : 0 } },
  ];
  const fx = [];
  thought(fx, "th11", f, 1288, [D[0], D[1] + 1.5, D[2]], 0.5);
  fx.push({ id: "basket", kind: "pot", pos: add3(D, [-0.85, 0, 0.4]), size: 0.55, rot: 0.2 });
  return { cam, L, actors, fx, p, world: { dog: { pos: [D[0], D[1], D[2]], rotY: 0.15, wag: true } }, kicks: [{ f: 1288, a: 0.012 }], dof: { focus: dist(cam.pos, add3(D, [-0.3, 0.7, 0])), cInf: 8 }, shadow: { c: [0, 0, 87.5], r: 10 } };
});

// 12 PAYOFF (L12): golden light — Raju walks home, relieved; mother waves from the lane edge; the dog follows.
shot("payoff", 1343, 1589, (f) => {
  const p = 0, t = (f - 1343) / 30;
  const z0 = 84, z1 = 88.5, z = lerp(z0, z1, lin(1343, 1463, f));
  const A = [-1.0, ht(-1.0, z, p), z];
  const M = [-1.6, ht(-1.6, 90.5, p), 90.5];
  const D = [-2.0, ht(-2.0, z - 2.2, p), z - 2.2];
  const cam = camKeys([
    { f: 1343, pos: add3(A, [1.6, 1.5, 4.6]), look: add3(A, [0, 1.15, 0]), fov: 38 },
    { f: 1463, pos: add3(A, [1.3, 1.4, 4.0]), look: add3(A, [0, 1.2, 0]), fov: 37, ease: (t) => smooth(t) },
    { f: 1589, pos: add3(A, [2.0, 2.6, 8.0]), look: add3(A, [0, 1.2, 0]), fov: 40, ease: easeInOut, path: [[-3.5, 2.2, 96]] },
  ], f);
  CAMNOW = cam;
  const L = LP.golden, mir = mirrorOf(cam, [0, -1]);
  const actors = [
    { id: "raju", kind: "side", outfit: RAJU, pos: [A[0], A[2]], dir: [0, 1], opts: { mode: "walk", phase: walkPhase(z - z0), expr: "relief_open", blink: blinkAt(f, 3), seed: 3, light: lightAng(cam, L, mir) } },
    { id: "maa", kind: "front", outfit: MAA, pos: [M[0], M[2]], opts: { expr: "smile", armR: "up", blink: blinkAt(f, 9), seed: 9, light: -2.1, tilt: q(idle(f, 9).tilt, 0.5) } },
  ];
  const fx = [];
  for (let i = 0; i < 3; i++) fx.push({ id: "bird" + i, kind: "bird", pos: [-30 + (f - 1343) * 0.4 + i * 3, 22 + i * 2 + Math.sin(f * 0.06 + i) * 1.2, 60 - i * 4], size: 1.4, t: q(((f * 0.09 + i * 0.25) % 1), 0.125) });
  return { cam, L, actors, fx, p, world: { dog: { pos: [D[0], D[1], D[2]], rotY: 0.35, wag: true } }, kicks: [], dof: { focus: dist(cam.pos, add3(A, [0, 1.2, 0])), cInf: 12 }, shadow: { c: A, r: 12 } };
});


export const SHOTLIST = SHOTS.map((s) => ({ id: s.id, a: s.a, b: s.b }));
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f < s.b) || SHOTS[SHOTS.length - 1];

export const frameState = (f) => {
  const s = shotAt(f), r = s.fn(f);
  const cam = { ...r.cam, pos: [...r.cam.pos], look: [...r.cam.look] };
  // creeping push on every frame (no static holds) and impact kicks
  const [kx, ky] = kick(f, r.kicks || []);
  if (kx || ky) {
    const d = dist(cam.pos, cam.look), R = camRight(cam), U = camUp(cam);
    cam.look = add3(cam.look, [R[0] * kx * d + U[0] * ky * d, R[1] * kx * d + U[1] * ky * d, R[2] * kx * d + U[2] * ky * d]);
  }
  const world = { progress: r.p ?? 0, slab: null, plug: null, short: false, ...(r.world || {}) };
  return { shot: s.id, cam, light: r.L, actors: r.actors || [], fx: r.fx || [], world, flash: r.flash || 0, vign: r.vign ?? 0.18, dof: r.dof, shadow: r.shadow };
};
