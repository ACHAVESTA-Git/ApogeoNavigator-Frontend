import { ArrowLeft, LoaderCircle, TriangleAlert } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { useUpload } from "../../hooks/useUpload";
import { CARGA } from "../../lib/constants";
import { T } from "../../lib/textos";
import { useApp } from "../layout/contexto";
import { Boton } from "../ui/Boton";
import { Popup } from "../ui/Popup";
import { CampoClave } from "./CampoClave";
import { DropZone } from "./DropZone";
import { FileRow } from "./FileRow";
import { Plegable } from "../ui/Plegable";
import { SuccessCheck } from "./SuccessCheck";

const Girando = () => <LoaderCircle aria-hidden="true" className="animate-girar size-4 motion-reduce:hidden" />;

/** Popup «Subir datos» (docs/plan/estandar-carga-ui.md): elegir → validar → revisar → guardar → hecho. */
export default function UploadDialog({ alCerrar }: { alCerrar: () => void }) {
  const t = T.carga;
  const idTitulo = useId();
  const { anunciar } = useApp();
  const u = useUpload(anunciar);
  const zona = useRef<HTMLButtonElement>(null);
  const campoClave = useRef<HTMLInputElement>(null);
  const pideClave = !u.clave || u.claveInvalida;

  // Al abrir, el foco va a la zona de arrastre (o al campo de la clave si falta). Ante un 401, al campo.
  useEffect(() => {
    if (u.paso !== "elegir") return;
    (u.claveInvalida || !u.clave ? campoClave : zona).current?.focus();
  }, [u.paso, u.claveInvalida]); // eslint-disable-line react-hooks/exhaustive-deps

  const { hechos, total } = u.progreso;
  const enCurso = Math.min(hechos + 1, total);
  const filasVisibles = { maxHeight: CARGA.FILAS_VISIBLES * CARGA.ALTO_FILA_PX };

  const pie = (
    <div className="grid grid-cols-3 items-center gap-3 sm:flex sm:justify-end">
      {u.paso === "elegir" && (
        <Boton variante="primario" disabled={!u.puedeValidar} onClick={u.validar} className="col-span-3 sm:min-w-36">{t.validar(u.archivos.length)}</Boton>
      )}
      {u.paso === "validando" && <Boton variante="primario" disabled className="col-span-3 sm:min-w-36"><Girando />{t.validando(enCurso, total)}</Boton>}
      {(u.paso === "revisar" || u.paso === "guardando") && (
        <>
          <p aria-live="polite" className="text-apoyo text-texto-2 col-span-3 sm:mr-auto">{t.resumen(u.conteo.guardables, u.conteo.conErrores)}</p>
          <Boton variante="texto" onClick={u.anterior} disabled={u.ocupado}><ArrowLeft aria-hidden="true" className="size-4" />{t.anterior}</Boton>
          <Boton variante="primario" disabled={u.ocupado || u.conteo.guardables === 0} onClick={u.guardar} className="col-span-2 sm:min-w-36">
            {u.paso === "guardando" ? <><Girando />{t.guardando(enCurso, total)}</> : t.guardar(u.conteo.guardables)}
          </Boton>
        </>
      )}
      {u.paso === "hecho" && (
        <>
          {u.conteo.noGuardados > 0 && <Boton variante="texto" onClick={u.revisarNoGuardados} className="col-span-3 sm:mr-auto">{t.revisarNoGuardados}</Boton>}
          <Boton variante="primario" className="col-span-3 sm:min-w-36" onClick={(e) => e.currentTarget.closest("dialog")?.dispatchEvent(new Event("cancel", { cancelable: true }))}>{t.listo}</Boton>
        </>
      )}
    </div>
  );

  return (
    <Popup titulo={t.titulo} rotulo={t.pasos[u.paso]} idTitulo={idTitulo} bloqueado={u.paso === "guardando"} pie={pie}
      ancho={`${u.archivos.length >= 2 ? CARGA.ANCHO_REM.varios : CARGA.ANCHO_REM.uno}rem`}
      alCerrar={() => { u.alCerrar(); alCerrar(); }}>
      <div aria-live="polite" className="sr-only">
        {u.paso === "validando" && t.validando(enCurso, total)}
        {u.paso === "guardando" && t.guardando(enCurso, total)}
        {u.paso === "hecho" && t.exito}
      </div>

      {u.errorRed && (
        <div role="alert" className="border-critico mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-l-2 py-1 pl-3">
          <TriangleAlert aria-hidden="true" className="text-critico size-4 shrink-0" />
          <p className="text-apoyo text-texto min-w-0 flex-1">{t.errorRed}</p>
          <Boton onClick={u.errorRed}>{T.reintentar}</Boton>
        </div>
      )}

      {u.paso === "hecho" ? (
        <SuccessCheck guardados={u.conteo.guardados} noGuardados={u.conteo.noGuardados}
          sitioAnalizado={u.archivos.find((a) => a.estado === "guardado" && a.siteId)?.siteId ?? undefined} alIr={() => { u.alCerrar(); alCerrar(); }} />
      ) : (
        <>
          {/* La zona de arrastre se pliega y el bloque de progreso se despliega: nunca aparece de golpe */}
          <Plegable abierto={u.paso === "elegir"}>
            <div className="pb-3"><DropZone ref={zona} alElegir={u.anadir} /></div>
          </Plegable>
          <Plegable abierto={u.ocupado}>
            <p className="text-texto flex items-center gap-2 pb-3 font-medium">
              <Girando />
              {u.paso === "guardando" ? t.guardando(enCurso, total) : t.validando(enCurso, total)}
            </p>
          </Plegable>
          {u.aviso && <p role="status" className="text-apoyo text-reservas pb-2">{u.aviso}</p>}
          {u.archivos.length > 0 && (
            <ul aria-label={t.lista} className="capilar-t overflow-y-auto overscroll-contain pr-1" style={u.paso === "elegir" || u.ocupado ? filasVisibles : undefined}>
              {u.archivos.map((a) => (
                <FileRow key={a.id} archivo={a} alQuitar={u.paso === "elegir" ? () => u.quitar(a.id) : undefined} />
              ))}
            </ul>
          )}
          <Plegable abierto={u.paso === "elegir" && pideClave} rapido>
            <div className="pt-4">
              <CampoClave ref={campoClave} valor={u.clave} invalida={u.claveInvalida} alCambiar={u.guardarClave} />
            </div>
          </Plegable>
        </>
      )}
    </Popup>
  );
}
