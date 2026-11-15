// Puerta única a los textos de la interfaz. Elige el módulo del idioma activo (`idioma.ts`) al cargar la página;
// el resto de la app importa de aquí y no sabe en qué idioma está. Español: `textos.es.ts`. Inglés: `textos.en.ts`.
import { IDIOMA } from "./idioma";
import * as en from "./textos.en";
import * as es from "./textos.es";

export type { FilaVeredicto, PartesVeredicto, Textos, TextosApiAnalisis } from "./textos.es";

/** Todo lo que exporta un idioma, con los textos sin literales (así el inglés se comprueba contra el español). */
type Modulo = Omit<typeof es, "T"> & { T: es.Textos };
const activo: Modulo = IDIOMA === "en" ? en : es;

export const T = activo.T;
export const NOMBRE_ASTRO = activo.NOMBRE_ASTRO;
export const ARTICULO_ASTRO = activo.ARTICULO_ASTRO;
export const DEL_ASTRO = activo.DEL_ASTRO;
export const NOMBRE_NIVEL = activo.NOMBRE_NIVEL;
export const FORMA_NIVEL = activo.FORMA_NIVEL;
export const NOMBRE_CATEGORIA = activo.NOMBRE_CATEGORIA;
export const FORMA_CATEGORIA = activo.FORMA_CATEGORIA;
export const ERRORES_POR_ESTADO = activo.ERRORES_POR_ESTADO;
export const ERRORES_DE_DOMINIO = activo.ERRORES_DE_DOMINIO;
export const SIN_LINEA_DIRECTA = activo.SIN_LINEA_DIRECTA;
export const ANALISIS_API = activo.ANALISIS_API;
export const umbralNivel = activo.umbralNivel;
export const esperaYReintenta = activo.esperaYReintenta;
export const enHoras = activo.enHoras;
export const proximoCambio = activo.proximoCambio;
export const faltanPara = activo.faltanPara;
export const describirCielo = activo.describirCielo;
export const describirInstante = activo.describirInstante;
export const horaLocal = activo.horaLocal;
export const veredicto = activo.veredicto;
export const partesVeredicto = activo.partesVeredicto;
export const veredictoFechas = activo.veredictoFechas;
export const partesVeredictoFechas = activo.partesVeredictoFechas;
export const partesDecision = activo.partesDecision;
export const relatoDiferencia = activo.relatoDiferencia;
export const periodoLegible = activo.periodoLegible;
