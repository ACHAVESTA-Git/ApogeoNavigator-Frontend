import { INCLINACION_EJE_LUNAR_DEG } from "../../lib/constants";
import { grados } from "../../lib/formato";
import { T } from "../../lib/textos";

const R = 78;
const [CX, CY] = [130, 110];
const RAYOS = [-58, -29, 0, 29, 58];

/** Mini-diagrama estático: el eje lunar apenas inclinado y la luz del Sol llegando rasante al polo sur. */
export function DiagramaPolo() {
  const t = T.inicio.polo;
  const inclinacion = grados(INCLINACION_EJE_LUNAR_DEG, 2);
  return (
    <svg role="img" aria-label={t.diagrama(inclinacion)} viewBox="0 0 420 230" className="w-full max-w-md">
      {/* rayos horizontales desde el Sol (derecha) */}
      {RAYOS.map((dy) => (
        <line key={dy} x1={400} x2={CX + Math.sqrt(R * R - dy * dy) + 6} y1={CY + dy} y2={CY + dy} className="stroke-sol" strokeWidth={1} opacity={0.75} />
      ))}
      <line x1={400} x2={CX + 4} y1={CY + R} y2={CY + R} className="stroke-sol" strokeWidth={1.5} />
      <text x={400} y={CY - R + 4} textAnchor="end" className="fill-sol font-mono text-[12px] max-sm:text-[16px]">{t.luz}</text>
      {/* Luna: mitad en sombra */}
      <circle cx={CX} cy={CY} r={R} className="fill-regolito stroke-horizonte" strokeWidth={1.5} />
      <path d={`M${CX} ${CY - R}A${R} ${R} 0 0 0 ${CX} ${CY + R}Z`} className="fill-vacio" opacity={0.85} />
      {/* eje inclinado 1,54° (exagerar sería falsear: se dibuja a escala) */}
      <g transform={`rotate(${INCLINACION_EJE_LUNAR_DEG} ${CX} ${CY})`}>
        <line x1={CX} x2={CX} y1={CY - R - 22} y2={CY + R + 22} className="stroke-texto" strokeWidth={1} strokeDasharray="4 4" />
      </g>
      <line x1={CX} x2={CX} y1={CY - R - 22} y2={CY - R - 6} className="stroke-horizonte" strokeWidth={1} />
      <text x={CX + 10} y={CY - R - 12} className="fill-texto-2 font-mono text-[12px] max-sm:text-[16px]">{t.eje} · {inclinacion}</text>
      <circle cx={CX} cy={CY + R} r={3.5} className="fill-texto" />
      <text x={CX + 12} y={CY + R + 22} className="fill-texto font-mono text-[12px] max-sm:text-[16px]">{t.polo}</text>
    </svg>
  );
}
