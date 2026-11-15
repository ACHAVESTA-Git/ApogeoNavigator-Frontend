// Comprueba el contraste WCAG de los tokens de color (bloque @theme de src/styles/index.css).
// Se ejecuta antes del build: si un par baja de su mínimo, el build falla.
import { readFileSync } from "node:fs";

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
if (fallos) {
  console.error(`contraste: ${fallos} par(es) no cumplen WCAG AA`);
  process.exit(1);
}
console.log(`contraste: ${PARES.reduce((n, [, f]) => n + f.length, 0)} pares cumplen WCAG AA. El más justo: ${peor.par}`);
