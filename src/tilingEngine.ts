type Position = { x: number; y: number };
export type Tile = { topLeft: Position; bottomRight: Position };

export const dummy = (): Array<Tile> => {
  return Array.from({ length: 10 }, () => {
    const x = Math.floor(Math.random() * 10) * 100;
    const y = Math.floor(Math.random() * 10) * 100;
    return {
      topLeft: { x, y },
      bottomRight: { x: x + 100, y: y + 200 },
    };
  });
};

const isEqual = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  return a.x === b.x && a.y === b.y;
};

export const generateTiles = (): Array<Tile> => {
  let availableLocations: Array<{ x: number; y: number }> = [];
  for (let x = 0; x < 10; x++) {
    for (let y = 0; y < 10; y++) {
      availableLocations.push({ x, y });
    }
  }

  let tiles: Array<Tile> = [];
  let retries = 0;
  while (retries < 5) {
    const randomIndex = Math.floor(Math.random() * availableLocations.length);
    const location = availableLocations[randomIndex];
    const neighbours = [
      { x: location.x + 1, y: location.y },
      { x: location.x - 1, y: location.y },
      { x: location.x, y: location.y + 1 },
      { x: location.x, y: location.y - 1 },
    ].filter((location) =>
      availableLocations.some((other) => isEqual(location, other))
    );
    if (neighbours.length === 0) {
      // We failed to find an available neighbour
      // So we reset this loop and try again
      retries++;
      continue;
    } else {
      // We successfully placed a tile, so we reset retries
      retries = 0;
    }

    const neighbour = neighbours[Math.floor(Math.random() * neighbours.length)];

    const [firstHalf, secondHalf] = [location, neighbour].sort((a, b) =>
      // Ascending on X, tiebreak on ascending Y
      a.x === b.x ? a.y - b.y : a.x - b.x
    );
    tiles.push({
      // We have a pair of x,y coordinates in 0-9 range
      // We want to convert them into pixel coordinates in 0-1000 range
      topLeft: { x: firstHalf.x * 100, y: firstHalf.y * 100 },
      bottomRight: { x: secondHalf.x * 100 + 100, y: secondHalf.y * 100 + 100 },
    });
    availableLocations = availableLocations.filter(
      (loc) => !isEqual(loc, location) && !isEqual(loc, neighbour)
    );
  }

  return tiles;
};
