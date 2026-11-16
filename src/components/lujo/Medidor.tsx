import { useId, type CSSProperties, type ReactNode } from "react";
import { useCifraAnimada } from "../../hooks/useCifraAnimada";
import { LUJO } from "../../lib/constants";
import { numeroCorto, separadorUnidad } from "../../lib/formato";
import { fraccion, masEsMejor, nivelPorUmbrales, puntoArco, type UmbralesMedidor } from "../../lib/lujo";
import { NOMBRE_NIVEL, T } from "../../lib/textos";
import type { NivelSemaforo } from "../../lib/tipos";
import { GlifoSemaforo } from "../glifos/GlifoSemaforo";
import { unir } from "../ui/clases";
import { useFormatoEstable } from "./useFormatoEstable";

const { LADO, RADIO, GROSOR, ARCO_DEG, INICIO_DEG, MARCA } = LUJO.MEDIDOR;
const C = LADO / 2;
const [X0, Y0] = puntoArco(C, C, RADIO, INICIO_DEG);
const [X1, Y1] = puntoArco(C, C, RADIO, INICIO_DEG + ARCO_DEG);
const ARCO = `M${X0.toFixed(3)} ${Y0.toFixed(3)}A${RADIO} ${RADIO} 0 1 1 ${X1.toFixed(3)} ${Y1.toFixed(3)}`;

const TRAZO: Record<NivelSemaforo, string> = { verde: "stroke-viable", amarillo: "stroke-reservas", rojo: "stroke-critico" };
const TAMANO = {
  sm: { caja: "w-24", cifra: "text-dato", unidad: "text-[0.75rem]" },
  md: { caja: "w-36", cifra: "text-dato-lg", unidad: "text-dato-sm" },
  lg: { caja: "w-48", cifra: "text-[2.25rem]", unidad: "text-dato" },
} as const;

export interface MedidorProps {
  /** El dato; `null` si la API no lo trae: se dibuja la pista vacía y «Sin dato» (nunca un valor inventado). */
  valor: number | null;
  /** Dónde empiezan «con reservas» y «viable». Si `viable` < `reservas`, menos es mejor (errores). */
  umbrales: UmbralesMedidor;
  /** Nivel ya decidido por la fuente del dato (p. ej. el semáforo de la API): manda sobre el cálculo con `umbrales`. */
  nivel?: NivelSemaforo;
  /** Qué mide: nombre accesible del medidor y rótulo visible. */
  rotulo: string;
  unidad?: string;
  /** Extremos de la escala del arco (por defecto 0–100). */
  min?: number;
  max?: number;
  /** Cómo se escribe el número (sin la unidad). Por defecto, `numeroCorto`. */
  formato?: (valor: number) => string;
  tamano?: keyof typeof TAMANO;
  /** Muestra bajo el medidor la frase de los umbrales (siempre llega al lector de pantalla). */
  leyenda?: boolean;
  /** Traza el arco y cuenta la cifra UNA vez al aparecer (600 ms). */
  animar?: boolean;
  /** Palabra de cada nivel cuando «Viable / Con reservas / Crítico» no describe la medida (p. ej. un R²: «Ajuste alto»). */
  nombresNivel?: Record<NivelSemaforo, string>;
  /** Línea extra bajo el nivel («qué significa para tu misión»). */
  children?: ReactNode;
  className?: string;
}

/** Marca radial de un umbral sobre la pista (raya clara con filete oscuro para que se lea sobre cualquier tramo). */
function Marca({ en }: { en: number }) {
  const grados = INICIO_DEG + ARCO_DEG * en;
  const [x1, y1] = puntoArco(C, C, RADIO - MARCA, grados);
  const [x2, y2] = puntoArco(C, C, RADIO + MARCA, grados);
  const linea = { x1, y1, x2, y2, strokeLinecap: "round" as const };
  return (
    <g data-marca-umbral="">
      <line {...linea} className="stroke-vacio" strokeWidth={4} />
      <line {...linea} className="stroke-texto" strokeWidth={1.5} />
    </g>
  );
}

/**
 * Arco radial de 270° con los dos umbrales marcados y la cifra en el centro. El nivel se dice con glifo + palabra
 * (no solo con el color del arco). `role="meter"`: el lector de pantalla oye rótulo, valor con unidad y nivel.
 */
export function Medidor({ valor, umbrales, nivel: nivelDado, rotulo, unidad, min = 0, max = 100, formato = numeroCorto, tamano = "md", leyenda = false, animar = true, nombresNivel = NOMBRE_NIVEL, children, className }: MedidorProps) {
  const fmt = useFormatoEstable(formato);
  const idLeyenda = useId();
  const hayDato = valor !== null && Number.isFinite(valor);
  const cifra = useCifraAnimada<HTMLSpanElement>(hayDato ? valor : 0, fmt, animar && hayDato, LUJO.CONTEO_MS);
  const nivel = hayDato ? (nivelDado ?? nivelPorUmbrales(valor, umbrales)) : null;
  const f = hayDato ? fraccion(valor, min, max) : 0;
  const conUnidad = (v: number) => `${fmt(v)}${unidad ? `${separadorUnidad(unidad)}${unidad}` : ""}`;
  const textoUmbrales = masEsMejor(umbrales)
    ? T.lujo.medidor.umbralesMayor(conUnidad(umbrales.reservas), conUnidad(umbrales.viable))
    : T.lujo.medidor.umbralesMenor(conUnidad(umbrales.viable), conUnidad(umbrales.reservas));
  const t = TAMANO[tamano];
  return (
    <div className={unir("flex min-w-0 flex-col items-center text-center", className)} data-nivel={nivel ?? "sin-dato"}>
      <div role="meter" aria-label={rotulo} aria-valuemin={min} aria-valuemax={max} aria-valuenow={hayDato ? valor : undefined}
        aria-valuetext={hayDato && nivel ? T.lujo.medidor.lectura(conUnidad(valor), nombresNivel[nivel]) : T.lujo.sinDato}
        aria-describedby={idLeyenda} className={unir("relative aspect-square max-w-full", t.caja)}>
        <svg viewBox={`0 0 ${LADO} ${LADO}`} aria-hidden="true" className="block size-full" fill="none">
          <path d={ARCO} className="stroke-texto/10" strokeWidth={GROSOR} strokeLinecap="round" />
          {nivel && f > 0 && (
            <path d={ARCO} pathLength={1} strokeWidth={GROSOR} strokeLinecap="round"
              className={unir(TRAZO[nivel], animar && "medidor-arco")}
              style={{ strokeDasharray: `${f} 1`, "--medidor-desde": f } as CSSProperties} />
          )}
          <Marca en={fraccion(umbrales.reservas, min, max)} />
          <Marca en={fraccion(umbrales.viable, min, max)} />
        </svg>
        <p aria-hidden="true" data-dato className={unir("text-texto absolute inset-0 grid place-content-center font-mono leading-none font-medium whitespace-nowrap", t.cifra)}>
          {hayDato ? (
            <span>
              <span ref={cifra}>{fmt(animar ? 0 : valor)}</span>
              {unidad && <span className={unir("text-texto-2 ml-0.5 font-light", t.unidad)}>{unidad}</span>}
            </span>
          ) : <span className="text-texto-3">—</span>}
        </p>
      </div>
      <p className="rotulo mt-2 text-balance">{rotulo}</p>
      {nivel ? <GlifoSemaforo nivel={nivel} etiqueta={nombresNivel[nivel]} className="mt-1.5" /> : <p className="text-apoyo text-texto-2 mt-1.5">{T.lujo.sinDato}</p>}
      <p id={idLeyenda} className={leyenda ? "text-texto-2 mt-1.5 max-w-medida-corta text-[0.75rem]" : "sr-only"}>{textoUmbrales}</p>
      {children && <div className="text-apoyo text-texto-2 mt-2 max-w-medida-corta">{children}</div>}
    </div>
  );
}
