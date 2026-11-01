import { cameraPose, distanceAt, pathPoint, pathTangent, type Vec3 } from "../path";
import { voyageState } from "./phase";

export const PORTO_END = 140;
export const JONKOPING_START = 200;
export const DECK_HEIGHT = 2.2; // matches the nau model's DeckSpot

export type Pose = { position: Vec3; heading: number }; // heading = rotation.y; 0 faces +Z
type CameraTarget = { position: Vec3; target: Vec3 };

const MOOR_OFFSET = 7; // nau centre, to the walker's right (the Douro)
const GANGPLANK = 4; // top of the gangplank, to the right
const SAIL_DISTANCE = 12;

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const lerp = (a: Vec3, b: Vec3, f: number): Vec3 => [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * f) as Vec3;
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = ([x, y, z]: Vec3, k: number): Vec3 => [x * k, y * k, z * k];

export function headingAt(d: number): number {
  const [tx, , tz] = pathTangent(d);
  return Math.atan2(tx, tz);
}

function rightNormal(d: number): Vec3 {
  const [tx, , tz] = pathTangent(d);
  const len = Math.hypot(tx, tz);
  return [-tz / len, 0, tx / len];
}

function flatTangent(d: number): Vec3 {
  const [tx, , tz] = pathTangent(d);
  const len = Math.hypot(tx, tz);
  return [tx / len, 0, tz / len];
}

const MOORED = add(pathPoint(PORTO_END), scale(rightNormal(PORTO_END), MOOR_OFFSET));

export function nauPose(s: number): Pose {
  const { phase, t } = voyageState(s);
  const sailed = phase === "liftOut" ? easeInOut(t) : phase === "sail" || phase === "diveIn" ? 1 : 0;
  return {
    position: add(MOORED, scale(flatTangent(PORTO_END), SAIL_DISTANCE * sailed)),
    heading: headingAt(PORTO_END),
  };
}

const withY = ([x, , z]: Vec3, y: number): Vec3 => [x, y, z];
const BOARD_A = pathPoint(PORTO_END);
const BOARD_B = withY(add(BOARD_A, scale(rightNormal(PORTO_END), GANGPLANK)), DECK_HEIGHT);
const BOARD_C = withY(MOORED, DECK_HEIGHT);
const dist = (a: Vec3, b: Vec3) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
export const GANGPLANK_ENDS: [Vec3, Vec3] = [BOARD_A, BOARD_B];
const AB = dist(BOARD_A, BOARD_B);
const BOARD_LENGTH = AB + dist(BOARD_B, BOARD_C);
const facing = (from: Vec3, to: Vec3) => Math.atan2(to[0] - from[0], to[2] - from[2]);

const walking = (d: number) => ({ position: pathPoint(d), heading: headingAt(d), walk: d });

export function avatarPose(s: number): Pose & { walk: number } {
  const { phase, t } = voyageState(s);
  switch (phase) {
    case "board": {
      // Up the gangplank (first 60%), then across the deck.
      const [from, to, f, before] = t < 0.6 ? [BOARD_A, BOARD_B, t / 0.6, 0] : [BOARD_B, BOARD_C, (t - 0.6) / 0.4, AB];
      return { position: lerp(from, to, f), heading: facing(from, to), walk: PORTO_END + before + dist(from, to) * f };
    }
    case "liftOut": {
      const nau = nauPose(s);
      return { position: withY(nau.position, DECK_HEIGHT), heading: nau.heading, walk: PORTO_END + BOARD_LENGTH };
    }
    case "sail":
    case "diveIn":
      return walking(JONKOPING_START); // already waiting in Jönköping, hidden by the map
    default:
      return walking(distanceAt(s));
  }
}

const high = (p: Vec3): CameraTarget => ({ position: add(p, [0, 45, 30]), target: p });
const blend = (a: CameraTarget, b: CameraTarget, f: number): CameraTarget => ({
  position: lerp(a.position, b.position, f),
  target: lerp(a.target, b.target, f),
});

export function cameraPoseAt(s: number): CameraTarget {
  const { phase, t } = voyageState(s);
  switch (phase) {
    case "board": {
      // Stay put but turn to keep the avatar in frame as it climbs aboard.
      const base = cameraPose(PORTO_END);
      const [x, y, z] = avatarPose(s).position;
      return { position: base.position, target: lerp(base.target, [x, y + 1.2, z], Math.min(t * 1.5, 1)) };
    }
    case "liftOut":
      return blend(cameraPose(PORTO_END), high(withY(nauPose(s).position, DECK_HEIGHT)), easeInOut(t));
    case "sail":
      return high(pathPoint(JONKOPING_START));
    case "diveIn":
      return blend(high(pathPoint(JONKOPING_START)), cameraPose(JONKOPING_START), easeInOut(t));
    default:
      return cameraPose(distanceAt(s));
  }
}
