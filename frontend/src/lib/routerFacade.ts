import {
  Board,
  ComparisonReport,
  NetResult,
  RoutingRunReport,
} from '../types/router';
import { routeNetAStar } from './algorithms/astar';
import { routeNetLee } from './algorithms/lee';
import { routeRipUpAndReroute } from './algorithms/ripup';
import { coordKey } from './gridUtils';
import { validateDRC, defaultDRCRules } from './drcValidator';

// Common function to run a routing algorithm on a board
function runRoutingAlgorithmOnBoard(
  board: Board,
  algorithmName: 'lee' | 'astar',
  routeFunction: (params: any) => any
): RoutingRunReport {
  const startTime = performance.now();
  const obstacleSet = new Set(board.obstacles.map(coordKey));
  const occupiedSet = new Set<string>();
  const netResults: NetResult[] = [];
  const gridOccupancy: Record<string, string> = {};

  for (const obs of board.obstacles) {
    gridOccupancy[coordKey(obs)] = 'OBSTACLE';
  }

  let totalCellsExplored = 0;

  for (const net of board.nets) {
    const res = routeFunction({
      source: net.source,
      target: net.target,
      rows: board.rows,
      cols: board.cols,
      layers: board.layers,
      obstacles: obstacleSet,
      occupied: occupiedSet,
      recordWavefront: true,
    });

    totalCellsExplored += res.cellsExplored;

    if (res.status === 'ROUTED') {
      for (const p of res.path) {
        const pk = coordKey(p);
        occupiedSet.add(pk);
        gridOccupancy[pk] = net.id;
      }
    }

    netResults.push({
      netId: net.id,
      netName: net.name,
      color: net.color,
      status: res.status,
      path: res.path,
      wirelength: res.wirelength,
      viaCount: res.viaCount,
      cellsExplored: res.cellsExplored,
    });
  }

  const endTime = performance.now();
  const netsRouted = netResults.filter((r) => r.status === 'ROUTED').length;
  const totalWirelength = netResults.reduce((sum, r) => sum + r.wirelength, 0);
  const totalVias = netResults.reduce((sum, r) => sum + r.viaCount, 0);

  let status: 'COMPLETED' | 'PARTIAL' | 'FAILED' = 'FAILED';
  if (netsRouted === board.nets.length) status = 'COMPLETED';
  else if (netsRouted > 0) status = 'PARTIAL';

  // Run DRC validation on the routing results
  const drcResult = validateDRC(board, netResults, defaultDRCRules);

  return {
    algorithm: algorithmName,
    boardId: board.id,
    boardName: board.name,
    rows: board.rows,
    cols: board.cols,
    layers: board.layers,
    status,
    netsTotal: board.nets.length,
    netsRouted,
    totalWirelength,
    totalVias,
    totalCellsExplored,
    executionTimeMs: Math.max(0.1, +(endTime - startTime).toFixed(2)),
    netResults,
    gridOccupancy,
    drcResult,
  };
}

export function runLeeOnBoard(board: Board): RoutingRunReport {
  return runRoutingAlgorithmOnBoard(board, 'lee', routeNetLee);
}

export function runAStarOnBoard(board: Board): RoutingRunReport {
  return runRoutingAlgorithmOnBoard(board, 'astar', routeNetAStar);
}

export function runRipUpOnBoard(board: Board): RoutingRunReport {
  const startTime = performance.now();
  const result = routeRipUpAndReroute(board, 10);
  const endTime = performance.now();

  const gridOccupancy: Record<string, string> = {};
  for (const obs of board.obstacles) {
    gridOccupancy[coordKey(obs)] = 'OBSTACLE';
  }
  for (const nr of result.netResults) {
    if (nr.status === 'ROUTED') {
      for (const p of nr.path) {
        gridOccupancy[coordKey(p)] = nr.netId;
      }
    }
  }

  // Run DRC validation on the routing results
  const drcResult = validateDRC(board, result.netResults, defaultDRCRules);

  return {
    algorithm: 'ripup',
    boardId: board.id,
    boardName: board.name,
    rows: board.rows,
    cols: board.cols,
    layers: board.layers,
    status: result.status,
    netsTotal: board.nets.length,
    netsRouted: result.netsRouted,
    totalWirelength: result.totalWirelength,
    totalVias: result.totalVias,
    totalCellsExplored: result.totalCellsExplored,
    executionTimeMs: Math.max(0.1, +(endTime - startTime).toFixed(2)),
    netResults: result.netResults,
    ripupEvents: result.ripupEvents,
    conflictClusters: result.conflictClusters,
    gridOccupancy,
    drcResult,
  };
}

export function compareAllAlgorithms(board: Board): ComparisonReport {
  const lee = runLeeOnBoard(board);
  const astar = runAStarOnBoard(board);
  const ripup = runRipUpOnBoard(board);

  const leeCells = lee.totalCellsExplored || 1;
  const astarCells = astar.totalCellsExplored || 1;
  const speedupAstarOverLee = +(leeCells / astarCells).toFixed(2);

  const leeW = lee.totalWirelength || 1;
  const astarW = astar.totalWirelength || 1;
  const wirelengthDifferencePercent = +(((astarW - leeW) / leeW) * 100).toFixed(1);

  return {
    board,
    lee,
    astar,
    ripup,
    speedupAstarOverLee,
    wirelengthDifferencePercent,
  };
}
