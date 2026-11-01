import { afterEach, expect, test, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { setScreens } from "../progress";
import { ROUTE } from "./europe";
import { pointAlong, shipTransform } from "./route";
import { VoyageMap } from "./VoyageMap";

const MAP = "Map: sailing from Porto to Jönköping";

afterEach(() => {
  act(() => setScreens(0));
  vi.restoreAllMocks();
});

const at = (s: number) => {
  const view = render(<VoyageMap />);
  act(() => setScreens(s));
  return view;
};

test("stays away before the voyage", () => {
  at(3.4);
  expect(screen.queryByRole("img", { name: MAP })).toBeNull();
});

test("mid-voyage the route is half drawn and the ship is halfway along it", () => {
  const { container } = at(4.325);
  const map = screen.getByRole("img", { name: MAP });
  expect((map.parentElement as HTMLElement).style.opacity).toBe("1");
  expect(Number(container.querySelector("mask path")!.getAttribute("stroke-dashoffset"))).toBeCloseTo(0.5);
  const { x, y, angle } = pointAlong(ROUTE, 0.5);
  expect(container.querySelector('[data-part="ship"]')!.getAttribute("transform")).toBe(shipTransform(x, y, angle));
});

test("labels both ends of the voyage", () => {
  at(4.325);
  expect(screen.getByText("Porto")).toBeInTheDocument();
  expect(screen.getByText("Jönköping")).toBeInTheDocument();
});

test("works without the 3D scene", () => {
  at(4.0);
  expect(screen.getByRole("img", { name: MAP })).toBeInTheDocument();
});

test("still shows and draws with scroll when motion is reduced", () => {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (q: string) => ({ matches: q.includes("reduce"), media: q }) as MediaQueryList,
  );
  const { container } = at(4.325);
  expect(screen.getByRole("img", { name: MAP })).toBeInTheDocument();
  expect(Number(container.querySelector("mask path")!.getAttribute("stroke-dashoffset"))).toBeCloseTo(0.5);
});
