import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Zap,
  Flame,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { Board, RoutingRunReport, NetResult } from '../types/router';
import { GridCanvas } from './GridCanvas';

interface RoutingConsoleProps {
  board: Board;
  activeLayer: number;
  setActiveLayer: (layer: number) => void;
  onRunAlgorithm: (algo: 'lee' | 'astar' | 'ripup') => Promise<RoutingRunReport>;
  currentReport: RoutingRunReport | null;
}

export const RoutingConsole: React.FC<RoutingConsoleProps> = ({
  board,
  activeLayer,
  setActiveLayer,
  onRunAlgorithm,
  currentReport,
}) => {
  const [isRouting, setIsRouting] = useState<boolean>(false);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);

  // Animation Playback States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);

  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Extract wavefront steps if available
  const wavefrontSteps = currentReport?.wavefrontHistory || [];
  const maxSteps = wavefrontSteps.length;

  const currentWavefrontStep = wavefrontSteps[currentStepIdx];
  const activeVisitedSet = new Set<string>();

  if (currentWavefrontStep) {
    for (let i = 0; i <= currentStepIdx; i++) {
      const step = wavefrontSteps[i];
      if (step.addedFrontier) {
        step.addedFrontier.forEach((c) =>
          activeVisitedSet.add(`${c.layer},${c.row},${c.col}`)
        );
      }
    }
  }

  // Animation playback loop
  useEffect(() => {
    if (isPlaying && maxSteps > 0) {
      animationTimerRef.current = setInterval(() => {
        setCurrentStepIdx((prev) => {
          if (prev >= maxSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, Math.max(20, Math.floor(100 / speedMultiplier)));
    } else {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
    }

    return () => {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
    };
  }, [isPlaying, maxSteps, speedMultiplier]);

  const handleRun = async (algo: 'lee' | 'astar' | 'ripup') => {
    setIsRouting(true);
    setIsPlaying(false);
    setCurrentStepIdx(0);
    try {
      const report = await onRunAlgorithm(algo);
      if (report.wavefrontHistory && report.wavefrontHistory.length > 0) {
        setIsPlaying(true);
      }
    } finally {
      setIsRouting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Algorithm Runner Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>Interactive Autorouter Console</span>
          </h2>
          <p className="text-xs text-slate-400">
            Execute pathfinding on board '{board.name}' ({board.rows}x{board.cols}, {board.nets.length} Nets)
          </p>
        </div>

        {/* Algorithm Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="run-lee-btn"
            disabled={isRouting}
            onClick={() => handleRun('lee')}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-all shadow-md disabled:opacity-50"
          >
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Lee's (BFS)</span>
          </button>

          <button
            id="run-astar-btn"
            disabled={isRouting}
            onClick={() => handleRun('astar')}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md disabled:opacity-50"
          >
            <Zap className="w-4 h-4 text-slate-950" />
            <span>A* Search</span>
          </button>

          <button
            id="run-ripup-btn"
            disabled={isRouting}
            onClick={() => handleRun('ripup')}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Rip-Up & Reroute</span>
          </button>

          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center space-x-1 px-3 py-2 border rounded-xl text-xs font-medium transition-colors ${
              showHeatmap
                ? 'bg-rose-950/60 border-rose-500 text-rose-400'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle Congestion / Rip-up Penalty Heatmap"
          >
            <Flame className="w-4 h-4" />
            <span className="hidden sm:inline">Heatmap</span>
          </button>
        </div>
      </div>

      {/* Main Grid View and Search Log Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: PCB Grid Canvas + Playback Bar */}
        <div className="lg:col-span-2 space-y-4 flex flex-col items-center">
          <GridCanvas
            board={board}
            activeLayer={activeLayer}
            netResults={currentReport?.netResults || []}
            activeStepVisited={maxSteps > 0 ? activeVisitedSet : undefined}
            activeStepCurrent={currentWavefrontStep?.currentCoord}
            showHeatmap={showHeatmap}
          />

          {/* Wavefront Animation Playback Bar */}
          {maxSteps > 0 && (
            <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-semibold text-emerald-400">
                  Search Wavefront Playback
                </span>
                <span className="font-mono text-slate-400">
                  Step {currentStepIdx + 1} / {maxSteps}
                </span>
              </div>

              {/* Progress Slider */}
              <input
                type="range"
                min={0}
                max={maxSteps - 1}
                value={currentStepIdx}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentStepIdx(Number(e.target.value));
                }}
                className="w-full accent-emerald-500 cursor-pointer"
              />

              {/* Playback Controls */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-bold shadow transition-colors"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentStepIdx((prev) => Math.min(maxSteps - 1, prev + 1));
                    }}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700"
                    title="Step Forward"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentStepIdx(0);
                    }}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700"
                    title="Reset to Step 0"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center space-x-2 text-slate-400">
                  <span>Speed:</span>
                  {[1, 5, 20].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpeedMultiplier(s)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                        speedMultiplier === s
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-950 text-slate-400'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Search Inspector & Metrics Terminal */}
        <div className="space-y-4">
          {/* Run Metrics Summary Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Run Summary
              </h3>
              {currentReport && (
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                    currentReport.status === 'COMPLETED'
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400'
                      : 'bg-amber-950/60 border-amber-500 text-amber-400'
                  }`}
                >
                  {currentReport.status}
                </span>
              )}
            </div>

            {currentReport ? (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="text-slate-400">Algorithm</div>
                    <div className="text-base font-bold text-emerald-400 uppercase font-mono">
                      {currentReport.algorithm}
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="text-slate-400">Runtime</div>
                    <div className="text-base font-bold text-cyan-400 font-mono">
                      {currentReport.executionTimeMs} ms
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="text-slate-400">Cells Explored</div>
                    <div className="text-base font-bold text-white font-mono">
                      {currentReport.totalCellsExplored.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="text-slate-400">Total Wirelength</div>
                    <div className="text-base font-bold text-amber-400 font-mono">
                      {currentReport.totalWirelength} units
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-slate-300 pt-2 border-t border-slate-800/80">
                  <span>Nets Completion</span>
                  <span className="font-mono font-bold text-white">
                    {currentReport.netsRouted} / {currentReport.netsTotal} Routed
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span>Vias Transitioned</span>
                  <span className="font-mono font-bold text-amber-400">
                    {currentReport.totalVias} Vias
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                Select an algorithm above to run routing on the board.
              </div>
            )}
          </div>

          {/* Per-Net Outcomes List */}
          {currentReport && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Per-Net Outcomes
              </h3>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {currentReport.netResults.map((nr) => (
                  <div
                    key={nr.netId}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: nr.color }}
                      />
                      <span className="font-semibold text-slate-200">{nr.netName}</span>
                    </div>

                    <div className="flex items-center space-x-3 font-mono">
                      <span className="text-slate-400">{nr.wirelength} units</span>
                      {nr.status === 'ROUTED' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rip-Up Event Log (if Rip-up was executed) */}
          {currentReport?.ripupEvents && currentReport.ripupEvents.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Rip-Up Conflict Log ({currentReport.ripupEvents.length})</span>
              </h3>

              <div className="space-y-2 max-h-48 overflow-y-auto text-[11px] font-mono pr-1">
                {currentReport.ripupEvents.map((e, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-amber-400">
                      <span>Round {e.round}</span>
                      <span className="text-rose-400">Ripped {e.rippedNetName}</span>
                    </div>
                    <p className="text-slate-400 text-[10px]">{e.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
