import { ArrowRight } from "lucide-react";
import { useEfemerides } from "../../hooks/useEfemerides";
import { enlaceCielo } from "../../lib/alunizaje";
import { BANDA } from "../../lib/constants";
import { diaCorto, fechaHora, soloHora, sumarHoras } from "../../lib/fechas";
import { horas, pct } from "../../lib/formato";
import { T } from "../../lib/textos";
import type { DiaVentana, EstanciaH } from "../../lib/tipos";
import { EnlaceBoton } from "../ui/Boton";
import { EstadoCarga, EstadoError } from "../ui/Estados";
import { BandaLuz } from "../ventanas/BandaLuz";

// Banda + ejes: el alto se reserva mientras llegan las efemérides de la estancia.
const ALTO_BANDA_PX = BANDA.ALTO_PX.media + 56;

/** Acto 2b: la estancia del día elegido sobre la línea de tiempo (bandas de Sol y Tierra) y el salto al Cielo. */
export function DetalleEstancia({ siteId, dato, estanciaH, rayado = false }: { siteId: string; dato: DiaVentana; estanciaH: EstanciaH; rayado?: boolean }) {
  const t = T.alunizaje;
  const llegada = dato.llegada_utc;
  const salida = sumarHoras(llegada, estanciaH);
  const efemerides = useEfemerides(siteId, { desde: llegada, hasta: salida });
  const deEstaEstancia = efemerides.data?.site_id === siteId && !efemerides.isPlaceholderData;
  return (
    <section aria-live="polite">
      <h2 className="text-seccion text-texto font-medium text-balance">{t.detalle.titulo(diaCorto(llegada), soloHora(llegada))}</h2>
      <p className="text-apoyo text-texto-2 mt-1">
        {t.detalle.resumen(horas(dato.horas_sol_y_tierra), pct(dato.pct_sol_y_tierra))} · {t.mejor.sale(diaCorto(salida), soloHora(salida))}
      </p>
      <div className="mt-4" style={{ minHeight: ALTO_BANDA_PX }}>
        {efemerides.error
          ? <EstadoError error={efemerides.error} compacto alReintentar={() => void efemerides.refetch()} />
          : deEstaEstancia && efemerides.data
            ? (
              <figure className="m-0" role="img" aria-label={t.detalle.banda(fechaHora(llegada), fechaHora(salida))}>
                <BandaLuz key={llegada + salida} filas={efemerides.data.filas} desde={llegada} hasta={salida} tamano="media" rayado={rayado} />
              </figure>
            )
            : <EstadoCarga texto={t.detalle.cargando} />}
      </div>
      <EnlaceBoton to={enlaceCielo(siteId, llegada)} variante="secundario" className="mt-4 min-h-12 max-sm:w-full">
        {t.detalle.verCielo}
        <ArrowRight aria-hidden="true" className="size-4" />
      </EnlaceBoton>
    </section>
  );
}
