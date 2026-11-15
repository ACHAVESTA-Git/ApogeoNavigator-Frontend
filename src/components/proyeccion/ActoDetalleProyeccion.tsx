import { Hourglass, TriangleAlert } from "lucide-react";
import { VARIABLES_ANALISIS, type OrigenDatos } from "../../lib/analisis";
import { PROYECCION_MODELO } from "../../lib/constants";
import { fechaHora, soloFecha } from "../../lib/fechas";
import { grados } from "../../lib/formato";
import type { ProyeccionModelo, ResultadoProyeccion } from "../../lib/proyeccionModelo";
import { T } from "../../lib/textos";
import { Sello } from "../lujo";
import { Desplegable } from "../ui/Desplegable";

const finito = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const error = (v: number | null | undefined): string => (finito(v) ? grados(v, PROYECCION_MODELO.DECIMALES_ERROR) : "—");

/** Lo que la proyección no puede decir. Llega SIEMPRE de la API y se enseña siempre junto a las cifras (nunca plegado). */
export function LimitacionesProyeccion({ limitaciones, className }: { limitaciones: ProyeccionModelo["limitaciones"]; className?: string }) {
  if (!limitaciones?.length) return null;
  return (
    <section aria-label={T.proyeccion.detalle.limitaciones} className={className} data-limitaciones="">
      <p className="rotulo">{T.proyeccion.detalle.limitaciones}</p>
      <ul className="mt-3 grid gap-x-8 gap-y-2.5 md:grid-cols-2">
        {limitaciones.map((l) => (
          <li key={l.codigo} className="text-apoyo text-texto flex gap-2.5" data-limitacion={l.codigo}>
            <TriangleAlert aria-hidden="true" className="text-reservas mt-0.5 size-4 shrink-0" />{l.mensaje}
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Origen para el Sello. La huella es la que trae la proyección (`sha3_256` del sitio). Si coincide con el archivo que
 * certifica /api/analisis, el sello lleva su procedencia y su firma; si no (o si ese certificado no está), solo la
 * huella, «sin registro» y sin firma: nunca se presta la firma de otro archivo.
 */
export function origenDelSello(sha3: string | null | undefined, certificado: OrigenDatos | undefined): OrigenDatos | null {
  if (!sha3) return null;
  if (certificado && certificado.sha3_256 === sha3) return certificado;
  return { tipo: "sin_registro", descripcion: "", sha3_256: sha3, coincide_con_semilla: null, ultima_carga: null, manifiesto: null };
}

/**
 * Acto 3 · Detalle y trazabilidad: método, entrenamiento, error variable por variable y por horizonte (solo lo que la
 * API trae; lo pendiente se dice) y el Sello con la huella del archivo de efemérides del sitio.
 */
export function ActoDetalleProyeccion({ p, resultado, certificado }: { p: ProyeccionModelo; resultado: ResultadoProyeccion; certificado?: OrigenDatos }) {
  const t = T.proyeccion.detalle;
  const { modelo } = p;
  const e = modelo.error;
  const rmse = VARIABLES_ANALISIS.filter((k) => finito(e?.rmse_deg?.[k]));
  const horizontes = [...(e?.por_horizonte ?? [])].sort((a, b) => a.meses - b.meses);
  const control = (e?.control_horizons ?? []).filter((c) => finito(c.error_deg));
  const origen = origenDelSello(resultado.sha3_256, certificado);
  const ficha: [string, string][] = [
    [t.metodo, modelo.metodo],
    [t.version, modelo.version],
    [t.entrenado, `${soloFecha(modelo.entrenado_desde)} → ${soloFecha(modelo.entrenado_hasta)}`],
    [t.proyectado, soloFecha(modelo.proyectado_hasta)],
  ];
  const pendiente = (
    <p className="text-apoyo text-reservas flex items-center gap-2 font-semibold" data-error-pendiente=""><Hourglass aria-hidden="true" className="size-4 shrink-0" />{T.proyeccion.heroe.pendiente}</p>
  );
  return (
    <section aria-labelledby="acto-detalle-proyeccion" className="mt-16">
      <p className="rotulo">{T.proyeccion.actos.detalle}</p>
      <h2 id="acto-detalle-proyeccion" className="titulo-instrumento text-seccion text-texto mt-2">{t.titulo}</h2>
      <p className="text-texto-2 mt-2 max-w-medida">{t.entrada}</p>
      <div className="mt-6 grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
        <div className="min-w-0">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {ficha.filter(([, v]) => v && !v.startsWith("undefined")).map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="rotulo">{k}</dt>
                <dd className="text-texto mt-1 font-mono wrap-anywhere" data-dato>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="border-linea mt-6 border-b">
            <Desplegable titulo={t.errores} abierto>
              {rmse.length > 0 && (
                <>
                  <p className="rotulo">{t.rmse}</p>
                  <p className="text-apoyo text-texto-2 mt-1.5 max-w-medida">{t.rmseNota}</p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4">
                    {rmse.map((k) => (
                      <div key={k} className="min-w-0">
                        <dt className="text-texto-2 text-[0.75rem]">{T.analisis.serie.variables[k]}</dt>
                        <dd className="text-dato-lg text-texto font-mono font-medium" data-dato>{error(e?.rmse_deg?.[k])}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              )}
              <p className="rotulo mt-6 first:mt-0">{t.horizonte}</p>
              {horizontes.length > 0 ? (
                <table className="mt-2 w-full max-w-md border-collapse text-left text-[0.8125rem]">
                  <thead><tr className="text-texto-3">{t.columnasHorizonte.map((c) => <th key={c} scope="col" className="py-1.5 pr-3 font-normal">{c}</th>)}</tr></thead>
                  <tbody className="font-mono" data-dato>
                    {horizontes.map((h) => (
                      <tr key={h.meses} className="capilar-t">
                        <th scope="row" className="text-texto-2 py-1.5 pr-3 font-sans font-normal whitespace-nowrap">{t.aMeses(h.meses)}</th>
                        <td className="text-texto py-1.5 pr-3">{error(h.rmse_sol_el_deg)}</td>
                        <td className="text-texto py-1.5 pr-3">{error(h.rmse_tierra_el_deg)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <div className="mt-2">{pendiente}</div>}
            </Desplegable>
            <Desplegable titulo={t.control(control.length)}>
              {control.length > 0 ? (
                <div className="max-h-72 overflow-auto overscroll-contain">
                  <table className="w-full min-w-[24rem] border-collapse text-left text-[0.8125rem]">
                    <thead><tr className="text-texto-3">{t.columnasControl.map((c) => <th key={c} scope="col" className="bg-regolito sticky top-0 py-1.5 pr-3 font-normal">{c}</th>)}</tr></thead>
                    <tbody className="font-mono" data-dato>
                      {control.map((c, i) => (
                        <tr key={`${c.site_id}-${c.utc}-${c.variable}-${i}`} className="capilar-t">
                          <td className="text-texto-2 py-1 pr-3">{c.site_id}</td>
                          <td className="text-texto-2 py-1 pr-3 whitespace-nowrap">{fechaHora(c.utc)}</td>
                          <td className="text-texto-2 py-1 pr-3">{T.analisis.serie.variables[c.variable as keyof typeof T.analisis.serie.variables] ?? c.variable}</td>
                          <td className="text-texto py-1 pr-3">{error(c.error_deg)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : pendiente}
            </Desplegable>
          </div>
        </div>
        <div className="min-w-0">
          {origen ? (
            <>
              <Sello origen={origen} titulo="h3" />
              <p className="text-apoyo text-texto-2 mt-3 px-1">{origen === certificado ? t.sello : t.selloSinRegistro}</p>
            </>
          ) : <p className="text-texto-2" data-sin-huella="">{t.sinArchivo}</p>}
        </div>
      </div>
    </section>
  );
}
