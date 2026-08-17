import { Board, Coord, Net, NetResult } from '../types/router';
import { coordKey, parseCoordKey, getNeighbors } from './gridUtils';

// DRC Rule Types
export interface DRCViolation {
  rule: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: Coord;
  netId?: string;
  details?: Record<string, any>;
}

export interface DRCResult {
  passed: boolean;
  violations: DRCViolation[];
  warnings: DRCViolation[];
  info: DRCViolation[];
}

// Default DRC Rules Configuration
export const defaultDRCRules = {
  // Electrical Rules
  minTraceWidth: 6, // mils
  minClearance: 6, // mils (between traces)
  minDrillSize: 10, // mils
  minAnnularRing: 4, // mils

  // Manufacturing Rules
  silkToSolderMaskClearance: 4, // mils
  copperToEdgeClearance: 10, // mils
  solderMaskToCopperClearance: 2, // mils

  // Conversion factor (assuming 1 grid unit = 1 mil for simplicity)
  gridToMil: 1,

  // Enable/disable specific checks
  checkTraceWidth: true,
  checkClearance: true,
  checkDrillSize: true,
  checkAnnularRing: true,
  checkSilkToSolderMask: true,
  checkCopperToEdge: true,
};

/**
 * Validates a routed board against DRC rules
 */
export function validateDRC(
  board: Board,
  netResults: NetResult[],
  rules = defaultDRCRules
): DRCResult {
  const violations: DRCViolation[] = [];

  // Skip validation if no nets were routed
  if (!netResults || netResults.length === 0) {
    return {
      passed: true,
      violations: [],
      warnings: [],
      info: []
    };
  }

  // Build occupancy map for fast lookup
  const occupancyMap = new Map<string, string>(); // coordKey -> netId
  const netMap = new Map<string, NetResult>(); // netId -> NetResult

  // Populate net map
  netResults.forEach(nr => {
    netMap.set(nr.netId, nr);
  });

  // Populate occupancy map from routed nets
  netResults.forEach(nr => {
    if (nr.status === 'ROUTED' && nr.path) {
      nr.path.forEach(coord => {
        occupancyMap.set(coordKey(coord), nr.netId);
      });
    }
  });

  // Add obstacles to occupancy map
  board.obstacles.forEach(obs => {
    occupancyMap.set(coordKey(obs), 'OBSTACLE');
  });

  // Run individual DRC checks
  if (rules.checkTraceWidth) {
    violations.push(...checkTraceWidth(board, netResults, occupancyMap, rules));
  }

  if (rules.checkClearance) {
    violations.push(...checkClearance(board, netResults, occupancyMap, rules));
  }

  if (rules.checkDrillSize) {
    violations.push(...checkDrillSize(board, netResults, rules));
  }

  if (rules.checkAnnularRing) {
    violations.push(...checkAnnularRing(board, netResults, occupancyMap, rules));
  }

  if (rules.checkSilkToSolderMask) {
    violations.push(...checkSilkToSolderMask(board, netResults, occupancyMap, rules));
  }

  if (rules.checkCopperToEdge) {
    violations.push(...checkCopperToEdge(board, netResults, occupancyMap, rules));
  }

  // Categorize violations by severity
  const errors = violations.filter(v => v.severity === 'error');
  const warnings = violations.filter(v => v.severity === 'warning');
  const info = violations.filter(v => v.severity === 'info');

  return {
    passed: errors.length === 0,
    violations: errors,
    warnings,
    info
  };
}

/**
 * Check trace width violations
 */
function checkTraceWidth(
  board: Board,
  netResults: NetResult[],
  occupancyMap: Map<string, string>,
  rules: typeof defaultDRCRules
): DRCViolation[] {
  const violations: DRCViolation[] = [];
  const minWidth = rules.minTraceWidth * rules.gridToMil;

  netResults.forEach(netResult => {
    if (netResult.status !== 'ROUTED' || !netResult.path) return;

    // For each segment in the path, check if it meets minimum width requirements
    // In our simple grid-based router, we assume traces are 1 grid unit wide
    // Real implementation would need to check actual routed trace widths

    // For now, we'll just note that our router produces minimum width traces
    // based on grid resolution, but this is a simplification
    const actualWidth = 1 * rules.gridToMil; // 1 grid unit

    if (actualWidth < minWidth) {
      violations.push({
        rule: 'MIN_TRACE_WIDTH',
        severity: 'error',
        message: `Trace width ${actualWidth}mil is less than minimum ${minWidth}mil`,
        netId: netResult.netId,
        details: {
          actualWidth,
          requiredWidth: minWidth
        }
      });
    }
  });

  return violations;
}

/**
 * Check clearance violations between traces and obstacles
 */
function checkClearance(
  board: Board,
  netResults: NetResult[],
  occupancyMap: Map<string, string>,
  rules: typeof defaultDRCRules
): DRCViolation[] {
  const violations: DRCViolation[] = [];
  const minClearance = rules.minClearance * rules.gridToMil;

  // For each occupied cell, check neighboring cells for violations
  occupancyMap.forEach((occupant, coordKeyStr) => {
    // Skip obstacles and empty spaces
    if (occupant === 'OBSTACLE' || !occupant) return;

    const coord = parseCoordKey(coordKeyStr);

    // Check all 8 surrounding cells (including diagonals) for clearance
    const neighbors = getNeighbors(coord, board.rows, board.cols, board.layers);

    neighbors.forEach(neighbor => {
      const neighborKey = coordKey(neighbor.coord);
      const neighborOccupant = occupancyMap.get(neighborKey);

      // Skip if neighbor is empty or same net
      if (!neighborOccupant || neighborOccupant === occupant) return;

      // Skip if neighbor is obstacle (obstacles have their own rules)
      if (neighborOccupant === 'OBSTACLE') return;

      // Different nets - check clearance
      if (neighborOccupant !== occupant) {
        // Calculate distance (for orthogonal neighbors it's 1 grid unit,
        // for diagonal it's sqrt(2) grid units)
        const isDiagonal =
          Math.abs(neighbor.coord.row - coord.row) === 1 &&
          Math.abs(neighbor.coord.col - coord.col) === 1;
        const distance = isDiagonal
          ? Math.sqrt(2) * rules.gridToMil
          : 1 * rules.gridToMil;

        if (distance < minClearance) {
          violations.push({
            rule: 'MIN_CLEARANCE',
            severity: 'error',
            message: `Clearance between nets ${occupant} and ${neighborOccupant} is ${distance.toFixed(2)}mil, less than minimum ${minClearance}mil`,
            location: coord,
            netId: occupant,
            details: {
              actualClearance: distance,
              requiredClearance: minClearance,
              adjacentNet: neighborOccupant
            }
          });
        }
      }
    });
  });

  return violations;
}

/**
 * Check drill size violations (for vias)
 */
function checkDrillSize(
  board: Board,
  netResults: NetResult[],
  rules: typeof defaultDRCRules
): DRCViolation[] {
  const violations: DRCViolation[] = [];
  const minDrillSize = rules.minDrillSize * rules.gridToMil;

  netResults.forEach(netResult => {
    if (netResult.status !== 'ROUTED') return;

    // Count vias in the net result (layer changes in path)
    let viaCount = 0;
    if (netResult.path && netResult.path.length >= 2) {
      for (let i = 1; i < netResult.path.length; i++) {
        const prev = netResult.path[i - 1];
        const curr = netResult.path[i];
        if (prev.layer !== curr.layer) {
          viaCount++;
        }
      }
    }

    // For now, we'll assume our vias meet minimum drill size
    // A real implementation would check actual via drill sizes
    const assumedDrillSize = 20 * rules.gridToMil; // 20mil assumed via drill

    if (assumedDrillSize < minDrillSize) {
      violations.push({
        rule: 'MIN_DRILL_SIZE',
        severity: 'error',
        message: `Via drill size ${assumedDrillSize}mil is less than minimum ${minDrillSize}mil`,
        netId: netResult.netId,
        details: {
          actualDrillSize: assumedDrillSize,
          requiredDrillSize: minDrillSize,
          viaCount
        }
      });
    }
  });

  return violations;
}

/**
 * Check annular ring violations (for vias)
 */
function checkAnnularRing(
  board: Board,
  netResults: NetResult[],
  occupancyMap: Map<string, string>,
  rules: typeof defaultDRCRules
): DRCViolation[] {
  const violations: DRCViolation[] = [];
  const minAnnularRing = rules.minAnnularRing * rules.gridToMil;

  // This is a simplified check - real annular ring check would require
  // knowledge of pad sizes and drill hole positions
  // For our grid-based router, we'll do a basic check

  netResults.forEach(netResult => {
    if (netResult.status !== 'ROUTED' || netResult.viaCount === 0) return;

    // Simplified: assume each via has adequate annular ring
    // Real implementation would check pad-to-drill clearance
    const assumedAnnularRing = 6 * rules.gridToMil; // 6mil assumed

    if (assumedAnnularRing < minAnnularRing && netResult.viaCount > 0) {
      violations.push({
        rule: 'MIN_ANNULAR_RING',
        severity: 'warning',
        message: `Net ${netResult.netName} has ${netResult.viaCount} vias with potential annular ring issues`,
        netId: netResult.netId,
        details: {
          assumedAnnularRing,
          requiredAnnularRing: minAnnularRing,
          viaCount: netResult.viaCount
        }
      });
    }
  });

  return violations;
}

/**
 * Check silk to solder mask clearance
 */
function checkSilkToSolderMask(
  board: Board,
  netResults: NetResult[],
  occupancyMap: Map<string, string>,
  rules: typeof defaultDRCRules
): DRCViolation[] {
  // Placeholder implementation - would require silk screen layer data
  return [];
}

/**
 * Check copper to edge clearance
 */
function checkCopperToEdge(
  board: Board,
  netResults: NetResult[],
  occupancyMap: Map<string, string>,
  rules: typeof defaultDRCRules
): DRCViolation[] {
  const violations: DRCViolation[] = [];
  const minClearance = rules.copperToEdgeClearance * rules.gridToMil;

  occupancyMap.forEach((occupant, coordKeyStr) => {
    // Skip empty spaces and obstacles
    if (!occupant || occupant === 'OBSTACLE') return;

    const coord = parseCoordKey(coordKeyStr);

    // Check if coordinate is near board edge
    const isNearEdge =
      coord.row < rules.copperToEdgeClearance ||
      coord.row >= board.rows - rules.copperToEdgeClearance ||
      coord.col < rules.copperToEdgeClearance ||
      coord.col >= board.cols - rules.copperToEdgeClearance;

    if (isNearEdge) {
      violations.push({
        rule: 'COPPER_TO_EDGE',
        severity: 'error',
        message: `Copper feature too close to board edge`,
        location: coord,
        netId: occupant,
        details: {
          distanceToEdge: Math.min(
            coord.row,
            board.rows - 1 - coord.row,
            coord.col,
            board.cols - 1 - coord.col
          ) * rules.gridToMil,
          requiredClearance: minClearance
        }
      });
    }
  });

  return violations;
}