import { useRouterStore } from '../stores/routerStore';

const AlgorithmControls = ({ onRoute, isRouting }) => {
  const { routingResults } = useRouterStore();

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2">Routing Controls</h2>

      <div className="space-y-2">
        <button
          onClick={() => onRoute('lee')}
          disabled={isRouting}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition"
        >
          Run Lee's Algorithm
        </button>

        <button
          onClick={() => onRoute('astar')}
          disabled={isRouting}
          className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 transition"
        >
          Run A* Algorithm
        </button>

        <button
          onClick={() => onRoute('rippup_reroute')}
          disabled={isRouting}
          className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 transition"
        >
          Run Rip-Up & Reroute
        </button>
      </div>

      {routingResults && (
        <div className="pt-4 border-t">
          <h3 className="font-medium mb-2">Routing Results</h3>
          <p className="text-sm text-gray-600">
            Algorithm: {routingResults.algorithm_used || 'N/A'}
          </p>
          <p className="text-sm text-gray-600">
            Success Rate: {(routingResults.statistics?.success_rate * 100).toFixed(1)}%
          </p>
          <p className="text-sm text-gray-600">
            Routed Nets: {routingResults.statistics?.routed_nets}/{routingResults.statistics?.total_nets}
          </p>
        </div>
      )}
    </div>
  );
};

export default AlgorithmControls;