import { expect, test } from "vitest";
import { failLine, linkSlug, parseEvents } from "./chat";

test("splits whole SSE blocks off and keeps the unfinished rest for the next chunk", () => {
  const { events, rest } = parseEvents(
    'event: bubble\ndata: {"text": "Hi."}\n\nevent: links\r\ndata: []\r\n\r\nevent: images\ndata: [{"src"',
  );
  expect(events).toEqual([
    { event: "bubble", data: { text: "Hi." } },
    { event: "links", data: [] },
  ]);
  expect(rest).toBe('event: images\ndata: [{"src"');
  expect(parseEvents(rest + ': "/a.webp", "alt": "A"}]\n\n').events).toEqual([
    { event: "images", data: [{ src: "/a.webp", alt: "A" }] },
  ]);
});

test("read-more links give their project's slug; errors give a line of his", () => {
  expect(linkSlug("/?project=unet-segmentation")).toBe("unet-segmentation");
  expect(linkSlug("/about")).toBeNull();
  expect(failLine(422)).toMatch(/shorter/);
  expect(failLine()).toMatch(/again/);
});
