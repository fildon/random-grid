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
   * The collection of all tilings produceable by adding one more tile to this tiling
   */
  generateChildren(): Array<Tiling> {
    const childTiles: Array<Tile> = [];

    // We'll try placing a tile in every possible position both horizontally and vertically
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const horizontalTile = new Tile([
          new Position(x, y),
          new Position(x + 1, y),
        ]);
        if (this.canPlaceTile(horizontalTile)) {
          childTiles.push(horizontalTile);
        }
        const verticalTile = new Tile([
          new Position(x, y),
          new Position(x, y + 1),
        ]);
        if (this.canPlaceTile(verticalTile)) {
          childTiles.push(verticalTile);
        }
      }
    }

    return childTiles.map(
      // Advancing here is an optimizing to skip a lot of thin branches
      (tile) => new Tiling(this.width, this.height, [...this.tiles, tile]).advanceTrivialTiles()
    ).filter((tiling): tiling is Tiling => tiling !== null);
  }

  /**
   * Advance the current tiling by inserting trivial tiles where only one option exists
   *
   * In some cases this can uncover that the current state is non-viable, in which case we return null
   */
  advanceTrivialTiles(): Tiling | null {
    // TODO review
    // Find positions with three occupied neighbours
    const positions = this.tiles.flatMap((tile) => tile.tilePosition);
    const counts = new Map<string, number>();
    for (const pos of positions) {
      const key = `${pos.x},${pos.y}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    // Find all positions with exactly three occupied neighbours
    const candidates = Array.from(counts.entries())
      .filter(([_, count]) => count === 3)
      .map(([key]) => {
        const [x, y] = key.split(",").map(Number);
        return new Position(x, y);
      });

    // If we have no candidates, there's nothing to do
    if (candidates.length === 0) {
      return this;
    }

    // Otherwise, we need to create new tiles for each candidate
    const newTiles = candidates.map((pos) => {
      const tile = new Tile([pos, new Position(pos.x + 1, pos.y)]);
      return tile;
    });

    // Create a new Tiling with the new tiles added
    return new Tiling(this.width, this.height, [...this.tiles, ...newTiles]);
  }

  /**
   * A tiling is complete when every position is occupied by a tile
   */
  isComplete(): boolean {
    // WARNING: this will never be true for odd width*height
    // This is a little trick because we know each tile covers 2 squares
    // and there are no overlaps
    return this.tiles.length === (this.width * this.height) / 2;
  }

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
