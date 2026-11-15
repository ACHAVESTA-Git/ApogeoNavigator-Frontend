import { HORAS_POR_DIA, SEMAFORO } from "../../lib/constants";
import { horas, numero, pct } from "../../lib/formato";
import { T, umbralNivel } from "../../lib/textos";
import type { Astro, NivelSemaforo } from "../../lib/tipos";
import { GlifoSemaforo } from "../glifos/GlifoSemaforo";
import { CifraRelato } from "../ui/CifraRelato";

const EJE = {
  sol: { rotulo: T.ventanas.energia, detalle: T.ventanas.energiaDetalle, umbrales: SEMAFORO.ENERGIA },
  tierra: { rotulo: T.ventanas.comunicacion, detalle: T.ventanas.comunicacionDetalle, umbrales: SEMAFORO.COMUNICACION },
} as const;

/**
 * La cifra de un eje con su relato: porcentaje, «N de 744 h», la media del catálogo como referencia, la
 * consecuencia operativa y el semáforo con glifo, palabra y umbral. `compacto` es la versión de la ficha.
 */
export function CifraMetrica({ astro, porcentaje, horasVisibles, horasTotales, nivel, sensible = false, media, compacto = false, titulo, className }: {
  astro: Astro; porcentaje: number; horasVisibles: number; horasTotales: number; nivel: NivelSemaforo; sensible?: boolean;
  /** Media de los `n` sitios del catálogo en el mismo rango; sin ella no se dibuja la referencia. */
  media?: { valor: number; n: number } | null; compacto?: boolean; titulo?: "h2" | "h3"; className?: string;
}) {
  const eje = EJE[astro];
  const sin = horasTotales - horasVisibles;
  const relato = T.ventanas.relato[astro](numero(horasVisibles / HORAS_POR_DIA, 1), horas(sin), sin === 0, horasVisibles === 0);
  const marca = media ? { valor: media.valor, texto: T.ventanas.frenteMedia(media.n, pct(media.valor), numero(Math.abs(porcentaje - media.valor), 1), Math.sign(porcentaje - media.valor)) } : null;
  return (
    <CifraRelato astro={astro} rotulo={eje.rotulo} porcentaje={porcentaje} lectura={T.ventanas.deHoras(horas(horasVisibles), horas(horasTotales))}
      detalle={eje.detalle} marca={marca} relato={relato} compacto={compacto} titulo={titulo} className={className}>
      <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
        <GlifoSemaforo nivel={nivel} nota={sensible} />
        {!compacto && <span className="text-dato-sm text-texto-2 font-mono" data-dato>· {umbralNivel(nivel, eje.umbrales)}</span>}
      </p>
    </CifraRelato>
  );
}
