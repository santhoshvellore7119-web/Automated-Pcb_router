import React, { useState } from 'react';
import { Board, Coord, Net, NetResult } from '../types/router';
import { coordKey } from '../lib/gridUtils';

interface GridCanvasProps {
  board: Board;
  activeLayer: number; // 0 = Top Layer (F.Cu), 1 = Bottom Layer (B.Cu)
  netResults?: NetResult[];
  activeStepVisited?: Set<string>;
  activeStepCurrent?: Coord;
  editorMode?: 'obstacle' | 'erase' | 'pin_source' | 'pin_target' | 'none';
  selectedNetId?: string;
  onCellClick?: (coord: Coord) => void;
  showHeatmap?: boolean;
  cellPenalties?: Map<string, number>;
}

export const GridCanvas: React.FC<GridCanvasProps> = ({
  board,
  activeLayer,
  netResults = [],
  activeStepVisited,
  activeStepCurrent,
  editorMode = 'none',
  selectedNetId,
  onCellClick,
  showHeatmap = false,
  cellPenalties,
}) => {
  const [hoveredCoord, setHoveredCoord] = useState<Coord | null>(null);

  const { rows, cols, layers, obstacles, nets } = board;

  // Build lookup maps for fast rendering
  const obstacleMap = new Set(obstacles.map(coordKey));

  // Source and Target pin maps: key -> Net
  const sourcePins = new Map<string, Net>();
  const targetPins = new Map<string, Net>();
  nets.forEach((n) => {
    sourcePins.set(coordKey(n.source), n);
    targetPins.set(coordKey(n.target), n);
  });

  // Calculate cell sizes dynamically so grid fits responsively
  const maxPixelWidth = 720;
  const cellSize = Math.max(12, Math.min(36, Math.floor(maxPixelWidth / cols)));

  // Collect trace segments and vias across all routed net results
  const traceSegments: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    layer: number;
    color: string;
    netName: string;
  }> = [];

  const vias: Array<{
    row: number;
    col: number;
    color: string;
    netName: string;
  }> = [];

  netResults.forEach((nr) => {
    if (nr.status !== 'ROUTED' || !nr.path || nr.path.length < 2) return;

    for (let i = 1; i < nr.path.length; i++) {
      const p1 = nr.path[i - 1];
      const p2 = nr.path[i];

      if (p1.layer !== p2.layer) {
        // Via layer hop at p1 location
        vias.push({
          row: p1.row,
          col: p1.col,
          color: nr.color,
          netName: nr.netName,
        });
      } else {
        traceSegments.push({
          x1: p1.col * cellSize + cellSize / 2,
          y1: p1.row * cellSize + cellSize / 2,
          x2: p2.col * cellSize + cellSize / 2,
          y2: p2.row * cellSize + cellSize / 2,
          layer: p1.layer,
          color: nr.color,
          netName: nr.netName,
        });
      }
    }
  });

  // Render SVG Grid Cells
  const gridRows = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const coord: Coord = { layer: activeLayer, row: r, col: c };
      const key = coordKey(coord);

      const isObstacle = obstacleMap.has(key);
      const srcNet = sourcePins.get(key);
      const tgtNet = targetPins.get(key);

      const isVisited = activeStepVisited?.has(key);
      const isCurrentHead =
        activeStepCurrent?.layer === activeLayer &&
        activeStepCurrent.row === r &&
        activeStepCurrent.col === c;

      const penalty = cellPenalties?.get(key) || 0;

      // Color computation for cell background
      let cellBg = 'fill-slate-900/90';
      if (isObstacle) {
        cellBg = 'fill-slate-700/90 stroke-slate-600';
      } else if (showHeatmap && penalty > 0) {
        // Heatmap color gradient based on penalty count
        const heatRatio = Math.min(1, penalty / 20);
        cellBg = heatRatio > 0.5 ? 'fill-rose-500/50' : 'fill-amber-500/40';
      } else if (isCurrentHead) {
        cellBg = 'fill-emerald-400 animate-pulse';
      } else if (isVisited) {
        cellBg = 'fill-emerald-500/20 stroke-emerald-500/30';
      }

      gridRows.push(
        <g
          key={key}
          onClick={() => onCellClick?.(coord)}
          onMouseEnter={() => setHoveredCoord(coord)}
          className="cursor-pointer transition-all duration-75"
        >
          <rect
            x={c * cellSize}
            y={r * cellSize}
            width={cellSize}
            height={cellSize}
            className={`${cellBg} stroke-slate-800/80 hover:stroke-emerald-400/80 hover:fill-slate-800`}
            strokeWidth={0.5}
          />

          {/* Obstacle hatching pattern icon */}
          {isObstacle && (
            <line
              x1={c * cellSize}
              y1={r * cellSize}
              x2={(c + 1) * cellSize}
              y2={(r + 1) * cellSize}
              className="stroke-slate-500/60"
              strokeWidth={1}
            />
          )}

          {/* Source Pin Pad */}
          {srcNet && (
            <g>
              <rect
                x={c * cellSize + cellSize * 0.15}
                y={r * cellSize + cellSize * 0.15}
                width={cellSize * 0.7}
                height={cellSize * 0.7}
                rx={cellSize * 0.15}
                fill={srcNet.color}
                className="stroke-white/80 shadow-md"
                strokeWidth={1.5}
              />
              <text
                x={c * cellSize + cellSize / 2}
                y={r * cellSize + cellSize / 2 + cellSize * 0.15}
                textAnchor="middle"
                fontSize={cellSize * 0.4}
                fontWeight="bold"
                fill="#ffffff"
                className="select-none pointer-events-none"
              >
                S
              </text>
            </g>
          )}

          {/* Target Pin Pad */}
          {tgtNet && (
            <g>
              <circle
                cx={c * cellSize + cellSize / 2}
                cy={r * cellSize + cellSize / 2}
                r={cellSize * 0.35}
                fill={tgtNet.color}
                className="stroke-white/80 shadow-md"
                strokeWidth={1.5}
              />
              <text
                x={c * cellSize + cellSize / 2}
                y={r * cellSize + cellSize / 2 + cellSize * 0.15}
                textAnchor="middle"
                fontSize={cellSize * 0.4}
                fontWeight="bold"
                fill="#ffffff"
                className="select-none pointer-events-none"
              >
                T
              </text>
            </g>
          )}
        </g>
      );
    }
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* Board Canvas Workspace Container */}
      <div className="relative p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl overflow-auto max-w-full">
        {/* Layer Badge Header */}
        <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-mono">
          <div className="flex items-center space-x-2">
            <span
              className={`w-3 h-3 rounded-full ${
                activeLayer === 0 ? 'bg-rose-500 shadow-rose-500/50' : 'bg-cyan-500 shadow-cyan-500/50'
              } shadow-sm`}
            />
            <span className="font-semibold text-slate-200">
              {activeLayer === 0 ? 'F.Cu (Top Layer 0)' : 'B.Cu (Bottom Layer 1)'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {layers > 1 && (
              <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                2-Layer Board Active
              </span>
            )}
            {hoveredCoord && (
              <span>
                (L{hoveredCoord.layer}, R{hoveredCoord.row}, C{hoveredCoord.col})
              </span>
            )}
          </div>
        </div>

        {/* SVG Canvas Board */}
        <svg
          width={cols * cellSize}
          height={rows * cellSize}
          className="bg-slate-900/90 rounded-lg border border-slate-800/80 shadow-inner select-none"
        >
          {/* 1. Base Grid and Pins */}
          {gridRows}

          {/* 2. Copper Trace Lines */}
          {traceSegments.map((seg, i) => {
            const isCurrentLayer = seg.layer === activeLayer;
            return (
              <line
                key={`trace-${i}`}
                x1={seg.x1}
                y1={seg.y1}
                x2={seg.x2}
                y2={seg.y2}
                stroke={seg.color}
                strokeWidth={isCurrentLayer ? Math.max(3, cellSize * 0.25) : Math.max(1.5, cellSize * 0.12)}
                strokeDasharray={isCurrentLayer ? undefined : '3,3'}
                opacity={isCurrentLayer ? 0.95 : 0.35}
                strokeLinecap="round"
              />
            );
          })}

          {/* 3. Vias (Concentric golden pads with drill hole) */}
          {vias.map((v, i) => (
            <g key={`via-${i}`}>
              <circle
                cx={v.col * cellSize + cellSize / 2}
                cy={v.row * cellSize + cellSize / 2}
                r={cellSize * 0.3}
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth={1}
                className="shadow-sm"
              />
              <circle
                cx={v.col * cellSize + cellSize / 2}
                cy={v.row * cellSize + cellSize / 2}
                r={cellSize * 0.12}
                fill="#0f172a"
              />
            </g>
          ))}
        </svg>

        {/* Legend Footer */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-sans gap-2">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 bg-slate-700 border border-slate-500 rounded-sm" />
              <span>Obstacle</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 bg-emerald-500 rounded-sm" />
              <span>Pin (S/T)</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-full bg-amber-500 border border-white" />
              <span>Via</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 bg-emerald-500/20 border border-emerald-500/40 rounded-sm" />
              <span>Frontier Visited</span>
            </div>
          </div>

          <div className="text-slate-500 font-mono text-[10px]">
            {rows}x{cols} Grid • {nets.length} Nets
          </div>
        </div>
      </div>
    </div>
  );
};
