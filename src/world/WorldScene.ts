import * as Phaser from "phaser";
import { heldDir, onPress, type Dir } from "./buttons";
import { STEP_MS, TILE } from "./config";
import { ahead, step, type Tile } from "./grid";
import { getView, setView } from "./store";
import { WORLD } from "./view";
import { NPCS, visibleNpcs } from "@/content/npcs";
import { placeById, type PlaceId } from "@/content/places";

// Greybox colours per Tiled tile id (1 grass … 7 roof); the art pack replaces this texture later.
const TILE_COLOURS = ["#6aa84f", "#d9b878", "#3b6fb6", "#8a5d34", "#2f6b2a", "#8f6a45", "#9c3a2a"];
const BLOCKING_TILES = [3, 5, 6, 7];
const OBJECT_COLOURS: Record<string, number> = { board: 0x6b4423, sign: 0xe6d29c, npc: 0x4f7fd0, academy: 0x7a4fa0 };

type Thing = { type: string; tile: Tile; props: Record<string, string> };

export class WorldScene extends Phaser.Scene {
  private ground!: Phaser.Tilemaps.TilemapLayer;
  private things: Thing[] = [];
  private hunter!: Phaser.GameObjects.Graphics;
  private tile: Tile = { x: 0, y: 0 };
  private facing: Dir = "up";
  private moving = false;
  private pressedA = false;

  constructor() {
    super("world");
  }

  preload() {
    this.load.tilemapTiledJSON("world", "/world/world.tmj");
  }

  create() {
    const canvas = document.createElement("canvas");
    canvas.width = TILE * TILE_COLOURS.length;
    canvas.height = TILE;
    const ctx = canvas.getContext("2d")!;
    TILE_COLOURS.forEach((c, i) => ((ctx.fillStyle = c), ctx.fillRect(i * TILE, 0, TILE, TILE)));
    this.textures.addCanvas("greybox", canvas);

    const map = this.make.tilemap({ key: "world" });
    this.ground = map.createLayer("ground", map.addTilesetImage("greybox", "greybox")!, 0, 0) as Phaser.Tilemaps.TilemapLayer;

    const shown = new Set(visibleNpcs(NPCS).map((n) => n.id));
    this.things = map
      .getObjectLayer("objects")!
      .objects.map((o) => ({
        type: o.type,
        tile: { x: Math.round(o.x! / TILE), y: Math.round(o.y! / TILE) },
        props: Object.fromEntries(((o.properties ?? []) as { name: string; value: string }[]).map((p) => [p.name, p.value])),
      }))
      .filter((t) => t.type !== "npc" || shown.has(t.props.npc));

    for (const t of this.things) {
      const colour = OBJECT_COLOURS[t.type];
      if (colour !== undefined) this.add.rectangle(t.tile.x * TILE + 1, t.tile.y * TILE + 1, TILE - 2, TILE - 2, colour).setOrigin(0);
    }

    this.tile = this.things.find((t) => t.type === "spawn")!.tile;
    this.hunter = this.add.graphics();
    this.placeHunter();

    const cam = this.cameras.main;
    cam.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    cam.startFollow(this.hunter, true);

    // Handled in update, after the store has seen the same press, so one A never both opens and advances a dialogue.
    const offPress = onPress((b) => b === "a" && getView().kind === "world" && (this.pressedA = true));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, offPress);
  }

  update() {
    const view = getView();
    const a = this.pressedA;
    this.pressedA = false;
    if (view.kind !== "world") return;
    if (view.travelTo) return this.travel(view.travelTo);
    if (a && !this.moving) return this.interact();
    if (!this.moving) this.tryStep();
  }

  private blocked = (t: Tile) =>
    t.x < 0 || t.y < 0 || t.x >= this.ground.layer.width || t.y >= this.ground.layer.height ||
    BLOCKING_TILES.includes(this.ground.getTileAt(t.x, t.y)?.index ?? 0) ||
    this.things.some((o) => o.type !== "spawn" && o.type !== "travel" && o.tile.x === t.x && o.tile.y === t.y);

  private tryStep() {
    const d = heldDir();
    if (!d || getView().kind !== "world") return;
    if (d !== this.facing) {
      this.facing = d;
      this.drawHunter();
    }
    const next = step(this.tile, d, this.blocked);
    if (next === this.tile) return;
    this.tile = next;
    this.moving = true;
    this.tweens.add({
      targets: this.hunter,
      x: next.x * TILE,
      y: next.y * TILE,
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

  private placeHunter() {
    this.hunter.setPosition(this.tile.x * TILE, this.tile.y * TILE);
    this.drawHunter();
  }

  /** Greybox hunter: dark coat, white hair, a yellow notch on the side he faces. */
  private drawHunter() {
    const g = this.hunter.clear();
    g.fillStyle(0x2f3440).fillRect(2, 2, 12, 13);
    g.fillStyle(0xe8e8e8).fillRect(4, 1, 8, 5);
    const notch: Record<Dir, [number, number]> = { up: [6, 0], down: [6, 12], left: [0, 6], right: [12, 6] };
    g.fillStyle(0xf8e060).fillRect(...notch[this.facing], 4, 4);
  }
}
