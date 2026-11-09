// Draws the simple geometric props (bridge, signs, notice boards) from the master palette. Run: node tools/art/props.mjs
// Hand-placed pixels beat AI for straight timber: exact, on the grid, free to tweak.
import { mkdirSync } from "node:fs";
import sharp from "sharp";

const C = {
  ink: "1a1614", dark: "3d2e25", wood: "6e5440", woodLit: "8a6c52", woodPale: "a88a6a",
  paper: "c4a886", wheat: "8daa72", roof: "8f3d2b", roofLit: "b05a3c", seal: "a8262a",
};

function canvas(w, h) {
  const data = Buffer.alloc(w * h * 4);
  const rect = (x, y, rw, rh, hex) => {
    const rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
    for (let j = y; j < y + rh; j++) for (let i = x; i < x + rw; i++) if (i >= 0 && j >= 0 && i < w && j < h) data.set([...rgb, 255], (j * w + i) * 4);
  };
  /** A filled box with a 1px ink outline. */
  const box = (x, y, rw, rh, fill) => (rect(x, y, rw, rh, C.ink), rect(x + 1, y + 1, rw - 2, rh - 2, fill));
  const save = (name) => sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toFile(`public/world/art/objects/${name}.png`);
  return { rect, box, save };
}

mkdirSync("public/world/art/objects", { recursive: true });

// Bridge, 5×2 tiles (the river plus its soft banks): planks across the river's flow, a rail with posts along each side.
{
  const { rect, box, save } = canvas(80, 32);
  box(0, 3, 80, 26, C.wood);
  for (let x = 1; x < 79; x += 3) rect(x, 4, 1, 24, C.dark); // plank seams
  for (let x = 2; x < 79; x += 6) rect(x, 4, 2, 24, C.woodLit); // alternate planks catch the light
  for (const y of [0, 27]) {
    box(0, y, 80, 4, C.woodPale); // rail
    for (let x = 0; x < 80; x += 12) box(x, y, 4, 5, C.dark); // posts
  }
  await save("bridge");
}

// Place-name sign: a wide plank on two posts with a red header, like a border marker.
{
  const { rect, box, save } = canvas(16, 16);
  box(2, 8, 3, 8, C.dark);
  box(11, 8, 3, 8, C.dark);
  box(0, 1, 16, 9, C.woodPale);
  rect(1, 2, 14, 2, C.seal);
  for (const y of [5, 7]) rect(3, y, 10, 1, C.dark); // carved letters; the words show in the text box
  await save("sign-place");
}

// Direction sign: one post with arrow arms pointing both ways.
{
  const { rect, box, save } = canvas(16, 16);
  box(6, 3, 4, 13, C.dark);
  for (const [y, left] of [[2, true], [7, false]]) {
    box(left ? 1 : 3, y, 12, 4, C.woodLit);
    rect(left ? 0 : 15, y + 1, 1, 2, C.ink); // the arrow's point
    rect(left ? 1 : 14, y + 1, 1, 2, C.woodLit);
  }
  await save("sign-direction");
}

// Notice boards: a timber panel under a small shingle roof, pinned with papers and one red seal.
async function board(name, h) {
  const { rect, box, save } = canvas(16, h);
  box(1, h - 9, 2, 9, C.dark);
  box(13, h - 9, 2, 9, C.dark);
  box(1, 4, 14, h - 9, C.wood);
  box(0, 0, 16, 5, C.roof);
  rect(1, 1, 14, 1, C.roofLit);
  const papers = h > 20 ? [[3, 6], [8, 7], [4, 12]] : [[3, 6], [8, 7]];
  for (const [x, y] of papers) box(x, y, 5, 5, C.paper);
  rect(papers[1][0] + 1, papers[1][1] + 3, 2, 1, C.seal);
  await save(name);
}
// Crop field, 4×5 tiles: ploughed furrows with rows of young wheat, laid over the crops ground patch.
{
  const { rect, save } = canvas(64, 80);
  rect(0, 0, 64, 80, C.dark);
  for (let y = 2; y < 80; y += 6) {
    rect(0, y, 64, 3, C.wood); // furrow ridge
    for (let x = 1 + (y % 4); x < 64; x += 4) rect(x, y - 1, 1, 2, C.wheat); // sprouts
  }
  await save("crops");
}

await board("board", 24);
await board("board-small", 20);
console.log("wrote bridge, sign-place, sign-direction, board, board-small");
