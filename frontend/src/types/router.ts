export interface Coord {
  layer: number; // 0 = Top (Copper 1), 1 = Bottom (Copper 2)
  row: number;
  col: number;
}

// Import DRCResult from drcValidator
import type { DRCResult } from '../lib/drcValidator';

export interface NetPin {
  layer: number;
  row: number;
  col: number;
}

export interface Net {
  id: string;
  name: string;
  color: string;
  priority: number;
  source: NetPin;
  target: NetPin;
}

export interface Board {
  id: string;
  name: string;
  rows: number;
  cols: number;
  layers: number; // 1 or 2
  obstacles: Coord[];
  nets: Net[];
  createdAt?: string;
}

export interface PathStep {
  coord: Coord;
  direction?: 'N' | 'S' | 'E' | 'W' | 'VIA_UP' | 'VIA_DOWN' | 'START';
}

export interface NetResult {
  netId: string;
  netName: string;
  color: string;
  status: 'ROUTED' | 'FAILED' | 'UNROUTABLE';
  path: Coord[];
  wirelength: number;
  viaCount: number;
  cellsExplored: number;
}

export interface RipUpEvent {
  round: number;
  rippedNetId: string;
  rippedNetName: string;
  triggeringNetId: string;
  triggeringNetName: string;
  reason: string;
}

export interface WavefrontStep {
  stepIndex: number;
  currentCoord?: Coord;
  visitedCount: number;
  addedFrontier?: Coord[];
  netId?: string;
}

export interface RoutingRunReport {
  algorithm: 'lee' | 'astar' | 'ripup';
  boardId: string;
  boardName: string;
  rows: number;
  cols: number;
  layers: number;
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED';
  netsTotal: number;
  netsRouted: number;
  totalWirelength: number;
  totalVias: number;
  totalCellsExplored: number;
  executionTimeMs: number;
  netResults: NetResult[];
  ripupEvents?: RipUpEvent[];
  wavefrontHistory?: WavefrontStep[];
  gridOccupancy?: Record<string, string>; // "layer-r-c" -> netId or "OBSTACLE"
  conflictClusters?: Array<{ clusterId: number; netIds: string[] }>;
  drcResult?: DRCResult; // Design Rule Check results
}

export interface ComparisonReport {
  board: Board;
  lee: RoutingRunReport;
  astar: RoutingRunReport;
  ripup: RoutingRunReport;
  speedupAstarOverLee: number; // cells explored ratio or time ratio
  wirelengthDifferencePercent: number;
}
