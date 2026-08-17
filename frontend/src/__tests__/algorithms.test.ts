import { routeNetLee, RouteSingleNetParams } from '../lib/algorithms/lee';
import { routeNetAStar } from '../lib/algorithms/astar';
import { Board, Coord } from '../types/router';

describe('Routing Algorithms', () => {
  const createTestParams = (source: Coord, target: Coord, boardSize = 10): RouteSingleNetParams => {
    return {
      source,
      target,
      rows: boardSize,
      cols: boardSize,
      layers: 1,
      obstacles: new Set(),
      occupied: new Set(),
      recordWavefront: false,
    };
  };

  describe("Lee's Algorithm (BFS)", () => {
    test('should find shortest path in open grid', () => {
      const source: Coord = { layer: 0, row: 0, col: 0 };
      const target: Coord = { layer: 0, row: 3, col: 3 };

      const result = routeNetLee(createTestParams(source, target));

      expect(result.status).toBe('ROUTED');
      // Manhattan distance should be 6 (3 down + 3 right)
      expect(result.wirelength).toBe(6);
      expect(result.path.length).toBe(7); // wirelength + 1 for source
    });

    test('should handle same source and target', () => {
      const coord: Coord = { layer: 0, row: 5, col: 5 };

      const result = routeNetLee(createTestParams(coord, coord));

      expect(result.status).toBe('ROUTED');
      expect(result.wirelength).toBe(0);
      expect(result.path).toEqual([coord]);
    });

    test('should find path around simple obstacle', () => {
      const source: Coord = { layer: 0, row: 0, col: 0 };
      const target: Coord = { layer: 0, row: 0, col: 4 };
      const obstacles = new Set(['0,0,1', '0,0,2', '0,0,3']); // Block direct path

      const params = createTestParams(source, target);
      params.obstacles = obstacles;

      const result = routeNetLee(params);

      expect(result.status).toBe('ROUTED');
      // Should go down, right, then up to avoid obstacle
      expect(result.wirelength).toBeGreaterThan(4);
    });
  });

  describe("A* Search Algorithm", () => {
    test('should find shortest path in open grid', () => {
      const source: Coord = { layer: 0, row: 0, col: 0 };
      const target: Coord = { layer: 0, row: 3, col: 3 };

      const result = routeNetAStar(createTestParams(source, target));

      expect(result.status).toBe('ROUTED');
      expect(result.wirelength).toBe(6);
      expect(result.path.length).toBe(7);
    });

    test("should be more efficient than Lee's in open space", () => {
      const source: Coord = { layer: 0, row: 0, col: 0 };
      const target: Coord = { layer: 0, row: 5, col: 5 };

      const leeResult = routeNetLee(createTestParams(source, target));
      const astarResult = routeNetAStar(createTestParams(source, target));

      expect(leeResult.status).toBe('ROUTED');
      expect(astarResult.status).toBe('ROUTED');

      // A* should explore fewer or equal cells in open grid with good heuristic
      expect(astarResult.cellsExplored).toBeLessThanOrEqual(leeResult.cellsExplored);
      // Both should find same optimal path length
      expect(astarResult.wirelength).toBe(leeResult.wirelength);
    });

    test('should handle barriers correctly', () => {
      const source: Coord = { layer: 0, row: 0, col: 0 };
      const target: Coord = { layer: 0, row: 0, col: 4 };
      // Create a horizontal wall with one gap
      const obstacles = new Set();
      for (let c = 1; c <= 3; c++) {
        if (c !== 2) { // Leave gap at column 2
          obstacles.add(`0,0,${c}`);
        }
      }

      const params = createTestParams(source, target);
      params.obstacles = obstacles;

      const leeResult = routeNetLee(params);
      const astarResult = routeNetAStar(params);

      expect(leeResult.status).toBe('ROUTED');
      expect(astarResult.status).toBe('ROUTED');
      // Both should find path through the gap
      expect(leeResult.wirelength).toBe(astarResult.wirelength);
      expect(astarResult.wirelength).toBe(6); // Need to go around: down, right 4 times, up
    });
  });

  describe("Algorithm Comparison", () => {
    test("A* should never explore more cells than Lee's in same conditions", () => {
      const testCases: Array<{source: Coord; target: Coord; obstacles?: Set<string>}> = [
        { source: {layer: 0, row: 0, col: 0}, target: {layer: 0, row: 5, col: 5} },
        { source: {layer: 0, row: 2, col: 2}, target: {layer: 0, row: 7, col: 7} },
        {
          source: {layer: 0, row: 0, col: 0},
          target: {layer: 0, row: 3, col: 3},
          obstacles: new Set(['0,1,1', '0,1,2', '0,2,1']) // Small obstacle
        }
      ];

      testCases.forEach(({source, target, obstacles}) => {
        const leeParams = createTestParams(source, target, 10);
        const astarParams = createTestParams(source, target, 10);

        if (obstacles) {
          leeParams.obstacles = obstacles;
          astarParams.obstacles = new Set([...obstacles]); // Copy the set
        }

        const leeResult = routeNetLee(leeParams);
        const astarResult = routeNetAStar(astarParams);

        expect(leeResult.status).toBe('ROUTED');
        expect(astarResult.status).toBe('ROUTED');

        // This is the key assertion: A* should be more efficient or equal
        expect(astarResult.cellsExplored).toBeLessThanOrEqual(leeResult.cellsExplored);

        // Both should find paths of equal length (optimality)
        expect(astarResult.wirelength).toBe(leeResult.wirelength);
      });
    });
  });
});