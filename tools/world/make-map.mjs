// Writes the greybox world map as a Tiled file (public/world/world.tmj). Run: npm run gen:world
// Once the layout settles, edit world.tmj in Tiled directly and stop regenerating it.
import { mkdirSync, writeFileSync } from "node:fs";

const W = 64, H = 40, T = 16;
const GRASS = 1, PATH = 2, WATER = 3, BRIDGE = 4, TREE = 5, WALL = 6, ROOF = 7;
const ground = new Array(W * H).fill(GRASS);
const set = (x, y, id) => (ground[y * W + x] = id);
const paint = (x, y, id) => ground[y * W + x] === GRASS && set(x, y, id); // never over houses, water or trees
const objects = [];
const obj = (type, x, y, props = {}) =>
  objects.push({
    id: objects.length + 1, name: "", type, x: x * T, y: y * T, width: T, height: T, rotation: 0, visible: true,
    properties: Object.entries(props).map(([name, value]) => ({ name, type: "string", value })),
  });

// A ring of trees keeps the hunter inside the map.
for (let x = 0; x < W; x++) set(x, 0, TREE), set(x, H - 1, TREE);
for (let y = 0; y < H; y++) set(0, y, TREE), set(W - 1, y, TREE);

// The river (Portugal west, Sweden east), the bridge, and the road across it.
const ROAD = 21;
for (let y = 1; y < H - 1; y++) for (let x = 30; x <= 32; x++) set(x, y, y === ROAD || y === ROAD + 1 ? BRIDGE : WATER);
for (let x = 1; x < W - 1; x++) paint(x, ROAD, PATH);

const places = [];
/** A place: n houses (3 wide: two roof rows over a wall row) with a door, a travel tile and, if it has work, a board. */
function place(id, cx, cy, n, { board = true, academy = false } = {}) {
  for (let i = 0; i < n; i++) {
    for (let x = cx + i * 4; x < cx + i * 4 + 3; x++) set(x, cy, ROOF), set(x, cy + 1, ROOF), set(x, cy + 2, WALL);
  }
  const door = cx + Math.floor(n / 2) * 4 + 1;
  if (academy) obj("academy", door, cy + 3, { place: id });
  obj("travel", door, cy + 4, { place: id });
  if (board) obj("board", door + 2, cy + 3, { place: id });
  places.push([door, cy + 4]);
}

// Portugal
place("childhood-house", 10, 3, 1, { board: false });
place("uminho", 8, 11, 2, { board: false, academy: true });
place("deloitte", 8, 29, 3);
// Sweden
place("current-house", 40, 3, 1);
place("ju", 46, 11, 2, { academy: true });
place("effektify", 48, 23, 3);
place("saab", 35, 31, 3);
place("jordbruksverket", 49, 31, 3);

// A lane from each door to the road, painted after every house exists so lanes go around, not through, them.
for (const [x, y] of places) for (let i = Math.min(y, ROAD); i <= Math.max(y, ROAD); i++) paint(x, i, PATH);

// Spawn on the Swedish bank by the bridge, facing the main board.
obj("spawn", 35, ROAD);
obj("board", 35, ROAD - 1, { place: "all" });
obj("sign", 33, ROAD - 1, { text: "← Portugal · UMinho · Deloitte · Childhood house" });
obj("sign", 37, ROAD - 1, { text: "↑ Jönköping University · Current house" });
obj("sign", 37, ROAD + 1, { text: "↓ Saab · Jordbruksverket · Effektify" });
obj("sign", 27, ROAD - 1, { text: "→ Sweden, across the bridge" });

for (const [x, y] of [[20, 5], [23, 15], [24, 34], [56, 6], [60, 16], [5, 24]]) set(x, y, TREE);

const map = {
  type: "map", version: "1.10", tiledversion: "1.10.2", orientation: "orthogonal", renderorder: "right-down",
  width: W, height: H, tilewidth: T, tileheight: T, infinite: false, nextlayerid: 3, nextobjectid: objects.length + 1,
  layers: [
    { id: 1, name: "ground", type: "tilelayer", width: W, height: H, x: 0, y: 0, opacity: 1, visible: true, data: ground },
    { id: 2, name: "objects", type: "objectgroup", draworder: "topdown", x: 0, y: 0, opacity: 1, visible: true, objects },
  ],
  // Greybox tiles are drawn at runtime (WorldScene); this image name is a stand-in until the art pack exists.
  tilesets: [{ firstgid: 1, name: "greybox", tilewidth: T, tileheight: T, tilecount: 7, columns: 7, margin: 0, spacing: 0, image: "greybox.png", imagewidth: 7 * T, imageheight: T }],
};

mkdirSync("public/world", { recursive: true });
writeFileSync("public/world/world.tmj", JSON.stringify(map));
console.log(`wrote public/world/world.tmj (${W}×${H}, ${objects.length} objects)`);
