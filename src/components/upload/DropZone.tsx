import { CloudUpload } from "lucide-react";
import { forwardRef, useRef, useState, type DragEvent } from "react";
import { CARGA } from "../../lib/constants";
import { T } from "../../lib/textos";
import { unir } from "../ui/clases";

const MB = 1024 * 1024;
/** Zona de arrastre con un botón real para teclado («elige archivos»). */
export const DropZone = forwardRef<HTMLButtonElement, { alElegir: (archivos: File[]) => void }>(function DropZone({ alElegir }, ref) {
  const entrada = useRef<HTMLInputElement>(null);
  const [encima, setEncima] = useState(false);
  const soltar = (e: DragEvent) => {
    e.preventDefault();
    setEncima(false);
    alElegir([...e.dataTransfer.files]);
  };
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setEncima(true); }}
      onDragLeave={() => setEncima(false)}
      onDrop={soltar}
      className={unir("rounded-control border border-dashed px-4 py-6 text-center transition-colors duration-(--dur-micro)",
        encima ? "border-texto bg-superficie" : "border-horizonte")}
    >
      <CloudUpload aria-hidden="true" className="text-texto-2 mx-auto size-6" strokeWidth={1.5} />
      <p className="text-texto mt-2">
        <span className="max-sm:hidden">{T.carga.zona} </span>
        <button ref={ref} type="button" onClick={() => entrada.current?.click()}
          className="tactil text-texto decoration-horizonte hover:decoration-texto font-semibold underline underline-offset-4">
          <span className="max-sm:hidden">{T.carga.elegir}</span>
          <span className="sm:hidden">{T.carga.zonaMovil}</span>
        </button>
      </p>
      <p className="text-texto-3 text-[0.75rem]">{T.carga.limites(CARGA.MAX_BYTES / MB, CARGA.MAX_ARCHIVOS)}</p>
      <p className="text-texto-3 text-[0.75rem]">{T.carga.nombres}</p>
      <input ref={entrada} type="file" accept={`${CARGA.EXTENSION},text/csv`} multiple hidden
        onChange={(e) => { alElegir([...(e.target.files ?? [])]); e.target.value = ""; }} />
    </div>
  );
});
