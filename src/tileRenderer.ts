import type { Tile } from "./tilingEngine";

export const renderTiles = (
  tiles: Array<Tile>,
  context: CanvasRenderingContext2D
) => {
  tiles.forEach((tile) => renderTile(tile, context));
};

const renderTile = (
  tile: Tile,
  context: CanvasRenderingContext2D
) => {
  const minX = Math.min(tile.tilePosition[0].x, tile.tilePosition[1].x);
  const minY = Math.min(tile.tilePosition[0].y, tile.tilePosition[1].y);
  const maxX = Math.max(tile.tilePosition[0].x, tile.tilePosition[1].x);
  const maxY = Math.max(tile.tilePosition[0].y, tile.tilePosition[1].y);

  const topLeft = { x: minX * 100, y: minY * 100 };
  const bottomRight = { x: maxX * 100 + 100, y: maxY * 100 + 100 };

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
