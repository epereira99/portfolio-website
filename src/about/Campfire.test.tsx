import { afterEach, expect, test, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { CAMP_ITEMS } from "@/content/about";
import { pointAt } from "@/journey/lowpoly/path";
import { CAMP_ALONG, CAMP_OFF, campCamera, campSpot, campToWorld } from "./camp";
import { CampScreen } from "./Campfire";

vi.mock("@react-three/fiber", () => ({ useFrame: () => {} }));
vi.mock("@react-three/drei", () => ({
  useGLTF: Object.assign(() => ({ scene: null, animations: [] }), { preload: () => {} }),
  Html: () => null,
  PointMaterial: () => null,
}));

afterEach(() => window.history.replaceState(null, "", "/"));

test("the camp sits in the meadow off the road's left side near the end, turned to face the road", () => {
  const road = pointAt(CAMP_ALONG);
  const spot = campSpot();
  expect(Math.hypot(spot.x - road.x, spot.z - road.z)).toBeCloseTo(CAMP_OFF);
  const right = [Math.cos(road.heading), -Math.sin(road.heading)];
  expect((spot.x - road.x) * right[0] + (spot.z - road.z) * right[1]).toBeLessThan(0); // his left as he walks
  const [fx, , fz] = campToWorld(0, 0, 1); // the way he faces at the camp
  expect(Math.hypot(road.x - fx, road.z - fz)).toBeLessThan(CAMP_OFF); // a step toward the road
  const cam = campCamera(16 / 9).position;
  expect(Math.hypot(road.x - cam[0], road.z - cam[2])).toBeLessThan(CAMP_OFF); // the camera's on the road side, facing him
});

test("at the camp, each thing makes him say its line in a bubble; off it, there's nothing", () => {
  render(<CampScreen />);
  expect(screen.queryByRole("navigation", { name: "Things by the fire" })).toBeNull();
  act(() => {
    window.location.hash = "about";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
  for (const item of CAMP_ITEMS) {
    fireEvent.click(screen.getByRole("button", { name: item.title }));
    expect(screen.getByText(item.body)).toBeInTheDocument();
  }
  fireEvent.click(screen.getByRole("button", { name: "← Back to the journey" }));
  expect(window.location.hash).toBe("");
  expect(screen.queryByRole("navigation", { name: "Things by the fire" })).toBeNull();
});
