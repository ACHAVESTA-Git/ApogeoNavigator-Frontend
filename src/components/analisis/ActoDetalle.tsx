import { Check, Minus, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import {
  VARIABLES_ANALISIS, estadoValidacion, limitacionesQueAplican, nombreMedida, textoPaso, unidadMedida, valorTextoMedida,
  type Analisis, type EstadoPaso, type MedidaPaso,
} from "../../lib/analisis";
import { soloFecha } from "../../lib/fechas";
import { grados, numero, numeroCorto, tamanoArchivo } from "../../lib/formato";
import { T } from "../../lib/textos";
import { Sello } from "../lujo";
import { Desplegable } from "../ui/Desplegable";
import { unir } from "../ui/clases";

const ICONO_ESTADO: Record<EstadoPaso, { Icono: typeof Check; clase: string }> = {
  ok: { Icono: Check, clase: "text-viable" },
  advertencia: { Icono: TriangleAlert, clase: "text-reservas" },
  no_disponible: { Icono: Minus, clase: "text-texto-2" },
};

function valorMedida(m: MedidaPaso): string {
  if (m.valor === null) return "—";
  if (typeof m.valor === "boolean") return m.valor ? T.analisis.si : T.analisis.no;
  if (typeof m.valor === "string") return valorTextoMedida(m.valor);
  if (m.unidad === "bytes") return tamanoArchivo(m.valor);
  return `${numeroCorto(m.valor)}${m.unidad === "°" ? "°" : m.unidad ? ` ${unidadMedida(m.unidad)}` : ""}`;
}

/** Una cifra con su contexto: qué es, cuánto vale y con qué se compara. */
function Cifra({ rotulo, valor, contexto, tono }: { rotulo: string; valor: string; contexto?: ReactNode; tono?: string }) {
  return (
    <div className="min-w-0">
      <dt className="rotulo">{rotulo}</dt>
      <dd className={unir("text-dato-lg mt-1.5 font-mono font-medium", tono ?? "text-texto")} data-dato>{valor}</dd>
      {contexto && <dd className="text-apoyo text-texto-2 mt-1">{contexto}</dd>}
    </div>
  );
}

/** Ajuste dentro de los datos (R², interno) y validación fuera de ellos (RMSE optimista; «de referencia» si no es propia). */
function Cifras({ a }: { a: Analisis }) {
  const tm = T.analisis.modelo;
  const tv = T.analisis.validacion;
  const v = a.validacion;
  const estado = estadoValidacion(v);
  const referencia = estado === "referencia";
  const tono = referencia ? "text-texto-2" : undefined;
  return (
    <>
      <p className="rotulo">{tm.r2}</p>
      <p className="text-apoyo text-texto-2 mt-2 max-w-medida">{a.modelo.nota_ajuste || tm.r2Nota}</p>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4">
        {VARIABLES_ANALISIS.filter((k) => a.modelo.r2[k] !== undefined).map((k) => (
          <Cifra key={k} rotulo={T.analisis.serie.variables[k]} valor={numero(a.modelo.r2[k] as number, 4)}
            contexto={a.modelo.residuos[k] && tm.residuo(grados(a.modelo.residuos[k]!.rmse_deg, 3))} />
        ))}
      </dl>
      <p className="rotulo mt-8">{tv.rmse}</p>
      {estado === "ausente" ? <p className="text-texto-2 mt-2">{tv.ausente} {v.motivo}</p> : (
        <>
          <p className="text-apoyo text-texto-2 mt-2 max-w-medida">
            {referencia && (
              <strong className="bg-reservas/12 text-reservas mr-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-semibold tracking-wide uppercase">
                <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0" />{tv.referencia}
              </strong>
            )}
            {referencia ? tv.referenciaNota : tv.propia}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4">
            {VARIABLES_ANALISIS.filter((k) => typeof v.rmse_deg?.[k] === "number").map((k) => (
              <Cifra key={k} rotulo={T.analisis.serie.variables[k]} valor={grados(v.rmse_deg![k] as number, 2)} tono={tono}
                contexto={typeof v.mejora_frente_a_ingenua?.[k] === "number" ? tv.frenteIngenua(numero(v.mejora_frente_a_ingenua[k] as number, 1)) : undefined} />
            ))}
            {v.semaforo_aciertos && <Cifra rotulo={tv.semaforo} valor={tv.deMeses(v.semaforo_aciertos.aciertos_global, v.semaforo_aciertos.meses)} tono={tono} />}
          </dl>
        </>
      )}
    </>
  );
}

/**
 * Acto 3 · Detalle y trazabilidad: lo que el análisis no puede decir, los pasos del cálculo con sus medidas, las
 * cifras variable por variable y el origen del archivo como sello de procedencia (sin franja lateral).
 */
export function ActoDetalle({ a }: { a: Analisis }) {
  const t = T.analisis;
  const ti = t.informe.detalle;
  const { calidad } = a.entrada;
  // Los nombres y descripciones de los pasos llegan de la API en español: se muestran en el idioma de la interfaz.
  const pasos = a.pasos.map((p) => ({ ...p, ...textoPaso(p, a.validacion) }));
  const aplican = limitacionesQueAplican(a);
  const otras = a.limitaciones.filter((l) => !aplican.includes(l));
  const archivo: [string, ReactNode][] = [
    [t.origen.archivo, a.entrada.archivo],
    [t.origen.filas, `${numeroCorto(calidad.filas_validas)} / ${numeroCorto(a.entrada.filas)}`],
    [t.origen.rango, <span key="r"><span className="whitespace-nowrap">{soloFecha(a.entrada.inicio_utc)} →</span> <span className="whitespace-nowrap">{soloFecha(a.entrada.fin_utc)}</span></span>],
  ];
  return (
    <section aria-labelledby="acto-detalle" className="mt-16">
      <p className="rotulo">{t.informe.actos.detalle}</p>
      <h2 id="acto-detalle" className="titulo-instrumento text-seccion text-texto mt-2">{ti.titulo}</h2>
      <p className="text-texto-2 mt-2 max-w-medida">{ti.entrada}</p>
      <div className="mt-6 grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
        <div className="border-linea min-w-0 border-b">
          <Desplegable titulo={ti.limitaciones(aplican.length)} abierto>
            <ul className="space-y-3">
              {aplican.map((l) => (
                <li key={l.codigo} className="text-texto flex gap-3"><TriangleAlert aria-hidden="true" className="text-reservas mt-1 size-4 shrink-0" />{l.mensaje}</li>
              ))}
            </ul>
            {otras.length > 0 && (
              <>
                <p className="rotulo mt-6">{t.limitaciones.otras}</p>
                <ul className="text-apoyo text-texto-2 mt-2 space-y-2">{otras.map((l) => <li key={l.codigo}>{l.mensaje}</li>)}</ul>
              </>
            )}
          </Desplegable>
          <Desplegable titulo={ti.pasos(pasos.length)}>
            <ol className="space-y-7">
              {pasos.map((p, i) => {
                const { Icono, clase } = ICONO_ESTADO[p.estado] ?? ICONO_ESTADO.no_disponible;
                return (
                  <li key={p.id} id={`paso-${p.id}`}>
                    <p className="rotulo flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>{t.pasos.paso(i + 1, pasos.length)}</span>
                      <span className={unir("flex items-center gap-1.5", clase)}><Icono aria-hidden="true" className="size-3.5" />{t.pasos.estados[p.estado] ?? p.estado}</span>
                    </p>
                    <h3 className="text-subtitulo text-texto mt-1.5 font-semibold">{p.nombre}</h3>
                    <p className="text-apoyo text-texto-2 mt-1 max-w-medida">{p.descripcion}</p>
                    <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                      {p.resultado.map((m) => (
                        <div key={m.nombre} className="min-w-0">
                          <dt className="text-texto-2 text-[0.75rem]">{nombreMedida(m.nombre)}</dt>
                          <dd className="text-dato text-texto font-mono wrap-anywhere" data-dato>{valorMedida(m)}</dd>
                        </div>
                      ))}
                    </dl>
                  </li>
                );
              })}
            </ol>
          </Desplegable>
          <Desplegable titulo={ti.cifras}><Cifras a={a} /></Desplegable>
        </div>
        <div className="min-w-0">
          <Sello origen={a.entrada.origen} titulo="h3" />
          <dl aria-label={ti.archivo} className="text-apoyo mt-4 grid grid-cols-2 gap-x-6 gap-y-3 px-1">
            {archivo.map(([k, v]) => (
              <div key={k} className="min-w-0 first:col-span-2">
                <dt className="text-texto-2">{k}</dt>
                <dd className="text-texto font-mono wrap-anywhere" data-dato>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
