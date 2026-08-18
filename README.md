<div align="center">
<img width="1200" height="475" alt="PCB Router Banner" src="https://via.placeholder.com/1200x475/000000/FFFFFF?text=Automated+PCB+Trace+Router" />
</div>

# Automated PCB Trace Router

A grid-based PCB autorouter using Lee's Algorithm, A* Search, and Rip-Up-and-Reroute conflict resolution with interactive visualization, Design Rule Check (DRC), and performance metrics.

## Features

- **Routing Algorithms**: Lee's (BFS), A* Search (with Manhattan heuristic), Rip-up & Reroute
- **Design Rule Check (DRC)**: Validates routed boards against manufacturing constraints
- **Interactive Visualization**: Real-time wavefront animation playback with speed controls
- **Multi-layer PCB Support**: Via hopping between copper layers
- **Performance Benchmarking**: Compare algorithm execution time, wirelength, and via count
- **Enhanced UI/UX**: Loading states, confirmation dialogs, and responsive design

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   ├── migrations/
│   └── var/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   └── stores/
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── README.md
├── package.json
├── vitest.config.ts
├── vitest.setup.ts
├── tsconfig.json
└── .gitignore
```

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
3. Open your browser to `http://localhost:5173` (or the URL shown in terminal)

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