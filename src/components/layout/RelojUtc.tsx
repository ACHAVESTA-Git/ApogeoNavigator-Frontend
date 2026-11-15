import { fechaHora, horaLima } from "../../lib/fechas";
import { useInstanteGlobal } from "../../lib/relojGlobal";
import { T, horaLocal } from "../../lib/textos";
import { unir } from "../ui/clases";

/** Reloj de la simulación: el instante que se está mirando, en UTC y con la hora de Lima. */
export function RelojUtc({ className }: { className?: string }) {
  const utc = useInstanteGlobal();
  return (
    <p className={unir("flex flex-col items-end leading-tight", className)} title={T.reloj.titulo}>
      <span className="text-dato-sm text-texto font-mono" data-dato>
        <time dateTime={utc}>{fechaHora(utc)}</time> <abbr title={T.reloj.utcLargo} className="text-texto-2 no-underline">{T.utc}</abbr>
      </span>
      <span className="text-texto-3 font-mono text-[0.75rem]" data-dato>{horaLocal(horaLima(utc))}</span>
    </p>
  );
}
