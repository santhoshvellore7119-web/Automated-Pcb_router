import { useState, useEffect, useRef } from 'react';
import { useSocket } from './hooks/useSocket';
import { useRouterStore } from './stores/routerStore';
import PCBEditor from './components/PCBEditor';
import AlgorithmControls from './components/AlgorithmControls';
import StatsPanel from './components/StatsPanel';
import './App.css';

function App() {
  const { socket, connected } = useSocket();
  const { routingResults, isRouting, setIsRouting } = useRouterStore();

  // State for storing routing results
  const [results, setResults] = useState(null);

  // State for storing the current board
  const [board, setBoard] = useState({
    width: 100,
    height: 100,
    components: [
      { id: 'R1', ref: 'R1', x: 10, y: 20, width: 5, height: 3 },
      { id: 'R2', ref: 'R2', x: 80, y: 60, width: 5, height: 3 },
      { id: 'C1', ref: 'C1', x: 20, y: 40, width: 3, height: 5 },
      { id: 'C2', ref: 'C2', x: 60, y: 80, width: 3, height: 5 },
      { id: 'U1', ref: 'U1', x: 50, y: 50, width: 10, height: 10 }
    ],
    nets: [
      { id: 'net1', pins: [{ ref: 'R1', x: 12, y: 22 }, { ref: 'C1', x: 22, y: 42 }] },
      { id: 'net2', pins: [{ ref: 'R2', x: 82, y: 62 }, { ref: 'U1', x: 55, y: 55 }] },
      { id: 'net3', pins: [{ ref: 'C2', x: 62, y: 82 }, { ref: 'U1', x: 45, y: 55 }] }
    ]
  });

  // Function to handle routing requests from AlgorithmControls
  const handleRoute = async (algorithm) => {
    setIsRouting(true);
    try {
      // Import the router facade dynamically to avoid circular dependencies
      const { routeNetLee, routeNetAStar, runRipUpOnBoard } = await import('./lib/routerFacade');
      
      let resultsData = null;
      
      switch (algorithm) {
        case 'lee':
          resultsData = await routeNetLee({ board });
          break;
        case 'astar':
          resultsData = await routeNetAStar({ board });
          break;
        case 'ripup_reroute':
          resultsData = await runRipUpOnBoard({ board });
          break;
        default:
          throw new Error(`Unknown algorithm: ${algorithm}`);
      }
      
      setResults(resultsData);
      // Update the store with the results
      // Note: We don't have access to setRoutingResults from the store directly
      // We'll need to update the store via a different approach or use the state above
      // For now, we'll just use the local state and pass it to the StatsPanel
    } catch (error) {
      console.error('Routing failed:', error);
    } finally {
      setIsRouting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-800 mb-6">PCB AutoRouter</h1>
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          <AlgorithmControls
            onRoute={handleRoute}
            isRouting={isRouting}
          />
          <StatsPanel results={results} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">PCB Editor</h2>
          <PCBEditor board={board} onRoute={handleRoute} />
        </div>

        {/* Simulation Controls */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Simulation Controls</h2>
          <div className="space-x-3">
            <button
              onClick={() => {
                // Reset to initial board state
                setBoard({
                  width: 100,
                  height: 100,
                  components: [
                    { id: 'R1', ref: 'R1', x: 10, y: 20, width: 5, height: 3 },
                    { id: 'R2', ref: 'R2', x: 80, y: 60, width: 5, height: 3 },
                    { id: 'C1', ref: 'C1', x: 20, y: 40, width: 3, height: 5 },
                    { id: 'C2', ref: 'C2', x: 60, y: 80, width: 3, height: 5 },
                    { id: 'U1', ref: 'U1', x: 50, y: 50, width: 10, height: 10 }
                  ],
                  nets: [
                    { id: 'net1', pins: [{ ref: 'R1', x: 12, y: 22 }, { ref: 'C1', x: 22, y: 42 }] },
                    { id: 'net2', pins: [{ ref: 'R2', x: 82, y: 62 }, { ref: 'U1', x: 55, y: 55 }] },
                    { id: 'net3', pins: [{ ref: 'C2', x: 62, y: 82 }, { ref: 'U1', x: 45, y: 55 }] }
                  ]
                });
                setResults(null);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
            >
              Reset Board
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
