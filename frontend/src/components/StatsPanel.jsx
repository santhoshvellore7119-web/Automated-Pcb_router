import { useRouterStore } from '../stores/routerStore';

const StatsPanel = ({ results }) => {
  // We can also use the store, but we'll use the prop passed from App
  const { routingResults } = useRouterStore();
  const data = results || routingResults;

  if (!data) {
    return <div className="p-4 bg-white rounded-lg shadow">No routing results yet</div>;
  }

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2">Routing Statistics</h2>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span>Total Nets:</span>
          <span>{data.statistics?.total_nets || 0}</span>
        </div>
        <div className="flex justify-between">
          <span>Routed Nets:</span>
          <span>{data.statistics?.routed_nets || 0}</span>
        </div>
        <div className="flex justify-between">
          <span>Unrouted Nets:</span>
          <span>{data.statistics?.unrouted_nets || 0}</span>
        </div>
        <div className="flex justify-between">
          <span>Overflow (Conflicts):</span>
          <span>{data.statistics?.overflow || 0}</span>
        </div>
        <div className="flex justify-between">
          <span>Success Rate:</span>
          <span>
            {((data.statistics?.routed_nets || 0) / (data.statistics?.total_nets || 1) * 100).toFixed(
              1
            )}%
          </span>
        </div>
      </div>

      {data.nets && Object.keys(data.nets).length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Net Details</h3>
          <div className="max-h-60 overflow-y-auto text-xs">
            {Object.entries(data.nets).map(([netId, netInfo]) => (
              <div key={netId} className="flex justify-between py-1 border-b">
                <span>Net {netId}:</span>
                <span className={netInfo.routed ? 'text-green-600' : 'text-red-600'}>
                  {netInfo.routed ? 'Routed' : 'Failed'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsPanel;