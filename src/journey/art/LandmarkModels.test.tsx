import { afterEach, expect, test, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { setScreens } from "../progress";
import { LandmarkModels as Landmarks } from "./LandmarkModels";

vi.mock("@react-three/drei", () => ({
  useGLTF: Object.assign(
    (url: string) => {
      if (url.includes("clerigos")) throw new Error("failed to load");
      return { scene: { clone: () => ({ traverse: () => {} }) } };
    },
    { preload: () => {} },
  ),
}));

afterEach(() => {
  act(() => setScreens(0));
  vi.restoreAllMocks();
});

test("a landmark that fails to load leaves the others standing", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  act(() => setScreens(2));
  let container!: HTMLElement;
  expect(() => ({ container } = render(<Landmarks />))).not.toThrow();
  expect(container.querySelector('[name="dom-luis"]')).not.toBeNull();
  expect(container.querySelector('[name="clerigos"]')).toBeNull();
});
