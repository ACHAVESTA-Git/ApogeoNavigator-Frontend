import { ArrowRight } from "lucide-react";
import { GraficoDiaLunar } from "../components/dia-lunar/GraficoDiaLunar";
import { GlifoAstro } from "../components/glifos/Astros";
import { AvisoHorizonteIdeal } from "../components/layout/AvisoHorizonteIdeal";
import { TituloPagina } from "../components/layout/TituloPagina";
import { Transporte, controlDeReloj } from "../components/tiempo/Transporte";
import { EnlaceBoton } from "../components/ui/Boton";
import { Desplegable } from "../components/ui/Desplegable";
import { CargaHorizons, EstadoCarga, EstadoError } from "../components/ui/Estados";
import { esPuntoPropio } from "../lib/puntoPropio";
import { useEfemerides } from "../hooks/useEfemerides";
import { useDesde } from "../hooks/useMedia";
import { useRelojSimulacion } from "../hooks/useRelojSimulacion";
import { useTeclasTiempo } from "../hooks/useTeclasTiempo";
import { eventosCruce, resumenDiario, sobreHorizonte } from "../lib/astro";
import { DATOS, PARAM_URL, RUTAS } from "../lib/constants";
import { fechaHora, horaLima } from "../lib/fechas";
import { grados, horas, numero } from "../lib/formato";
import { NOMBRE_ASTRO, T, faltanPara, horaLocal, periodoLegible } from "../lib/textos";
import { proximosEventos } from "../lib/astro";
import type { Astro, FilaEfemeride, Site, Utc } from "../lib/tipos";
import { useContextoSitio } from "./SitioLayout";

const ASTROS: readonly Astro[] = ["sol", "tierra"];

function Linea({ sitio, filas, desde, hasta }: { sitio: Site; filas: FilaEfemeride[]; desde: Utc; hasta: Utc }) {
  const t = T.diaLunar;
  const reloj = useRelojSimulacion(filas, sitio.site_id);
  const teclas = useTeclasTiempo(reloj);
  const esEscritorio = useDesde("lg");
  const periodo = periodoLegible(desde, hasta);
  const fila = filas[reloj.indice];
  const eventos = proximosEventos(filas, reloj.tUtc);
  const cielo = `${RUTAS.CIELO(sitio.site_id)}?${new URLSearchParams({ [PARAM_URL.DESDE]: desde, [PARAM_URL.HASTA]: hasta, [PARAM_URL.T]: reloj.tUtc })}`;
  return (
    <div className="contenedor pt-4 pb-12">
      <TituloPagina documento={t.documento(sitio.nombre)} className="rotulo max-md:sr-only">{t.titulo(sitio.nombre, periodo)}</TituloPagina>
      {/* Resumen textual: qué pasa en el periodo, con las fechas de cada cruce */}
      <ul className="text-texto mt-3 grid gap-x-10 gap-y-1 md:grid-cols-2">
        {ASTROS.map((astro) => {
          const cruces = eventosCruce(filas, astro);
          const arriba = sobreHorizonte(filas[0][`${astro}_el_deg`]);
          return (
            <li key={astro} className="flex items-start gap-2">
              <GlifoAstro astro={astro} px={14} className="mt-1" />
              <span className="first-letter:uppercase">
                {cruces.length
                  ? t.resumen(NOMBRE_ASTRO[astro], cruces.map((c) => ({ tipo: c.tipo, cuando: fechaHora(c.utc) })))
                  : t.sinEventos(NOMBRE_ASTRO[astro], arriba, periodo)}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-4">
        <GraficoDiaLunar filas={filas} reloj={reloj} alPulsarTecla={teclas} etiqueta={t.grafico(periodo)} />
        <Transporte filas={filas} control={controlDeReloj(reloj, filas)} conHoras={esEscritorio} className="mt-3" />
      </div>

      <div className="panel mt-4 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 p-4">
        <dl className="text-dato-sm grid gap-x-8 gap-y-1 font-mono sm:grid-cols-3" data-dato aria-live="polite">
          <div>
            <dt className="rotulo">{T.utc}</dt>
            <dd className="text-dato text-texto">{fechaHora(reloj.tUtc)}</dd>
            <dd className="text-texto-3">{horaLocal(horaLima(reloj.tUtc))}</dd>
          </div>
          {ASTROS.map((astro) => (
            <div key={astro}>
              <dt className="rotulo flex items-center gap-2"><GlifoAstro astro={astro} px={12} />{NOMBRE_ASTRO[astro]}</dt>
              <dd className="text-dato text-texto">{grados(fila[`${astro}_el_deg`], 2, true)}</dd>
              <dd className="text-texto-2 font-sans">{eventos && faltanPara(astro, eventos[astro])}</dd>
            </div>
          ))}
        </dl>
        <EnlaceBoton to={cielo}>{t.irAlCielo}<ArrowRight aria-hidden="true" className="size-4" /></EnlaceBoton>
      </div>
      <p className="text-texto-3 mt-3 text-[0.75rem]">{t.duracion(numero(DATOS.DIA_LUNAR_DIAS, 1))}. {T.cielo.escalaLupa}.</p>
      <AvisoHorizonteIdeal className="mt-2" />

      <Desplegable titulo={t.tabla} className="mt-8 border-b">
        <div className="overflow-x-auto">
          <table className="text-dato-sm w-full min-w-[28rem] border-collapse font-mono" data-dato>
            <caption className="text-apoyo text-texto-2 pb-3 text-left font-sans">{t.tablaTitulo}</caption>
            <thead>
              <tr>{t.columnas.map((c, i) => <th key={c} scope="col" className={`rotulo py-2 font-sans ${i ? "text-right" : "text-left"}`}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {resumenDiario(filas, desde, hasta).map((d) => (
                <tr key={d.fecha} className="capilar-t text-texto-2">
                  <th scope="row" className="py-1.5 text-left font-normal">{d.fecha}</th>
                  <td className="py-1.5 text-right">{horas(d.horasSol)}</td>
                  <td className="py-1.5 text-right">{horas(d.horasTierra)}</td>
                  <td className="py-1.5 text-right">{numero(d.solMax)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Desplegable>
    </div>
  );
}

export default function DiaLunar() {
  const { sitio, desde, hasta } = useContextoSitio();
  const { data, isPending, error, refetch } = useEfemerides(sitio.site_id, { desde, hasta });
  if (isPending) return <div className="contenedor min-h-[60svh]">{esPuntoPropio(sitio.site_id) ? <CargaHorizons /> : <EstadoCarga texto={T.diaLunar.cargando} />}</div>;
  if (error || !data?.filas.length) return <div className="contenedor py-10"><EstadoError error={error ?? undefined} alReintentar={() => void refetch()} /></div>;
  return <Linea key={`${sitio.site_id}-${desde}`} sitio={sitio} filas={data.filas} desde={desde} hasta={hasta} />;
}
