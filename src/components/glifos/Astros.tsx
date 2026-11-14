// Glifos del Sol y la Tierra. Se distinguen por FORMA además de por color:
// el Sol es un disco lleno con núcleo claro; la Tierra, un anillo con terminador en media luna.
import { unir } from "../ui/clases";

interface PropsGlifo {
  /** Radio en unidades del SVG contenedor (o en px si es independiente). */
  r?: number;
  /** Astro bajo el horizonte: contorno discontinuo al 50 %. */
  fantasma?: boolean;
}

/** Sol para incrustar en un SVG, centrado en (0,0). */
export function SolSvg({ r = 7, fantasma = false }: PropsGlifo) {
  if (fantasma) return <circle r={r} className="stroke-sol fill-none opacity-50" strokeWidth={1.5} strokeDasharray="3 3" />;
  return (
    <>
      <circle r={r} className="fill-sol" />
      <circle r={r * 0.45} className="fill-sol-nucleo" />
    </>
  );
}
/** Tierra para incrustar en un SVG, centrada en (0,0). */
export function TierraSvg({ r = 6, fantasma = false }: PropsGlifo) {
  if (fantasma) return <circle r={r} className="stroke-tierra fill-none opacity-50" strokeWidth={1.5} strokeDasharray="3 3" />;
  return (
    <>
      <circle r={r} className="fill-vacio stroke-tierra" strokeWidth={1.5} />
      {/* terminador: media luna iluminada */}
      <path d={`M0 ${-r} A${r} ${r} 0 0 1 0 ${r} A${r * 0.45} ${r} 0 0 0 0 ${-r}Z`} className="fill-tierra" />
    </>
  );
}

const Marco = ({ px, className, children }: { px: number; className?: string; children: React.ReactNode }) => (
  <svg aria-hidden="true" width={px} height={px} viewBox="-10 -10 20 20" className={unir("inline-block shrink-0 overflow-visible", className)}>
    {children}
  </svg>
);
export const GlifoSol = ({ px = 16, className, fantasma }: { px?: number; className?: string; fantasma?: boolean }) => (
  <Marco px={px} className={className}><SolSvg r={8} fantasma={fantasma} /></Marco>
);
export const GlifoTierra = ({ px = 16, className, fantasma }: { px?: number; className?: string; fantasma?: boolean }) => (
  <Marco px={px} className={className}><TierraSvg r={7.5} fantasma={fantasma} /></Marco>
);
export const GlifoAstro = ({ astro, ...resto }: { astro: "sol" | "tierra"; px?: number; className?: string; fantasma?: boolean }) =>
  astro === "sol" ? <GlifoSol {...resto} /> : <GlifoTierra {...resto} />;
