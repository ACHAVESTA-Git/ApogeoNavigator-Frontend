// Comprueba el contraste WCAG de los tokens de color (bloque @theme de src/styles/index.css).
// Se ejecuta antes del build: si un par baja de su mínimo, el build falla.
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const css = readFileSync(new URL("../src/styles/index.css", import.meta.url), "utf8");
const tokens = Object.fromEntries([...css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map(([, nombre, hex]) => [nombre, hex]));

const lineal = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const luminancia = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => lineal(parseInt(hex.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contraste = (a, b) => {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

const FONDOS = ["vacio", "regolito", "superficie", "elevada"];
const TEXTO = 4.5; // texto normal (AA)
const GRAFICO = 3; // iconos, bordes con significado y trazos de gráficos
/** [primer plano, fondos, mínimo] */
const PARES = [
  ...["texto", "texto-2", "texto-3", "sol", "tierra", "viable", "reservas", "critico"].map((c) => [c, FONDOS, TEXTO]),
  ["foco", FONDOS, GRAFICO],
  ["horizonte", ["vacio", "regolito", "superficie"], GRAFICO],
  ["vacio", ["texto", "sol"], TEXTO], // botón primario y selección de texto
];

let fallos = 0;
let peor = { valor: Infinity, par: "" };
for (const [color, fondos, minimo] of PARES) {
  for (const fondo of fondos) {
    if (!tokens[color] || !tokens[fondo]) {
      console.error(`contraste: falta el token --color-${tokens[color] ? fondo : color}`);
      fallos++;
      continue;
    }
    const valor = contraste(tokens[color], tokens[fondo]);
    if (valor / minimo < peor.valor) peor = { valor: valor / minimo, par: `${color} sobre ${fondo}: ${valor.toFixed(2)}:1 (mínimo ${minimo})` };
    if (valor < minimo) {
      console.error(`contraste: ${color} sobre ${fondo} = ${valor.toFixed(2)}:1, por debajo de ${minimo}:1`);
      fallos++;
    }
  }
}

// ---- Texto de estado sobre HALO compuesto ----------------------------------------------------
// El halo es el token del nivel con su alfa REAL (se lee de las clases `bg-{nivel}/NN` de src/, mínimo 12 %)
// compuesto sobre cada fondo, incluido el `vidrio` (degradado de la utilidad `vidrio`) sobre vacío y elevada.
const raiz = fileURLToPath(new URL("../src/", import.meta.url));
const archivos = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = join(dir, e.name);
    if (e.isDirectory()) return e.name === "__tests__" || e.name === "node_modules" ? [] : archivos(ruta);
    return /\.(tsx|ts)$/.test(e.name) && !/\.test\./.test(e.name) ? [ruta] : [];
  });
const fuentes = archivos(raiz).map((ruta) => [ruta, readFileSync(ruta, "utf8")]);

const NIVELES = ["viable", "reservas", "critico", "sol", "tierra"];
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const aHex = (c) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
const mezcla = (frente, fondo, a) => frente.map((v, i) => v * a + fondo[i] * (1 - a));

const alfas = Object.fromEntries(NIVELES.map((n) => [n, new Set([12])]));
for (const [, src] of fuentes)
  for (const [, n, a] of src.matchAll(new RegExp(`\\bbg-(${NIVELES.join("|")})/(\\d{1,3})\\b`, "g"))) alfas[n].add(Number(a));

const vidrio = css.match(/@utility vidrio \{\s*background:\s*linear-gradient\(180deg,\s*rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\),\s*rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)\)/);
const fondosHalo = Object.fromEntries(["vacio", "regolito", "superficie", "elevada"].map((f) => [f, rgb(tokens[f])]));
if (vidrio) {
  const [sup, inf] = [vidrio.slice(1, 4).map(Number), vidrio.slice(5, 8).map(Number)];
  const [aSup, aInf] = [Number(vidrio[4]), Number(vidrio[8])];
  for (const f of ["vacio", "elevada"]) {
    fondosHalo[`vidrio/${f} (arriba)`] = mezcla(sup, rgb(tokens[f]), aSup);
    fondosHalo[`vidrio/${f} (abajo)`] = mezcla(inf, rgb(tokens[f]), aInf);
  }
} else {
  console.error("contraste: no se pudo leer el degradado de la utilidad `vidrio` en index.css");
  fallos++;
}

const nuevos = [];
const peorHalo = {};
for (const nivel of NIVELES)
  for (const alfa of [...alfas[nivel]].sort((x, y) => x - y)) {
    for (const [fondo, base] of Object.entries(fondosHalo)) {
      const halo = aHex(mezcla(rgb(tokens[nivel]), base, alfa / 100));
      for (const texto of [nivel, "texto", "texto-2"]) {
        const valor = contraste(tokens[texto], halo);
        const clave = `${texto} sobre halo ${nivel}`;
        nuevos.push(valor);
        if (!peorHalo[clave] || valor < peorHalo[clave].valor) peorHalo[clave] = { valor, fondo, alfa };
        if (valor < TEXTO) {
          console.error(`contraste: ${clave}/${alfa} sobre ${fondo} = ${valor.toFixed(2)}:1, por debajo de ${TEXTO}:1`);
          fallos++;
        }
      }
    }
  }

// Regla prohibida: `text-texto-3` (3,5-3,9:1) no pasa AA sobre un halo de estado en la misma cadena de clases.
const HALO = new RegExp(`(?:^|[\\s:])bg-(?:${NIVELES.join("|")})/(?:\\d{1,3}|\\[[^\\]]+\\])(?=$|[\\s"'\`])`);
const TEXTO3 = /(?:^|[\s:])text-texto-3(?=$|[\s"'`])/;
let prohibidos = 0;
for (const [ruta, src] of fuentes)
  for (const m of src.matchAll(/"([^"\n]*)"|'([^'\n]*)'|`([^`]*)`/g)) {
    const cadena = m[1] ?? m[2] ?? m[3];
    if (TEXTO3.test(cadena) && HALO.test(cadena)) {
      const linea = src.slice(0, m.index).split("\n").length;
      console.error(`contraste: ${relative(fileURLToPath(new URL("..", import.meta.url)), ruta)}:${linea} combina text-texto-3 con un halo de estado (no pasa AA): usa text-texto-2 o el color del nivel`);
      prohibidos++;
    }
  }
fallos += prohibidos;

if (fallos) {
  console.error(`contraste: ${fallos} par(es) no cumplen WCAG AA`);
  process.exit(1);
}
console.log(`contraste: ${PARES.reduce((n, [, f]) => n + f.length, 0)} pares cumplen WCAG AA. El más justo: ${peor.par}`);
console.log(`contraste: ${nuevos.length} pares de texto de estado sobre halo compuesto cumplen ${TEXTO}:1 (${Object.keys(fondosHalo).length} fondos; alfas leídos: ${NIVELES.map((n) => `${n} ${[...alfas[n]].join("/")}%`).join(", ")}). Peor caso por par:`);
for (const [clave, { valor, fondo, alfa }] of Object.entries(peorHalo)) console.log(`  ${clave.padEnd(26)} ${valor.toFixed(2)}:1  (${alfa}% sobre ${fondo})`);
console.log("contraste: regla vigilada: ningún text-texto-3 junto a bg-{viable|reservas|critico|sol|tierra}/<alfa> en src/**/*.tsx");
