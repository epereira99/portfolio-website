// Draw order for the world: whatever stands lower on screen is in front, so roofs and canopies hide the hunter behind them.
export const depthOf = (feetY: number) => feetY;
