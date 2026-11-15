// Regla dura del rediseño «Lujo inmersivo»: CERO líneas laterales de color.
// El estado se comunica con icono + texto + un chip o halo de fondo sutil, nunca con una franja a un lado.
// Esta prueba recorre src/**/*.{ts,tsx,css} y falla si aparece alguno de los patrones prohibidos.
//
// PROHIBIDO
//   1. Borde de un solo lado en Tailwind: `border-l`, `border-l-2`, `border-l-viable`, `border-s-*`, `border-r-*`,
//      `border-e-*` (con o sin variantes: `md:border-l`, `hover:border-l-sol`).
//   2. Lo mismo en CSS o en estilos en línea: `border-left`, `border-right`, `border-inline-start`,
//      `border-inline-end` (y sus `-color`, `-width`, `-style`), `borderLeft`, `borderInlineStart`, etc.
//   3. Borde lateral simulado con sombra interior: `shadow-[inset_2px_0…]` o `box-shadow: inset 2px 0 …`.
//   4. Barra vertical de acento: un elemento `absolute` de `w-0.5`, `w-1` o `w-[2px]`…`w-[4px]` pegado a un lado
//      (`left-0`, `right-0`, `start-0`, `end-0`) o a toda la altura (`inset-y-0`).
//
// PERMITIDO (excepciones legítimas)
//   - Bordes completos (`border`, `border-texto/8`) y horizontales (`border-t`, `border-b`, `border-y`): separan, no acentúan.
//   - Marcas de 1 px colocadas por un DATO sobre un gráfico (`w-px` con `left: x%`): cursor del tiempo en BandaLuz,
//     raya de referencia en CifraRelato. No van pegadas a un lado ni comunican estado.
//   - `src/components/ui/Corchetes.tsx`: corchetes de visor en las cuatro esquinas (10 px, `border-t` + `border-l`…);
//     son esquinas neutras, no una franja lateral. Es el único archivo exento de la regla 1.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

// Vitest se ejecuta desde la raíz del paquete (en jsdom `import.meta.url` no es una ruta de archivo).
const SRC = resolve(process.cwd(), "src");
const ESTE_ARCHIVO = "lib/__tests__/sin-lineas-laterales.test.ts";
const EXENTOS_BORDE_TAILWIND = new Set(["components/ui/Corchetes.tsx"]);

/** Un límite de clase: principio de línea, espacio, comilla o el `:` de una variante de Tailwind. */
const INICIO = "(?:^|[\\s\"'`:])";
const FIN = "(?=$|[\\s\"'`])";

export const PATRONES: { nombre: string; regla: RegExp; exentos?: Set<string> }[] = [
  { nombre: "borde de un solo lado (Tailwind)", regla: new RegExp(`${INICIO}border-[lsre](?:-[^\\s"'\`]+)?${FIN}`), exentos: EXENTOS_BORDE_TAILWIND },
  { nombre: "borde de un solo lado (CSS)", regla: /border-(?:left|right|inline-start|inline-end)(?:-(?:color|width|style))?\s*:/ },
  { nombre: "borde de un solo lado (estilo en línea)", regla: /\bborder(?:Left|Right|InlineStart|InlineEnd)(?:Color|Width|Style)?\b/ },
  { nombre: "borde lateral simulado con sombra interior", regla: /shadow-\[inset_-?[1-9][0-9.]*(?:px)?_0[_\]]|box-shadow:[^;]*inset\s+-?[1-9][0-9.]*px\s+0(?:px)?\s/ },
];

const ANCHO_BARRA = new RegExp(`${INICIO}w-(?:0\\.5|1|\\[[2-4]px\\])${FIN}`);
const PEGADA = new RegExp(`${INICIO}(?:left-0|right-0|start-0|end-0|inset-y-0)${FIN}`);
const ABSOLUTA = new RegExp(`${INICIO}absolute${FIN}`);
/** Regla 4: las tres cosas en la misma línea (la misma lista de clases). */
export const esBarraLateral = (linea: string): boolean => ANCHO_BARRA.test(linea) && PEGADA.test(linea) && ABSOLUTA.test(linea);

export function infracciones(linea: string, archivo = ""): string[] {
  const halladas = PATRONES.filter((p) => !p.exentos?.has(archivo) && p.regla.test(linea)).map((p) => p.nombre);
  if (esBarraLateral(linea)) halladas.push("barra vertical de acento");
  return halladas;
}

function archivos(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = join(dir, e.name);
    if (e.isDirectory()) return archivos(ruta);
    return /\.(tsx?|css)$/.test(e.name) ? [ruta] : [];
  });
}

describe("regla dura: cero líneas laterales de color", () => {
  it("detecta cada patrón prohibido", () => {
    for (const mala of [
      'className="panel border-l-2 border-l-viable p-4"',
      'className="border-linea min-w-0 border-l pl-4"',
      'className="md:border-s-2"',
      "\"hover:border-r-sol\"",
      'className="border-e"',
      "  border-left: 2px solid var(--color-sol);",
      "  border-inline-start-color: red;",
      "style={{ borderLeft: \"2px solid\" }}",
      "style={{ borderInlineStartWidth: 2 }}",
      'className="shadow-[inset_2px_0_0_var(--color-sol)]"',
      "  box-shadow: inset 3px 0 0 var(--color-sol);",
      'className="bg-sol absolute inset-y-0 left-0 w-0.5"',
      'className="absolute top-2 bottom-2 left-0 w-1 rounded-full bg-viable"',
      'className="absolute right-0 h-full w-[3px] bg-critico"',
    ]) expect(infracciones(mala), mala).not.toHaveLength(0);
  });

  it("no confunde lo permitido", () => {
    for (const buena of [
      'className="border border-texto/8 rounded-panel"',
      'className="border-t border-reservas/40 pt-3"',
      'className="border-b border-y border-linea"',
      'className="border-linea border-reservas"',
      'className="bg-texto absolute inset-y-0 w-px"', // marca de 1 px colocada por un dato
      'className="absolute top-0 left-0 w-full"',
      'className="w-1/2 w-10 w-1.5"',
      "  box-shadow: inset 0 1px 0 rgb(237 235 228 / 0.07);",
      "  border: 1px solid rgb(237 235 228 / 0.08);",
    ]) expect(infracciones(buena), buena).toHaveLength(0);
  });

  it("no hay ninguna en src/", () => {
    const halladas: string[] = [];
    for (const ruta of archivos(SRC)) {
      const archivo = relative(SRC, ruta).split(sep).join("/");
      if (archivo === ESTE_ARCHIVO) continue;
      readFileSync(ruta, "utf8").split("\n").forEach((linea, i) => {
        for (const nombre of infracciones(linea, archivo)) halladas.push(`src/${archivo}:${i + 1} · ${nombre} · ${linea.trim().slice(0, 120)}`);
      });
    }
    expect(halladas, `Líneas laterales prohibidas (usa icono + texto + chip o halo):\n${halladas.join("\n")}`).toEqual([]);
  });
});
