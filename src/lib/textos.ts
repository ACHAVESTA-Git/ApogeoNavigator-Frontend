// Cadenas de la interfaz y plantillas generadas a partir de datos. Todo en español.
import { DATOS, SEMAFORO, ZONA_HORARIA_LOCAL } from "./constants";
import { esMesCompleto, fechaHora, fechaLarga, mesLargo, soloFecha } from "./fechas";
import { grados, horas, numero, pct } from "./formato";
import type { Astro, Categoria, EventosAstro, NivelSemaforo, Utc } from "./tipos";

export const NOMBRE_ASTRO: Record<Astro, string> = { sol: "Sol", tierra: "Tierra" };
export const ARTICULO_ASTRO: Record<Astro, string> = { sol: "el Sol", tierra: "la Tierra" };
export const DEL_ASTRO: Record<Astro, string> = { sol: "del Sol", tierra: "de la Tierra" };

export const NOMBRE_NIVEL: Record<NivelSemaforo, string> = { verde: "Viable", amarillo: "Con reservas", rojo: "Crítico" };
export const FORMA_NIVEL: Record<NivelSemaforo, string> = { verde: "círculo", amarillo: "triángulo", rojo: "cuadrado con aspa" };
export const NOMBRE_CATEGORIA: Record<Categoria, string> = {
  apolo: "Apolo", artemis: "Artemis", clps: "CLPS", internacional: "Internacional",
  historico: "Histórico", personalizado: "Personalizado",
};
export const FORMA_CATEGORIA: Record<Categoria, string> = {
  apolo: "círculo", artemis: "rombo", clps: "cuadrado", internacional: "triángulo",
  historico: "anillo", personalizado: "cruz",
};

type Umbrales = { readonly VERDE_MIN: number; readonly AMARILLO_MIN: number };
/** 'Crítico · < 40 %' */
export function umbralNivel(n: NivelSemaforo, u: Umbrales): string {
  if (n === "verde") return `≥ ${u.VERDE_MIN} %`;
  return n === "amarillo" ? `${u.AMARILLO_MIN}–${u.VERDE_MIN} %` : `< ${u.AMARILLO_MIN} %`;
}
const leyendaEje = (u: Umbrales): string =>
  `≥ ${u.VERDE_MIN} % viable · ${u.AMARILLO_MIN}–${u.VERDE_MIN} % con reservas · < ${u.AMARILLO_MIN} % crítico`;

export const T = {
  marca: "Apogeo",
  producto: "Navegador lunar",
  utc: "UTC",
  avisoHorizonte:
    "Elevación respecto a un horizonte ideal (Luna lisa, sin relieve). El relieve real puede tapar el Sol o la Tierra.",
  avisoHorizonteCorto: "Horizonte ideal: sin relieve.",
  saltar: "Saltar al contenido",
  cargando: "Cargando…",
  reintentar: "Reintentar",
  cerrar: "Cerrar",
  fuente: "Fuente",
  seAbreEnOtraPestana: "(se abre en otra pestaña)",
  sobreHorizonte: "Sobre el horizonte",
  bajoHorizonte: "Bajo el horizonte",
  sinCambio: "No cambia en el periodo con datos",
  nav: { inicio: "Inicio", sitios: "Sitios", comparar: "Comparar", acceso: "Acceso", subir: "Subir datos", subirCorto: "Subir", principal: "Navegación principal" },
  semaforo: {
    energia: "Energía",
    comunicacion: "Comunicación",
    global: "Global",
    leyenda: `Umbrales provisionales. Energía: ${leyendaEje(SEMAFORO.ENERGIA)}. Comunicación: ${leyendaEje(SEMAFORO.COMUNICACION)}.`,
    peor: "el peor de energía y comunicación",
    sensible: "sensible al relieve",
  },
  errores: {
    generico: "Algo no salió como esperábamos.",
    sinServicio: "Los datos no están disponibles ahora.",
    sitioDesconocido: "No conocemos este sitio.",
    sinEfemerides: "Este sitio no tiene efemérides cargadas.",
    sinDatosRango: "No hay datos en el rango pedido.",
    fueraDeDatos: (param: string) => `'${param}' está fuera del rango de datos disponible`,
    rangoOrden: "'hasta' debe ser posterior a 'desde'",
    rangoMaximo: `El rango máximo es de ${DATOS.RANGO_MAX_DIAS} días.`,
  },
} as const;

const redondo = (v: number): string => numero(v, 0);

/** 'en 291 h' */
export const enHoras = (h: number): string => `en ${horas(Math.round(h))}`;

/** Línea del panel de lectura: qué hará el astro y cuándo. */
export function proximoCambio(e: EventosAstro): string {
  if (e.horas_restantes === null) {
    return e.visible ? "no se pone en el periodo con datos" : "no sale en el periodo con datos";
  }
  const cuando = e.visible ? e.proxima_puesta_utc : e.proxima_salida_utc;
  const verbo = e.visible ? "se pone" : "sale";
  return `${verbo} ${enHoras(e.horas_restantes)} · ${cuando ? fechaHora(cuando) : ""} ${T.utc}`.trim();
}
/** Texto vivo de la línea de tiempo: 'Faltan 9 h para la puesta del Sol'. */
export function faltanPara(astro: Astro, e: EventosAstro): string {
  if (e.horas_restantes === null) return `${NOMBRE_ASTRO[astro]}: ${T.sinCambio.toLowerCase()}`;
  const evento = e.visible ? "la puesta" : "la salida";
  if (e.horas_restantes <= 0) return `${e.visible ? "Se pone" : "Sale"} ${ARTICULO_ASTRO[astro]} ahora`;
  return `Faltan ${horas(Math.round(e.horas_restantes))} para ${evento} ${DEL_ASTRO[astro]}`;
}

const posicion = (el: number): string =>
  el > 0 ? `${grados(el, 1)} sobre el horizonte` : `${grados(Math.abs(el), 1)} bajo el horizonte`;

interface FilaCielo { sol_az_deg: number; sol_el_deg: number; tierra_az_deg: number; tierra_el_deg: number }
/** Descripción accesible del cielo en un instante (aria-describedby del panorama). */
export function describirCielo(utc: Utc, fila: FilaCielo): string {
  return (
    `El ${fechaLarga(utc)}, el Sol está a ${redondo(fila.sol_az_deg)}° de azimut y ${posicion(fila.sol_el_deg)}; ` +
    `la Tierra, a ${redondo(fila.tierra_az_deg)}° y ${posicion(fila.tierra_el_deg)}. ${T.avisoHorizonteCorto}`
  );
}
/** aria-valuetext de la regla de tiempo. */
export function describirInstante(utc: Utc, fila: FilaCielo): string {
  return `${fechaLarga(utc)}. Sol ${posicion(fila.sol_el_deg)}; Tierra ${posicion(fila.tierra_el_deg)}`;
}

export const horaLocal = (hora: string): string => `${hora} ${ZONA_HORARIA_LOCAL.NOMBRE}, ${ZONA_HORARIA_LOCAL.DESFASE}`;

export const SIN_LINEA_DIRECTA = "Sin línea directa con la Tierra: requiere satélite de retransmisión.";

export interface FilaVeredicto { nombre: string; horas_sol: number; pct_sol: number; horas_tierra_visible: number; pct_tierra: number }
const listar = (nombres: string[]): string =>
  nombres.length <= 1 ? (nombres[0] ?? "") : `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;

/** Frase de comparación generada solo con las métricas: ordena, no opina. */
export function veredicto(filas: FilaVeredicto[], periodo: string): string {
  if (filas.length < 2) return "";
  const porSol = [...filas].sort((a, b) => b.horas_sol - a.horas_sol);
  const [mejor, ...resto] = porSol;
  const ultimo = resto[resto.length - 1];
  const dif = mejor.horas_sol - ultimo.horas_sol;
  const sol =
    dif === 0
      ? `${listar(filas.map((f) => f.nombre))} tienen las mismas horas de sol (${horas(mejor.horas_sol)}) en ${periodo}`
      : `${mejor.nombre} tiene ${horas(dif)} más de sol que ${ultimo.nombre} en ${periodo}`;

  const completos = filas.filter((f) => f.pct_tierra >= 100);
  const sinTierra = filas.filter((f) => f.horas_tierra_visible === 0);
  const parciales = filas.filter((f) => f.pct_tierra < 100 && f.horas_tierra_visible > 0);
  const partes: string[] = [];
  if (completos.length) partes.push(`${listar(completos.map((f) => f.nombre))} ${completos.length > 1 ? "ven" : "ve"} la Tierra todo el periodo`);
  parciales.forEach((f) => partes.push(`${f.nombre} la ve ${horas(f.horas_tierra_visible)} (${pct(f.pct_tierra)})`));
  if (sinTierra.length) partes.push(`${listar(sinTierra.map((f) => f.nombre))} no ${sinTierra.length > 1 ? "la ven" : "la ve"} nunca`);
  return `${sol}. ${partes.join("; ")}.`.replace(/\. ([a-zñáéíóú])/u, (_, c: string) => `. ${c.toUpperCase()}`);
}

/** 'diciembre de 2026' si el rango es un mes natural completo; si no, '2026-12-01 → 2026-12-08'. */
export function periodoLegible(desde: Utc, hasta: Utc): string {
  return esMesCompleto(desde, hasta) ? mesLargo(desde) : `${soloFecha(desde)} → ${soloFecha(hasta)}`;
}
