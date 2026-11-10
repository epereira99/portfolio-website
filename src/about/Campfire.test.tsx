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

const sse = (body: string) => new Response(body, { headers: { "Content-Type": "text/event-stream" } });

test("asking him: his answer in bubbles, its photo in a thought, its read-more opening the project", async () => {
  const fetch = vi.fn(async () =>
    sse(
      'event: bubble\ndata: {"text": "I built a U-Net."}\n\n' +
        'event: bubble\ndata: {"text": "It segments trees."}\n\n' +
        'event: links\ndata: [{"title": "Land analysis", "url": "/?project=unet-segmentation"}]\n\n' +
        'event: images\ndata: [{"src": "/personal/a.webp", "alt": "Me on the pitch", "caption": "U19"}]\n\n' +
        "event: done\ndata: {}\n\n",
    ),
  );
  vi.stubGlobal("fetch", fetch);
  render(<CampScreen />);
  act(() => {
    window.location.hash = "about";
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
  fireEvent.click(screen.getByRole("button", { name: "What did you do at Jordbruksverket?" }));
  expect(await screen.findByText("It segments trees.")).toBeInTheDocument();
  expect(screen.getByText("I built a U-Net.")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Me on the pitch" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Enlarge photo" })); // opens like a project's polaroid
  fireEvent.keyDown(screen.getByRole("button", { name: "Shrink photo" }), { key: "Escape" });
  expect(screen.queryByRole("button", { name: "Shrink photo" })).toBeNull();
  const sent = JSON.parse((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
  expect(sent.question).toBe("What did you do at Jordbruksverket?");
  expect(sent.session_id).toMatch(/^[0-9a-f-]{36}$/);

  fireEvent.click(screen.getByRole("button", { name: "Read more: Land analysis" }));
  expect(window.location.search).toBe("?project=unet-segmentation");

  fetch.mockResolvedValueOnce(new Response(null, { status: 503 }));
  fireEvent.change(screen.getByLabelText("Ask me anything"), { target: { value: "Hello?" } });
  fireEvent.click(screen.getByRole("button", { name: "Ask" }));
  expect(await screen.findByText(/head's in the clouds/)).toBeInTheDocument();
  expect(screen.queryByText("It segments trees.")).toBeNull();
  vi.unstubAllGlobals();
});
