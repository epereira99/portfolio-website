// Writes the world map as a Tiled file (public/world/world.tmj). Run: npm run gen:world
// Ground is autotiled from art/tilesets.json; `solid` marks blocked tiles; objects carry an `art` name from public/world/art/objects/.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { pickTile } from "./wang.mjs";

const W = 48, H = 32, T = 16;
const RIVER = [22, 23, 24], ROAD = 16, SOUTH_ROAD = 29;
const DRY_EDGE = 20; // corners west of this are Portugal's dry grass; leaves a 2-tile green strip so dry grass never meets water
const { sets } = JSON.parse(readFileSync("art/tilesets.json", "utf8"));

// Terrain per cell corner (a (W+1)×(H+1) grid), collision per cell.
const corner = [...Array(H + 1)].map(() => [...Array(W + 1)].map((_, x) => (x < DRY_EDGE ? "dry" : "grass")));
const solid = new Array(W * H).fill(0);
const block = (x, y) => (solid[y * W + x] = 1);
const isSolid = (x, y) => solid[y * W + x] === 1;
const CORNERS = [[0, 0], [1, 0], [0, 1], [1, 1]];
/** Paints a cell's four corners, never over water: paths stop at the bank and the bridge covers the gap. */
const paint = (x, y, t) => CORNERS.forEach(([dx, dy]) => corner[y + dy][x + dx] !== "water" && (corner[y + dy][x + dx] = t));
const path = (x, y) => !isSolid(x, y) && paint(x, y, "path");

const objects = [];
/** An object w×h tiles with its top-left at tile (x, y). */
const obj = (type, x, y, props = {}, w = 1, h = 1) =>
  objects.push({
    id: objects.length + 1, name: "", type, x: x * T, y: y * T, width: w * T, height: h * T, rotation: 0, visible: true,
    properties: Object.entries(props).map(([name, value]) => ({ name, type: "string", value })),
  });
/** Scenery: solid on its bottom `solidRows` rows, so the hunter can walk behind a tree's canopy. */
function art(name, x, y, w, h, solidRows = h) {
  obj("art", x, y, { art: name }, w, h);
  for (let j = h - solidRows; j < h; j++) for (let i = 0; i < w; i++) block(x + i, y + j);
}
/** Something the hunter faces and presses A on (spawn and travel are just marks on open ground). */
function thing(type, x, y, props = {}) {
  obj(type, x, y, props);
  if (type !== "spawn" && type !== "travel") block(x, y);
}

// The river (Portugal west, Sweden east) with a two-tile bridge where the road crosses.
for (let y = 0; y < H; y++)
  for (const x of RIVER) {
    CORNERS.forEach(([dx, dy]) => (corner[y + dy][x + dx] = "water"));
    if (y !== ROAD && y !== ROAD + 1) block(x, y);
  }
art("bridge", RIVER[0], ROAD, RIVER.length, 2, 0);

const lanes = [];
/** A place: buildings left to right on one baseline; the first is the landmark whose door the hunter visits. */
function place(id, x, y, buildings, { board = true, boardSide = 2, academy = false, road = ROAD } = {}) {
  const base = y + Math.max(...buildings.map((b) => b.h)) - 1;
  let bx = x;
  for (const b of buildings) {
    art(b.art, bx, base - b.h + 1, b.w, b.h);
    bx += b.w + 1;
  }
  const door = x + Math.floor(buildings[0].w / 2);
  if (academy) thing("academy", door, base, { place: id });
  thing("travel", door, base + 1, { place: id });
  if (board) thing("board", door + boardSide, base + 1, { place: id, art: "board-small" });
  lanes.push([door, base + 1, road]);
}
const PT_HOUSE = { art: "house-pt", w: 3, h: 3 };
const SE_HOUSE = { art: "house-se", w: 3, h: 3 };

// Portugal
place("childhood-house", 8, 3, [{ art: "house-childhood", w: 3, h: 3 }], { board: false });
place("uminho", 2, 8, [{ art: "fortress-uminho", w: 5, h: 4 }], { board: false, academy: true });
place("deloitte", 3, 20, [{ art: "office-deloitte", w: 4, h: 4 }, PT_HOUSE, PT_HOUSE], { road: SOUTH_ROAD });
// Sweden
place("current-house", 33, 3, [{ art: "house-current", w: 3, h: 3 }]);
place("ju", 39, 2, [{ art: "fortress-ju", w: 7, h: 5 }], { academy: true });
place("effektify", 30, 9, [{ art: "hall-effektify", w: 4, h: 4 }, SE_HOUSE, SE_HOUSE], { boardSide: -2 });
place("saab", 27, 19, [{ art: "compound-saab", w: 5, h: 4 }, SE_HOUSE, SE_HOUSE], { road: SOUTH_ROAD });
place("jordbruksverket", 33, 25, [{ art: "farmhouse", w: 3, h: 3 }, { art: "barn", w: 4, h: 3 }], { road: SOUTH_ROAD });
for (let x = 42; x <= 45; x++) for (let y = 24; y <= 28; y++) paint(x, y, "crops");

// Spawn on the Swedish bank by the bridge, facing the main board, with the signs around it.
thing("spawn", 27, ROAD);
thing("board", 27, ROAD - 1, { place: "all", art: "board" });
thing("sign", 26, ROAD - 1, { look: "place", art: "sign-place", text: "Sweden" });
thing("sign", 20, ROAD - 1, { look: "place", art: "sign-place", text: "Portugal" });
thing("sign", 29, ROAD - 1, { look: "direction", art: "sign-direction", text: "↑ MSc AI (Jönköping University) · Effektify · Current house" });
thing("sign", 29, ROAD + 1, { look: "direction", art: "sign-direction", text: "↓ Saab · Jordbruksverket   ← Deloitte · BSc Computer Science (UMinho) · Childhood house" });
thing("sign", 20, ROAD + 1, { look: "direction", art: "sign-direction", text: "↑ BSc Computer Science (UMinho) · Childhood house   ↓ Deloitte" });

// A ring of pines keeps the hunter inside the map; a few more trees break up the open ground.
for (let x = 0; x < W; x++)
  for (let y = 0; y < H; y++) {
    if (x > 0 && y > 0 && x < W - 1 && y < H - 1) continue;
    art(x < DRY_EDGE ? "tree-pt" : "pine", x, y - 1, 1, 2, 1);
    block(x, y); // the top row's canopy sits off the map, so block its trunk row too
  }
for (const [x, y] of [[25, 4], [45, 9], [46, 14], [44, 20], [30, 26], [14, 6], [16, 10], [12, 12], [10, 18], [3, 26], [16, 24]])
  art(x < DRY_EDGE ? "tree-pt" : "pine", x, y - 1, 1, 2, 1);

// Roads after everything solid exists, so they run around buildings, never through them.
for (let x = 1; x < W - 1; x++) path(x, ROAD);
for (const x of [18, 26]) for (let y = ROAD; y <= SOUTH_ROAD; y++) path(x, y);
for (let x = 2; x < W - 2; x++) if (!RIVER.includes(x)) path(x, SOUTH_ROAD);
for (const [x, y, road] of lanes) for (let i = Math.min(y, road); i <= Math.max(y, road); i++) path(x, i);

const ground = [];
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) ground.push(pickTile([corner[y][x], corner[y][x + 1], corner[y + 1][x], corner[y + 1][x + 1]], sets));

const layer = (id, name, data, visible = true) => ({ id, name, type: "tilelayer", width: W, height: H, x: 0, y: 0, opacity: 1, visible, data });
const map = {
  type: "map", version: "1.10", tiledversion: "1.10.2", orientation: "orthogonal", renderorder: "right-down",
  width: W, height: H, tilewidth: T, tileheight: T, infinite: false, nextlayerid: 4, nextobjectid: objects.length + 1,
  layers: [
    layer(1, "ground", ground),
    layer(2, "solid", solid, false),
    { id: 3, name: "objects", type: "objectgroup", draworder: "topdown", x: 0, y: 0, opacity: 1, visible: true, objects },
  ],
  tilesets: [{
    firstgid: 1, name: "terrain", tilewidth: T, tileheight: T, tilecount: 16 * sets.length, columns: 16, margin: 0, spacing: 0,
    image: "art/terrain.png", imagewidth: 16 * T, imageheight: sets.length * T,
  }],
};

mkdirSync("public/world", { recursive: true });
writeFileSync("public/world/world.tmj", JSON.stringify(map));
console.log(`wrote public/world/world.tmj (${W}×${H}, ${objects.length} objects)`);
