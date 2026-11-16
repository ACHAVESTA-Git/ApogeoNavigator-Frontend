import type { ReactNode } from "react";
import { useCifraAnimada } from "../../hooks/useCifraAnimada";
import { LUJO } from "../../lib/constants";
import { numeroCorto } from "../../lib/formato";
import { unir } from "../ui/clases";
import { useFormatoEstable } from "./useFormatoEstable";

const TAMANO = { heroe: "text-heroe", media: "text-dato-xl" } as const;
const UNIDAD = { heroe: "text-[0.36em]", media: "text-[0.5em]" } as const;
const TONO = { texto: "text-texto", sol: "text-sol", tierra: "text-tierra" } as const;

export interface CifraHeroeProps {
  /** El dato (siempre de la API o calculado en `src/lib`). */
  valor: number;
  /** Cómo se escribe el número (sin la unidad). Por defecto, `numeroCorto`. */
  formato?: (valor: number) => string;
  /** Unidad: va detrás, en peso ligero y menor tamaño («h», «%», «°»). */
  unidad?: string;
  /** Rótulo en versalitas encima de la cifra. */
  rotulo?: string;
  /** Con qué se compara («vs. Apolo 11», «de 744 h»). */
  contexto?: ReactNode;
  /** `heroe`: 56–96 px fluida (una por pantalla). `media`: 32–52 px, para franjas de 2 o 3 cifras. */
  tamano?: keyof typeof TAMANO;
  tono?: keyof typeof TONO;
  /** Cuenta desde 0 hasta el valor UNA vez al aparecer (≤ 600 ms); después solo interpola si el valor cambia. */
  animar?: boolean;
  className?: string;
}

/**
 * Cifra protagonista: número en mono tabular grande, unidad ligera y contexto. El lector de pantalla recibe el
 * valor final (el conteo es solo visual); con movimiento reducido la cifra aparece ya con su valor.
 */
export function CifraHeroe({ valor, formato = numeroCorto, unidad, rotulo, contexto, tamano = "heroe", tono = "texto", animar = true, className }: CifraHeroeProps) {
  const fmt = useFormatoEstable(formato);
  const cifra = useCifraAnimada<HTMLSpanElement>(valor, fmt, animar, LUJO.CONTEO_MS);
  return (
    <div className={unir("min-w-0", className)}>
      {rotulo && <p className="rotulo mb-2">{rotulo}</p>}
      <p className={unir("font-mono font-medium whitespace-nowrap", TAMANO[tamano], TONO[tono])} data-dato>
        <span className="sr-only">{fmt(valor)}{unidad ? ` ${unidad}` : ""}</span>
        <span aria-hidden="true">
          <span ref={cifra}>{fmt(animar ? 0 : valor)}</span>
          {unidad && <span className={unir("text-texto-2 ml-[0.18em] font-light tracking-normal", UNIDAD[tamano])}>{unidad}</span>}
        </span>
      </p>
      {contexto && <p className="text-apoyo text-texto-2 mt-2">{contexto}</p>}
    </div>
  );
}
