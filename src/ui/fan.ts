// Even horizontal spacing so cards never overlap; height follows an elliptical arc (spec §4).
export function fanPositions(n: number, step = 130, rx = 420, ry = 170): { x: number; y: number }[] {
  return Array.from({ length: n }, (_, k) => {
    const x = (k - (n - 1) / 2) * step;
    return { x, y: -Math.sqrt(Math.max(0, 1 - (x / rx) ** 2)) * ry - 40 };
  });
}
