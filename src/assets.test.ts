// @vitest-environment node
import { existsSync, readdirSync, statSync } from "node:fs";
import { describe, expect, test } from "vitest";

describe("memory walk assets stay within budget", () => {
  const walk = existsSync("public/walk") ? readdirSync("public/walk").filter((f) => f.endsWith(".webp")).sort() : [];

  test("139 walk frames named walk-000..walk-138", () => {
    expect(walk).toHaveLength(139);
    expect(walk[0]).toBe("walk-000.webp");
    expect(walk[138]).toBe("walk-138.webp");
  });

  test("walk frames total ≤ 4 MB", () => {
    const total = walk.reduce((sum, f) => sum + statSync(`public/walk/${f}`).size, 0);
    expect(total).toBeLessThanOrEqual(4 * 1024 * 1024);
  });
});
