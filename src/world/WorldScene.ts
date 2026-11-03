import * as Phaser from "phaser";
import { heldDir, type Dir } from "./buttons";
import { ART_DIR, HUNTER_FRAME, HUNTER_ROWS, STEP_MS, TILE, WALK_FRAMES } from "./config";
import { depthOf } from "./depth";
import { ahead, step, type Tile } from "./grid";
import { signNear } from "./signs";
import { getView, onWorldA, setNearbySign, setView } from "./store";
import { WORLD } from "./view";
import { NPCS, visibleNpcs } from "@/content/npcs";
import { placeById, type PlaceId } from "@/content/places";

// Stand-ins for art the pack doesn't have yet, by object type.
const GREYBOX: Record<string, number> = { board: 0x6b4423, sign: 0xe6d29c, npc: 0x4f7fd0, art: 0x55504a };

type TmjObject = { type: string; x: number; y: number; width: number; height: number; properties?: { name: string; value: string }[] };
type Tmj = { width: number; layers: { name: string; data?: number[]; objects?: TmjObject[] }[] };
type Thing = { type: string; tile: Tile; props: Record<string, string> };

const propsOf = (o: TmjObject) => Object.fromEntries((o.properties ?? []).map((p) => [p.name, p.value]));
const artKey = (name: string) => `art:${name}`;
const COLUMNS = WALK_FRAMES + 1; // hunter.png: a standing frame, then the walk
const standFrame = (d: Dir) => HUNTER_ROWS.indexOf(d) * COLUMNS;

export class WorldScene extends Phaser.Scene {
  private solid: number[] = [];
  private mapWidth = 0;
  private mapHeight = 0;
  private things: Thing[] = [];
  private signs: { tile: Tile; text: string }[] = [];
  private hunter!: Phaser.GameObjects.Sprite;
  private tile: Tile = { x: 0, y: 0 };
  private facing: Dir = "up";
  private moving = false;
  private pressedA = false;

  constructor() {
    super("world");
  }

  preload() {
    this.load.tilemapTiledJSON("world", "/world/world.tmj");
    this.load.image("terrain", `${ART_DIR}/terrain.png`);
    this.load.spritesheet("hunter", `${ART_DIR}/hunter.png`, { frameWidth: HUNTER_FRAME.w, frameHeight: HUNTER_FRAME.h });
    // Object art is named in the map, so queue it once the map has loaded; a missing file falls back to a greybox.
    this.load.once("filecomplete-tilemapJSON-world", () => {
      const names = new Set(this.objectsOf(this.tmj()).map((o) => propsOf(o).art).filter(Boolean));
      for (const name of names) this.load.image(artKey(name), `${ART_DIR}/objects/${name}.png`);
    });
  }

  private tmj = () => this.cache.tilemap.get("world").data as Tmj;
  private objectsOf = (tmj: Tmj) => tmj.layers.find((l) => l.name === "objects")!.objects!;

  create() {
    const map = this.make.tilemap({ key: "world" });
    map.createLayer("ground", map.addTilesetImage("terrain", "terrain")!, 0, 0);
    const tmj = this.tmj();
    this.solid = tmj.layers.find((l) => l.name === "solid")!.data!;
    this.mapWidth = map.width;
    this.mapHeight = map.height;

    const shown = new Set(visibleNpcs(NPCS).map((n) => n.id));
    const objects = this.objectsOf(tmj).filter((o) => o.type !== "npc" || shown.has(propsOf(o).npc));
    this.things = objects
      .filter((o) => o.type !== "art")
      .map((o) => ({ type: o.type, tile: { x: Math.round(o.x / TILE), y: Math.round(o.y / TILE) }, props: propsOf(o) }));
    this.signs = this.things.filter((t) => t.type === "sign").map((t) => ({ tile: t.tile, text: t.props.text }));

    for (const o of objects) {
      const name = propsOf(o).art;
      const bottom = o.y + o.height;
      if (name && this.textures.exists(artKey(name))) {
        this.add.image(o.x + o.width / 2, bottom, artKey(name)).setOrigin(0.5, 1).setDepth(depthOf(bottom));
      } else if (GREYBOX[o.type] !== undefined) {
        this.add.rectangle(o.x + 1, o.y + 1, o.width - 2, o.height - 2, GREYBOX[o.type]).setOrigin(0).setDepth(depthOf(bottom));
      }
    }

    for (const [row, dir] of HUNTER_ROWS.entries()) {
      const start = row * COLUMNS + 1;
      this.anims.create({
        key: `walk-${dir}`,
        frames: this.anims.generateFrameNumbers("hunter", { start, end: start + WALK_FRAMES - 1 }),
        frameRate: (WALK_FRAMES * 1000) / (2 * STEP_MS), // one full stride every two steps
        repeat: -1,
      });
    }

    this.tile = this.things.find((t) => t.type === "spawn")!.tile;
    this.hunter = this.add.sprite(0, 0, "hunter", standFrame(this.facing)).setOrigin(0.5, 1);
    this.placeHunter();

    const cam = this.cameras.main;
    cam.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    cam.startFollow(this.hunter, true);

    // The store decides which A presses belong to the world; acting in update keeps one press from also advancing the dialogue it opens.
    const offA = onWorldA(() => (this.pressedA = true));
    const off = () => (offA(), setNearbySign(null));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
    this.events.once(Phaser.Scenes.Events.DESTROY, off);
  }

  update() {
    this.hunter.setDepth(depthOf(this.hunter.y));
    setNearbySign(signNear(this.tile, this.signs));
    const view = getView();
    const a = this.pressedA;
    this.pressedA = false;
    if (view.kind !== "world") return;
    if (view.travelTo) return this.travel(view.travelTo);
    if (a && !this.moving) return this.interact();
    if (!this.moving) this.tryStep();
  }

  private blocked = (t: Tile) =>
    t.x < 0 || t.y < 0 || t.x >= this.mapWidth || t.y >= this.mapHeight || this.solid[t.y * this.mapWidth + t.x] === 1;

  private tryStep() {
    const d = heldDir();
    if (!d || getView().kind !== "world") return this.stand();
    this.facing = d;
    const next = step(this.tile, d, this.blocked);
    if (next === this.tile) return this.stand();
    this.tile = next;
    this.moving = true;
    this.hunter.play(`walk-${d}`, true);
    this.tweens.add({
      targets: this.hunter,
      x: this.footX(next),
      y: this.footY(next),
      duration: STEP_MS,
      ease: "Linear",
      onComplete: () => {
        this.moving = false;
        this.tryStep(); // chain the next step in the same frame so a held direction walks without a hitch
      },
    });
  }

  private interact() {
    const at = ahead(this.tile, this.facing);
    const thing = this.things.find((t) => t.tile.x === at.x && t.tile.y === at.y);
    if (!thing) return;
    const place = thing.props.place as PlaceId | "all";
    if (thing.type === "board") {
      setView({
        kind: "dialogue",
        lines: ["Contracts are pinned to the board.", "Read one?"],
        page: 0,
        then: { kind: "board", place, index: 0 },
      });
    } else if (thing.type === "sign") {
      setView({ kind: "dialogue", lines: [thing.props.text], page: 0 });
    } else if (thing.type === "npc") {
      const npc = NPCS.find((n) => n.id === thing.props.npc)!;
      setView({ kind: "dialogue", lines: [`${npc.name}:`, npc.line], page: 0 });
    } else if (thing.type === "academy") {
      setView({ kind: "degree", slug: placeById(place as PlaceId).degree! });
    }
  }

  private travel(id: PlaceId) {
    const target = this.things.find((t) => t.type === "travel" && t.props.place === id);
    if (target) {
      this.tweens.killTweensOf(this.hunter);
      this.moving = false;
      this.tile = target.tile;
      this.facing = "down";
      this.placeHunter();
    }
    setView(WORLD);
  }

  // The hunter's feet sit on the bottom-centre of his tile; his sprite rises a tile above it.
  private footX = (t: Tile) => t.x * TILE + TILE / 2;
  private footY = (t: Tile) => (t.y + 1) * TILE;

  private placeHunter() {
    this.hunter.setPosition(this.footX(this.tile), this.footY(this.tile));
    this.stand();
  }

  /** Stops the walk and shows the standing frame for the way he faces. */
  private stand() {
    this.hunter.stop();
    this.hunter.setFrame(standFrame(this.facing));
  }
}
