import { Ban, ChevronDown, CircleCheck, FileSpreadsheet, LoaderCircle, Trash2, TriangleAlert, type LucideIcon } from "lucide-react";
import { useId, useState } from "react";
import { useMovimientoReducido } from "../../hooks/useMovimientoReducido";
import { tamanoArchivo } from "../../lib/formato";
import { T } from "../../lib/textos";
import type { ArchivoCarga, EstadoArchivo } from "../../lib/upload";
import { unir } from "../ui/clases";
import { ErrorTable } from "./ErrorTable";
import { Plegable } from "./Plegable";

// Estado = SOLO un icono pequeño de color antes de la línea secundaria (con aria-label y tooltip). Sin fondos de color.
const ICONO: Partial<Record<EstadoArchivo, { Icono: LucideIcon; color: string; etiqueta: string; curva?: string }>> = {
  valido: { Icono: CircleCheck, color: "text-viable", etiqueta: T.carga.estados.valido },
  guardado: { Icono: CircleCheck, color: "text-viable", etiqueta: T.carga.estados.guardado },
  advertencias: { Icono: TriangleAlert, color: "text-reservas", etiqueta: T.carga.estados.advertencias },
  // Los fallos entran con la curva de frenado: el icono «se clava».
  errores: { Icono: Ban, color: "text-critico", etiqueta: T.carga.estados.errores, curva: "[animation-timing-function:var(--ease-frenado)]" },
  no_guardado: { Icono: Ban, color: "text-critico", etiqueta: T.carga.estados.no_guardado, curva: "[animation-timing-function:var(--ease-frenado)]" },
};

function lineaSecundaria(a: ArchivoCarga): string {
  if (a.errorLocal) return a.errorLocal;
  if (a.mensaje) return a.mensaje;
  const base = `${a.tipo ? T.carga.tipos[a.tipo] : ""} · ${tamanoArchivo(a.archivo.size)}`;
  if (!a.informe) return base;
  const partes = [base];
  if (a.informe.total_filas) partes.push(T.carga.filas(a.informe.total_filas));
  if (a.informe.total_errores) partes.push(T.carga.nErrores(a.informe.total_errores));
  else if (a.informe.advertencias.length) partes.push(T.carga.nAdvertencias(a.informe.advertencias.length));
  return partes.join(" · ");
}

/** Fila compacta de un archivo: icono de CSV, nombre, «tipo · tamaño» con su icono de estado y la acción de la derecha. */
export function FileRow({ archivo: a, alQuitar }: { archivo: ArchivoCarga; alQuitar?: () => void }) {
  const id = useId();
  const reducido = useMovimientoReducido();
  const [abierta, setAbierta] = useState(false);
  const enCurso = a.estado === "validando" || a.estado === "guardando";
  const estado = a.errorLocal ? ICONO.errores : ICONO[a.estado];
  const errores = a.informe?.errores ?? [];
  const advertencias = a.informe?.advertencias ?? [];
  const conDetalle = errores.length + advertencias.length > 0;
  return (
    <li className="capilar-b">
      <div className="flex min-h-15 items-center gap-3 py-2">
        <span className="bg-superficie flex size-8 shrink-0 items-center justify-center rounded-control">
          <FileSpreadsheet aria-hidden="true" className="text-texto-2 size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-apoyo text-texto truncate font-semibold" title={a.archivo.name}>{a.archivo.name}</p>
          <p className="text-texto-3 flex items-center gap-1.5 text-[0.8125rem]">
            {enCurso && !reducido && <LoaderCircle aria-hidden="true" className="animate-girar size-3.5 shrink-0" />}
            {!enCurso && estado && (
              <span role="img" aria-label={estado.etiqueta} title={estado.etiqueta} className={unir("animate-aparecer inline-flex shrink-0", estado.color, estado.curva)}>
                <estado.Icono aria-hidden="true" className="size-3.5" />
              </span>
            )}
            <span className={unir("min-w-0", conDetalle || a.errorLocal || a.mensaje ? "" : "truncate", (a.errorLocal || a.mensaje) && "text-texto-2")}>
              {a.estado === "validando" ? T.carga.validandoFila : a.estado === "guardando" ? T.carga.guardandoFila : lineaSecundaria(a)}
            </span>
          </p>
        </div>
        {alQuitar && (
          <button type="button" onClick={alQuitar} aria-label={T.carga.quitar(a.archivo.name)}
            className="tactil text-critico hover:bg-superficie inline-flex shrink-0 items-center justify-center rounded-control transition-colors duration-(--dur-micro) active:scale-[0.98]">
            <Trash2 aria-hidden="true" className="size-4" />
          </button>
        )}
        {!alQuitar && conDetalle && (
          <button type="button" onClick={() => setAbierta((v) => !v)} aria-expanded={abierta} aria-controls={id} aria-label={T.carga.detalle(a.archivo.name)}
            className="tactil text-texto-2 hover:text-texto inline-flex shrink-0 items-center justify-center">
            <ChevronDown aria-hidden="true" className={unir("size-4 transition-transform duration-(--dur-corta)", abierta && "rotate-180")} />
          </button>
        )}
      </div>
      {conDetalle && (
        <Plegable abierto={abierta} rapido>
          <div id={id}>
            {errores.length > 0 && <ErrorTable titulo={`${T.carga.errores}: ${a.archivo.name}`} incidencias={errores} total={a.informe?.total_errores ?? errores.length} />}
            {advertencias.length > 0 && <ErrorTable titulo={`${T.carga.advertencias}: ${a.archivo.name}`} incidencias={advertencias} total={advertencias.length} />}
          </div>
        </Plegable>
      )}
    </li>
  );
}
