import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LowpolyWalk } from "./LowpolyWalk";

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
}));

test("a failing 3D canvas leaves the rest of the page working, behind a hidden layer", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const { container } = render(
    <>
      <LowpolyWalk />
      <p>still here</p>
    </>,
  );
  expect(screen.getByText("still here")).toBeInTheDocument();
  expect(container.firstElementChild!.getAttribute("aria-hidden")).toBe("true");
});
