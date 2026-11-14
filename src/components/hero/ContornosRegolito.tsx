import { HERO } from "../../lib/constants";

/**
 * Líneas de contorno del regolito: más juntas cerca del horizonte (perspectiva). Se iluminan alrededor
 * del azimut del Sol con un degradado periódico: es el barrido de luz rasante, calculado y no decorativo.
 */
export function ContornosRegolito({ ancho, alto, yHorizonte, curvatura, idDegradado }: {
  ancho: number; alto: number; yHorizonte: number; curvatura: number; idDegradado: string;
}) {
  const fondo = alto - yHorizonte;
  const lineas = Array.from({ length: HERO.CONTORNOS }, (_, i) => {
    const f = (i + 1) / (HERO.CONTORNOS + 1);
    const y = yHorizonte + fondo * f * f; // separación creciente
    const c = curvatura * (1 + f * 1.5);
    return `M0 ${y + c}Q${ancho / 2} ${y - c} ${ancho} ${y + c}`;
  });
  return (
    <g fill="none">
      {lineas.map((d, i) => (
        <g key={i} opacity={1 - (i / HERO.CONTORNOS) * 0.7}>
          <path d={d} className="stroke-linea" strokeWidth={1} opacity={0.7} />
          <path d={d} stroke={`url(#${idDegradado})`} strokeWidth={1} />
        </g>
      ))}
    </g>
  );
}
