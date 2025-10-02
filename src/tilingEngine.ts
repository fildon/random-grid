class Position {
  constructor(public x: number, public y: number) {}
  isEqual(other: Position): boolean {
    return this.x === other.x && this.y === other.y;
  }
}

export class Tile {
  constructor(public tilePosition: [Position, Position]) {}
  overlaps(other: Tile): boolean {
    const [a, b] = this.tilePosition;
    return other.tilePosition.some((pos) => a.isEqual(pos) || b.isEqual(pos));
  }
}

class Tiling {
  constructor(
    public width: number,
    public height: number,
    public tiles: Array<Tile>
  ) {}

  /**
   * Is the given tile a valid addition to this tiling?
   */
  canPlaceTile(newTile: Tile): boolean {
    // We can place a tile if it doesn't overlap existing tiles
    const hasOverlap = this.tiles.some((existingTile) =>
      newTile.overlaps(existingTile)
    );

    // And if it's within bounds
    const withinBounds = newTile.tilePosition.every(
      (pos) =>
        pos.x >= 0 && pos.x < this.width && pos.y >= 0 && pos.y < this.height
    );

    return !hasOverlap && withinBounds;
  }

  /**
   * Walk one step down the tree of possible tilings
   */
  generateChildren(): Array<Tiling> {
    // Find the most tightly controlled position
    // We should generate only as many children as we have choices at the most tightly controlled position
    const freePositions = this.freePositions();
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
      if (!this.canPlaceTile(newTile)) {
        throw new Error("Logic error: cannot place tile");
      }
      return new Tiling(this.width, this.height, [...this.tiles, newTile]);
    });
  }

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
    return this.isInBounds(position) && !this.occupiedPositions().some((p) => p.isEqual(position));
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
   * If everything is working correctly, this always returns false.
   * But it is useful for debugging.
   */
  hasOverlaps(): boolean {
    for (let i = 0; i < this.tiles.length; i++) {
      for (let j = i + 1; j < this.tiles.length; j++) {
        if (this.tiles[i].overlaps(this.tiles[j])) {
          return true;
        }
      }
    }
    return false;
  }
}

class TileTreeWalkNode {
  constructor(
    // // Null for root
    public parent: TileTreeWalkNode | null,
    // // Tiles placed so far
    public tiling: Tiling,
    // // Each child differs by one additional tile
    public children: Array<TileTreeWalkNode> = [],
    // // Whether we have already explored this node
    public visited: boolean = false,
    // // Whether this node can possibly lead to a solution
    public viable: boolean = true
  ) {}
  countVisited(): number {
    return (
      (this.visited ? 1 : 0) +
      this.children.reduce((sum, child) => sum + child.countVisited(), 0)
    );
  }
  countViable(): number {
    return (
      (this.viable ? 1 : 0) +
      this.children.reduce((sum, child) => sum + child.countViable(), 0)
    );
  }
}

export const generateTiles = (): Array<Tile> => {
  const root = new TileTreeWalkNode(null, new Tiling(10, 10, []));
  let pointer = root;

  while (!pointer.tiling.isComplete()) {
    if (!pointer.viable) {
      // Backtrack to parent
      pointer = pointer.parent!;

      if (!pointer) {
        throw new Error("No complete tiling found");
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
  }

  // We have found a complete tiling
  return pointer.tiling.tiles;
};
