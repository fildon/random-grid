import type { Tile } from "./tilingEngine";

export const renderTiles = (
  tiles: Array<Tile>,
  context: CanvasRenderingContext2D,
  cellSize: number
) => {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  tiles.forEach((tile) => renderTile(tile, context, cellSize));
};

const renderTile = (
  tile: Tile,
  context: CanvasRenderingContext2D,
  cellSize: number
) => {
  const minX = Math.min(tile.tilePosition[0].x, tile.tilePosition[1].x);
  const minY = Math.min(tile.tilePosition[0].y, tile.tilePosition[1].y);
  const maxX = Math.max(tile.tilePosition[0].x, tile.tilePosition[1].x);
  const maxY = Math.max(tile.tilePosition[0].y, tile.tilePosition[1].y);

  const topLeft = { x: minX * cellSize, y: minY * cellSize };
  const bottomRight = { x: maxX * cellSize + cellSize, y: maxY * cellSize + cellSize };

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
