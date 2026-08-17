import React, { useState } from 'react';
import { Board, ComparisonReport, RoutingRunReport } from './types/router';
import { ALL_PRESETS } from './lib/presetBoards';
import { Navbar } from './components/Navbar';
import { BoardEditor } from './components/BoardEditor';
import { RoutingConsole } from './components/RoutingConsole';
import { ComparisonDashboard } from './components/ComparisonDashboard';
import { AlgorithmInfoModal } from './components/AlgorithmInfoModal';
import { KiCadModal } from './components/KiCadModal';
import {
  compareAllAlgorithms,
  runAStarOnBoard,
  runLeeOnBoard,
  runRipUpOnBoard,
} from './lib/routerFacade';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'editor' | 'console' | 'comparison' | 'architecture'
  >('editor');

  const [currentBoard, setCurrentBoard] = useState<Board>(ALL_PRESETS[1]); // Default to Off-Corner Speedup Benchmark
  const [activeLayer, setActiveLayer] = useState<number>(0);

  const [currentReport, setCurrentReport] = useState<RoutingRunReport | null>(null);
  const [comparisonReport, setComparisonReport] = useState<ComparisonReport | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);

  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isKiCadModalOpen, setIsKiCadModalOpen] = useState<boolean>(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  // Run single algorithm against REST API (with client fallback)
  const handleRunAlgorithm = async (
    algo: 'lee' | 'astar' | 'ripup'
  ): Promise<RoutingRunReport> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/boards/${currentBoard.id}/route/${algo}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentBoard),
      });

      if (res.ok) {
        const report: RoutingRunReport = await res.json();
        setCurrentReport(report);
        return report;
      }
    } catch {
      // Fallback to local execution if offline
    }

    let localReport: RoutingRunReport;
    if (algo === 'lee') localReport = runLeeOnBoard(currentBoard);
    else if (algo === 'astar') localReport = runAStarOnBoard(currentBoard);
    else localReport = runRipUpOnBoard(currentBoard);

    setCurrentReport(localReport);
    return localReport;
  };

  // Run comparative benchmark across all 3 algorithms
  const handleRunComparison = async () => {
    setIsComparing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/boards/${currentBoard.id}/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentBoard),
      });

      if (res.ok) {
        const report: ComparisonReport = await res.json();
        setComparisonReport(report);
        setCurrentReport(report.astar);
        setIsComparing(false);
        return;
      }
    } catch {
      // Fallback to local comparative evaluation
    }

    const localComparison = compareAllAlgorithms(currentBoard);
    setComparisonReport(localComparison);
    setCurrentReport(localComparison.astar);
    setIsComparing(false);
  };

  // Change active preset board
  const handleSelectPreset = (board: Board) => {
    setCurrentBoard(board);
    setCurrentReport(null);
    setComparisonReport(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Application Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentBoard={currentBoard}
        onSelectPreset={handleSelectPreset}
        onOpenKiCadModal={() => setIsKiCadModalOpen(true)}
        onOpenInfoModal={() => setIsInfoModalOpen(true)}
        onRunComparison={handleRunComparison}
        isComparing={isComparing}
        onCancelComparison={() => {
          setIsComparing(false);
          setComparisonReport(null);
          setCurrentReport(null);
        }}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 pb-12">
        {activeTab === 'editor' && (
          <BoardEditor
            board={currentBoard}
            onChangeBoard={(newBoard) => {
              setCurrentBoard(newBoard);
              setCurrentReport(null);
              setComparisonReport(null);
            }}
            activeLayer={activeLayer}
            setActiveLayer={setActiveLayer}
          />
        )}

        {activeTab === 'console' && (
          <RoutingConsole
            board={currentBoard}
            activeLayer={activeLayer}
            setActiveLayer={setActiveLayer}
            onRunAlgorithm={handleRunAlgorithm}
            currentReport={currentReport}
          />
        )}

        {activeTab === 'comparison' && (
          <ComparisonDashboard
            comparisonReport={comparisonReport}
            onRunComparison={handleRunComparison}
            isLoading={isComparing}
          />
        )}
      </main>

      {/* Theory & Math Guide Modal */}
      <AlgorithmInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />

      {/* KiCad & Board JSON Export Modal */}
      <KiCadModal
        isOpen={isKiCadModalOpen}
        onClose={() => setIsKiCadModalOpen(false)}
        board={currentBoard}
        currentReport={currentReport}
      />
    </div>
  );
}
