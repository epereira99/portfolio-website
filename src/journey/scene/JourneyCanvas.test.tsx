import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { JourneyCanvas } from "./JourneyCanvas";

vi.mock("@react-three/fiber", () => ({
  Canvas: () => {
    throw new Error("WebGL unavailable");
  },
  useFrame: () => {},
  useThree: () => ({}),
}));
vi.mock("@react-three/drei", () => ({
  useGLTF: Object.assign(() => ({ scene: null, animations: [] }), { preload: () => {} }),
  useAnimations: () => ({ actions: {}, mixer: null }),
  RoundedBox: () => null,
}));

test("a failing 3D canvas leaves the rest of the page working", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  expect(() =>
    render(
      <>
        <JourneyCanvas />
        <p>still here</p>
      </>,
    ),
  ).not.toThrow();
  expect(screen.getByText("still here")).toBeInTheDocument();
});
