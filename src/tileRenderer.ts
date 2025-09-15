import type { Tile } from "./tilingEngine";

export const renderTiles = (
  tiles: Array<Tile>,
  context: CanvasRenderingContext2D
) => {
  tiles.forEach((tile) => renderTile(tile, context));
};

const renderTile = (
  { topLeft, bottomRight }: Tile,
  context: CanvasRenderingContext2D
) => {
  context.strokeStyle = "black";
  context.lineWidth = 2;
  context.beginPath();
  context.roundRect(
    topLeft.x,
    topLeft.y,
    bottomRight.x - topLeft.x,
    bottomRight.y - topLeft.y,
    10
  );
  context.fillStyle = "rgba(0, 0, 0, 0.34)";
  context.fill();
  context.stroke();
};
