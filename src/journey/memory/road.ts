import { TOTAL_SCREENS, segmentStart } from "../timeline";

// A cartoon meadow with a winding dirt path, seen from just behind Eduardo. Depth is in world units; one journey
// screen walks UNITS of it. The camera follows the path sideways, so it always starts under his feet.
export const HORIZON = 0.42; // of the canvas height: where the path vanishes
const UNITS = 6;
const NEAR = 1; // depth at the bottom edge of the screen
const FAR = 40;
const PATH = 0.2; // path half-width, as a fraction of the screen width at the bottom edge
const SIGHT = 8; // how far ahead the snow shows: farther would paint the horizon white in mid-Portugal

// Sweden starts with Jönköping: the snow line and the pines begin there, so you see them coming down the path.
const SNOW_AT = segmentStart("jonkoping") * UNITS;

const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(Math.max((v - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

/** 0 on Portuguese grass, 1 on Swedish snow, for a point at this depth. */
export function snowAt(depth: number): number {
  return smooth(SNOW_AT - 1.5, SNOW_AT + 1.5, depth);
}

/** The path's centre (world x) at a depth: a slow S-bend. */
export function pathX(d: number): number {
  return 0.55 * Math.sin(d * 0.32) + 0.25 * Math.sin(d * 0.11 + 1);
}

const rand = (i: number) => {
  const v = Math.sin(i * 12.9898) * 43758.5453;
  return v - Math.floor(v);
};
const LENGTH = TOTAL_SCREENS * UNITS + FAR;

export type Tree = { d: number; x: number; size: number; kind: "broadleaf" | "pine" };

/** Trees on both sides, clear of the path, fixed so the same tree is always in the same place. */
export const TREES: Tree[] = Array.from({ length: Math.ceil((LENGTH / 1.3) * 2) }, (_, i) => {
  const d = Math.floor(i / 2) * 1.3 + rand(i) * 0.9;
  const side = i % 2 ? 1 : -1;
  return {
    d,
    x: pathX(d) + side * (PATH + 0.28 + rand(i + 0.5) * 0.7),
    size: 0.26 + rand(i + 0.25) * 0.16,
    kind: d < SNOW_AT ? "broadleaf" : "pine",
  };
});

// Grass tufts along the path's edges and flowers in the meadow (Portugal only), like the trees fixed in place.
const TUFTS = Array.from({ length: Math.ceil(LENGTH / 0.45) * 2 }, (_, i) => {
  const d = Math.floor(i / 2) * 0.45 + rand(i + 0.7) * 0.3;
  return { d, x: pathX(d) + (i % 2 ? 1 : -1) * PATH * (1.05 + rand(i + 0.1) * 0.4) };
});
const FLOWERS = Array.from({ length: Math.ceil(SNOW_AT / 0.3) }, (_, i) => {
  const d = i * 0.3 + rand(i + 0.3) * 0.3;
  return { d, x: pathX(d) + (rand(i + 0.9) > 0.5 ? 1 : -1) * (PATH + 0.1 + rand(i + 0.6) * 0.9), white: rand(i) > 0.4 };
});

type RGB = [number, number, number];
const hex = (c: string): RGB => [0, 1, 2].map((k) => parseInt(c.slice(1 + k * 2, 3 + k * 2), 16)) as RGB;
const lerp = (a: RGB, b: RGB, t: number): RGB => a.map((v, k) => v + (b[k] - v) * t) as RGB;
const css = (c: RGB, a = 1) => `rgba(${c.map(Math.round).join(",")},${a})`;
const mix = (a: string, b: string, t: number) => css(lerp(hex(a), hex(b), t));

const GRASS_FAR = hex("#b5e06e");
const GRASS_NEAR = hex("#5aae38");
const SNOW_FAR = hex("#f8fbfd");
const SNOW_NEAR = hex("#e3ecf4");

// Clouds sit in screen space and drift a little as he walks: [x, y, size] as fractions of the screen.
const CLOUDS: [number, number, number][] = [
  [0.1, 0.2, 0.17],
  [0.42, 0.13, 0.1],
  [0.68, 0.26, 0.13],
  [0.95, 0.15, 0.18],
  [1.25, 0.3, 0.11],
];

/** Generated art (tools/road/make-sprites.mjs) drawn in place of the scene's own shapes, once loaded. */
export const SPRITES = [
  "tree",
  "pine",
  "cloud",
  "grass",
  "mountains-pt",
  "mountains-se",
  "ground",
  "snow",
  "dirt",
  "snow-path",
  "sky-pt",
  "sky-se",
] as const;
export type Sprites = Partial<Record<(typeof SPRITES)[number], HTMLImageElement>>;
const loaded = (im?: HTMLImageElement) => (im?.complete && im.naturalWidth > 0 ? im : undefined);
const patterns = new WeakMap<HTMLImageElement, CanvasPattern | null>();
const pattern = (ctx: CanvasRenderingContext2D, im?: HTMLImageElement) => {
  const ok = loaded(im);
  if (!ok) return undefined;
  if (!patterns.has(ok)) patterns.set(ok, ctx.createPattern(ok, "repeat"));
  return patterns.get(ok) ?? undefined;
};

/** Draws the scene for a journey position s (screens). */
export function drawRoad(ctx: CanvasRenderingContext2D, w: number, h: number, s: number, sprites: Sprites = {}): void {
  const cam = s * UNITS;
  const camX = pathX(cam + NEAR);
  const hy = h * HORIZON;
  const project = (x: number, d: number) => {
    const f = NEAR / Math.max(d - cam, 0.05);
    return { x: w / 2 + (x - camX) * f * w, y: hy + (h - hy) * f, f };
  };
  const winter = snowAt(cam + SIGHT / 2); // the sky turns a little ahead of the ground
  const pan = -camX * w * 0.04; // far scenery shifts a little as the path bends

  const sky = ctx.createLinearGradient(0, 0, 0, hy);
  sky.addColorStop(0, mix("#2b9be8", "#7fb0dc", winter));
  sky.addColorStop(1, mix("#bfe7fb", "#e6eef6", winter));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, hy + 1);
  for (const [im, a] of [[loaded(sprites["sky-pt"]), 1 - winter], [loaded(sprites["sky-se"]), winter]] as const) {
    if (!im || a <= 0) continue;
    const k = Math.max(w / im.naturalWidth, (hy + 1) / im.naturalHeight); // cover the sky, anchored at the horizon
    ctx.globalAlpha = a;
    ctx.drawImage(im, (w - im.naturalWidth * k) / 2, hy + 1 - im.naturalHeight * k, im.naturalWidth * k, im.naturalHeight * k);
  }
  ctx.globalAlpha = 1;

  const span = w * 1.5;
  for (const [cx, cy, size] of CLOUDS) {
    const x = ((((cx * w + s * w * 0.04 + pan) % span) + span) % span) - w * 0.2;
    const im = loaded(sprites.cloud);
    if (im) ctx.drawImage(im, x - size * h * 1.1, cy * h - size * h * 0.7, size * h * 2.2, (size * h * 2.2 * im.naturalHeight) / im.naturalWidth);
    else cloud(ctx, x, cy * h, size * h, winter);
  }

  const pt = loaded(sprites["mountains-pt"]);
  const se = loaded(sprites["mountains-se"]);
  if (pt || se) {
    // Portugal's range fades into Sweden's snowy one; whichever is missing, the other stands in.
    for (const [im, a] of [[pt ?? se!, 1 - winter], [se ?? pt!, winter]] as const) {
      if (a <= 0) continue;
      const mh = hy * 0.42; // leaves sky above them; repeated sideways to fill the width
      const mw = (mh * im.naturalWidth) / im.naturalHeight;
      ctx.globalAlpha = a;
      // Every other copy is mirrored, so neighbours meet at matching edges instead of a seam.
      for (let x = (((pan * 0.5) % (2 * mw)) - 2 * mw), k = 0; x < w; x += mw, k++) {
        ctx.save();
        ctx.translate(x + (k % 2) * mw, 0);
        ctx.scale(k % 2 ? -1 : 1, 1);
        ctx.drawImage(im, 0, hy + h * 0.01 - mh, mw, mh);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  } else {
    mountains(ctx, w, hy, h, pan * 0.5, winter);
    // Two rows of rolling hills over the horizon, lighter behind. The mountain art has its own foothills.
    hills(ctx, w, hy, h * 0.07, pan * 0.8, 5.3, mix("#9fd468", "#e9f0f6", snowAt(cam + SIGHT)));
    hills(ctx, w, hy, h * 0.035, pan, 8.1, mix("#86c653", "#dde7f0", snowAt(cam + SIGHT)));
  }

  // Meadow in strips, each coloured for its depth, so the snow line comes towards him.
  const STRIPS = 90;
  const grass = pattern(ctx, sprites.ground);
  const snowTex = pattern(ctx, sprites.snow);
  const groundTex = grass || snowTex;
  for (let i = 0; i < (groundTex ? 0 : STRIPS); i++) {
    const y0 = hy + ((h - hy) * i) / STRIPS;
    const f = (i + 0.5) / STRIPS;
    const t = Math.sqrt(f);
    ctx.fillStyle = css(lerp(lerp(GRASS_FAR, GRASS_NEAR, t), lerp(SNOW_FAR, SNOW_NEAR, t), snowAt(cam + Math.min(NEAR / f, SIGHT))));
    ctx.fillRect(0, y0, w, (h - hy) / STRIPS + 1);
  }

  if (groundTex) {
    const view = { w, h, hy, cam, camX };
    perspective(ctx, view, grass ?? snowTex!, 1.6, (d) => (grass ? 1 : 0) * (snowTex ? 1 - snowAt(Math.min(d, cam + SIGHT)) : 1));
    if (snowTex) perspective(ctx, view, snowTex, 1.6, (d) => snowAt(Math.min(d, cam + SIGHT)));
  }

  // The path: a darker rim, the dirt, then a lighter worn strip down the middle. Snow-packed in Sweden.
  const pathWinter = snowAt(cam + SIGHT / 2);
  const dirt = pattern(ctx, sprites.dirt);
  const snowPath = pattern(ctx, sprites["snow-path"]);
  if (!dirt && !snowPath) drawPath(ctx, project, cam, PATH * 1.12, mix("#c08a4f", "#b8c6d4", pathWinter));
  if (dirt || snowPath) {
    ctx.save();
    pathShape(ctx, project, cam, PATH);
    ctx.clip();
    const view = { w, h, hy, cam, camX };
    perspective(ctx, view, dirt ?? snowPath!, 0.8, (d) => (dirt ? 1 : 0) * (snowPath ? 1 - snowAt(d) : 1));
    if (snowPath) perspective(ctx, view, snowPath, 0.8, (d) => snowAt(d));
    ctx.restore();
  } else {
    drawPath(ctx, project, cam, PATH, mix("#e2b57a", "#d7e0ea", pathWinter));
    drawPath(ctx, project, cam, PATH * 0.35, mix("#f0d3a0", "#eaf0f6", pathWinter));
  }

  if (groundTex) {
    // Haze across the horizon: it blends the mountains' foot into the ground and hides the far textures, which get
    // too fine to read and would shimmer as he walks.
    const top = hy - h * 0.04;
    const bottom = hy + (h - hy) * 0.1;
    const haze = ctx.createLinearGradient(0, top, 0, bottom);
    const tone = lerp(hex("#d4e4ec"), hex("#eef3f8"), winter);
    haze.addColorStop(0, css(tone, 0));
    haze.addColorStop((hy - top) / (bottom - top), css(tone, 0.55));
    haze.addColorStop(1, css(tone, 0));
    ctx.fillStyle = haze;
    ctx.fillRect(0, top, w, bottom - top);
  }

  for (const fl of groundTex ? [] : FLOWERS) {
    const dz = fl.d - cam;
    if (dz < 0.4 || dz > 14) continue;
    const p = project(fl.x, fl.d);
    const r = 0.012 * p.f * w;
    if (r < 0.6) continue;
    ctx.fillStyle = fl.white ? "#ffffff" : "#ffe066";
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.arc(p.x + Math.cos(k * 1.57) * r, p.y - r + Math.sin(k * 1.57) * r, r * 0.8, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = "#f2a422";
    ctx.beginPath();
    ctx.arc(p.x, p.y - r, r * 0.6, 0, 7);
    ctx.fill();
  }

  for (const t of TUFTS) {
    const dz = t.d - cam;
    if (dz < 0.3 || dz > 16) continue;
    const p = project(t.x, t.d);
    const H = 0.05 * p.f * w;
    if (H < 1) continue;
    const snow = snowAt(t.d);
    if (snow >= 1) continue; // buried
    ctx.globalAlpha = 1 - snow;
    const clump = loaded(sprites.grass);
    if (clump) {
      const gh = H * 2.4;
      const gw = (gh * clump.naturalWidth) / clump.naturalHeight;
      ctx.drawImage(clump, p.x - gw / 2, p.y - gh * 0.92, gw, gh);
      continue;
    }
    ctx.fillStyle = "#3f8f2a";
    ctx.beginPath();
    for (const [dx, lean, k] of [[-0.35, -0.5, 0.7], [0, 0.1, 1], [0.35, 0.5, 0.75]]) {
      ctx.moveTo(p.x + dx * H - H * 0.12, p.y);
      ctx.quadraticCurveTo(p.x + dx * H, p.y - H * k * 0.6, p.x + (dx + lean * 0.5) * H, p.y - H * k);
      ctx.quadraticCurveTo(p.x + dx * H + H * 0.05, p.y - H * k * 0.5, p.x + dx * H + H * 0.12, p.y);
    }
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Far to near, so nearer trees cover farther ones.
  for (let i = TREES.length - 1; i >= 0; i--) {
    const t = TREES[i];
    const dz = t.d - cam;
    if (dz < 0.3 || dz > FAR) continue;
    const p = project(t.x, t.d);
    const H = t.size * p.f * w;
    if (H < 1.5) continue;
    ctx.globalAlpha = Math.min((FAR - dz) / 6, 1); // fade in at the far end instead of popping
    const im = loaded(t.kind === "pine" ? sprites.pine : sprites.tree);
    if (!im) {
      ctx.fillStyle = "rgba(30, 60, 20, 0.18)"; // the sprites bring their own shadow
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, H * 0.32, H * 0.06, 0, 0, 7);
      ctx.fill();
    }
    if (im) {
      const th = H * 1.1;
      const tw = (th * im.naturalWidth) / im.naturalHeight;
      ctx.save();
      ctx.translate(p.x, p.y);
      if (i % 2) ctx.scale(-1, 1); // mirror every other tree so the same sprite doesn't repeat
      ctx.drawImage(im, -tw / 2, -th, tw, th);
      ctx.restore();
    } else if (t.kind === "pine") drawPine(ctx, p.x, p.y, H);
    else drawBroadleaf(ctx, p.x, p.y, H, i);
  }
  ctx.globalAlpha = 1;
}

type Project = (x: number, d: number) => { x: number; y: number; f: number };
type View = { w: number; h: number; hy: number; cam: number; camX: number };

/**
 * Lays a repeating texture flat on the ground in perspective, one thin screen row at a time: each row is a single
 * depth, so the texture is scaled to that depth's width and squashed to the depth range the row covers.
 * tile: world units one texture repeat spans. alpha(d): how much of it shows at depth d.
 */
function perspective(ctx: CanvasRenderingContext2D, v: View, tex: CanvasPattern, tile: number, alpha: (d: number) => number) {
  const step = Math.max(2, Math.round(v.h / 360));
  const T = 512 / tile; // texture px per world unit (textures are 512px, tools/road/make-sprites.mjs)
  for (let y0 = v.hy + 1; y0 < v.h; y0 += step) {
    const y1 = Math.min(y0 + step, v.h);
    const f0 = (y0 - v.hy) / (v.h - v.hy);
    const f1 = (y1 - v.hy) / (v.h - v.hy);
    const d0 = v.cam + NEAR / f0; // far edge of the row
    const d1 = v.cam + NEAR / f1; // near edge
    const a = alpha((d0 + d1) / 2);
    if (a <= 0.01) continue;
    const f = (f0 + f1) / 2;
    const sx = (f * v.w) / T;
    const sy = -(y1 - y0) / ((d0 - d1) * T);
    tex.setTransform(new DOMMatrix([sx, 0, 0, sy, v.w / 2 - v.camX * f * v.w, y1 - sy * d1 * T]));
    ctx.globalAlpha = a;
    ctx.fillStyle = tex;
    ctx.fillRect(0, y0, v.w, y1 - y0 + 0.5);
  }
  ctx.globalAlpha = 1;
}

function drawPath(ctx: CanvasRenderingContext2D, project: Project, cam: number, half: number, color: string) {
  ctx.fillStyle = color;
  pathShape(ctx, project, cam, half);
  ctx.fill();
}

function pathShape(ctx: CanvasRenderingContext2D, project: Project, cam: number, half: number) {
  const N = 60;
  const left: { x: number; y: number }[] = [];
  const right: { x: number; y: number }[] = [];
  for (let i = 0; i <= N; i++) {
    const d = cam + 0.3 * (FAR / 0.3) ** (i / N); // denser near him, where the bends are big on screen
    left.push(project(pathX(d) - half, d));
    right.push(project(pathX(d) + half, d));
  }
  ctx.beginPath();
  left.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  for (let i = N; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
  ctx.closePath();
}

function cloud(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, winter: number) {
  const puffs: [number, number, number][] = [
    [-0.5, 0, 0.3],
    [-0.15, -0.2, 0.42],
    [0.25, -0.1, 0.36],
    [0.55, 0.03, 0.26],
  ];
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - size, y - size, size * 2, size * 1.1); // a flat bottom
  ctx.clip();
  for (const [color, lift] of [[mix("#d6e9f7", "#c9d5e0", winter), 0], ["#ffffff", 0.07]] as const) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (const [dx, dy, r] of puffs) {
      ctx.moveTo(x + dx * size + r * size, y + (dy - lift) * size);
      ctx.arc(x + dx * size, y + (dy - lift) * size, r * size, 0, 7);
    }
    ctx.fill();
  }
  ctx.restore();
}

function mountains(ctx: CanvasRenderingContext2D, w: number, hy: number, h: number, pan: number, winter: number) {
  const peaks: [number, number][] = [
    [0.08, 0.13],
    [0.3, 0.19],
    [0.52, 0.12],
    [0.74, 0.21],
    [0.97, 0.14],
  ];
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-w * 0.2, hy);
  for (const [px, ph] of peaks) {
    const x = px * w + pan;
    const top = hy - ph * h;
    ctx.lineTo(x - ph * h * 1.1, hy - ph * h * 0.25);
    ctx.quadraticCurveTo(x, top - ph * h * 0.08, x + ph * h * 1.1, hy - ph * h * 0.25);
  }
  ctx.lineTo(w * 1.2, hy);
  ctx.closePath();
  ctx.fillStyle = mix("#7cc0b0", "#9db3c8", winter);
  ctx.fill();
  if (winter > 0) {
    ctx.clip(); // snow caps, only on the mountains
    ctx.globalAlpha = winter;
    ctx.fillStyle = "#f6f9fc";
    for (const [px, ph] of peaks) {
      const x = px * w + pan;
      const cap = hy - ph * h * 0.45; // the drawn peak tops out at ≈ 0.67 ph
      ctx.beginPath();
      ctx.moveTo(x - ph * h, cap - ph * h);
      ctx.lineTo(x + ph * h, cap - ph * h);
      for (let k = 4; k >= 0; k--) ctx.lineTo(x - ph * h + (k * ph * h) / 2, cap + (k % 2 ? ph * h * 0.06 : -ph * h * 0.04));
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function hills(ctx: CanvasRenderingContext2D, w: number, hy: number, height: number, pan: number, seed: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, hy + 1);
  for (let x = 0; x <= w; x += w / 60) {
    const u = (x - pan) / w;
    const bump = 0.6 + 0.4 * Math.sin(u * seed + seed) * Math.sin(u * seed * 0.37 + 2);
    ctx.lineTo(x, hy - height * bump);
  }
  ctx.lineTo(w, hy + 1);
  ctx.fill();
}

function triangle(ctx: CanvasRenderingContext2D, x: number, top: number, bottom: number, half: number) {
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.quadraticCurveTo(x + half * 0.5, bottom - (bottom - top) * 0.5, x + half, bottom);
  ctx.quadraticCurveTo(x, bottom + (bottom - top) * 0.08, x - half, bottom);
  ctx.quadraticCurveTo(x - half * 0.5, bottom - (bottom - top) * 0.5, x, top);
  ctx.fill();
}

function drawPine(ctx: CanvasRenderingContext2D, x: number, y: number, H: number) {
  ctx.fillStyle = "#6b4226";
  ctx.fillRect(x - H * 0.035, y - H * 0.16, H * 0.07, H * 0.16);
  for (let k = 0; k < 3; k++) {
    const bottom = y - H * (0.12 + k * 0.24);
    const top = bottom - H * 0.4;
    const half = H * (0.3 - k * 0.07);
    ctx.fillStyle = "#24604a";
    triangle(ctx, x, top, bottom, half);
    ctx.fillStyle = "#2f7a5c"; // the sunny side
    triangle(ctx, x - half * 0.25, top + H * 0.06, bottom - H * 0.02, half * 0.55);
    ctx.fillStyle = "#f7fafc"; // snow on each tier
    triangle(ctx, x, top, top + H * 0.14, half * 0.34);
  }
}

// Canopy puffs for a round cartoon tree: [dx, dy, r] in tree heights, drawn dark first, then lit from the upper left.
const CANOPY: [number, number, number][] = [
  [-0.2, -0.6, 0.2],
  [0.2, -0.62, 0.2],
  [0, -0.8, 0.24],
  [-0.12, -0.95, 0.17],
  [0.16, -0.9, 0.16],
];

function drawBroadleaf(ctx: CanvasRenderingContext2D, x: number, y: number, H: number, seed: number) {
  const lean = (rand(seed + 0.4) - 0.5) * H * 0.12;
  ctx.fillStyle = "#7a4a28";
  ctx.beginPath();
  ctx.moveTo(x - H * 0.07, y);
  ctx.quadraticCurveTo(x - H * 0.02 + lean, y - H * 0.3, x - H * 0.035 + lean, y - H * 0.6);
  ctx.lineTo(x + H * 0.035 + lean, y - H * 0.6);
  ctx.quadraticCurveTo(x + H * 0.03 + lean, y - H * 0.3, x + H * 0.07, y);
  ctx.fill();
  for (const [color, grow, dx, dy] of [
    ["#3d8a2c", 1, 0, 0],
    ["#5cae3a", 0.78, -0.03, -0.03],
    ["#8fd256", 0.42, -0.07, -0.07],
  ] as const) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (const [px, py, r] of CANOPY) {
      const cx = x + lean + (px + dx) * H;
      const cy = y + (py + dy) * H;
      ctx.moveTo(cx + r * grow * H, cy);
      ctx.arc(cx, cy, r * grow * H, 0, 7);
    }
    ctx.fill();
  }
}
