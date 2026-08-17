import { Coord, WavefrontStep } from '../../types/router';
import { coordKey, getNeighbors, manhattanDistance } from '../gridUtils';
import { RouteSingleNetParams, SingleNetRouteResult } from './lee';

interface HeapNode {
  coord: Coord;
  f: number;
  g: number;
  dir?: 'N' | 'S' | 'E' | 'W' | 'VIA';
  counter: number;
}

class MinHeap {
  private data: HeapNode[] = [];

  public push(node: HeapNode) {
    this.data.push(node);
    this.up(this.data.length - 1);
  }

  public pop(): HeapNode | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const bottom = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = bottom;
      this.down(0);
    }
    return top;
  }

  public size(): number {
    return this.data.length;
  }

  private up(i: number) {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (this.compare(this.data[i], this.data[p]) < 0) {
        [this.data[i], this.data[p]] = [this.data[p], this.data[i]];
        i = p;
      } else {
        break;
      }
    }
  }

  private down(i: number) {
    const len = this.data.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;

      if (left < len && this.compare(this.data[left], this.data[smallest]) < 0) {
        smallest = left;
      }
      if (right < len && this.compare(this.data[right], this.data[smallest]) < 0) {
        smallest = right;
      }
      if (smallest !== i) {
        [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
        i = smallest;
      } else {
        break;
      }
    }
  }

  private compare(a: HeapNode, b: HeapNode): number {
    if (Math.abs(a.f - b.f) > 1e-6) {
      return a.f - b.f;
    }
    return a.counter - b.counter; // Deterministic tie-breaker
  }
}

export function routeNetAStar(params: RouteSingleNetParams): SingleNetRouteResult {
  const {
    source,
    target,
    rows,
    cols,
    layers,
    obstacles,
    occupied,
    cellPenalties,
    recordWavefront = true,
  } = params;

  const srcKey = coordKey(source);
  const tgtKey = coordKey(target);

  if (srcKey === tgtKey) {
    return {
      path: [source],
      status: 'ROUTED',
      wirelength: 0,
      viaCount: 0,
      cellsExplored: 1,
      visitedSet: new Set([srcKey]),
    };
  }

  const openHeap = new MinHeap();
  const gScore = new Map<string, number>();
  const parentMap = new Map<string, Coord>();
  const visitedSet = new Set<string>();
  const wavefrontSteps: WavefrontStep[] = [];

  let counter = 0;
  gScore.set(srcKey, 0);

  const initialH = manhattanDistance(source, target);
  openHeap.push({
    coord: source,
    f: initialH,
    g: 0,
    counter: counter++,
  });

  let targetFound = false;
  let stepIdx = 0;

  while (openHeap.size() > 0) {
    const current = openHeap.pop()!;
    const currKey = coordKey(current.coord);

    if (visitedSet.has(currKey)) continue;
    visitedSet.add(currKey);

    if (currKey === tgtKey) {
      targetFound = true;
      break;
    }

    const neighbors = getNeighbors(current.coord, rows, cols, layers);
    const addedFrontier: Coord[] = [];

    for (const n of neighbors) {
      const nk = coordKey(n.coord);
      const isTarget = nk === tgtKey;

      if (!isTarget && (obstacles.has(nk) || occupied.has(nk))) {
        continue; // Obstacle or blocked by another net
      }

      // Base step cost + optional ripup penalty
      const ripPenalty = cellPenalties?.get(nk) || 0;
      let moveCost = n.cost + ripPenalty;

      // Small tie-breaking bend penalty (0.01) to prefer straight traces without breaking admissibility
      if (current.dir && current.dir !== n.dir && !n.isVia) {
        moveCost += 0.01;
      }

      const tentativeG = current.g + moveCost;
      const currentG = gScore.get(nk) ?? Infinity;

      if (tentativeG < currentG) {
        gScore.set(nk, tentativeG);
        parentMap.set(nk, current.coord);

        const h = manhattanDistance(n.coord, target);
        const f = tentativeG + h;

        openHeap.push({
          coord: n.coord,
          f,
          g: tentativeG,
          dir: n.dir,
          counter: counter++,
        });
        addedFrontier.push(n.coord);
      }
    }

    if (recordWavefront) {
      wavefrontSteps.push({
        stepIndex: stepIdx,
        currentCoord: current.coord,
        visitedCount: visitedSet.size,
        addedFrontier,
      });
    }
    stepIdx++;
  }

  if (!targetFound) {
    return {
      path: [],
      status: 'FAILED',
      wirelength: 0,
      viaCount: 0,
      cellsExplored: visitedSet.size,
      visitedSet,
      wavefrontSteps,
    };
  }

  // Path reconstruction
  const path: Coord[] = [];
  let currK: string | undefined = tgtKey;
  while (currK) {
    const [l, r, c] = currK.split(',').map(Number);
    path.unshift({ layer: l, row: r, col: c });
    const pCoord: Coord | undefined = parentMap.get(currK);
    currK = pCoord ? coordKey(pCoord) : undefined;
  }

  let wirelength = 0;
  let viaCount = 0;
  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    if (prev.layer !== curr.layer) {
      viaCount++;
    } else {
      wirelength++;
    }
  }

  return {
    path,
    status: 'ROUTED',
    wirelength,
    viaCount,
    cellsExplored: visitedSet.size,
    visitedSet,
    wavefrontSteps,
  };
}
