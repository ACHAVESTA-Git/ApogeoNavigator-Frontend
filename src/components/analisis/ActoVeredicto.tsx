import type { CSSProperties } from "react";
import type { Analisis } from "../../lib/analisis";
import { CONFIANZA } from "../../lib/constants";
import { grados, numero } from "../../lib/formato";
import { umbralesAciertos, veredictoConfianza } from "../../lib/informe";
import { T } from "../../lib/textos";
import { CifraHeroe, Medidor, PanelVidrio, Veredicto } from "../lujo";
import { NotaAyuda } from "./NotaAyuda";

const r2 = (v: number) => numero(v, CONFIANZA.DECIMALES_R2);
const entero = (v: number) => String(Math.round(v));
const entrada = (retraso: number, desde: number) => ({ "--retraso": `${retraso}ms`, "--desde": `${desde}px` }) as CSSProperties;

/**
 * Acto 1 · Veredicto: «¿Puedo fiarme de la proyección?». Una frase con cifras de la validación, el error típico como
 * cifra héroe y tres medidores con sus umbrales explicados. Una validación hecha con otros datos se rotula «de
 * referencia» y nunca da verde; sin validación no se afirma nada.
 */
export function ActoVeredicto({ a }: { a: Analisis }) {
  const t = T.analisis.informe;
  const v = veredictoConfianza(a);
  const referencia = v.estado === "referencia";
  const conAciertos = v.aciertos !== null && v.meses !== null;
  const base = conAciertos ? (referencia ? t.veredicto.referencia : t.veredicto.propia)(v.aciertos as number, v.meses as number) : null;
  const frase = v.estado === "ausente" ? t.veredicto.ausente
    : base === null ? t.veredicto.sinSemaforo
    : v.rmseSol !== null ? t.veredicto.conError(base, grados(v.rmseSol, 2)) : t.veredicto.sinError(base);
  const etiqueta = v.estado === "ausente" ? t.veredicto.etiquetas.ausente : referencia ? t.veredicto.etiquetas.referencia : t.veredicto.etiquetas[v.nivel];
  const nota = v.estado === "ausente" ? a.validacion.motivo : referencia ? t.veredicto.referenciaNota : t.veredicto.propiaNota;
  const uAciertos = v.meses ? umbralesAciertos(v.meses) : null;
  const medidores = [
    { clave: "r2Sol", rotulo: t.medidores.r2Sol, valor: a.modelo.r2.sol_el_deg ?? null, umbrales: CONFIANZA.R2, max: 1, formato: r2, unidad: undefined,
      ayuda: t.medidores.umbralesR2(r2(CONFIANZA.R2.reservas), r2(CONFIANZA.R2.viable)), mision: t.medidores.r2Mision },
    { clave: "r2Tierra", rotulo: t.medidores.r2Tierra, valor: a.modelo.r2.tierra_el_deg ?? null, umbrales: CONFIANZA.R2, max: 1, formato: r2, unidad: undefined,
      ayuda: t.medidores.umbralesR2(r2(CONFIANZA.R2.reservas), r2(CONFIANZA.R2.viable)), mision: t.medidores.r2Mision },
    { clave: "aciertos", rotulo: t.medidores.aciertos, valor: uAciertos ? v.aciertos : null, umbrales: uAciertos ?? CONFIANZA.ACIERTOS_FRACCION, max: v.meses ?? 1, formato: entero,
      unidad: v.meses ? t.medidores.deMeses(v.meses) : undefined,
      ayuda: uAciertos && v.meses ? t.medidores.umbralesAciertos(uAciertos.reservas, uAciertos.viable, v.meses) : null,
      mision: referencia ? t.medidores.aciertosReferencia : t.medidores.aciertosMision },
  ];
  return (
    <PanelVidrio como="section" aria-labelledby="acto-veredicto" relleno="ninguno" className="relative mt-6 overflow-hidden p-5 md:p-8">
      {/* La única luz de acento de la pantalla: el Sol, ámbar, rasante desde la esquina. Decorativa y quieta. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_90%_at_0%_0%,var(--color-sol-tenue),transparent_70%)]" />
      <div className="relative grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center">
        <div className="min-w-0">
          <p id="acto-veredicto" className="rotulo">{t.actos.veredicto}</p>
          <div className="lujo-entrada mt-4" style={entrada(0, 12)}>
            <Veredicto nivel={v.nivel} etiqueta={etiqueta} como="h2" tamano="titulo" className="*:last:basis-full">{frase}</Veredicto>
            {nota && <p className="text-apoyo text-texto-2 mt-3 max-w-medida">{nota}</p>}
          </div>
          {v.rmseSol !== null && (
            <div className="lujo-entrada mt-8" style={entrada(60, 8)}>
              <CifraHeroe valor={v.rmseSol} formato={(n) => numero(n, 2)} unidad="°" rotulo={t.heroe.rotulo} tono={referencia ? "texto" : "sol"} contexto={t.heroe.contexto} />
              <p className="text-apoyo text-texto mt-2 max-w-medida">{t.heroe.mision}</p>
            </div>
          )}
        </div>
        <ul className="lujo-entrada grid gap-x-4 gap-y-8 sm:grid-cols-3" style={entrada(110, 6)}>
          {medidores.map((m) => (
            <li key={m.clave} className="relative min-w-0 px-1 pt-2">
              {m.ayuda && <NotaAyuda etiqueta={t.medidores.ayuda(m.rotulo)}>{m.ayuda}</NotaAyuda>}
              <Medidor valor={m.valor} umbrales={m.umbrales} rotulo={m.rotulo} min={0} max={m.max} formato={m.formato} unidad={m.unidad}>{m.mision}</Medidor>
            </li>
          ))}
        </ul>
      </div>
    </PanelVidrio>
  );
}
