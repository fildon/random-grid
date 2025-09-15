import { renderTiles } from "./tileRenderer";
import { generateTiles } from "./tilingEngine";

const generateButton = document.getElementById("generate-button")!;
const canvasElement = document.querySelector("canvas")!;
const canvasContext = canvasElement.getContext("2d")!;

const paintRandomTiles = () => {
  canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);
  const tiles = generateTiles();
  renderTiles(tiles, canvasContext);
};

generateButton.addEventListener("click", paintRandomTiles);
paintRandomTiles();
