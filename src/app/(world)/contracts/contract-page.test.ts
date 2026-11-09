// @vitest-environment node
import { expect, test } from "vitest";
import { generateMetadata, generateStaticParams } from "./[slug]/page";

test("every contract is pre-rendered at its own URL", async () => {
  const params = await generateStaticParams();
  expect(params).toHaveLength(6);
  expect(params.map((p) => p.slug)).toContain("saab-thesis");
});

test("contract pages are titled for sharing", async () => {
  const meta = await generateMetadata({ params: Promise.resolve({ slug: "saab-thesis" }) });
  expect(meta.title).toBe("AI Driven Sensor Optimization for Marksman Posture Analysis - Master Thesis · Contracts · Eduardo Pereira");
});
