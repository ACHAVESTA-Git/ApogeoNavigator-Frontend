// Genera los datos de ejemplo del frontend a partir de los CSV REALES del backend.
// Uso: npm run datos:muestra   (DATA_DIR=<ruta> para otra carpeta de datos)
// Salida: public/muestra/*.json (respaldo cuando la API no responde) y src/assets/hero-shackleton.json.
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.resolve(RAIZ, process.env.DATA_DIR ?? "../ApogeoNavigator-Backend/data");
const SALIDA = path.join(RAIZ, "public", "muestra");
const HERO = path.join(RAIZ, "src", "assets", "hero-shackleton.json");
const SITIO_HERO = "shackleton";
const PASO_HERO_HORAS = 3;
const HERO_HASTA = "2027-01-01T00:00Z"; // el hero cuenta diciembre de 2026 (DATOS.HASTA_POR_DEFECTO)
const COLUMNAS = ["sol_az_deg", "sol_el_deg", "tierra_az_deg", "tierra_el_deg"];
const MS_HORA = 3_600_000;
const PATRON_EFEMERIDES = /^efemerides_([a-z0-9][a-z0-9_-]{2,39})\.csv$/;
const NUMERICAS_SITES = ["lat_deg", "lon_este_deg", "alt_km"];
const ALT_KM_DEFECTO = 0; // = ALT_KM_DEFAULT del backend

/** Parser CSV mínimo con soporte de comillas dobles y BOM. */
function parsearCsv(texto) {
  const filas = [];
  let campo = "";
  let fila = [];
  let entreComillas = false;
  const limpio = texto.replace(/^﻿/, "");
  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i];
    if (entreComillas) {
      if (c === '"' && limpio[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') entreComillas = false;
      else campo += c;
    } else if (c === '"') entreComillas = true;
    else if (c === ",") { fila.push(campo); campo = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && limpio[i + 1] === "\n") i++;
      fila.push(campo); campo = "";
      if (fila.some((v) => v !== "")) filas.push(fila);
      fila = [];
    } else campo += c;
  }
  if (campo !== "" || fila.length) { fila.push(campo); filas.push(fila); }
  const [cabecera, ...datos] = filas;
  return datos.map((valores) => Object.fromEntries(cabecera.map((col, i) => [col, (valores[i] ?? "").trim()])));
}

const leerCsv = async (nombre) => parsearCsv(await readFile(path.join(DATA_DIR, nombre), "utf8"));
const escribir = async (ruta, datos) => {
  await mkdir(path.dirname(ruta), { recursive: true });
  await writeFile(ruta, `${JSON.stringify(datos)}\n`);
};
const aMs = (utc) => Date.parse(utc.replace("Z", ":00Z"));
const numero = (valor) => (valor === "" ? null : Number(valor));

const sitios = (await leerCsv("sites.csv")).map((s) => ({
  ...s,
  ...Object.fromEntries(NUMERICAS_SITES.map((k) => [k, numero(s[k])])),
  alt_km: numero(s.alt_km) ?? ALT_KM_DEFECTO,
  notas: s.notas === "" ? null : s.notas,
}));
await escribir(path.join(SALIDA, "sites.json"), sitios);

const referencia = (await leerCsv("metricas.csv")).map(({ site_id, inicio_utc, fin_utc, ...resto }) => ({
  site_id, inicio_utc, fin_utc, ...Object.fromEntries(Object.entries(resto).map(([k, v]) => [k, numero(v)])),
}));
await escribir(path.join(SALIDA, "metricas-referencia.json"), referencia);

const conteo = {};
for (const archivo of (await readdir(DATA_DIR)).sort()) {
  const id = PATRON_EFEMERIDES.exec(archivo)?.[1];
  if (!id) continue;
  const filas = (await leerCsv(archivo)).map(({ utc, ...resto }) => ({
    utc, ...Object.fromEntries(Object.entries(resto).map(([k, v]) => [k, Number(v)])),
  }));
  const cabecera = {
    site_id: id,
    inicio_utc: filas[0].utc,
    fin_utc: filas.at(-1).utc,
    paso_horas: (aMs(filas[1].utc) - aMs(filas[0].utc)) / MS_HORA,
  };
  // Formato columnar (el paso es constante): un tercio del peso; muestra.ts reconstruye las filas.
  const columnas = Object.fromEntries(COLUMNAS.map((c) => [c, filas.map((f) => f[c])]));
  await escribir(path.join(SALIDA, "efemerides", `${id}.json`), { ...cabecera, columnas });
  conteo[id] = filas.length;
  if (id === SITIO_HERO) {
    // Contenido de la landing (no es respaldo): una fila cada 3 h del mes del relato.
    const horarias = filas.filter((f) => aMs(f.utc) < aMs(HERO_HASTA));
    const mes = horarias.filter((_, i) => i % PASO_HERO_HORAS === 0);
    // Cifras exactas del relato, calculadas con TODAS las filas horarias del mes (no con la muestra de 3 h).
    const cruces = horarias.flatMap((f, i) => (i && (horarias[i - 1].tierra_el_deg > 0) !== (f.tierra_el_deg > 0) ? [{ utc: f.utc, sale: f.tierra_el_deg > 0 }] : []));
    const resumen = {
      sitios: sitios.length,
      horas_total: horarias.length,
      horas_sol: horarias.filter((f) => f.sol_el_deg > 0).length,
      horas_tierra: horarias.filter((f) => f.tierra_el_deg > 0).length,
      sol_el_min_deg: Math.min(...horarias.map((f) => f.sol_el_deg)),
      sol_el_max_deg: Math.max(...horarias.map((f) => f.sol_el_deg)),
      tierra_salida_utc: cruces.find((c) => c.sale)?.utc ?? null,
      tierra_puesta_utc: cruces.find((c) => !c.sale)?.utc ?? null,
      // primera puesta del Sol en todos los datos del sitio (fuera del mes del relato)
      sol_puesta_utc: filas.find((f, i) => i && filas[i - 1].sol_el_deg > 0 && f.sol_el_deg <= 0)?.utc ?? null,
    };
    await escribir(HERO, { ...cabecera, fin_utc: mes.at(-1).utc, paso_horas: PASO_HERO_HORAS, resumen, filas: mes });
  }
}

await escribir(path.join(SALIDA, "manifiesto.json"), {
  generado_utc: new Date().toISOString(),
  origen: "ApogeoNavigator-Backend/data (CSV reales de JPL Horizons, diciembre de 2026)",
  sitios: sitios.length,
  filas_efemerides: conteo,
});
console.log(`Muestra generada: ${sitios.length} sitios, ${Object.keys(conteo).length} efemérides → ${path.relative(RAIZ, SALIDA)}`);
