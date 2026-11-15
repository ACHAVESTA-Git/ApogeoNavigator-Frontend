import { Check, Copy, ShieldAlert, ShieldCheck, ShieldQuestion, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { textoFirma, textoOrigen, type OrigenDatos } from "../../lib/analisis";
import { ANALISIS_GRAFICO, LUJO } from "../../lib/constants";
import { fechaLarga } from "../../lib/fechas";
import { abreviarHuella } from "../../lib/lujo";
import { T } from "../../lib/textos";
import { unir } from "../ui/clases";
import { PanelVidrio } from "./PanelVidrio";

export type EstadoSello = "conforme" | "invalida" | "sinConfirmar";

/**
 * Estado del sello. Solo es «conforme» si el archivo es la semilla de NASA/JPL Horizons, la firma del manifiesto
 * es VÁLIDA (`firmado === true`) y ese manifiesto corresponde al archivo. Una firma inválida manda sobre todo lo demás.
 */
export function estadoSello(origen: OrigenDatos): EstadoSello {
  const m = origen.manifiesto;
  if (m?.firmado === false) return "invalida";
  return origen.tipo === "semilla_nasa" && m?.firmado === true && m.coincide ? "conforme" : "sinConfirmar";
}

const ASPECTO: Record<EstadoSello, { Icono: LucideIcon; halo: string; texto: string }> = {
  conforme: { Icono: ShieldCheck, halo: "bg-viable/12 text-viable", texto: "text-viable" },
  invalida: { Icono: ShieldAlert, halo: "bg-critico/12 text-critico", texto: "text-critico" },
  sinConfirmar: { Icono: ShieldQuestion, halo: "bg-reservas/12 text-reservas", texto: "text-reservas" },
};
const FIRMA: Record<"true" | "false" | "null", string> = { true: "text-viable", false: "text-critico", null: "text-reservas" };

export interface SelloProps {
  /** `entrada.origen` del análisis, tal cual llega de la API. */
  origen: OrigenDatos;
  /** Nivel del título del sello dentro de la página. */
  titulo?: "h2" | "h3";
  className?: string;
}

/**
 * Insignia de procedencia con aspecto de certificado: de dónde viene el archivo, su huella SHA3-256 (abreviada, con
 * copia de la completa) y el estado de la firma ML-DSA-65 del manifiesto. Reglas de presentación del análisis:
 * el título solo nombra a NASA/JPL Horizons si el archivo ES la semilla (`textoOrigen`), y la firma distingue
 * válida / no válida / no verificable (`textoFirma`), con su nota.
 */
export function Sello({ origen, titulo: Titulo = "h2", className }: SelloProps) {
  const t = T.lujo.sello;
  const { titulo, texto } = textoOrigen(origen, fechaLarga);
  const estado = estadoSello(origen);
  const { Icono, halo, texto: tono } = ASPECTO[estado];
  const m = origen.manifiesto;
  const [copiado, setCopiado] = useState(false);
  useEffect(() => {
    if (!copiado) return;
    const id = window.setTimeout(() => setCopiado(false), LUJO.COPIADO_MS);
    return () => window.clearTimeout(id);
  }, [copiado]);
  const copiar = () => {
    void navigator.clipboard?.writeText(origen.sha3_256).then(() => setCopiado(true)).catch(() => undefined);
  };
  return (
    <PanelVidrio como="section" aria-label={t.rotulo} data-estado={estado} className={unir("max-w-3xl", className)}>
      <div className="flex items-start gap-4">
        {/* Emblema: doble anillo, como el sello de un certificado. El estado va también en palabra, a su lado. */}
        <span aria-hidden="true" className={unir("grid size-14 shrink-0 place-items-center rounded-full border border-current/30 outline-1 outline-offset-[3px] outline-current/20 outline-dashed", halo)}>
          <Icono className="size-6" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="rotulo">{t.rotulo}</span>
            <span className={unir("text-apoyo font-semibold whitespace-nowrap", tono)}>{t.estados[estado]}</span>
          </p>
          <Titulo className="text-subtitulo text-texto mt-1.5 font-semibold text-balance">{titulo}</Titulo>
          <p className="text-apoyo text-texto-2 mt-1 max-w-medida">{texto}</p>
        </div>
      </div>
      <dl className="border-texto/8 text-apoyo mt-5 grid gap-x-8 gap-y-4 border-t pt-4 md:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-texto-3">{T.analisis.origen.huella}</dt>
          <dd className="mt-0.5 flex items-center gap-1">
            <code className="text-texto min-w-0 truncate font-mono" data-dato title={origen.sha3_256}>
              {abreviarHuella(origen.sha3_256, ANALISIS_GRAFICO.DECIMALES_HUELLA)}
            </code>
            <button type="button" onClick={copiar} aria-label={t.copiar} title={t.copiar}
              className="tactil text-texto-2 hover:text-texto -my-2.5 grid shrink-0 place-items-center rounded-full transition-[color,transform] duration-(--dur-micro) ease-salida active:scale-[0.97]">
              {copiado ? <Check aria-hidden="true" className="text-viable size-4" /> : <Copy aria-hidden="true" className="size-4" />}
            </button>
            <span role="status" className={copiado ? "text-texto-2 text-[0.75rem]" : "sr-only"}>{copiado ? t.copiado : ""}</span>
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-texto-3">{t.firma}</dt>
          {m ? (
            <dd className="mt-0.5">
              <span className={unir("font-semibold", FIRMA[String(m.firmado) as keyof typeof FIRMA])} data-firmado={String(m.firmado)}>{textoFirma(m.firmado)}</span>
              {m.firma_nota && <span className="text-texto-2 block">{m.firma_nota}</span>}
              {!m.coincide && <span className="text-texto block">{t.manifiestoAjeno}</span>}
            </dd>
          ) : (
            <dd className="text-texto-2 mt-0.5">{t.sinManifiesto}</dd>
          )}
        </div>
      </dl>
    </PanelVidrio>
  );
}
