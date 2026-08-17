import { Board, RoutingRunReport } from '../types/router';

/**
 * Generates a valid .kicad_pcb format file string for KiCad EDA
 */
export function generateKiCadPcb(board: Board, report: RoutingRunReport): string {
  const timestamp = new Date().toISOString();
  let kicadStr = `(kicad_pcb (version 20211014) (generator "Automated PCB Trace Router")\n`;
  kicadStr += `  (general\n    (thickness 1.6)\n  )\n`;
  kicadStr += `  (paper "A4")\n`;
  kicadStr += `  (layers\n`;
  kicadStr += `    (0 "F.Cu" signal)\n`;
  if (board.layers > 1) {
    kicadStr += `    (31 "B.Cu" signal)\n`;
  }
  kicadStr += `    (44 "Edge.Cuts" user "Board Outline")\n`;
  kicadStr += `  )\n\n`;

  // Board outline (Scale 1 grid cell = 1.27 mm / 50 mil pitch)
  const pitch = 1.27; // mm
  const widthMm = (board.cols * pitch).toFixed(2);
  const heightMm = (board.rows * pitch).toFixed(2);

  kicadStr += `  ;; Board Outline\n`;
  kicadStr += `  (gr_line (start 0 0) (end ${widthMm} 0) (layer "Edge.Cuts") (width 0.15))\n`;
  kicadStr += `  (gr_line (start ${widthMm} 0) (end ${widthMm} ${heightMm}) (layer "Edge.Cuts") (width 0.15))\n`;
  kicadStr += `  (gr_line (start ${widthMm} ${heightMm}) (end 0 ${heightMm}) (layer "Edge.Cuts") (width 0.15))\n`;
  kicadStr += `  (gr_line (start 0 ${heightMm}) (end 0 0) (layer "Edge.Cuts") (width 0.15))\n\n`;

  // Nets declaration
  kicadStr += `  ;; Nets\n`;
  kicadStr += `  (net 0 "")\n`;
  board.nets.forEach((net, idx) => {
    kicadStr += `  (net ${idx + 1} "${net.name}")\n`;
  });
  kicadStr += `\n`;

  // Traces and Vias from Routing Run Report
  kicadStr += `  ;; Routed Traces & Vias (${report.algorithm.toUpperCase()} algorithm)\n`;
  report.netResults.forEach((netRes, netIdx) => {
    if (netRes.status !== 'ROUTED' || netRes.path.length < 2) return;
    const netCode = netIdx + 1;

    for (let i = 1; i < netRes.path.length; i++) {
      const p1 = netRes.path[i - 1];
      const p2 = netRes.path[i];

      const x1 = (p1.col * pitch + pitch / 2).toFixed(3);
      const y1 = (p1.row * pitch + pitch / 2).toFixed(3);
      const x2 = (p2.col * pitch + pitch / 2).toFixed(3);
      const y2 = (p2.row * pitch + pitch / 2).toFixed(3);

      if (p1.layer !== p2.layer) {
        // Via insertion
        kicadStr += `  (via (at ${x1} ${y1}) (size 0.8) (drill 0.4) (layers "F.Cu" "B.Cu") (net ${netCode}))\n`;
      } else {
        const layerName = p1.layer === 0 ? 'F.Cu' : 'B.Cu';
        kicadStr += `  (segment (start ${x1} ${y1}) (end ${x2} ${y2}) (width 0.25) (layer "${layerName}") (net ${netCode}))\n`;
      }
    }
  });

  kicadStr += `)\n`;
  return kicadStr;
}
