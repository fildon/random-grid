class Position {
  constructor(public x: number, public y: number) {}
  isEqual(other: Position): boolean {
    return this.x === other.x && this.y === other.y;
  }
}

export class Tile {
  constructor(
    public tilePosition: [Position, Position],
    public id: number = Math.floor(Math.random() * 32)
  ) {}
  overlaps(other: Tile): boolean {
    return other.tilePosition.some((a) =>
      this.tilePosition.some((b) => b.isEqual(a))
    );
  }
}

class Tiling {
  constructor(
    public width: number,
    public height: number,
    public tiles: Array<Tile>
  ) {}

  occupiedPositions(): Array<Position> {
    return this.tiles.flatMap((tile) => tile.tilePosition);
  }

  isInBounds(position: Position): boolean {
    return (
      position.x >= 0 &&
      position.x < this.width &&
      position.y >= 0 &&
      position.y < this.height
    );
  }

  isFreePosition(position: Position): boolean {
    return (
      this.isInBounds(position) &&
      !this.occupiedPositions().some((p) => p.isEqual(position))
    );
  }

  freePositions(): Array<Position> {
    const positions: Array<Position> = [];
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        const newPosition = new Position(x, y);
        if (this.isFreePosition(newPosition)) {
          positions.push(newPosition);
        }
      }
    }
    return positions;
  }

  /**
   * A tiling is complete when every position is occupied
   */
  isComplete(): boolean {
    return this.occupiedPositions().length === this.width * this.height;
  }

  /**
   * The set of free positions is connected.
   *
   * Notably we consider the empty set to be connected.
   */
  hasConnectedVacancy(): boolean {
    const freePositions = this.freePositions();
    if (freePositions.length === 0) {
      return true;
    }

    // Flood fill from the first free position
    const toVisit = [freePositions[0]];
    const visited: Array<Position> = [];

    while (toVisit.length > 0) {
      const current = toVisit.pop()!;
      if (visited.some((p) => p.isEqual(current))) {
        continue;
      }
      visited.push(current);

      // Add all 4 neighboring positions
      const neighbors = [
        new Position(current.x - 1, current.y),
        new Position(current.x + 1, current.y),
        new Position(current.x, current.y - 1),
        new Position(current.x, current.y + 1),
      ];
      for (const neighbor of neighbors) {
        if (
          freePositions.some((p) => p.isEqual(neighbor)) &&
          !visited.some((p) => p.isEqual(neighbor))
        ) {
          toVisit.push(neighbor);
        }
      }
    }

    return visited.length === freePositions.length;
  }

  /**
   * Walk one step down the tree of possible tilings
   */
  generateChildren(): Array<Tiling> {
    // Find the most tightly controlled position
    // We should generate only as many children as we have choices at the most tightly controlled position
    const freePositions = this.freePositions()
      .map((value) => ({
        value,
        rank:
          // Random factor to break ties
          Math.random() +
          // Euclidean distance from center, negated to bias away from centre
          -1 *
            Math.sqrt(
              Math.abs(value.x - this.width / 2) ** 2 +
                Math.abs(value.y - this.height / 2) ** 2
            ),
      }))
      .toSorted((a, b) => a.rank - b.rank)
      .map(({ value }) => value);
    if (freePositions.length === 0) {
      return [];
    }

    // Find the position with the fewest free neighbours
    let bestPosition: Position | null = null;
    let bestFreeNeighbours: Array<Position> = [];
    for (const position of freePositions) {
      const freeNeighbours = [
        new Position(position.x - 1, position.y),
        new Position(position.x + 1, position.y),
        new Position(position.x, position.y - 1),
        new Position(position.x, position.y + 1),
      ].filter((neighbour) => this.isFreePosition(neighbour));

      if (
        bestPosition === null ||
        freeNeighbours.length < bestFreeNeighbours.length
      ) {
        bestPosition = position;
        bestFreeNeighbours = freeNeighbours;
      }
    }

    return bestFreeNeighbours.map((neighbour) => {
      const newTile = new Tile([bestPosition!, neighbour]);
      return new Tiling(this.width, this.height, [...this.tiles, newTile]);
    });
  }
}

class TileTreeWalkNode {
  constructor(
    // Null for root
    public parent: TileTreeWalkNode | null,
    // Tiles placed so far
    public tiling: Tiling,
    // Each child differs by one additional tile
    public children: Array<TileTreeWalkNode> = [],
    // Whether we have already explored this node
    public visited: boolean = false,
    // Whether this node can possibly lead to a solution
    public viable: boolean = true
  ) {}
}

export function* initTileGenerator(
  width: number,
  height: number
): Generator<Array<Tile>, Array<Tile>, unknown> {
  const root = new TileTreeWalkNode(null, new Tiling(width, height, []));
  let pointer = root;
  yield pointer.tiling.tiles;

  while (!pointer.tiling.isComplete()) {
    // Yield the current pointer state

    if (!pointer.viable) {
      // Backtrack to parent
      pointer = pointer.parent!;
      yield pointer.tiling.tiles;

      if (!pointer) {
        throw new Error("No complete tiling found");
      }

      // Accelerate backtracking until we find a node with connected vacancy
      let hasConnectedVacancy = pointer.tiling.hasConnectedVacancy();
      while (!hasConnectedVacancy) {
        // Backtrack to parent
        pointer.viable = false;
        pointer = pointer.parent!;
        yield pointer.tiling.tiles;
        if (!pointer) {
          throw new Error("No complete tiling found");
        }
        hasConnectedVacancy = pointer.tiling.hasConnectedVacancy();
      }
    }

    // Generate children if we haven't already visited this node
    if (!pointer.visited) {
      pointer.children = pointer.tiling
        .generateChildren()
        .map((tiling) => new TileTreeWalkNode(pointer, tiling));
      pointer.visited = true;
    }

    const viableChildren = pointer.children.filter((child) => child.viable);
    if (viableChildren.length === 0) {
      // We found no way to proceed. This is a deadend.
      pointer.viable = false;
      // Return to loop top
      continue;
    }

    // Randomly pick a viable child
    pointer = viableChildren[Math.floor(Math.random() * viableChildren.length)];
    yield pointer.tiling.tiles;
  }

  // We have found a complete tiling
  return pointer.tiling.tiles;
}
