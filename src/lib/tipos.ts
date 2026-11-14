// Tipos del contrato real de la API (ApogeoNavigator-Backend/app/schemas/).
import type { CATEGORIAS, TIPOS_ARCHIVO } from "./constants";

export type Utc = string; // 'YYYY-MM-DDTHH:MMZ'
export type Categoria = (typeof CATEGORIAS)[number];
export type TipoArchivo = (typeof TIPOS_ARCHIVO)[number];
export type NivelSemaforo = "verde" | "amarillo" | "rojo";
export type Astro = "sol" | "tierra";

export interface Site {
  // GET /api/sites → Site[]
  site_id: string;
  nombre: string;
  categoria: Categoria;
  mision: string;
  agencia: string;
  lat_deg: number;
  lon_este_deg: number;
  alt_km: number;
  fuente_url: string;
  notas: string | null;
}
export interface FilaEfemeride {
  utc: Utc;
  sol_az_deg: number;
  sol_el_deg: number;
  tierra_az_deg: number;
  tierra_el_deg: number;
}
export interface Efemerides {
  // GET /api/efemerides/{id}?desde&hasta (extremos INCLUIDOS)
  site_id: string;
  inicio_utc: Utc;
  fin_utc: Utc;
  paso_horas: number;
  filas: FilaEfemeride[];
}
export interface Semaforo {
  energia: NivelSemaforo;
  comunicacion: NivelSemaforo;
  global: NivelSemaforo;
}
export interface ValoresMetricas {
  horas_sol: number;
  pct_sol: number;
  sol_el_max_deg: number;
  sol_el_media_deg: number | null;
  horas_tierra_visible: number;
  pct_tierra: number;
}
export interface ReferenciaMetricas extends ValoresMetricas {
  coincide: boolean;
}
/** Aviso que acompaña al semáforo (hoy solo `sensible_al_relieve`). El mensaje lo redacta la API. */
export interface Aviso {
  codigo: string;
  mensaje: string;
}
export interface Metrica extends ValoresMetricas {
  // intervalo [desde, hasta)
  site_id: string;
  inicio_utc: Utc;
  fin_utc: Utc;
  semaforo: Semaforo;
  avisos: Aviso[];
  origen: "calculado" | "ejemplo";
  referencia: ReferenciaMetricas | null;
}
export interface RespuestaMetricas {
  resultados: Metrica[];
}
export interface EventosAstro {
  visible: boolean;
  proxima_puesta_utc: Utc | null;
  proxima_salida_utc: Utc | null;
  horas_restantes: number | null;
}
export interface Puestas {
  // GET /api/puestas/{id}?desde
  site_id: string;
  desde_utc: Utc;
  sol: EventosAstro;
  tierra: EventosAstro;
}
export interface IncidenciaCsv {
  fila: number;
  columna: string | null;
  codigo: string;
  mensaje: string;
  valor: string | null;
}
export interface InformeCsv {
  archivo: string;
  tipo: TipoArchivo;
  valido: boolean;
  total_filas: number;
  total_errores: number;
  errores: IncidenciaCsv[];
  advertencias: IncidenciaCsv[];
}
export interface ResultadoGuardado extends InformeCsv {
  guardado: boolean;
  copia_historial: string | null;
}
export interface Rango {
  desde?: Utc;
  hasta?: Utc;
}
/** Fila de metricas.csv tal como la guarda la muestra (referencia de la «prueba de oro»). */
export interface FilaReferencia extends ValoresMetricas {
  site_id: string;
  inicio_utc: Utc;
  fin_utc: Utc;
}
