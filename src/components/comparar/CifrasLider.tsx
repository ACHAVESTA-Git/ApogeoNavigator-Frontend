import type { DatosFila } from "../../hooks/useFilasComparacion";
import { HORAS_POR_DIA } from "../../lib/constants";
import { horas, numero, pct } from "../../lib/formato";
import { T } from "../../lib/textos";
import type { Astro, Metrica } from "../../lib/tipos";
import { CifraRelato } from "../ui/CifraRelato";

const EJES: { astro: Astro; rotulo: string; pct: (m: Metrica) => number; horas: (m: Metrica) => number }[] = [
  { astro: "sol", rotulo: T.ventanas.energia, pct: (m) => m.pct_sol, horas: (m) => m.horas_sol },
  { astro: "tierra", rotulo: T.ventanas.comunicacion, pct: (m) => m.pct_tierra, horas: (m) => m.horas_tierra_visible },
];
const mayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

/**
 * La decisión en dos cifras: quién lidera cada eje, frente a quién (el menor de la selección, la raya sobre la
 * barra) y qué supone la diferencia en horas y en días. Solo usa las métricas ya pedidas para las filas.
 */
export function CifrasLider({ filas }: { filas: DatosFila[] }) {
  const conDatos = filas.filter((f): f is DatosFila & { metrica: Metrica } => Boolean(f.metrica));
  if (conDatos.length < 2) return null;
  return (
    <section aria-label={T.comparar.cifras} className="mt-6 grid gap-3 sm:grid-cols-2">
      {EJES.map((eje) => {
        const orden = [...conDatos].sort((a, b) => eje.horas(b.metrica) - eje.horas(a.metrica));
        const [mejor, peor] = [orden[0], orden[orden.length - 1]];
        const delta = eje.horas(mejor.metrica) - eje.horas(peor.metrica);
        return (
          <CifraRelato key={eje.astro} astro={eje.astro} rotulo={eje.rotulo} porcentaje={eje.pct(mejor.metrica)}
            lectura={T.comparar.lidera(mayuscula(mejor.etiqueta), horas(eje.horas(mejor.metrica)))}
            marca={delta === 0 ? null : { valor: eje.pct(peor.metrica), texto: T.comparar.frenteA(mayuscula(peor.etiqueta), pct(eje.pct(peor.metrica))) }}
            relato={T.comparar.relato[eje.astro](mayuscula(mejor.etiqueta), peor.etiqueta, horas(delta), numero(delta / HORAS_POR_DIA, 1), delta === 0)} />
        );
      })}
    </section>
  );
}
