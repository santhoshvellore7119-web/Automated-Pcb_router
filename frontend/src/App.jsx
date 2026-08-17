import { useState, useEffect, useRef } from 'react';
import { useSocket } from './hooks/useSocket';
import { useRouterStore } from './stores/routerStore';
import { PCBEditor } from './components/PCBEditor';
import { AlgorithmControls } from './components/AlgorithmControls';
import { StatsPanel } from './components/StatsPanel';
import './App.css';

function App() {
  const { socket, connected } = useSocket();
  const { routingResults, setRoutingResults, isRouting } = useRouterStore();

  const [boardData, setBoardData] = useState({
    width: 100, // mm
    height: 80, // mm
    components: [],
    nets: [],
    obstacles: []
  });

  const editorRef = useRef(null);

  // Initialize board with some sample components and nets
  useEffect(() => {
    const initialBoard = {
      width: 100,
      height: 80, // mm
      components: [
        { id: 1, ref: 'R1', x: 10, y: 20, width: 2, height: 1.2, layer: 1 },
        { id: 2, ref: 'C1', x: 20, y: 20, width: 1.6, height: 0.8, layer: 1 },
        { id: 3, ref: 'U1', x: 50, y: 40, width: 10, height: 6, layer: 1 },
        { id: 4, ref: 'R2', x: 80, y: 60, width: 2, height: 1.2, layer: 1 }
      ],
      nets: [
        { id: 1, name: 'NET_R1_U1', pins: [{ ref: 'R1', pin: 1 }, { ref: 'U1', pin: 5 }] },
        { id: 2, name: 'NET_C1_U1', pins: [{ ref: 'C1', pin: 1 }, { ref: 'U1', pin: 6 }] },
        { id: 3, name: 'NET_R2_U1', pins: [{ ref: 'R2', pin: 1 }, { ref: 'U1', pin: 7 }] }
      ],
      obstacles: []
    };

    setBoardData(initialBoard);
  }, []);

  const handleRoute = async (algorithm) => {
    if (!socket) return;

    // Send routing request to backend
    socket.emit('route_request', {
      board: boardData,
      algorithm: algorithm,
      parameters: {} // Could be expanded with algorithm-specific params
    });
  };

  // Handle routing results from backend
  useEffect(() => {
    if (!socket) return;

    const handleRouteResult = (result) => {
      setRoutingResults(result);
    };

    socket.on('route_result', handleRouteResult);

    return () => {
      socket.off('route_result', handleRouteResult);
    };
  }, [socket, setRoutingResults]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>PCB Trace Router</h1>
        <div className="connection-status">
          {connected ? '● Connected' : '● Disconnected'}
        </div>
      </header>

      <div className="app-body">
        <div className="editor-panel">
          <PCBEditor
            ref={editorRef}
            board={boardData}
            onRoute={(algorithm) => handleRoute(algorithm)}
          />
        </div>

        <div className="sidebar">
          <AlgorithmControls
            onRoute={handleRoute}
            isRouting={isRouting}
          />
          <StatsPanel results={routingResults} />
        </div>
      </div>

      <footer className="app-footer">
        <p>PCB Trace Router - Built with React & Flask</p>
      </footer>
    </div>
  );
}

export default App;