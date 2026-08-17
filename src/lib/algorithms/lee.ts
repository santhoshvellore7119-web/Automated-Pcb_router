import { Coord, WavefrontStep } from '../../types/router';
import { coordKey, getNeighbors } from '../gridUtils';

export interface RouteSingleNetParams {
  source: Coord;
  target: Coord;
  rows: number;
  cols: number;
  layers: number;
  obstacles: Set<string>; // Set of coordKey strings
  occupied: Set<string>;  // Set of coordKey strings (from other nets)
  cellPenalties?: Map<string, number>; // Extra ripup penalty map
  recordWavefront?: boolean;
}

export interface SingleNetRouteResult {
  path: Coord[];
  status: 'ROUTED' | 'FAILED';
  wirelength: number;
  viaCount: number;
  cellsExplored: number;
  visitedSet: Set<string>;
  wavefrontSteps?: WavefrontStep[];
}

export function routeNetLee(params: RouteSingleNetParams): SingleNetRouteResult {
  const { source, target, rows, cols, layers, obstacles, occupied, recordWavefront = true } = params;

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

  // FIFO Queue for BFS flood fill
  const queue: Coord[] = [source];
  const parentMap = new Map<string, Coord>();
  const visitedSet = new Set<string>([srcKey]);
  const wavefrontSteps: WavefrontStep[] = [];

  let targetFound = false;
  let stepIdx = 0;

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const currK = coordKey(curr);

    // Stop immediately upon discovering target
    if (currK === tgtKey) {
      targetFound = true;
      break;
    }

    const neighbors = getNeighbors(curr, rows, cols, layers);
    const addedFrontier: Coord[] = [];

    for (const n of neighbors) {
      const nk = coordKey(n.coord);

      // Target is always accessible even if occupied by target net pin
      const isTarget = nk === tgtKey;

      if (!visitedSet.has(nk)) {
        if (!isTarget && (obstacles.has(nk) || occupied.has(nk))) {
          continue; // Blocked
        }

        visitedSet.add(nk);
        parentMap.set(nk, curr);
        queue.push(n.coord);
        addedFrontier.push(n.coord);

        if (nk === tgtKey) {
          targetFound = true;
          break;
        }
      }
    }

    if (recordWavefront) {
      wavefrontSteps.push({
        stepIndex: stepIdx,
        currentCoord: curr,
        visitedCount: visitedSet.size,
        addedFrontier,
      });
    }
    stepIdx++;

    if (targetFound) break;
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

  // Reconstruct path from target to source
  const path: Coord[] = [];
  let currK: string | undefined = tgtKey;
  while (currK) {
    const [l, r, c] = currK.split(',').map(Number);
    path.unshift({ layer: l, row: r, col: c });
    const pCoord: Coord | undefined = parentMap.get(currK);
    currK = pCoord ? coordKey(pCoord) : undefined;
  }

  // Compute metrics
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
