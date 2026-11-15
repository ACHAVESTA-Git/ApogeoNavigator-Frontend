import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Fija la escala tipográfica de `index.css`: tamaños máximos de los titulares, suelo de 12 px, crecimiento
 * fluido (sin saltos) entre 360 y 1440 px, jerarquía, interletraje por tamaño y medida de línea.
 */
const css = readFileSync(resolve(__dirname, "index.css"), "utf8");
const PX_POR_REM = 16;
const ANCHO_MIN = 360;
const ANCHO_MAX = 1440;
const SUELO_PX = 12;
const CARACTERES_POR_CH = 1.43; // medido en Archivo: ancho del «0» frente al carácter medio de texto corrido

const token = (nombre: string): string => {
  const m = css.match(new RegExp(`--${nombre}:\\s*([^;]+);`));
  if (!m) throw new Error(`Falta el token --${nombre}`);
  return m[1].trim();
};

/** Tamaño en px de un token `--text-*` para un ancho de ventana (admite `Nrem` y `clamp(a, b + cvw, d)`). */
function tamano(nombre: string, ancho: number): number {
  const valor = token(`text-${nombre}`);
  const fijo = valor.match(/^([\d.]+)rem$/);
  if (fijo) return Number(fijo[1]) * PX_POR_REM;
  const c = valor.match(/^clamp\(([\d.]+)rem,\s*([\d.]+)rem \+ ([\d.]+)vw,\s*([\d.]+)rem\)$/);
  if (!c) throw new Error(`Formato no reconocido en --text-${nombre}: ${valor}`);
  const [min, base, vw, max] = c.slice(1).map(Number);
  return Math.min(max * PX_POR_REM, Math.max(min * PX_POR_REM, base * PX_POR_REM + (vw * ancho) / 100));
}
const interletraje = (nombre: string): number => Number(token(`text-${nombre}--letter-spacing`).replace("em", ""));

const TAMANOS = ["display", "titulo", "seccion", "subtitulo", "entrada", "cuerpo", "apoyo", "rotulo", "dato-xl", "dato-lg", "dato", "dato-sm"];
const FLUIDOS = ["display", "titulo", "seccion", "dato-xl", "dato-lg"];

describe("escala tipográfica", () => {
  it("contiene los titulares: portada ≤ 54 px, título ≤ 30 px, sección ≤ 22 px y cifra grande ≤ 52 px", () => {
    expect(tamano("display", 2560)).toBeLessThanOrEqual(54);
    expect(tamano("titulo", 2560)).toBeLessThanOrEqual(30);
    expect(tamano("seccion", 2560)).toBeLessThanOrEqual(22);
    expect(tamano("dato-xl", 2560)).toBeLessThanOrEqual(52);
    expect(Math.round(tamano("display", ANCHO_MIN))).toBeLessThanOrEqual(32);
  });

  it("ningún tamaño baja de 12 px", () => {
    for (const t of TAMANOS) expect(tamano(t, 320), t).toBeGreaterThanOrEqual(SUELO_PX);
  });

  it("los tamaños fluidos crecen en línea recta de 360 a 1440 px, sin saltos", () => {
    for (const t of FLUIDOS) {
      const valor = token(`text-${t}`);
      const [min, , , max] = valor.match(/[\d.]+(?=rem|vw)/g)!.map(Number);
      expect(tamano(t, ANCHO_MIN), `${t} a 360`).toBeCloseTo(min * PX_POR_REM, 0);
      expect(tamano(t, ANCHO_MAX), `${t} a 1440`).toBeCloseTo(max * PX_POR_REM, 0);
      // Continuidad: entre dos anchos vecinos el tamaño nunca cambia más de 0,05 px.
      for (let w = 320; w < 1600; w++) expect(Math.abs(tamano(t, w + 1) - tamano(t, w))).toBeLessThan(0.05);
    }
  });

  it("mantiene la jerarquía en móvil y en escritorio", () => {
    const orden = ["display", "titulo", "seccion", "subtitulo", "entrada", "cuerpo", "apoyo", "rotulo"];
    for (const ancho of [ANCHO_MIN, ANCHO_MAX]) {
      for (let i = 1; i < orden.length; i++) {
        expect(tamano(orden[i - 1], ancho), `${orden[i - 1]} > ${orden[i]} a ${ancho}`).toBeGreaterThan(tamano(orden[i], ancho));
      }
    }
  });

  it("cierra el interletraje al crecer el texto y lo abre en los rótulos", () => {
    expect(interletraje("display")).toBeLessThan(interletraje("titulo"));
    expect(interletraje("titulo")).toBeLessThan(interletraje("seccion"));
    expect(interletraje("seccion")).toBeLessThan(interletraje("subtitulo"));
    expect(interletraje("subtitulo")).toBeLessThan(0);
    expect(interletraje("rotulo")).toBeGreaterThan(0);
  });

  it("la medida de línea queda entre 60 y 70 caracteres", () => {
    const medida = Number(token("container-medida").replace("ch", "")) * CARACTERES_POR_CH;
    expect(medida).toBeGreaterThanOrEqual(60);
    expect(medida).toBeLessThanOrEqual(70);
  });
});

describe("tamaños escritos a mano en los componentes", () => {
  const fuentes = import.meta.glob("../**/*.tsx", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

  it("no hay texto de menos de 12 px ni medidas de línea de más de 46ch", () => {
    const fallos: string[] = [];
    for (const [ruta, codigo] of Object.entries(fuentes)) {
      for (const m of codigo.matchAll(/text-\[([\d.]+)(px|rem)\]/g)) {
        const px = Number(m[1]) * (m[2] === "rem" ? PX_POR_REM : 1);
        if (px < SUELO_PX) fallos.push(`${ruta}: ${m[0]}`);
      }
      for (const m of codigo.matchAll(/max-w-\[(\d+)ch\]/g)) {
        if (Number(m[1]) > 46) fallos.push(`${ruta}: ${m[0]} (usar max-w-medida)`);
      }
    }
    expect(fallos).toEqual([]);
  });
});
