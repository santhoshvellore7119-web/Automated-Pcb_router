# PCB Trace Router Frontend

This is the frontend for the PCB Trace Router application, built with React and Vix. It provides an interactive interface for designing PCBs and running various routing algorithms.

## Features

- Interactive PCB editor with component placement
- Real-time visualization of routing algorithms
- Support for multiple routing algorithms:
  - Lee's Algorithm (Breadth-First Search)
  - A* Search Algorithm
  - Rip-Up and Reroute (multi-net conflict resolution)
- Visual feedback on routing results
- Connection status monitoring
- Responsive design

## Technology Stack

- **React 18** - UI library
- **Vite** - Build tool and development server
- **Socket.IO Client** - Real-time communication with backend
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **ESLint** - Code quality

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Development

To start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` by default.

### Building for Production

To create a production build:
```bash
npm run build
```

To preview the production build:
```bash
npm run preview
```

## Project Structure

```
frontend/
├── public/             ├── src/assets/                     # Files
       ├── hooks/                # Custom React hooks
│       # React components      # Stylinlcorexecute
├── store                # State management (Zustand)├── components# React components
├── hooks                # Custom React hooks
├── styles              
├── ASSETS               # Static asset
├── index.html          # HTML template
├── main.jsx            # Entry point
├── App.jsx             # Main application component
├── index.css           # Global styles (Tailwind)
├── vite.config.js      # Vite configuration
├── package.json        # Dependencies and scripts
├── tailwind.config.js  # Tailwind configuration
├── postcss.config.js   # PostCSS configuration
└── README.md           # This file

## Components

### PCBEditor
The main canvas for displaying and interacting with the PCB layout. Shows:
- Board boundaries
- Components (as rectangles)
- Nets (as connection lines)
- Obstacles (if any)
- Routing results

### AlgorithmControls
Panel with buttons to trigger different routing algorithms:
- Lee's Algorithm
- A* Algorithm  
- Rip-Up and Reroute

### StatsPanel
Displays statistics about the routing process:
- Total nets processed
- Successfully routed nets
- Unrouted nets
- Overflow/conflict count
- Success rate
- Individual net routing status

## State Management

The application uses Zustand for state management with a single store:

**routerStore**:
- `routingResults`: Stores the latest routing results from the backend
- `isRouting`: Boolean flag indicating if routing is in progress
- `setRoutingResults`: Action to update routing results
- `setIsRouting`: Action to update routing status

## Real-time Communication

The frontend connects to the backend via Socket.IO for real-time updates:

**Emitted Events**:
- `route_request`: Sent when a routing algorithm is initiated
  - Payload: `{ board, algorithm, parameters }`

**Received Events**:
- `route_result`: Received when routing completes
  - Payload: `{ nets, statistics, algorithm_used, ... }`

The connection status is displayed in the application header.

## Styling

The application uses Tailwind CSS for styling. Key aspects:

- Responsive design using Tailwind's breakpoint system
- Consistent spacing and typography
- Visual feedback for user interactions
- Color coding for different elements:
  - Components: Blue/gray rectangles
  - Nets: Green dashed lines
  - Obstacles: Red semi-transparent rectangles
  - Routes: Various colors based on algorithm

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```
VITE_SERVER_URL=http://localhost:5000
```

This tells the frontend where to connect to the backend WebSocket server.

## Backend Integration

This frontend expects a backend server running at the URL specified in `VITE_SERVER_URL`. The backend should provide:

1. **WebSocket Endpoint**: Socket.IO server at the root path
2. **Event Handling**: 
   - Listen for `route_request` events
   - Emit `route_result` events when routing completes
3. **REST API**: For managing boards, components, nets, etc. (if needed for advanced features)

The backend should implement the routing algorithms:
- Lee's Algorithm (Breadth-First Search)
- A* Search Algorithm  
- Rip-Up and Reroute with conflict detection and resolution

## Development Guidelines

### Code Style

- Follow existing code patterns in the repository
- Use functional components with hooks
- Keep components small and focused
- Use Tailwind utility classes for styling
- Add PropTypes or TypeScript for prop validation (future enhancement)

### Adding New Features

1. **New Components**: Add to `src/components/`
2. **State Updates**: Modify stores in `src/stores/` if needed
3. **Reusable Logic**: Create custom hooks in `src/hooks/`
4. **Styling**: Use Tailwind classes or create new utility classes
5. **Event Handling**: Add Socket.IO listeners in `useSocket.js` or component effects

## Troubleshooting

### Connection Issues

If you see "● Disconnected" in the header:
1. Check that the backend server is running
2. Verify the `VITE_SERVER_URL` environment variable is correct
3. Ensure the backend is configured to accept Socket.IO connections
4. Check browser console for WebSocket error messages

### Build Issues

If you encounter build problems:
1. Clear the cache: `rm -rf node_modules/.vite`
2. Reinstall dependencies: `npm install`
3. Try again: `npm run build`

## Future Enhancements

Potential improvements for future versions:

1. **TypeScript Migration**: Add type safety
2. **Enhanced PCB Editor**: 
   - Drag-and-drop component placement
   - Net routing visualization
   - Design rule checking
3. **Advanced Visualization**:
   - Animated routing process
   - Heatmaps for congestion
   - Layer visualization
4. **User Authentication**: 
   - User accounts and project saving
   - Collaboration features
5. **Export Capabilities**:
   - Gerber file generation
   - SVG/PNG export
   - BOM generation
6. **Testing**:
   - Unit tests with Jest/Vitest
   - Integration tests with Cypress
   - End-to-end testing

## License

This project is part of the PCB Trace Router system. Please refer to the main repository for licensing information.