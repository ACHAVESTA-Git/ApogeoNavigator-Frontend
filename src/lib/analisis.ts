// «Cómo analizamos los datos»: tipos de GET /api/analisis/{site_id} y las reglas de presentación que evitan
// afirmar más de lo que los datos demuestran. Los textos viven en textos.ts (T.analisis); aquí solo se decide
// CUÁL toca. Contrato: docs/api/analisis-transparencia.md del backend.
import { ANALISIS_GRAFICO } from "./constants";
import { ANALISIS_API, T, type TextosApiAnalisis } from "./textos";
import type { Utc } from "./tipos";

export const VARIABLES_ANALISIS = ["sol_el_deg", "sol_az_deg", "tierra_el_deg", "tierra_az_deg"] as const;
export type VariableAnalisis = (typeof VARIABLES_ANALISIS)[number];
export type EstadoPaso = "ok" | "advertencia" | "no_disponible";
export type TipoOrigen = "semilla_nasa" | "subido" | "modificado" | "sin_registro";
type PorVariable<V> = Partial<Record<VariableAnalisis, V>>;

/** Medida de un paso. ÚNICO sitio con tipo laxo: el backend decide qué medidas da cada paso. */
export interface MedidaPaso { nombre: string; valor: number | string | boolean | null; unidad: string }
export interface PasoAnalisis { id: string; nombre: string; descripcion: string; estado: EstadoPaso; resultado: MedidaPaso[] }
export interface UltimaCarga { cargado_utc: Utc; archivo: string; sha3_256: string; coincide: boolean; cargado_por: string }
export interface OrigenDatos {
  tipo: TipoOrigen;
  descripcion: string;
  sha3_256: string;
  coincide_con_semilla: boolean | null;
  ultima_carga: UltimaCarga | null;
  /** `firmado`: true solo con firma VÁLIDA; false si es inválida o falta; null si no se puede verificar. */
  manifiesto: { sha3_256: string; generado_utc: Utc; firmado: boolean | null; firma_nota?: string | null; coincide: boolean } | null;
}
export interface PicoEspectro { periodo_dias: number; amplitud_rel: number; candidatos: string[]; es_sinodico: boolean }
export interface Residuos { rmse_deg: number; mae_deg: number; sesgo_deg: number; max_abs_deg: number; p95_abs_deg: number }
export interface PuntoSerie { utc: Utc; observado: number | null; ajustado: number | null; proyectado: number | null }
export interface Limitacion { codigo: string; mensaje: string; aplica: boolean }
export interface ValidacionAnalisis {
  disponible: boolean;
  vigente: boolean;
  motivo: string | null;
  validacion_desde_utc?: Utc | null;
  validacion_hasta_utc?: Utc | null;
  rmse_deg?: PorVariable<number | null>;
  mae_deg?: PorVariable<number | null>;
  rmse_referencia_ingenua_deg?: PorVariable<number | null>;
  mejora_frente_a_ingenua?: PorVariable<number | null>;
  rmse_por_mes_deg?: PorVariable<(number | null)[]>;
  semaforo_aciertos?: { meses: number; aciertos_energia: number; aciertos_comunicacion: number; aciertos_global: number } | null;
  puestas_sol?: { eventos_reales: number | null; emparejados_pct: number | null; mae_h: number | null } | null;
}
export interface Analisis {
  site_id: string;
  desde_utc: Utc;
  hasta_utc: Utc;
  pasos: PasoAnalisis[];
  entrada: {
    archivo: string; filas: number; bytes: number; inicio_utc: Utc; fin_utc: Utc; paso_horas: number;
    calidad: { filas_validas: number; filas_con_error: number; huecos: number; paso_constante: boolean };
    origen: OrigenDatos;
  };
  espectro: {
    ventana_dias: number; resolucion_dias: number; sinodico_teorico_dias: number; sinodico_afinado_dias: number;
    series: { variable: string; nombre: string; picos: PicoEspectro[] }[];
    nota: string;
  };
  modelo: {
    terminos_por_cuerpo: Record<string, number>;
    periodos: { cuerpo: string; periodo_dias: number; rol: string }[];
    ajuste_directo_elevacion_sol: boolean;
    r2: PorVariable<number>;
    residuos: PorVariable<Residuos>;
    /** Aclaración del backend: R² y residuos son del ajuste dentro de los datos. */
    nota_ajuste?: string | null;
  };
  validacion: ValidacionAnalisis;
  limitaciones: Limitacion[];
  serie: { variable: VariableAnalisis; nombre: string; paso_horas: number; fin_datos_utc: Utc; puntos: PuntoSerie[] };
}

// ---------------------------------------------------------------- reglas de presentación (fijadas con pruebas)
export const CODIGO_VALIDACION_AJENA = "validacion_de_otros_datos";

/** Regla 5 · Quién cargó: solo una de las tres categorías del contrato; cualquier otra cosa (una identidad) no se muestra. */
export const quienCargo = (cargadoPor: string | null | undefined): string =>
  (cargadoPor && Object.prototype.hasOwnProperty.call(T.analisis.origen.quienes, cargadoPor) ? T.analisis.origen.quienes[cargadoPor] : undefined) ?? T.analisis.origen.quienNoConsta;

/** Regla 2 · Texto del origen: solo `semilla_nasa` menciona a NASA; subido y modificado dicen que NO son la semilla. */
export function textoOrigen(origen: OrigenDatos, fecha: (utc: Utc) => string): { titulo: string; texto: string; esNasa: boolean } {
  const t = T.analisis.origen;
  const carga = origen.ultima_carga;
  switch (origen.tipo) {
    case "semilla_nasa":
      return { titulo: t.semilla.titulo, texto: t.semilla.texto, esNasa: true };
    case "subido":
      return { titulo: t.subido.titulo, texto: carga ? t.subido.texto(fecha(carga.cargado_utc), quienCargo(carga.cargado_por)) : t.subido.sinFecha, esNasa: false };
    case "modificado":
      return { titulo: t.modificado.titulo, texto: t.modificado.texto, esNasa: false };
    default:
      return { titulo: t.sinRegistro.titulo, texto: t.sinRegistro.texto, esNasa: false };
  }
}

/** Estado de la firma del manifiesto: «firmado» solo si la firma es válida (true); null no es ni sí ni no. */
export const textoFirma = (firmado: boolean | null | undefined): string =>
  firmado === true ? T.analisis.origen.firma.valida : firmado === false ? T.analisis.origen.firma.sinFirma : T.analisis.origen.firma.noVerificable;

/** Regla 1 · La validación solo se presenta como propia si se hizo con ESTOS datos; si no, es «de referencia». */
export function estadoValidacion(v: ValidacionAnalisis): "propia" | "referencia" | "ausente" {
  if (!v.disponible) return "ausente";
  return v.vigente ? "propia" : "referencia";
}
/** Limitaciones que aplican a este sitio; la de «validación de otros datos» entra siempre que la validación no sea vigente. */
export function limitacionesQueAplican(a: Pick<Analisis, "limitaciones" | "validacion">): Limitacion[] {
  const aplican = a.limitaciones.filter((l) => l.aplica);
  if (estadoValidacion(a.validacion) !== "referencia" || aplican.some((l) => l.codigo === CODIGO_VALIDACION_AJENA)) return aplican;
  const ajena = a.limitaciones.find((l) => l.codigo === CODIGO_VALIDACION_AJENA);
  return [...aplican, ajena ?? { codigo: CODIGO_VALIDACION_AJENA, mensaje: T.analisis.validacion.referenciaNota, aplica: true }];
}

// ---------------------------------------------------------------- textos que escribe la API, en el idioma de la interfaz
/** Los siete pasos del contrato, por su `id`. Un paso con otro `id` se muestra con el nombre y la descripción de la API. */
export const PASOS_CONOCIDOS = ["carga", "validacion_csv", "features", "fft", "ajuste", "validacion_horizons", "proyeccion"] as const;
const propio = <V,>(tabla: Record<string, V>, clave: string): V | undefined =>
  Object.prototype.hasOwnProperty.call(tabla, clave) ? tabla[clave] : undefined;

/**
 * Nombre y descripción de un paso. Se traducen por `id`; si el `id` no se conoce, valen los de la API. Donde la
 * descripción depende de la validación se elige con la regla 1, igual que hace la API: nunca se presenta como
 * propia una validación hecha con otros datos.
 */
export function textoPaso(paso: Pick<PasoAnalisis, "id" | "nombre" | "descripcion">, v: ValidacionAnalisis, tabla: TextosApiAnalisis = ANALISIS_API): { nombre: string; descripcion: string } {
  const traducido = propio(tabla.pasos, paso.id);
  if (!traducido) return { nombre: paso.nombre, descripcion: paso.descripcion };
  const d = traducido.descripcion;
  return { nombre: traducido.nombre, descripcion: typeof d === "string" ? d : d[estadoValidacion(v)] };
}
/** Rótulo de una medida: se traduce por el nombre que le da la API; uno desconocido se muestra tal cual. */
export const nombreMedida = (nombre: string, tabla: TextosApiAnalisis = ANALISIS_API): string => propio(tabla.medidas, nombre) ?? nombre;
/** Unidad de una medida: solo se traducen las que son palabras (filas, días…); «°», «h» o «%» no cambian. */
export const unidadMedida = (unidad: string, tabla: TextosApiAnalisis = ANALISIS_API): string => propio(tabla.unidades, unidad) ?? unidad;
/** Un valor de texto «N de M» conserva sus dos cifras y solo cambia la palabra de enlace; cualquier otro texto no se toca. */
export function valorTextoMedida(valor: string, deTotal: (parte: number, total: number) => string = T.analisis.validacion.deMeses): string {
  const m = /^(\d+) de (\d+)$/.exec(valor);
  return m ? deTotal(Number(m[1]), Number(m[2])) : valor;
}

/**
 * Regla 4 · La serie en tres trazos disjuntos en el tiempo: `observado` y `ajustado` solo hasta el fin de los
 * datos; `proyectado`, solo después. Un valor fuera de su tramo se descarta aunque la respuesta lo traiga.
 */
export function tramosSerie(puntos: readonly PuntoSerie[], finDatosUtc: Utc) {
  const fin = Date.parse(finDatosUtc.replace("Z", ":00Z"));
  const t = (p: PuntoSerie) => Date.parse(p.utc.replace("Z", ":00Z"));
  const de = (campo: "observado" | "ajustado" | "proyectado", dentro: boolean) =>
    puntos.flatMap((p) => (p[campo] !== null && (t(p) <= fin) === dentro ? [{ t: t(p), v: p[campo] as number }] : []));
  return { observado: de("observado", true), ajustado: de("ajustado", true), proyectado: de("proyectado", false), finMs: fin };
}

/** Regla 3 · Banda alrededor de la proyección: ± RMSE de validación de esa variable (optimista; no es un intervalo). */
export const rmseDeValidacion = (v: ValidacionAnalisis, variable: VariableAnalisis): number | null =>
  v.disponible ? (v.rmse_deg?.[variable] ?? null) : null;

export const esVariableAnalisis = (v: string | null): v is VariableAnalisis => (VARIABLES_ANALISIS as readonly string[]).includes(v ?? "");

type Margen = { sup: number; der: number; inf: number; izq: number };
/** Lienzo de un gráfico del análisis a partir del ancho medido de su contenedor (0 = aún sin medir). */
export function lienzoGrafico(anchoPx: number, cfg: { ANCHO: number; RAZON: number; ALTO_MIN: number; ALTO_MAX: number; MARGEN: Margen; MARGEN_COMPACTO: Margen }) {
  const ANCHO = anchoPx > 0 ? Math.max(ANALISIS_GRAFICO.ANCHO_MIN, Math.round(anchoPx)) : cfg.ANCHO;
  const compacto = ANCHO < ANALISIS_GRAFICO.ANCHO_COMPACTO;
  return {
    ANCHO,
    ALTO: Math.round(Math.min(cfg.ALTO_MAX, Math.max(cfg.ALTO_MIN, ANCHO * cfg.RAZON))),
    MARGEN: compacto ? cfg.MARGEN_COMPACTO : cfg.MARGEN,
    marcasX: compacto ? ANALISIS_GRAFICO.MARCAS_X.compacto : ANALISIS_GRAFICO.MARCAS_X.amplio,
  };
}
