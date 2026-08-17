import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  ALL_PRESETS,
  createForcedCongestionBoard,
  generateRandomBoard,
} from '../frontend/src/lib/presetBoards';
import {
  compareAllAlgorithms,
  runAStarOnBoard,
  runLeeOnBoard,
  runRipUpOnBoard,
} from '../frontend/src/lib/routerFacade';
import { Board } from '../frontend/src/types/router';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory Board Repository seeded with standard presets
  const boardStore = new Map<string, Board>();
  for (const p of ALL_PRESETS) {
    boardStore.set(p.id, p);
  }

  // --- API Endpoints ---

  // 1. Health check
  app.get('/api/v1/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Automated PCB Trace Router API',
      version: '1.0.0',
      uptimeSeconds: process.uptime(),
      boardsStored: boardStore.size,
    });
  });

  // 2. Validate & Store Board
  app.post('/api/v1/boards', (req, res) => {
    const board: Board = req.body;
    if (!board || !board.rows || !board.cols || !board.nets) {
      return res.status(400).json({
        error: 'Invalid board schema. Required fields: rows, cols, layers, nets',
      });
    }
    const boardId = board.id || `board-${Date.now()}`;
    const savedBoard: Board = { ...board, id: boardId, createdAt: new Date().toISOString() };
    boardStore.set(boardId, savedBoard);
    res.status(201).json(savedBoard);
  });

  // 3. Get Stored Board
  app.get('/api/v1/boards/:id', (req, res) => {
    const board = boardStore.get(req.params.id);
    if (!board) {
      return res.status(404).json({ error: `Board with ID '${req.params.id}' not found.` });
    }
    res.json(board);
  });

  // 4. Route with Lee's Algorithm
  app.post('/api/v1/boards/:id/route/lee', (req, res) => {
    const board = req.body.rows ? req.body : boardStore.get(req.params.id);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    const report = runLeeOnBoard(board);
    res.json(report);
  });

  // 5. Route with A* Search
  app.post('/api/v1/boards/:id/route/astar', (req, res) => {
    const board = req.body.rows ? req.body : boardStore.get(req.params.id);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    const report = runAStarOnBoard(board);
    res.json(report);
  });

  // 6. Route with Rip-Up & Reroute
  app.post('/api/v1/boards/:id/route/ripup', (req, res) => {
    const board = req.body.rows ? req.body : boardStore.get(req.params.id);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    const report = runRipUpOnBoard(board);
    res.json(report);
  });

  // 7. Compare All 3 Algorithms
  app.post('/api/v1/boards/:id/compare', (req, res) => {
    const board = req.body.rows ? req.body : boardStore.get(req.params.id);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    const report = compareAllAlgorithms(board);
    res.json(report);
  });

  // 8. Generate Random Evaluation Board
  app.post('/api/v1/generate/random', (req, res) => {
    const { rows = 20, cols = 20, layers = 1, obstacleDensity = 15, netCount = 3 } = req.body || {};
    const randomBoard = generateRandomBoard(rows, cols, layers, obstacleDensity, netCount);
    boardStore.set(randomBoard.id, randomBoard);
    res.json(randomBoard);
  });

  // 9. Generate Forced-Congestion Test Board
  app.post('/api/v1/generate/congestion', (_req, res) => {
    const board = createForcedCongestionBoard();
    boardStore.set(board.id, board);
    res.json(board);
  });

  // --- Vite / Static Middleware Setup ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: '../frontend',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), '../frontend/dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Automated PCB Trace Router server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
