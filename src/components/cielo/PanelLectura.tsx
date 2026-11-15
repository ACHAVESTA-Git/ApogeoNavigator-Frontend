import { CLAVE_AZIMUT, CLAVE_ELEVACION, sobreHorizonte } from "../../lib/astro";
import { ZONA_HORARIA_LOCAL } from "../../lib/constants";
import { diaLima, fechaHora, horaLima } from "../../lib/fechas";
import { grados } from "../../lib/formato";
import type { PosicionCielo } from "../../lib/interpolar";
import { NOMBRE_ASTRO, T, proximoCambio } from "../../lib/textos";
import type { Astro, EventosAstro, Utc } from "../../lib/tipos";
import { GlifoAstro } from "../glifos/Astros";
import { unir } from "../ui/clases";

const ASTROS: readonly Astro[] = ["sol", "tierra"];
const COLOR: Record<Astro, string> = { sol: "text-sol", tierra: "text-tierra" };

/** Lectura del instante en «tabla de instrumento»: UTC, Lima y, por astro, azimut, elevación, estado y próximo cambio. */
export function PanelLectura({ utc, posicion, eventos, periodo, azimutFiable, className }: {
  /** en una proyección, false donde el azimut no tiene una banda acotable (cénit o nadir) */
  azimutFiable?: Record<Astro, boolean>;
  utc: Utc; posicion: PosicionCielo; eventos?: Record<Astro, EventosAstro> | null; periodo?: { desde: Utc; hasta: Utc }; className?: string;
}) {
  const t = T.cielo;
  return (
    <section aria-label={t.panel} className={unir("grid gap-x-10 gap-y-4 font-mono md:grid-cols-3", className)} data-dato>
      <dl className="grid grid-cols-[4.5rem_1fr] content-start gap-x-3 gap-y-1">
        <dt className="rotulo self-center">{T.utc}</dt>
        <dd className="text-dato text-texto"><time dateTime={utc}>{fechaHora(utc)}</time></dd>
        <dt className="rotulo self-center">{t.lima}</dt>
        <dd className="text-dato-sm text-texto-2">{diaLima(utc)}, {horaLima(utc)} ({ZONA_HORARIA_LOCAL.DESFASE})</dd>
      </dl>
      {ASTROS.map((astro) => {
        const el = posicion[CLAVE_ELEVACION[astro]];
        const visible = sobreHorizonte(el);
        const e = eventos?.[astro];
        const azDudoso = azimutFiable?.[astro] === false;
        return (
          <dl key={astro} className="grid grid-cols-[4.5rem_1fr] content-start gap-x-3 gap-y-1 max-md:capilar-t max-md:pt-4">
            <dt className="rotulo flex items-center gap-2 self-center">
              <GlifoAstro astro={astro} px={14} fantasma={!visible} />
              {NOMBRE_ASTRO[astro]}
            </dt>
            <dd className="text-dato text-texto flex flex-wrap gap-x-4">
              <span className={azDudoso ? "text-texto-2" : undefined} title={azDudoso ? t.azimutPocoFiable(astro) : undefined}>
                <abbr title={t.abbrAzimut} className="text-texto-3 no-underline">{t.az}</abbr>{" "}
                {azDudoso && <span aria-hidden="true">≈ </span>}{grados(posicion[CLAVE_AZIMUT[astro]], azDudoso ? 0 : 2)}
                {azDudoso && <span className="border-reservas text-reservas ml-2 rounded-full border border-dashed px-1.5 py-px align-middle font-sans text-[0.75rem] font-semibold whitespace-nowrap">{t.pocoFiable}</span>}
              </span>
              <span><abbr title={t.abbrElevacion} className="text-texto-3 no-underline">{t.el}</abbr> {grados(el, 2, true)}</span>
            </dd>
            <dt className="sr-only">{t.estado}</dt>
            <dd className={unir("col-start-2 text-[0.75rem] font-semibold tracking-[0.08em] uppercase", visible ? COLOR[astro] : "text-texto-2")}>
              {visible ? T.sobreHorizonte : T.bajoHorizonte}
            </dd>
            <dt className="sr-only">{t.proximoCambio}</dt>
            <dd className="text-dato-sm text-texto-2 col-start-2 min-h-[1.3em]">{e ? proximoCambio(e, periodo) : "…"}</dd>
          </dl>
        );
      })}
    </section>
  );
}
