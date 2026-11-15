import { CalendarClock } from "lucide-react";
import { RANKING, RUTAS } from "../../lib/constants";
import { T } from "../../lib/textos";
import { EnlaceBoton } from "../ui/Boton";

/**
 * «Planear alunizaje» → `/sitios/:id/ventana`. Esa pantalla llega en otra rama: mientras `RANKING.VENTANA_ALUNIZAJE`
 * sea falso (la misma constante que usa Comparar) el enlace no se dibuja (ni desactivado ni roto). `activo` existe para probar los dos estados.
 */
export function EnlacePlanear({ siteId, activo = RANKING.VENTANA_ALUNIZAJE, className }: { siteId: string; activo?: boolean; className?: string }) {
  if (!activo) return null;
  return (
    <EnlaceBoton to={RUTAS.VENTANA_ALUNIZAJE(siteId)} className={className}>
      <CalendarClock aria-hidden="true" className="size-4" />
      {T.sitios.planear}
    </EnlaceBoton>
  );
}
