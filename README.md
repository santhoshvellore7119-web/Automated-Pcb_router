# Automated PCB Trace Router

A grid-based PCB autorouter using Lee's Algorithm, A* Search, and Rip-Up-and-Reroute conflict resolution with interactive visualization, Design Rule Check (DRC), and performance metrics.

## Project Structure

```
.
├── backend/                  # Express server with routing algorithms
│   ├── .env                  # Environment variables
│   └── server.ts             # Main server entry point
├── frontend/                 # React/Vite frontend application
│   ├── index.html            # HTML template
│   ├── package.json          # Frontend dependencies and scripts
│   ├── public/               # Static assets
│   ├── src/                  # Source code
│   │   ├── components/       # React components
│   │   ├── lib/              # Routing algorithms and board utilities
│   │   ├── stores/           # Zustand state management
│   │   ├── App.jsx           # Main application component
│   │   ├── main.jsx          # Entry point
│   │   ├── index.css         # Global styles (Tailwind)
│   │   └── vite.config.ts    # Vite configuration
├── dist/                     # Production build output
├── node_modules/             # Project dependencies
├── package.json              # Root dependencies and scripts
├── vitest.config.ts          # Vitest configuration
├── vitest.setup.ts           # Vitest setup
├── tsconfig.json             # TypeScript configuration
└── .gitignore                # Git ignore rules
```

## Features

- **Routing Algorithms**: Lee's (BFS), A* Search (with Manhattan heuristic), Rip-up & Reroute
- **Design Rule Check (DRC)**: Validates routed boards against manufacturing constraints
- **Interactive Visualization**: Real-time wavefront animation playback with speed controls
- **Multi-layer PCB Support**: Via hopping between copper layers
- **Performance Benchmarking**: Compare algorithm execution time, wirelength, and via count
- **Enhanced UI/UX**: Loading states, confirmation dialogs, and responsive design

## Run Locally

**Prerequisites:** Node.js (v16+ recommended)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server (runs both frontend and backend):
   ```bash
   npm run dev
   ```
   - Backend server starts on `http://localhost:3000`
   - Frontend Vite dev server starts on `http://localhost:5173`
   - Open your browser to the frontend URL shown in the terminal.

## API Endpoints

The backend provides REST API endpoints for board routing:

- `GET /api/v1/health` - Health check
- `POST /api/v1/boards` - Validate and store a board
- `GET /api/v1/boards/:id` - Retrieve a stored board
- `POST /api/v1/boards/:id/route/lee` - Route with Lee's Algorithm
- `POST /api/v1/boards/:id/route/astar` - Route with A* Search
- `POST /api/v1/boards/:id/route/ripup` - Route with Rip-Up & Reroute
- `POST /api/v1/boards/:id/compare` - Compare all three algorithms
- `POST /api/v1/generate/random` - Generate a random test board
- `POST /api/v1/generate/congestion` - Generate a forced-congestion test board

## Build for Production

```bash
npm run build
```
This will:
1. Build the frontend assets to `frontend/dist/`
2. Bundle the backend server to `dist/server.cjs`

To run the production build:
```bash
npm start
```
The built assets will be served by the backend when `NODE_ENV=production`.

## Environment Variables

You can configure the API base URL for the frontend by creating a `.env` file in the frontend directory:

```
VITE_API_BASE_URL=http://localhost:3000
```

## License

MIT