import React, { useEffect, useState } from 'react';
import {
  Cpu,
  Layers,
  BarChart3,
  BookOpen,
  Download,
  Activity,
  Play,
  RefreshCw,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Board } from '../types/router';
import { ALL_PRESETS } from '../lib/presetBoards';

interface NavbarProps {
  activeTab: 'editor' | 'console' | 'comparison' | 'architecture';
  setActiveTab: (tab: 'editor' | 'console' | 'comparison' | 'architecture') => void;
  currentBoard: Board;
  onSelectPreset: (board: Board) => void;
  onOpenKiCadModal: () => void;
  onOpenInfoModal: () => void;
  onRunComparison: () => void;
  isComparing?: boolean;
  onCancelComparison?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentBoard,
  onSelectPreset,
  onOpenKiCadModal,
  onOpenInfoModal,
  onRunComparison,
  isComparing = false,
  onCancelComparison,
}) => {
  const [healthStatus, setHealthStatus] = useState<{
    ok: boolean;
    boardsStored?: number;
    lastCheck?: number;
  }>({ ok: false, lastCheck: 0 });
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  useEffect(() => {
    const checkHealth = async () => {
      setIsCheckingHealth(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/health`);
        const data = await res.json();
        setHealthStatus({
          ok: data.status === 'ok',
          boardsStored: data.boardsStored,
          lastCheck: Date.now()
        });
      } catch (error) {
        setHealthStatus({ ok: false, lastCheck: Date.now() });
      } finally {
        setIsCheckingHealth(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Cpu className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight text-white font-mono">
                  PCB Trace Router
                </h1>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  v1.0 REST API
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans hidden sm:block">
                Grid Autorouter with Lee's, A* Search & Rip-Up-and-Reroute
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              id="tab-editor-btn"
              onClick={() => setActiveTab('editor')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'editor'
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
              disabled={isComparing}
            >
              <Layers className="w-4 h-4" />
              <span>Board Editor</span>
            </button>

            <button
              id="tab-console-btn"
              onClick={() => setActiveTab('console')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'console'
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
              disabled={isComparing}
            >
              <Play className="w-4 h-4" />
              <span>Routing Console</span>
            </button>

            <button
              id="tab-comparison-btn"
              onClick={() => {
                setActiveTab('comparison');
                onRunComparison();
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'comparison'
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
              disabled={isComparing}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Benchmark Dashboard</span>
            </button>

            <button
              id="tab-info-btn"
              onClick={onOpenInfoModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden md:inline">Theory & Math</span>
            </button>
          </nav>

          {/* Quick Presets & Export Actions */}
          <div className="flex items-center space-x-2">
            <div className="relative hidden lg:block">
              <select
                id="preset-board-selector"
                onChange={(e) => {
                  const selected = ALL_PRESETS.find((p) => p.id === e.target.value);
                  if (selected) onSelectPreset(selected);
                }}
                value={currentBoard.id}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                disabled={isComparing}
              >
                <option value="" disabled>
                  Select Preset Board...
                </option>
                {ALL_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              id="export-kicad-btn"
              onClick={onOpenKiCadModal}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-200 font-medium transition-colors"
              title="Export KiCad .kicad_pcb or Board JSON"
              disabled={isComparing}
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Comparison Cancel Button (shown during comparison) */}
            {isComparing && (
              <button
                id="cancel-comparison-btn"
                onClick={onCancelComparison}
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-slate-950 font-medium transition-colors hover:scale-[1.02] transition-transform"
                title="Cancel Comparison"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cancel</span>
              </button>
            )}

            {/* Health Status Indicator */}
            <div
              className={`flex items-center space-x-1.5 px-2 py-1 rounded-full text-[11px] font-mono border ${
                healthStatus.ok
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-400'
              } ${isCheckingHealth ? 'animate-pulse' : ''}`}
              title="REST Backend Service Status"
            >
              {isCheckingHealth ? (
                <Loader2 className="w-3 h-3" />
              ) : (
                <Activity className="w-3 h-3 animate-pulse" />
              )}
              <span className="hidden xl:inline">
                {healthStatus.ok ? 'API Active' : 'API Offline'}
              </span>
              {!healthStatus.ok && healthStatus.lastCheck > 0 && (
                <span className="hidden ml-1 text-[9px] text-slate-400">
                  {(Date.now() - healthStatus.lastCheck) / 1000}s ago
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
