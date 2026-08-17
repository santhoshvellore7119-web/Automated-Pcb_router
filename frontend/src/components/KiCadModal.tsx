import React, { useState } from 'react';
import { X, Download, Copy, Check, FileCode, FileJson } from 'lucide-react';
import { Board, RoutingRunReport } from '../types/router';
import { generateKiCadPcb } from '../lib/kicadExport';

interface KiCadModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: Board;
  currentReport: RoutingRunReport | null;
}

export const KiCadModal: React.FC<KiCadModalProps> = ({
  isOpen,
  onClose,
  board,
  currentReport,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'kicad' | 'json'>('kicad');

  if (!isOpen) return null;

  const kicadContent = currentReport
    ? generateKiCadPcb(board, currentReport)
    : ';; Please run a routing algorithm first to generate KiCad trace segments.';

  const jsonContent = JSON.stringify({ board, routingReport: currentReport }, null, 2);

  const displayContent = activeTab === 'kicad' ? kicadContent : jsonContent;

  const handleCopy = () => {
    navigator.clipboard.writeText(displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename =
      activeTab === 'kicad'
        ? `${board.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.kicad_pcb`
        : `${board.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;

    const mimeType = activeTab === 'kicad' ? 'text/plain' : 'application/json';
    const blob = new Blob([displayContent], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <FileCode className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Board & Trace Exporter</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('kicad')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'kicad'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>KiCad (.kicad_pcb)</span>
            </button>

            <button
              onClick={() => setActiveTab('json')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'json'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <FileJson className="w-4 h-4" />
              <span>Board JSON</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-lg text-xs font-bold shadow transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {/* Syntax Code Display Box */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 max-h-96 overflow-y-auto whitespace-pre">
          {displayContent}
        </div>
      </div>
    </div>
  );
};
