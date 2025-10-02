import { renderTiles } from "./tileRenderer";
import { buildCompleteTiling, initTileGenerator } from "./tilingEngine";

const generateButton = document.getElementById("generate-button")!;
const canvasElement = document.querySelector("canvas")!;
const canvasContext = canvasElement.getContext("2d")!;

let currentController: AbortController | null = null;

const paintRandomTiles = async () => {
  // Cancel any existing operation
  if (currentController) {
    currentController.abort();
  }
  
  // Create new controller for this operation
  currentController = new AbortController();
  const signal = currentController.signal;
  
  try {
    const tileGenerator = initTileGenerator();
    let result = tileGenerator.next();
    renderTiles(result.value, canvasContext);
    
    while (!result.done) {
      // Check if operation was cancelled
      if (signal.aborted) {
        return;
      }
      
      await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(resolve, 10);
        signal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          reject(new DOMException('Operation cancelled', 'AbortError'));
        });
      });
      
      result = tileGenerator.next();
      renderTiles(result.value, canvasContext);
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      // Operation was cancelled, this is expected
      return;
    }
    // Re-throw other errors
    throw error;
  }
};

generateButton.addEventListener("click", paintRandomTiles);
paintRandomTiles();

