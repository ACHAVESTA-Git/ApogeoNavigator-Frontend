import { UMBRALES_MISION } from "../../lib/constants";
import { numero } from "../../lib/formato";
import { T } from "../../lib/textos";
import type { Metrica } from "../../lib/tipos";
import { Medidor, type MedidorProps } from "../lujo";
import { unir } from "../ui/clases";

// Trunca (no redondea): con umbrales enteros, la cifra escrita nunca contradice el nivel (44,6 % se lee «44», con reservas).
const entero = (valor: number) => numero(Math.floor(valor), 0);

/**
 * Medidor doble de un sitio: energía (% de horas de sol) y comunicación (% de horas con la Tierra visible), con las
 * cifras de `/api/metricas`. Sin métrica (cargando o sin dato) dibuja las dos pistas vacías con el mismo tamaño:
 * nada se mueve cuando llega el dato.
 */
export function MedidoresMision({ metrica, tamano = "sm", animar = false, etiqueta, className }: {
  metrica: Pick<Metrica, "pct_sol" | "pct_tierra"> | undefined; tamano?: MedidorProps["tamano"]; animar?: boolean; etiqueta?: string; className?: string;
}) {
  return (
    <div role="group" aria-label={etiqueta ?? T.mision.medidores} className={unir("flex items-start justify-center gap-4", className)}>
      <Medidor valor={metrica?.pct_sol ?? null} umbrales={UMBRALES_MISION.ENERGIA} rotulo={T.mision.energia} unidad="%" formato={entero} tamano={tamano} animar={animar} />
      <Medidor valor={metrica?.pct_tierra ?? null} umbrales={UMBRALES_MISION.COMUNICACION} rotulo={T.mision.comunicacion} unidad="%" formato={entero} tamano={tamano} animar={animar} />
    </div>
  );
}
