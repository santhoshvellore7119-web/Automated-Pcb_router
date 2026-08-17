import { Coord } from '../types/router';

export function coordKey(c: Coord): string {
  return `${c.layer},${c.row},${c.col}`;
}

export function parseCoordKey(key: string): Coord {
  const [l, r, c] = key.split(',').map(Number);
  return { layer: l, row: r, col: c };
}

export interface Neighbor {
  coord: Coord;
  isVia: boolean;
  cost: number;
  dir: 'N' | 'S' | 'E' | 'W' | 'VIA';
}

export function getNeighbors(
  curr: Coord,
  rows: number,
  cols: number,
  layers: number,
  viaCost: number = 2
): Neighbor[] {
  const neighbors: Neighbor[] = [];
  const { layer, row, col } = curr;

  // Cardinal grid directions
  const directions: Array<{ r: number; c: number; dir: 'N' | 'S' | 'E' | 'W' }> = [
    { r: -1, c: 0, dir: 'N' },
    { r: 1, c: 0, dir: 'S' },
    { r: 0, c: -1, dir: 'W' },
    { r: 0, c: 1, dir: 'E' },
  ];

  for (const d of directions) {
    const nr = row + d.r;
    const nc = col + d.c;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
      neighbors.push({
        coord: { layer, row: nr, col: nc },
        isVia: false,
        cost: 1,
        dir: d.dir,
      });
    }
  }

  // Layer transition via (if 2 layers)
  if (layers > 1) {
    const otherLayer = layer === 0 ? 1 : 0;
    neighbors.push({
      coord: { layer: otherLayer, row, col },
      isVia: true,
      cost: viaCost,
      dir: 'VIA',
    });
  }

  return neighbors;
}

export function manhattanDistance(a: Coord, b: Coord, viaCost: number = 2): number {
  const gridDist = Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
  const layerDist = a.layer !== b.layer ? viaCost : 0;
  return gridDist + layerDist;
}
