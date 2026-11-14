import type { Categoria } from "../../lib/tipos";

/** Forma por categoría, centrada en (0,0) con «radio» r: apolo ●, artemis ◆, clps ■, internacional ▲. */
export function FormaCategoria({ categoria, r = 6 }: { categoria: Categoria; r?: number }) {
  switch (categoria) {
    case "apolo":
      return <circle r={r} />;
    case "artemis":
      return <path d={`M0 ${-r * 1.25}L${r * 1.25} 0 0 ${r * 1.25} ${-r * 1.25} 0Z`} />;
    case "clps":
      return <rect x={-r * 0.9} y={-r * 0.9} width={r * 1.8} height={r * 1.8} />;
    case "internacional":
      return <path d={`M0 ${-r * 1.15}L${r * 1.15} ${r * 0.85}H${-r * 1.15}Z`} />;
    case "historico":
      return <circle r={r * 0.8} fill="none" stroke="currentColor" strokeWidth={r * 0.4} />;
    default:
      return <path d={`M${-r} 0H${r}M0 ${-r}V${r}`} fill="none" stroke="currentColor" strokeWidth={r * 0.4} />;
  }
}

export function GlifoCategoria({ categoria, className }: { categoria: Categoria; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="-9 -9 18 18" className={className ?? "size-3.5 shrink-0"} fill="currentColor">
      <FormaCategoria categoria={categoria} />
    </svg>
  );
}
