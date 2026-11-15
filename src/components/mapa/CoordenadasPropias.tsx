import { ArrowRight } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { RUTAS } from "../../lib/constants";
import { coordenadas } from "../../lib/formato";
import { idDePunto, leerCoordenada } from "../../lib/puntoPropio";
import { T } from "../../lib/textos";
import { Boton } from "../ui/Boton";
import { Desplegable } from "../ui/Desplegable";
import { unir } from "../ui/clases";

const CAMPO =
  "tactil bg-superficie border-texto/12 text-texto mt-1.5 w-full rounded-control border px-3 font-mono text-base " +
  "focus-visible:-outline-offset-2 aria-[invalid=true]:border-critico";

function Campo({ eje, valor, alCambiar }: { eje: "lat" | "lon"; valor: string; alCambiar: (v: string) => void }) {
  const id = useId();
  const t = T.puntoPropio;
  const { error } = leerCoordenada(valor, eje);
  return (
    <label className="block min-w-0 flex-1">
      <span className="rotulo">{eje === "lat" ? t.lat : t.lon}</span>
      {/* Teclado de texto: el decimal de iOS no tiene signo menos y aquí el Sur y el Oeste son negativos. */}
      <input value={valor} onChange={(e) => alCambiar(e.target.value)} inputMode="text" autoComplete="off" autoCapitalize="none" spellCheck={false}
        placeholder={eje === "lat" ? "−89,66" : "129,20"} aria-invalid={Boolean(error)} aria-describedby={id} className={CAMPO} />
      <span id={id} className={unir("mt-1 block text-[0.8125rem]", error ? "text-critico font-semibold" : "text-texto-3")}>
        {error || (eje === "lat" ? t.ayudaLat : t.ayudaLon)}
      </span>
    </label>
  );
}

/**
 * HU-13 · Coordenadas propias: latitud y longitud con validación en vivo (Sur negativo, Este positivo). Al
 * enviar se abre el Cielo de ese punto, que se consulta en vivo a JPL Horizons. Revelado progresivo: plegado
 * por defecto para no competir con el catálogo.
 */
export function CoordenadasPropias({ className }: { className?: string }) {
  const t = T.puntoPropio;
  const navegar = useNavigate();
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  // El guion tipográfico (−) que se muestra en la ayuda también vale al escribir.
  const normal = (v: string) => v.replace(/[−–]/g, "-");
  const [la, lo] = [leerCoordenada(normal(lat), "lat"), leerCoordenada(normal(lon), "lon")];
  const punto = la.valor !== null && lo.valor !== null ? { lat: la.valor, lon: lo.valor } : null;
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (punto) void navegar(RUTAS.CIELO(idDePunto(punto)));
  };
  return (
    <Desplegable titulo={t.titulo} className={className}>
      <form onSubmit={enviar} noValidate className="max-w-md pb-2">
        <p className="text-apoyo text-texto-2">{t.entrada}</p>
        <div className="mt-4 flex gap-3">
          <Campo eje="lat" valor={normal(lat)} alCambiar={setLat} />
          <Campo eje="lon" valor={normal(lon)} alCambiar={setLon} />
        </div>
        <p aria-live="polite" className="text-dato-sm text-texto-2 mt-3 min-h-[1.5em] font-mono" data-dato>
          {punto && t.lectura(coordenadas(punto.lat, punto.lon))}
        </p>
        <Boton type="submit" variante="primario" className="mt-2" disabled={!punto}>
          {t.ver}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Boton>
        <p className="text-texto-3 mt-3 text-[0.8125rem]">{t.privacidad}</p>
      </form>
    </Desplegable>
  );
}
