import { Board, Coord, Net } from '../types/router';

export function createCornerToCornerBoard(): Board {
  return {
    id: 'preset-corner-to-corner',
    name: '1. Corner-to-Corner Test (Open Grid)',
    rows: 20,
    cols: 20,
    layers: 1,
    obstacles: [],
    nets: [
      {
        id: 'net-1',
        name: 'NET1_CORNER',
        color: '#ef4444',
        priority: 1,
        source: { layer: 0, row: 0, col: 0 },
        target: { layer: 0, row: 19, col: 19 },
      },
    ],
  };
}

export function createOffCornerSpeedupBoard(): Board {
  return {
    id: 'preset-off-corner',
    name: '2. Off-Corner A* Speedup Benchmark',
    rows: 30,
    cols: 30,
    layers: 1,
    obstacles: [],
    nets: [
      {
        id: 'net-1',
        name: 'NET1_CENTER',
        color: '#3b82f6',
        priority: 1,
        source: { layer: 0, row: 2, col: 2 },
        target: { layer: 0, row: 15, col: 15 },
      },
      {
        id: 'net-2',
        name: 'NET2_PERIPHERY',
        color: '#10b981',
        priority: 2,
        source: { layer: 0, row: 28, col: 2 },
        target: { layer: 0, row: 15, col: 28 },
      },
    ],
  };
}

export function createForcedCongestionBoard(): Board {
  const obstacles: Coord[] = [];
  // Build a wall across column 10, leaving only row 10 open as a 1-cell gap
  for (let r = 0; r < 20; r++) {
    if (r !== 10) {
      obstacles.push({ layer: 0, row: r, col: 10 });
    }
  }

  return {
    id: 'preset-forced-congestion',
    name: '3. Forced Congestion Bottleneck (1-Cell Corridor)',
    rows: 20,
    cols: 20,
    layers: 1,
    obstacles,
    nets: [
      {
        id: 'net-a',
        name: 'NET_ALPHA',
        color: '#f59e0b',
        priority: 1,
        source: { layer: 0, row: 5, col: 2 },
        target: { layer: 0, row: 5, col: 18 },
      },
      {
        id: 'net-b',
        name: 'NET_BETA',
        color: '#8b5cf6',
        priority: 2,
        source: { layer: 0, row: 15, col: 2 },
        target: { layer: 0, row: 15, col: 18 },
      },
    ],
  };
}

export function createMultiNetCrossoverBoard(): Board {
  return {
    id: 'preset-crossover',
    name: '4. Multi-Net Crossover & Rip-Up Challenge',
    rows: 16,
    cols: 16,
    layers: 1,
    obstacles: [
      { layer: 0, row: 3, col: 8 },
      { layer: 0, row: 4, col: 8 },
      { layer: 0, row: 11, col: 8 },
      { layer: 0, row: 12, col: 8 },
    ],
    nets: [
      {
        id: 'net-horiz',
        name: 'NET_HORIZ_MAIN',
        color: '#06b6d4',
        priority: 1,
        source: { layer: 0, row: 7, col: 1 },
        target: { layer: 0, row: 7, col: 14 },
      },
      {
        id: 'net-vert-1',
        name: 'NET_VERT_CROSS_1',
        color: '#ec4899',
        priority: 2,
        source: { layer: 0, row: 1, col: 6 },
        target: { layer: 0, row: 14, col: 6 },
      },
      {
        id: 'net-vert-2',
        name: 'NET_VERT_CROSS_2',
        color: '#84cc16',
        priority: 3,
        source: { layer: 0, row: 1, col: 10 },
        target: { layer: 0, row: 14, col: 10 },
      },
    ],
  };
}

export function createTwoLayerViaBridgeBoard(): Board {
  const obstacles: Coord[] = [];
  // Solid wall across layer 0 column 10 (top layer)
  for (let r = 2; r < 18; r++) {
    obstacles.push({ layer: 0, row: r, col: 10 });
  }

  return {
    id: 'preset-via-bridge',
    name: '5. Two-Layer Board (Via Hopping Bridge)',
    rows: 20,
    cols: 20,
    layers: 2,
    obstacles,
    nets: [
      {
        id: 'net-bridge-1',
        name: 'NET_TOP_TO_BOTTOM',
        color: '#6366f1',
        priority: 1,
        source: { layer: 0, row: 10, col: 3 },
        target: { layer: 0, row: 10, col: 17 },
      },
      {
        id: 'net-bridge-2',
        name: 'NET_PARALLEL_BUS',
        color: '#14b8a6',
        priority: 2,
        source: { layer: 0, row: 12, col: 3 },
        target: { layer: 0, row: 12, col: 17 },
      },
    ],
  };
}

export function generateRandomBoard(
  rows: number = 20,
  cols: number = 20,
  layers: number = 1,
  obstacleDensityPercent: number = 15,
  netCount: number = 3
): Board {
  const obstacles: Coord[] = [];
  const obstacleSet = new Set<string>();

  const totalCells = rows * cols * layers;
  const numObstacles = Math.floor((totalCells * obstacleDensityPercent) / 100);

  while (obstacles.length < numObstacles) {
    const l = Math.floor(Math.random() * layers);
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    const key = `${l},${r},${c}`;
    if (!obstacleSet.has(key)) {
      obstacleSet.add(key);
      obstacles.push({ layer: l, row: r, col: c });
    }
  }

  const colors = [
    '#ef4444',
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#84cc16',
  ];

  const nets: Net[] = [];
  for (let i = 0; i < netCount; i++) {
    let src: Coord | null = null;
    let tgt: Coord | null = null;

    let attempts = 0;
    while (!src || !tgt) {
      attempts++;
      if (attempts > 200) break;

      const sl = Math.floor(Math.random() * layers);
      const sr = Math.floor(Math.random() * rows);
      const sc = Math.floor(Math.random() * cols);
      const skey = `${sl},${sr},${sc}`;

      const tl = Math.floor(Math.random() * layers);
      const tr = Math.floor(Math.random() * rows);
      const tc = Math.floor(Math.random() * cols);
      const tkey = `${tl},${tr},${tc}`;

      if (skey !== tkey && !obstacleSet.has(skey) && !obstacleSet.has(tkey)) {
        src = { layer: sl, row: sr, col: sc };
        tgt = { layer: tl, row: tr, col: tc };
        obstacleSet.add(skey);
        obstacleSet.add(tkey);
      }
    }

    if (src && tgt) {
      nets.push({
        id: `random-net-${i + 1}`,
        name: `NET_${i + 1}`,
        color: colors[i % colors.length],
        priority: i + 1,
        source: src,
        target: tgt,
      });
    }
  }

  return {
    id: `random-${Date.now()}`,
    name: `Random Board (${rows}x${cols}, ${obstacleDensityPercent}% Obs, ${nets.length} Nets)`,
    rows,
    cols,
    layers,
    obstacles,
    nets,
  };
}

export const ALL_PRESETS: Board[] = [
  createCornerToCornerBoard(),
  createOffCornerSpeedupBoard(),
  createForcedCongestionBoard(),
  createMultiNetCrossoverBoard(),
  createTwoLayerViaBridgeBoard(),
];
