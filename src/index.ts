import { renderTiles } from "./tileRenderer";
import { initTileGenerator } from "./tilingEngine";

const generateButton = document.getElementById("generate-button")!;
const canvasElement = document.querySelector("canvas")!;
const canvasContext = canvasElement.getContext("2d")!;

let currentController: AbortController | null = null;

const CANVAS_SIZE = 1000; // Must match what we see in the HTML
const GRID_SIZE = 30; // Logical with and height of positions
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE; // Size of a cell given the number of cells

const paintRandomTiles = async () => {
  // Cancel any existing operation
  if (currentController) {
    currentController.abort();
  }

  // Create new controller for this operation
  currentController = new AbortController();
  const signal = currentController.signal;

  try {
    const tileGenerator = initTileGenerator(GRID_SIZE, GRID_SIZE);
    let result = tileGenerator.next();
    renderTiles(result.value, canvasContext, CELL_SIZE);

    while (!result.done) {
      // Check if operation was cancelled
      if (signal.aborted) {
        return;
      }

      await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(resolve, 1);
        signal.addEventListener("abort", () => {
          clearTimeout(timeoutId);
          reject(new DOMException("Operation cancelled", "AbortError"));
        });
      });

      result = tileGenerator.next();
      renderTiles(result.value, canvasContext, CELL_SIZE);
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      // Operation was cancelled, this is expected
      return;
    }
    // Re-throw other errors
    throw error;
  }
};

generateButton.addEventListener("click", paintRandomTiles);
paintRandomTiles();
