import React, { useState } from 'react';
import {
  Grid,
  Plus,
  Trash2,
  Shuffle,
  Layers,
  Sliders,
  ShieldAlert,
  Edit2,
  Check,
} from 'lucide-react';
import { Board, Coord, Net } from '../types/router';
import { GridCanvas } from './GridCanvas';
import { ALL_PRESETS, generateRandomBoard } from '../lib/presetBoards';

interface BoardEditorProps {
  board: Board;
  onChangeBoard: (board: Board) => void;
  activeLayer: number;
  setActiveLayer: (layer: number) => void;
}

export const BoardEditor: React.FC<BoardEditorProps> = ({
  board,
  onChangeBoard,
  activeLayer,
  setActiveLayer,
}) => {
  const [editorTool, setEditorTool] = useState<
    'obstacle' | 'erase' | 'pin_source' | 'pin_target'
  >('obstacle');

  const [selectedNetId, setSelectedNetId] = useState<string>(
    board.nets[0]?.id || ''
  );

  const [obstacleDensity, setObstacleDensity] = useState<number>(15);
  const [newNetName, setNewNetName] = useState<string>('');
  const [newNetColor, setNewNetColor] = useState<string>('#3b82f6');

  // Loading states for async operations
  const [isAddingNet, setIsAddingNet] = useState(false);
  const [isRemovingNet, setIsRemovingNet] = useState(false);
  const [netToRemoveId, setNetToRemoveId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Handle cell clicks in editor mode
  const handleCellClick = (coord: Coord) => {
    const key = `${coord.layer},${coord.row},${coord.col}`;

    if (editorTool === 'obstacle') {
      // Add obstacle if not present
      if (!board.obstacles.some((o) => `${o.layer},${o.row},${o.col}` === key)) {
        onChangeBoard({
          ...board,
          obstacles: [...board.obstacles, coord],
        });
      }
    } else if (editorTool === 'erase') {
      // Remove obstacle or pins at coord
      const updatedObstacles = board.obstacles.filter(
        (o) => `${o.layer},${o.row},${o.col}` !== key
      );
      onChangeBoard({
        ...board,
        obstacles: updatedObstacles,
      });
    } else if (editorTool === 'pin_source') {
      if (!selectedNetId) return;
      const updatedNets = board.nets.map((n) =>
        n.id === selectedNetId ? { ...n, source: coord } : n
      );
      onChangeBoard({ ...board, nets: updatedNets });
    } else if (editorTool === 'pin_target') {
      if (!selectedNetId) return;
      const updatedNets = board.nets.map((n) =>
        n.id === selectedNetId ? { ...n, target: coord } : n
      );
      onChangeBoard({ ...board, nets: updatedNets });
    }
  };

  // Add new net handler
  const handleAddNet = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingNet(true);
    try {
      const name = newNetName.trim() || `NET_${board.nets.length + 1}`;
      const newNet: Net = {
        id: `net-${Date.now()}`,
        name,
        color: newNetColor,
        priority: board.nets.length + 1,
        source: { layer: activeLayer, row: 0, col: 0 },
        target: { layer: activeLayer, row: Math.min(5, board.rows - 1), col: Math.min(5, board.cols - 1) },
      };
      const updatedNets = [...board.nets, newNet];
      onChangeBoard({ ...board, nets: updatedNets });
      setSelectedNetId(newNet.id);
      setNewNetName('');
    } finally {
      setIsAddingNet(false);
    }
  };

  // Remove net handler - shows confirmation dialog
  const handleRemoveNet = (netId: string) => {
    setNetToRemoveId(netId);
    setShowConfirmDialog(true);
  };

  // Confirm net removal
  const handleConfirmRemoveNet = async () => {
    if (!netToRemoveId) return;
    setIsRemovingNet(true);
    try {
      const updatedNets = board.nets.filter((n) => n.id !== netToRemoveId);
      onChangeBoard({ ...board, nets: updatedNets });
      if (selectedNetId === netToRemoveId) {
        setSelectedNetId(updatedNets[0]?.id || '');
      }
    } finally {
      setIsRemovingNet(false);
      setNetToRemoveId(null);
      setShowConfirmDialog(false);
    }
  };

  // Cancel net removal
  const handleCancelRemoveNet = () => {
    setNetToRemoveId(null);
    setShowConfirmDialog(false);
  };

  // Generate random board handler
  const handleGenerateRandom = () => {
    const randomBoard = generateRandomBoard(
      board.rows,
      board.cols,
      board.layers,
      obstacleDensity,
      Math.max(2, board.nets.length || 3)
    );
    onChangeBoard(randomBoard);
    setSelectedNetId(randomBoard.nets[0]?.id || '');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Board Geometry & Presets Settings Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-semibold text-white">Board Dimensions</h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {board.rows}x{board.cols} Grid
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Rows</label>
              <input
                type="number"
                min={10}
                max={50}
                value={board.rows}
                onChange={(e) =>
                  onChangeBoard({
                    ...board,
                    rows: Math.max(10, Math.min(50, Number(e.target.value) || 10)),
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Columns</label>
              <input
                type="number"
                min={10}
                max={50}
                value={board.cols}
                onChange={(e) =>
                  onChangeBoard({
                    ...board,
                    cols: Math.max(10, Math.min(50, Number(e.target.value) || 10)),
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-300 font-medium">Copper Layers</span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  onChangeBoard({ ...board, layers: 1 });
                  setActiveLayer(0);
                }}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                  board.layers === 1
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                1 Layer
              </button>
              <button
                type="button"
                onClick={() => onChangeBoard({ ...board, layers: 2 })}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                  board.layers === 2
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                2 Layers (Vias)
              </button>
            </div>
          </div>

          {/* Preset Buttons Quick Select */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Benchmark Evaluation Presets
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {ALL_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onChangeBoard(preset)}
                  className={`text-left p-2 rounded-lg border text-[11px] truncate transition-all ${
                    board.id === preset.id
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Editing Toolbar Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Edit2 className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-semibold text-white">Interactive Painter</h2>
            </div>

            {/* Layer Switcher */}
            {board.layers > 1 && (
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setActiveLayer(0)}
                  className={`px-2 py-0.5 rounded font-mono ${
                    activeLayer === 0 ? 'bg-rose-500 text-white' : 'text-slate-400'
                  }`}
                >
                  Top (0)
                </button>
                <button
                  onClick={() => setActiveLayer(1)}
                  className={`px-2 py-0.5 rounded font-mono ${
                    activeLayer === 1 ? 'bg-cyan-500 text-white' : 'text-slate-400'
                  }`}
                >
                  Bottom (1)
                </button>
              </div>
            )}
          </div>

          {/* Tool Modes */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => setEditorTool('obstacle')}
              className={`flex items-center space-x-2 p-2.5 rounded-xl border font-medium transition-all ${
                editorTool === 'obstacle'
                  ? 'bg-slate-800 border-emerald-500 text-emerald-400 shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <Grid className="w-4 h-4 text-slate-400" />
              <span>Place Obstacle</span>
            </button>

            <button
              onClick={() => setEditorTool('erase')}
              className={`flex items-center space-x-2 p-2.5 rounded-xl border font-medium transition-all ${
                editorTool === 'erase'
                  ? 'bg-slate-800 border-emerald-500 text-emerald-400 shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Eraser</span>
            </button>

            <button
              onClick={() => setEditorTool('pin_source')}
              className={`flex items-center space-x-2 p-2.5 rounded-xl border font-medium transition-all ${
                editorTool === 'pin_source'
                  ? 'bg-slate-800 border-emerald-500 text-emerald-400 shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <div className="w-3 h-3 rounded-sm bg-emerald-500 flex items-center justify-center text-[9px] text-white font-bold">
                S
              </div>
              <span>Set Source Pin</span>
            </button>

            <button
              onClick={() => setEditorTool('pin_target')}
              className={`flex items-center space-x-2 p-2.5 rounded-xl border font-medium transition-all ${
                editorTool === 'pin_target'
                  ? 'bg-slate-800 border-emerald-500 text-emerald-400 shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-cyan-500 flex items-center justify-center text-[9px] text-white font-bold">
                T
              </div>
              <span>Set Target Pin</span>
            </button>
          </div>

          {/* Generator Slider & Action */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Random Obstacle Density</span>
              <span className="font-mono text-emerald-400 font-bold">{obstacleDensity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              value={obstacleDensity}
              onChange={(e) => setObstacleDensity(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />

            <button
              onClick={handleGenerateRandom}
              className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs py-2 px-4 rounded-xl shadow-lg transition-all"
            >
              <Shuffle className="w-4 h-4" />
              <span>Generate Random Evaluation Board</span>
            </button>
          </div>
        </div>

        {/* Netlist Manager Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-semibold text-white">
                Netlist ({board.nets.length})
              </h2>
            </div>
          </div>

          {/* Add Net Form */}
          <form onSubmit={handleAddNet} className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Net Name (e.g. NET_CLK)"
              value={newNetName}
              onChange={(e) => setNewNetName(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-emerald-500"
              disabled={isAddingNet}
            />
            <input
              type="color"
              value={newNetColor}
              onChange={(e) => setNewNetColor(e.target.value)}
              className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
              disabled={isAddingNet}
            />
            <button
              type="submit"
              disabled={isAddingNet}
              className={`bg-slate-800 hover:bg-slate-700 text-emerald-400 p-2 rounded-lg border border-slate-700 ${
                isAddingNet ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title="Add Net"
            >
              {isAddingNet ? (
                <>
                  <Loader2 className="w-4 h-4" />
                  <span className="ml-1">Adding...</span>
                </>
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </button>
          </form>

          {/* Nets List */}
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {board.nets.map((net) => {
              const isSelected = selectedNetId === net.id;
              const isBeingRemoved = netToRemoveId === net.id;
              return (
                <div
                  key={net.id}
                  onClick={!isBeingRemoved ? () => setSelectedNetId(net.id) : undefined}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-500/50 text-white'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/40'
                  } ${isBeingRemoved ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-sm"
                      style={{ backgroundColor: net.color }}
                    />
                    <div>
                      <span className="font-semibold">{net.name}</span>
                      <div className="text-[10px] text-slate-400 font-mono">
                        S: (L{net.source.layer}, R{net.source.row}, C{net.source.col}) → T: (L
                        {net.target.layer}, R{net.target.row}, C{net.target.col})
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveNet(net.id);
                    }}
                    disabled={isBeingRemoved}
                    className={`text-slate-500 hover:text-rose-400 p-1 ${
                      isBeingRemoved ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title="Delete Net"
                  >
                    {isBeingRemoved ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Net Removal */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 w-96">
            <div className="flex items-center space-x-3 mb-4">
              <ShieldAlert className="w-8 h-8 text-rose-400" />
              <h3 className="text-lg font-semibold text-white">Confirm Net Removal</h3>
            </div>
            <p className="text-slate-300 text-center">
              Are you sure you want to remove this net? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelRemoveNet}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              >
                <Sliders className="w-4 h-4" />
                <span className="hidden sm:inline">Cancel</span>
              </button>
              <button
                onClick={handleConfirmRemoveNet}
                disabled={isRemovingNet}
                className={`flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-slate-950 rounded-lg transition-colors ${
                  isRemovingNet ? 'opacity-70' : ''
                }`}
              >
                {isRemovingNet ? (
                  <>
                    <Loader2 className="w-4 h-4" />
                    <span className="ml-1">Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Remove</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Grid Canvas View */}
      <div className="flex flex-col items-center space-y-2">
        <GridCanvas
          board={board}
          activeLayer={activeLayer}
          editorMode={editorTool}
          selectedNetId={selectedNetId}
          onCellClick={handleCellClick}
        />
      </div>
    </div>
  );
};
