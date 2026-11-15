import { Fragment, useId } from "react";
import { MAPA, MOVIMIENTO } from "../../lib/constants";
import { latitud, nombreCorto } from "../../lib/formato";
import { proyectarPolar, radioLatitud } from "../../lib/geo";
import { T } from "../../lib/textos";
import type { Site } from "../../lib/tipos";
import { FormaCategoria } from "../glifos/GlifoCategoria";
import { useAnclaHorizonte } from "../layout/horizonteContexto";
import { unir } from "../ui/clases";

const L = MAPA.LADO;
const C = L / 2;
const R = C - MAPA.MARGEN;
const RAD = Math.PI / 180;
const pct = (v: number) => `${(v / L) * 100}%`;
const ROTULO_ANILLO: Partial<Record<number, string>> = { [MAPA.ANILLO_ARTEMIS]: T.sitios.zonaArtemis, 0: T.sitios.ecuador };
const ROTULO_MERIDIANO: Record<number, string> = { 0: T.sitios.haciaTierra, 90: "90° E", 180: "180°", 270: `90° ${T.oeste}` };

/**
 * Proyección azimutal equidistante centrada en el polo sur: 0° de longitud hacia arriba (hacia la Tierra),
 * este en sentido horario. El anillo del ecuador (el limbo visto desde el polo) es el horizonte continuo.
 */
export function MapaPolar({ sitios, activo, seleccionado, alActivar, alSeleccionar, cargando = false }: {
  sitios: readonly Site[]; activo: string | null; seleccionado: string | null;
  alActivar: (id: string | null) => void; alSeleccionar: (id: string) => void; cargando?: boolean;
}) {
  const id = useId();
  const ancla = useAnclaHorizonte("anillo");
  const rHorizonte = radioLatitud(MAPA.ANILLO_HORIZONTE, R);
  const resaltado = sitios.find((s) => s.site_id === (activo ?? seleccionado));
  const meridianos = Array.from({ length: 360 / MAPA.MERIDIANOS_CADA }, (_, i) => i * MAPA.MERIDIANOS_CADA);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[640px]">
      <svg role="img" aria-label={T.sitios.mapa(sitios.length)} viewBox={`0 0 ${L} ${L}`} className="size-full overflow-visible">
        <defs>
          <clipPath id={`${id}-disco`}><circle cx={C} cy={C} r={R} /></clipPath>
        </defs>
        {/* Cara oculta: semidisco inferior velado */}
        <g clipPath={`url(#${id}-disco)`}>
          <rect x={0} y={C} width={L} height={C} className="fill-regolito" />
        </g>
        <circle cx={C} cy={C} r={radioLatitud(MAPA.ANILLO_ARTEMIS, R)} className="fill-sol-tenue" />
        {/* Meridianos */}
        {meridianos.map((lon) => (
          <line key={lon} x1={C} y1={C} x2={C + R * Math.sin(lon * RAD)} y2={C - R * Math.cos(lon * RAD)}
            className="stroke-linea" strokeWidth={1} strokeDasharray={lon % 90 === 0 ? undefined : "2 5"} />
        ))}
        {/* Anillos de latitud (el del ecuador lo dibuja el horizonte continuo) */}
        {/* Aparecen uno tras otro cuando el horizonte ya se ha enrollado (stagger de 60 ms) */}
        {MAPA.ANILLOS.filter((lat) => lat !== MAPA.ANILLO_HORIZONTE).map((lat, i) => (
          <circle key={lat} cx={C} cy={C} r={radioLatitud(lat, R)} className="stroke-linea animate-aparecer fill-none" strokeWidth={1}
            style={{ animationDelay: `${MOVIMIENTO.LARGA + i * MOVIMIENTO.STAGGER}ms` }} />
        ))}
        <circle cx={C} cy={C} r={R} className="stroke-linea fill-none" strokeWidth={1} strokeDasharray="1 4" />
        {/* Anillo de latitud del sitio resaltado: relaciona el punto con su latitud */}
        {resaltado && (
          <circle cx={C} cy={C} r={radioLatitud(resaltado.lat_deg, R)} className="stroke-texto fill-none transition-opacity duration-(--dur-corta)" strokeWidth={1} opacity={0.7} />
        )}
        {/* Rótulos de anillos, sobre el meridiano 315° para no pisar los sitios */}
        <g aria-hidden="true" className="fill-texto-3 font-mono text-[12px] max-sm:text-[24px]">
          {MAPA.ANILLOS.map((lat) => {
            const r = radioLatitud(lat, R);
            // El anillo de Artemis es tan pequeño que su rótulo va fuera, abajo a la derecha del polo.
            const dentro = lat === MAPA.ANILLO_ARTEMIS;
            const [x, y] = dentro ? [C + r + 8, C + 18] : [C - r * Math.SQRT1_2 - 4, C - r * Math.SQRT1_2 - 4];
            const nombre = ROTULO_ANILLO[lat];
            // En móvil el texto mide el doble: un rótulo con nombre anclado por su final no cabe a la izquierda
            // del anillo en una línea, así que allí va en dos (latitud arriba, nombre abajo).
            const partido = Boolean(nombre) && !dentro;
            return (
              <Fragment key={lat}>
                <text x={x} y={y} textAnchor={dentro ? "start" : "end"} className={nombre && !partido ? undefined : "max-sm:hidden"}>
                  {latitud(lat, 0)}{nombre ? ` · ${nombre}` : ""}
                </text>
                {partido && (
                  <text x={x} y={y} textAnchor="end" className="sm:hidden">
                    <tspan x={x} dy={-MAPA.INTERLINEA_ROTULO_MOVIL}>{latitud(lat, 0)}</tspan>
                    <tspan x={x} dy={MAPA.INTERLINEA_ROTULO_MOVIL}>{nombre}</tspan>
                  </text>
                )}
              </Fragment>
            );
          })}
          {MAPA.MERIDIANOS_ROTULADOS.map((lon) => (
            <text key={lon} x={C + (R + 14) * Math.sin(lon * RAD)} y={C - (R + 14) * Math.cos(lon * RAD) + 4}
              textAnchor={lon === 90 ? "start" : lon === 270 ? "end" : "middle"} className={lon === 0 ? undefined : "max-sm:hidden"}>
              {ROTULO_MERIDIANO[lon]}
            </text>
          ))}
          <text x={C} y={C + R - 14} textAnchor="middle" className="fill-texto-2 font-sans text-[13px] max-sm:text-[24px]">{T.sitios.caraOculta}</text>
        </g>
      </svg>

      {/* Ancla del horizonte: el cuadrado que circunscribe el anillo del ecuador */}
      <div ref={ancla} aria-hidden="true" className="pointer-events-none absolute"
        style={{ left: pct(C - rHorizonte), top: pct(C - rHorizonte), width: pct(2 * rHorizonte), height: pct(2 * rHorizonte) }} />

      {/* Puntos: botones reales de 44 px sobre el mapa; la forma indica la categoría */}
      {!cargando && sitios.map((s) => {
        const p = proyectarPolar(s.lat_deg, s.lon_este_deg, R);
        const esActivo = s.site_id === activo || s.site_id === seleccionado;
        const aLaIzquierda = s.lon_este_deg < 0 || Math.hypot(p.x, p.y) < MAPA.RADIO_ETIQUETA_IZQ;
        return (
          <button
            key={s.site_id}
            type="button"
            aria-label={`${s.nombre}, ${latitud(s.lat_deg)}`}
            aria-pressed={s.site_id === seleccionado}
            onClick={() => alSeleccionar(s.site_id)}
            onPointerEnter={() => alActivar(s.site_id)}
            onPointerLeave={() => alActivar(null)}
            onFocus={() => alActivar(s.site_id)}
            onBlur={() => alActivar(null)}
            className={unir("group absolute z-20 flex size-11 -translate-1/2 items-center justify-center rounded-full active:[&>svg]:scale-[0.92]", esActivo && "z-30")}
            style={{ left: pct(C + p.x), top: pct(C + p.y) }}
          >
            <svg aria-hidden="true" viewBox="-12 -12 24 24"
              className={unir("size-6 overflow-visible transition-transform duration-(--dur-corta) ease-salida motion-reduce:transform-none",
                esActivo ? "scale-[1.6] text-texto" : "text-texto-2")}
              fill="currentColor">
              <circle r={10} className="fill-vacio" opacity={0.85} />
              <FormaCategoria categoria={s.categoria} r={5} />
            </svg>
            <span aria-hidden="true"
              className={unir("text-dato-sm pointer-events-none absolute top-1/2 -translate-y-1/2 font-mono whitespace-nowrap",
                aLaIzquierda ? "right-full -mr-1.5" : "left-full -ml-1.5",
                esActivo ? "text-texto bg-vacio z-10 px-1" : "text-texto-2 hidden lg:block")}>
              {nombreCorto(s.nombre)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
