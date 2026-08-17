import { Board, Net, NetResult, RipUpEvent } from '../../types/router';
import { coordKey, manhattanDistance } from '../gridUtils';
import { UnionFind } from '../unionFind';
import { routeNetAStar } from './astar';
import { RouteSingleNetParams } from './lee';

export interface RipUpResult {
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED';
  netsRouted: number;
  totalWirelength: number;
  totalVias: number;
  totalCellsExplored: number;
  netResults: NetResult[];
  ripupEvents: RipUpEvent[];
  conflictClusters: Array<{ clusterId: number; netIds: string[] }>;
}

export function routeRipUpAndReroute(board: Board, maxRounds: number = 10): RipUpResult {
  const obstacleSet = new Set<string>();
  for (const obs of board.obstacles) {
    obstacleSet.add(coordKey(obs));
  }

  // Sort nets shortest Manhattan distance first, or by explicit priority
  const sortedNets: Net[] = [...board.nets].sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    const distA = manhattanDistance(a.source, a.target);
    const distB = manhattanDistance(b.source, b.target);
    return distA - distB;
  });

  const unionFind = new UnionFind(board.nets.map((n) => n.id));
  const netPaths = new Map<string, NetResult>();
  const occupiedByNet = new Map<string, string>(); // coordKey -> netId
  const cellPenalties = new Map<string, number>(); // coordKey -> penalty value
  const ripupEvents: RipUpEvent[] = [];

  let totalCellsExplored = 0;

  // Round 0: Route all nets greedily with A*
  for (const net of sortedNets) {
    const occupiedKeys = new Set(occupiedByNet.keys());

    const routeParams: RouteSingleNetParams = {
      source: net.source,
      target: net.target,
      rows: board.rows,
      cols: board.cols,
      layers: board.layers,
      obstacles: obstacleSet,
      occupied: occupiedKeys,
      cellPenalties,
      recordWavefront: false,
    };

    const result = routeNetAStar(routeParams);
    totalCellsExplored += result.cellsExplored;

    const netRes: NetResult = {
      netId: net.id,
      netName: net.name,
      color: net.color,
      status: result.status,
      path: result.path,
      wirelength: result.wirelength,
      viaCount: result.viaCount,
      cellsExplored: result.cellsExplored,
    };

    netPaths.set(net.id, netRes);

    if (result.status === 'ROUTED') {
      for (const p of result.path) {
        occupiedByNet.set(coordKey(p), net.id);
      }
    }
  }

  // Iterative Rip-Up & Reroute Rounds
  let round = 1;
  let progressInRound = true;

  while (round <= maxRounds && progressInRound) {
    const unroutedNets = sortedNets.filter(
      (n) => netPaths.get(n.id)?.status !== 'ROUTED'
    );

    if (unroutedNets.length === 0) {
      break; // All nets successfully routed!
    }

    progressInRound = false;

    for (const failingNet of unroutedNets) {
      // Find blocking net inside bounding box between source and target
      const minRow = Math.min(failingNet.source.row, failingNet.target.row);
      const maxRow = Math.max(failingNet.source.row, failingNet.target.row);
      const minCol = Math.min(failingNet.source.col, failingNet.target.col);
      const maxCol = Math.max(failingNet.source.col, failingNet.target.col);

      // Collect all routed nets occupying cells in bounding box or overall board
      const blockingNetCounts = new Map<string, number>();
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          for (let l = 0; l < board.layers; l++) {
            const k = coordKey({ layer: l, row: r, col: c });
            const ownerId = occupiedByNet.get(k);
            if (ownerId && ownerId !== failingNet.id) {
              blockingNetCounts.set(ownerId, (blockingNetCounts.get(ownerId) || 0) + 1);
            }
          }
        }
      }

      let blockingNetIdToRip: string | null = null;
      let maxCount = 0;
      for (const [netId, count] of blockingNetCounts.entries()) {
        if (count > maxCount) {
          maxCount = count;
          blockingNetIdToRip = netId;
        }
      }

      // Fallback: pick any active net if bounding box yielded none
      if (!blockingNetIdToRip) {
        for (const [coordK, netId] of occupiedByNet.entries()) {
          if (netId !== failingNet.id) {
            blockingNetIdToRip = netId;
            break;
          }
        }
      }

      if (blockingNetIdToRip) {
        const blockingNet = board.nets.find((n) => n.id === blockingNetIdToRip)!;

        // Cluster mutually conflicting nets in Union-Find
        unionFind.union(failingNet.id, blockingNetIdToRip);

        // Rip up the blocking net
        const blockingNetRes = netPaths.get(blockingNetIdToRip);
        if (blockingNetRes && blockingNetRes.path.length > 0) {
          for (const p of blockingNetRes.path) {
            const pk = coordKey(p);
            occupiedByNet.delete(pk);
            // Increase cell penalty on ripped cells to encourage detour
            cellPenalties.set(pk, (cellPenalties.get(pk) || 0) + 5);
          }
        }

        netPaths.set(blockingNetIdToRip, {
          ...blockingNetRes!,
          status: 'UNROUTABLE',
          path: [],
          wirelength: 0,
          viaCount: 0,
        });

        ripupEvents.push({
          round,
          rippedNetId: blockingNet.id,
          rippedNetName: blockingNet.name,
          triggeringNetId: failingNet.id,
          triggeringNetName: failingNet.name,
          reason: `Ripped to clear corridor in bounding box (${maxCount} overlapping cells)`,
        });

        // First reroute failingNet
        const occupiedKeys1 = new Set(occupiedByNet.keys());
        const route1 = routeNetAStar({
          source: failingNet.source,
          target: failingNet.target,
          rows: board.rows,
          cols: board.cols,
          layers: board.layers,
          obstacles: obstacleSet,
          occupied: occupiedKeys1,
          cellPenalties,
          recordWavefront: false,
        });
        totalCellsExplored += route1.cellsExplored;

        if (route1.status === 'ROUTED') {
          netPaths.set(failingNet.id, {
            netId: failingNet.id,
            netName: failingNet.name,
            color: failingNet.color,
            status: 'ROUTED',
            path: route1.path,
            wirelength: route1.wirelength,
            viaCount: route1.viaCount,
            cellsExplored: route1.cellsExplored,
          });
          for (const p of route1.path) {
            occupiedByNet.set(coordKey(p), failingNet.id);
          }
          progressInRound = true;
        }

        // Then attempt to reroute the ripped blocking net with updated cell penalties
        const occupiedKeys2 = new Set(occupiedByNet.keys());
        const route2 = routeNetAStar({
          source: blockingNet.source,
          target: blockingNet.target,
          rows: board.rows,
          cols: board.cols,
          layers: board.layers,
          obstacles: obstacleSet,
          occupied: occupiedKeys2,
          cellPenalties,
          recordWavefront: false,
        });
        totalCellsExplored += route2.cellsExplored;

        if (route2.status === 'ROUTED') {
          netPaths.set(blockingNet.id, {
            netId: blockingNet.id,
            netName: blockingNet.name,
            color: blockingNet.color,
            status: 'ROUTED',
            path: route2.path,
            wirelength: route2.wirelength,
            viaCount: route2.viaCount,
            cellsExplored: route2.cellsExplored,
          });
          for (const p of route2.path) {
            occupiedByNet.set(coordKey(p), blockingNet.id);
          }
          progressInRound = true;
        }
      }
    }

    round++;
  }

  // Calculate final aggregated statistics
  const finalNetResults = Array.from(netPaths.values());
  const netsRouted = finalNetResults.filter((r) => r.status === 'ROUTED').length;
  const totalWirelength = finalNetResults.reduce((acc, r) => acc + r.wirelength, 0);
  const totalVias = finalNetResults.reduce((acc, r) => acc + r.viaCount, 0);

  let status: 'COMPLETED' | 'PARTIAL' | 'FAILED' = 'FAILED';
  if (netsRouted === board.nets.length) {
    status = 'COMPLETED';
  } else if (netsRouted > 0) {
    status = 'PARTIAL';
  }

  return {
    status,
    netsRouted,
    totalWirelength,
    totalVias,
    totalCellsExplored,
    netResults: finalNetResults,
    ripupEvents,
    conflictClusters: unionFind.getClusters(),
  };
}
