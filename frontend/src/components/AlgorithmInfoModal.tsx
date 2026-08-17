import React from 'react';
import { X, BookOpen, Cpu, ShieldCheck, Layers, GitMerge, Zap } from 'lucide-react';

interface AlgorithmInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlgorithmInfoModal: React.FC<AlgorithmInfoModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">
              Automated PCB Trace Router — Algorithmic Architecture
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* Section 1: Lee's Algorithm */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center space-x-2">
              <Cpu className="w-4 h-4" />
              <span>1. Lee's Algorithm (Breadth-First Flood Fill)</span>
            </h3>
            <p className="text-slate-400">
              Lee's algorithm performs a textbook breadth-first flood fill outward from the source pin using a FIFO queue, a cost map, and a parent-pointer map. It is guaranteed to find the shortest path on an unweighted grid ($O(R \times C \times L)$ time complexity), but expands equally in every radial direction regardless of target position.
            </p>
          </div>

          {/* Section 2: A* Search */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-cyan-400 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>2. A* Search (Informed Best-First Search)</span>
            </h3>
            <p className="text-slate-400">
              A* replaces the FIFO queue with a min-heap priority queue ordered by $f = g + h$, where $h$ is the Manhattan distance heuristic ($|r_1 - r_2| + |c_1 - c_2|$). Because every move on the grid costs at least 1 unit, $h$ never overestimates the true remaining distance ($h \le h^*$), preserving the shortest-path guarantee while exploring significantly fewer cells on off-corner targets.
            </p>
          </div>

          {/* Section 3: Rip-Up-and-Reroute */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-indigo-400 flex items-center space-x-2">
              <GitMerge className="w-4 h-4" />
              <span>3. Rip-Up-and-Reroute & Union-Find</span>
            </h3>
            <p className="text-slate-400">
              Finding the optimal routing order for multi-net PCB layouts is NP-hard. When independently routed nets collide or block subsequent nets, the Rip-Up controller scans the bounding box of the failing net, identifies the blocking trace, rips it up, increases cell traversal penalty weights, and reroutes both nets within a bounded round cap. Conflicting nets are clustered using a Disjoint-Set Union-Find structure with path compression and rank ($O(\alpha(N))$ time complexity).
            </p>
          </div>

          {/* Architecture Module Table */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white">System Module Architecture</h3>
            <div className="border border-slate-800 rounded-xl overflow-hidden font-mono text-[11px]">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase">
                  <tr>
                    <th className="p-2.5">Module</th>
                    <th className="p-2.5">Location</th>
                    <th className="p-2.5">Responsibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="p-2.5 font-semibold text-emerald-400">Board Model</td>
                    <td className="p-2.5">src/types/router.ts</td>
                    <td className="p-2.5">Grid, obstacles, nets, via rules, trace occupancy</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-cyan-400">Router Facade</td>
                    <td className="p-2.5">src/lib/routerFacade.ts</td>
                    <td className="p-2.5">Shared dispatch across Lee's, A*, and Rip-Up</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-amber-400">Lee's Algorithm</td>
                    <td className="p-2.5">src/lib/algorithms/lee.ts</td>
                    <td className="p-2.5">Breadth-first wave-propagation router</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-indigo-400">A* Search</td>
                    <td className="p-2.5">src/lib/algorithms/astar.ts</td>
                    <td className="p-2.5">Best-first router with Manhattan heuristic</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-rose-400">Union-Find</td>
                    <td className="p-2.5">src/lib/unionFind.ts</td>
                    <td className="p-2.5">Net-conflict clustering for rip-up pass</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-purple-400">REST API</td>
                    <td className="p-2.5">server.ts</td>
                    <td className="p-2.5">Express routes and error handling</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow transition-all"
          >
            Close Theory Guide
          </button>
        </div>
      </div>
    </div>
  );
};
