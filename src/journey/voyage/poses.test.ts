import { describe, expect, test } from "vitest";
import { cameraPose, distanceAt, pathPoint, type Vec3 } from "../path";
import { DECK_HEIGHT, GANGPLANK, HULL_HALF_WIDTH, MOOR_OFFSET, avatarPose, cameraPoseAt, headingAt, nauPose } from "./poses";

const near = (a: Vec3, b: Vec3, digits = 4) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i], digits));

describe("avatarPose", () => {
  test("walks the path normally before the voyage", () => {
    const pose = avatarPose(3.0);
    near(pose.position, pathPoint(distanceAt(3.0)));
    expect(pose.walk).toBeCloseTo(120);
  });

  test("boards from the end of Porto's path onto the deck", () => {
    near(avatarPose(3.5).position, pathPoint(140));
    const end = avatarPose(3.7249);
    expect(end.position[1]).toBeCloseTo(DECK_HEIGHT, 1);
    const deck = nauPose(3.7249).position;
    expect(Math.hypot(end.position[0] - deck[0], end.position[2] - deck[2])).toBeLessThan(0.1);
  });

  test("scrolling back puts the avatar on Porto's path, or partway up the gangplank", () => {
    expect(avatarPose(3.49).position[1]).toBe(0);
    const y = avatarPose(3.6).position[1];
    expect(y).toBeGreaterThan(0);
    expect(y).toBeLessThan(DECK_HEIGHT);
  });

  test("waits in Jönköping behind the map and stays there after landing", () => {
    near(avatarPose(4.3).position, pathPoint(200));
    near(avatarPose(5.0).position, pathPoint(200));
    near(avatarPose(6).position, pathPoint(240));
  });
});

describe("cameraPoseAt", () => {
  test("follows the walker outside the voyage", () => {
    const c = cameraPoseAt(3.0);
    near(c.position, cameraPose(120).position);
    near(c.target, cameraPose(120).target);
  });

  test("is high above the world while the map is up", () => {
    expect(cameraPoseAt(3.95).position[1]).toBeGreaterThanOrEqual(40);
  });

  test("lands behind the walker in Jönköping", () => {
    near(cameraPoseAt(5.0).position, cameraPose(200).position);
  });
});

describe("boarding geometry", () => {
  test("the gangplank reaches the hull, so the avatar never walks on air", () => {
    expect(GANGPLANK).toBeGreaterThanOrEqual(MOOR_OFFSET - HULL_HALF_WIDTH);
  });
});

describe("nauPose", () => {
  test("is moored until the lift-out, then sails about 12 units", () => {
    near(nauPose(3.0).position, nauPose(3.5).position);
    const [a, b] = [nauPose(3.5).position, nauPose(3.95).position];
    expect(Math.hypot(b[0] - a[0], b[2] - a[2])).toBeCloseTo(12, 1);
  });
});

describe("the ending", () => {
  test("stops on the quay and turns to face the viewer", () => {
    near(avatarPose(8.5).position, pathPoint(340));
    expect(avatarPose(8.5).heading).toBeCloseTo(headingAt(340));
    expect(avatarPose(8.8).heading).toBeCloseTo(headingAt(340) + Math.PI);
  });

  test("never walks into the unbuilt path, however far you scroll", () => {
    for (const s of [9, 99]) {
      near(avatarPose(s).position, pathPoint(340));
      expect(avatarPose(s).heading).toBeCloseTo(headingAt(340) + Math.PI);
    }
  });

  test("scrolling back out of the ending walks forward again", () => {
    near(avatarPose(8.4).position, pathPoint(336));
    expect(avatarPose(8.4).heading).toBeCloseTo(headingAt(336));
  });

  test("the camera pulls back to frame the face", () => {
    const quay = pathPoint(340);
    const from = (s: number) => {
      const p = cameraPoseAt(s).position;
      return Math.hypot(p[0] - quay[0], p[1] - quay[1], p[2] - quay[2]);
    };
    expect(cameraPoseAt(9).target[1]).toBeCloseTo(1.5);
    expect(from(9)).toBeGreaterThan(from(8.5));
  });
});
