import { Check, TriangleAlert } from "lucide-react";
import { grados, horas, pct } from "../../lib/formato";
import { T } from "../../lib/textos";
import type { Metrica, ValoresMetricas } from "../../lib/tipos";
import { Desplegable } from "../ui/Desplegable";
import { Lectura } from "../ui/Lectura";

const CAMPOS: { clave: keyof ValoresMetricas; nombre: string; formato: (v: number) => string }[] = [
  { clave: "horas_sol", nombre: "horas de sol", formato: horas },
  { clave: "pct_sol", nombre: "% de sol", formato: pct },
  { clave: "sol_el_max_deg", nombre: "altura máxima", formato: (v) => grados(v, 2, true) },
  { clave: "sol_el_media_deg", nombre: "altura media", formato: (v) => grados(v, 2, true) },
  { clave: "horas_tierra_visible", nombre: "horas de Tierra", formato: horas },
  { clave: "pct_tierra", nombre: "% de Tierra", formato: pct },
];

/** Revelado bajo demanda: alturas del Sol y trazabilidad contra metricas.csv (HU-12). */
export function ReferenciaMetricas({ metrica }: { metrica: Metrica }) {
  const t = T.ventanas;
  const ref = metrica.referencia;
  const diferencias = ref && !ref.coincide ? CAMPOS.filter((c) => metrica[c.clave] !== ref[c.clave]) : [];
  return (
    <Desplegable titulo={t.masMetricas} className="border-b">
      <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
        <Lectura rotulo={t.solMax}>{grados(metrica.sol_el_max_deg, 2, true)}</Lectura>
        <Lectura rotulo={t.solMedia}>
          {metrica.sol_el_media_deg === null ? <span className="text-texto-2 font-sans">{t.sinMedia}</span> : grados(metrica.sol_el_media_deg, 2, true)}
        </Lectura>
        <Lectura rotulo={t.origen}><span className="text-apoyo font-sans">{t.origenes[metrica.origen] ?? metrica.origen}</span></Lectura>
        <Lectura rotulo={t.referencia}>
          <span className="text-apoyo inline-flex items-center gap-2 font-sans">
            {ref?.coincide && <><Check aria-hidden="true" className="text-viable size-4" />{t.coincide}</>}
            {ref && !ref.coincide && <><TriangleAlert aria-hidden="true" className="text-reservas size-4" />{t.noCoincide}</>}
            {!ref && <span className="text-texto-2">{t.sinReferencia}</span>}
          </span>
        </Lectura>
      </dl>
      {diferencias.length > 0 && ref && (
        <ul className="text-apoyo text-texto-2 mt-4 list-inside list-disc">
          {diferencias.map((c) => {
            const [calculado, referencia] = [metrica[c.clave], ref[c.clave]];
            return <li key={c.clave}>{t.diferencia(c.nombre, calculado === null ? "—" : c.formato(calculado), referencia === null ? "—" : c.formato(referencia))}</li>;
          })}
        </ul>
      )}
    </Desplegable>
  );
}
