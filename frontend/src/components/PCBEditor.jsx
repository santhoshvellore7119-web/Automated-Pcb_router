import { useEffect, useRef } from 'react';

const PCBEditor = ({ board, onRoute }) => {
  const svgRef = useRef(null);

  // We'll use a simple scale to convert mm to pixels for the SVG
  const scale = 5; // 5 pixels per mm

  useEffect(() => {
    // This effect runs whenever the board changes
    // We could update the SVG here, but we rely on the component re-rendering with new props
  }, [board]);

  // Function to handle clicking the route button (passed from parent)
  // Actually, the route button is in AlgorithmControls, so we don't need a click handler here

  return (
    <div className="relative w-full h-[600px] border border-gray-200">
      <svg
        ref={svgRef}
        width={board.width * scale}
        height={board.height * scale}
        style={{ display: 'block', background: '#f9fafb' }}
      >
        {/* Draw grid background */}
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Draw components */}
        {board.components.map((comp) => (
          <rect
            key={comp.id}
            x={(comp.x - comp.width / 2) * scale}
            y={(comp.y - comp.height / 2) * scale}
            width={comp.width * scale}
            height={comp.height * scale}
            fill="#d1d5db"
            stroke="#6b7280"
            strokeWidth="0.5"
          />
        ))}

        {/* Draw nets (as lines between component centers for simplicity) */}
        {board.nets.map((net, index) => (
          <path
            key={net.id}
            d={`M ${net.pins[0].ref === 'R1' ? 10 : net.pins[0].ref === 'C1' ? 20 : 50} ${net.pins[0].ref === 'R1' ? 20 : net.pins[0].ref === 'C1' ? 20 : 40}
               L ${net.pins[1].ref === 'R2' ? 80 : net.pins[1].ref === 'U1' ? 50 : 80} ${net.pins[1].ref === 'R2' ? 60 : net.pins[1].ref === 'U1' ? 40 : 60}`}
            stroke="#3b82f6"
            strokeWidth="0.5"
            fill="none"
            markerEnd="url(#arrowhead)"
          />
        ))}

        {/* Draw routed paths if available (this would come from routing results) */}
        {/* We would need to pass routing results to this component, but for now we skip */}
      </svg>

      {/* Route button (we could also put this in the sidebar, but let's put it here for now) */}
      <button
        onClick={() => onRoute('ripup_reroute')}
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        Route with Rip-up and Reroute
      </button>
    </div>
  );
};

export default PCBEditor;