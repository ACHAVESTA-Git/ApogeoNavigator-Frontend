import { KeyRound } from "lucide-react";
import { CLAVES_PQC } from "../../lib/constants";
import { abreviarHuella } from "../../lib/lujo";
import type { HuellaPqc } from "../../lib/sesion";

/**
 * Huellas PÚBLICAS de las claves post-cuánticas como chips: algoritmo + principio de la huella SHA3-256.
 * Una huella no es un secreto; aquí nunca entra material privado.
 */
export function HuellasPqc({ huellas, className }: { huellas: HuellaPqc[]; className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-2 ${className ?? ""}`}>
      {huellas.map((h) => (
        <li key={`${h.algoritmo}-${h.huella}`} className="bg-texto/[0.045] inline-flex min-h-8 max-w-full items-center gap-2 rounded-full border border-texto/10 px-3 py-1">
          <KeyRound aria-hidden="true" className="text-texto-2 size-3.5 shrink-0" />
          <span className="text-apoyo text-texto font-semibold whitespace-nowrap">{h.algoritmo}</span>
          <span className="text-dato-sm text-texto-2 truncate font-mono" data-dato title={h.huella}>{abreviarHuella(h.huella, CLAVES_PQC.HUELLA_VISIBLE)}</span>
        </li>
      ))}
    </ul>
  );
}
