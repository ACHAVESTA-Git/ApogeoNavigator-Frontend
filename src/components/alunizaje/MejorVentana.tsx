import { ArrowRight, CircleCheck, OctagonX, TriangleAlert, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { enlaceCielo, hayEmpate, sinVentanaUtil } from "../../lib/alunizaje";
import { diaCorto, diaLima, horaLima, soloFecha, soloHora } from "../../lib/fechas";
import { horas, numeroCorto, pct } from "../../lib/formato";
import { T, horaLocal } from "../../lib/textos";
import type { EstanciaH, NivelSemaforo, ResultadoVentanas, VentanaAlunizaje } from "../../lib/tipos";
import { AvisoHorizonteIdeal } from "../layout/AvisoHorizonteIdeal";
import { CifraHeroe } from "../lujo";
import { EnlaceBoton } from "../ui/Boton";
import { unir } from "../ui/clases";

// Estado = icono + texto + halo sutil (los mismos halos que `Veredicto`); nunca una línea lateral.
const ESTADO: Record<NivelSemaforo, { Icono: LucideIcon; chip: string }> = {
  verde: { Icono: CircleCheck, chip: "bg-viable/12 text-viable" },
  amarillo: { Icono: TriangleAlert, chip: "bg-reservas/12 text-reservas" },
  rojo: { Icono: OctagonX, chip: "bg-critico/12 text-critico" },
};
function Chip({ nivel, children }: { nivel: NivelSemaforo; children: ReactNode }) {
  const { Icono, chip } = ESTADO[nivel];
  return (
    <span className={unir("text-apoyo rounded-control inline-flex min-h-8 items-start gap-1.5 py-1.5 pr-3 pl-2 font-semibold", chip)}>
      <Icono aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {children}
    </span>
  );
}

/** Riesgo operativo de enlace: el tramo continuo más largo sin la Tierra dentro de la estancia. */
function Riesgo({ ventana, estanciaH }: { ventana: VentanaAlunizaje; estanciaH: EstanciaH }) {
  const t = T.alunizaje.riesgo;
  const racha = ventana.racha_sin_tierra_h;
  if (racha === undefined) return null;
  if (!(racha > 0)) return <Chip nivel="verde">{t.enlaceContinuo}</Chip>;
  // Si la racha ocupa la estancia entera puede seguir fuera de ella: es un mínimo.
  return racha >= estanciaH ? <Chip nivel="rojo">{t.todaLaEstancia(horas(racha))}</Chip> : <Chip nivel="amarillo">{t.sinEnlace(horas(racha))}</Chip>;
}

export interface MejorVentanaProps {
  siteId: string;
  resultado: ResultadoVentanas;
  estanciaH: EstanciaH;
  /** La API marca el Sol del sitio como sensible al relieve en el mes de la ventana. */
  sensible: boolean;
  alElegir: (dia: string) => void;
}

/** Acto 1: la mejor llegada en lenguaje operativo, con su riesgo de enlace y las alternativas. */
export function MejorVentana({ siteId, resultado, estanciaH, sensible, alElegir }: MejorVentanaProps) {
  const t = T.alunizaje;
  const [mejor, ...alternativas] = resultado.mejores;

  if (!mejor || sinVentanaUtil(resultado.mejores)) {
    return (
      <div>
        <p className="rotulo mb-3">{t.mejor.rotulo}</p>
        <div className="flex items-start gap-3">
          <span className="bg-critico/12 text-critico inline-flex size-9 shrink-0 items-center justify-center rounded-full"><OctagonX aria-hidden="true" className="size-5" /></span>
          <h2 className="text-seccion text-texto font-medium text-balance">{mejor ? t.mejor.sinVentana : t.mejor.sinEvaluadas}</h2>
        </div>
        <p className="text-apoyo text-texto-2 mt-3 max-w-medida">{mejor ? t.mejor.sinVentanaDetalle : t.mejor.sinEvaluadasDetalle}</p>
        <AvisoHorizonteIdeal className="mt-5" />
      </div>
    );
  }

  const empate = hayEmpate(resultado);
  const llegada = mejor.llegada_utc;
  return (
    <div>
      <p className="rotulo mb-3">{t.mejor.rotulo}</p>
      <h2 className="text-seccion text-texto font-medium text-balance">{t.mejor.llega(diaCorto(llegada), soloHora(llegada))}</h2>
      <p className="text-apoyo text-texto-2 mt-1">{t.mejor.enLima(diaLima(llegada), horaLocal(horaLima(llegada)))}</p>
      <CifraHeroe className="mt-5" valor={mejor.horas_sol_y_tierra} unidad="h" tono="sol"
        contexto={<>
          {t.mejor.conSolYTierra}{sensible ? "*" : ""}
          {mejor.pct_sol_y_tierra !== undefined && <> · {t.mejor.deEstancia(pct(mejor.pct_sol_y_tierra), horas(estanciaH))}</>}
        </>} />
      {empate && (
        <p className="text-apoyo text-texto mt-3"><strong className="font-semibold">{t.mejor.empate}.</strong> <span className="text-texto-2">{t.mejor.empateCalendario}</span></p>
      )}

      <div className="mt-5">
        <p className="text-apoyo text-texto-2 mb-2">{t.alLlegar.titulo}</p>
        <div className="flex flex-wrap gap-2">
          {mejor.sol_al_llegar !== undefined && <Chip nivel={mejor.sol_al_llegar ? "verde" : "rojo"}>{mejor.sol_al_llegar ? t.alLlegar.sol.si : t.alLlegar.sol.no}</Chip>}
          {mejor.tierra_al_llegar !== undefined && <Chip nivel={mejor.tierra_al_llegar ? "verde" : "rojo"}>{mejor.tierra_al_llegar ? t.alLlegar.tierra.si : t.alLlegar.tierra.no}</Chip>}
          <Riesgo ventana={mejor} estanciaH={estanciaH} />
        </div>
      </div>

      <EnlaceBoton to={enlaceCielo(siteId, llegada)} variante="primario" className="mt-6 min-h-12 max-sm:w-full">
        {t.mejor.verCielo}
        <ArrowRight aria-hidden="true" className="size-4" />
      </EnlaceBoton>

      {alternativas.length > 0 && (
        <div className="mt-6">
          <p className="rotulo mb-2">{t.alternativas.titulo}</p>
          <ul className="flex flex-col gap-2">
            {alternativas.map((v) => (
              <li key={v.llegada_utc}>
                <button type="button" onClick={() => alElegir(soloFecha(v.llegada_utc))}
                  aria-label={t.alternativas.elegir(diaCorto(v.llegada_utc), soloHora(v.llegada_utc), horas(v.horas_sol_y_tierra))}
                  className="rounded-control border-texto/12 bg-texto/[0.045] hover:border-texto/30 flex min-h-12 w-full items-center justify-between gap-3 border px-4 text-left transition-[border-color,transform] duration-(--dur-micro) ease-salida active:scale-[0.98]">
                  <span className="text-apoyo text-texto">{t.alternativas.item(diaCorto(v.llegada_utc), soloHora(v.llegada_utc))}</span>
                  <span className="text-dato text-texto font-mono font-medium whitespace-nowrap" data-dato>{numeroCorto(v.horas_sol_y_tierra)}<span className="text-texto-2 ml-1 font-light">h</span></span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <AvisoHorizonteIdeal className="mt-6" />
      {sensible && <p className="text-apoyo text-texto-2 mt-2">{t.mejor.relieve(T.semaforo.sensible)}</p>}
    </div>
  );
}
