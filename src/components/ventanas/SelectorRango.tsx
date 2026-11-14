import { useEffect, useId, useState, type FormEvent } from "react";
import { BANDA, DATOS, HORAS_POR_DIA } from "../../lib/constants";
import { aCampoLocal, aMs, desdeCampoLocal, diasEntre, inicioDeMes, soloFecha, sumarHoras, sumarMeses } from "../../lib/fechas";
import { T } from "../../lib/textos";
import type { Utc } from "../../lib/tipos";
import { Boton } from "../ui/Boton";

const CAMPO = "tactil bg-superficie border-linea text-texto w-full rounded-control border px-3 font-mono text-[0.9375rem] aria-[invalid=true]:border-critico";

/** Misma validación que el backend, antes de llamar: formato, orden, ≤ 35 días y dentro de los datos. */
export function validarRango(desde: Utc | null, hasta: Utc | null): string | null {
  const t = T.ventanas;
  if (!desde || !hasta) return t.errorFormato;
  if (aMs(hasta) <= aMs(desde)) return t.errorOrden;
  if (diasEntre(desde, hasta) > DATOS.RANGO_MAX_DIAS) return t.errorMaximo(DATOS.RANGO_MAX_DIAS);
  const { DESDE, HASTA } = DATOS.COBERTURA;
  if (aMs(desde) < aMs(DESDE) || aMs(hasta) > aMs(HASTA)) return t.errorCobertura(soloFecha(DESDE), soloFecha(HASTA));
  return null;
}

/** Rango en UTC con dos campos datetime-local y atajos (mes completo y semanas 1–4 del mes en curso). */
export function SelectorRango({ desde, hasta, alAplicar, errorServidor }: {
  desde: Utc; hasta: Utc; alAplicar: (desde: Utc, hasta: Utc) => void; errorServidor?: string | null;
}) {
  const t = T.ventanas;
  const id = useId();
  const [d, setD] = useState(aCampoLocal(desde));
  const [h, setH] = useState(aCampoLocal(hasta));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setD(aCampoLocal(desde));
    setH(aCampoLocal(hasta));
    setError(null);
  }, [desde, hasta]);

  const aplicar = (e: FormEvent) => {
    e.preventDefault();
    const [nd, nh] = [desdeCampoLocal(d), desdeCampoLocal(h)];
    const fallo = validarRango(nd, nh);
    setError(fallo);
    if (!fallo && nd && nh) alAplicar(nd, nh);
  };
  const mes = inicioDeMes(desde);
  const semana = (n: number) => {
    const inicio = sumarHoras(mes, n * BANDA.DIAS_SEMANA * HORAS_POR_DIA);
    return [inicio, sumarHoras(inicio, BANDA.DIAS_SEMANA * HORAS_POR_DIA)] as const;
  };
  const atajos = [
    { etiqueta: t.mesCompleto, rango: [mes, sumarMeses(mes, 1)] as const },
    ...Array.from({ length: BANDA.SEMANAS }, (_, n) => ({ etiqueta: t.semana(n + 1), rango: semana(n) })),
  ];
  const mensaje = error ?? errorServidor;
  return (
    <form onSubmit={aplicar} noValidate aria-label={t.rango}>
      <div role="group" aria-label={t.atajos} className="flex flex-wrap gap-2">
        {atajos.map(({ etiqueta, rango }) => {
          const activo = rango[0] === desde && rango[1] === hasta;
          return (
            <Boton key={etiqueta} aria-pressed={activo} onClick={() => alAplicar(rango[0], rango[1])}
              className={activo ? "border-texto! bg-superficie" : "border-linea!"}>
              {etiqueta}
            </Boton>
          );
        })}
      </div>
      <div className="mt-4 grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <label className="block">
          <span className="rotulo">{t.desde} · {T.utc}</span>
          <input type="datetime-local" step={3600} value={d} onChange={(e) => setD(e.target.value)} className={`${CAMPO} mt-1.5`}
            aria-invalid={Boolean(mensaje)} aria-describedby={mensaje ? `${id}-error` : undefined} />
        </label>
        <label className="block">
          <span className="rotulo">{t.hasta} · {T.utc}</span>
          <input type="datetime-local" step={3600} value={h} onChange={(e) => setH(e.target.value)} className={`${CAMPO} mt-1.5`}
            aria-invalid={Boolean(mensaje)} aria-describedby={mensaje ? `${id}-error` : undefined} />
        </label>
        <Boton type="submit">{t.aplicar}</Boton>
      </div>
      {mensaje && <p id={`${id}-error`} role="alert" className="text-apoyo text-critico mt-2">{mensaje}</p>}
    </form>
  );
}
