// Traducción en el cliente de las notas y limitaciones que el backend envía en español. Se traducen por `codigo`
// (limitaciones) o por su forma conocida (espectro, R²); si el código o la forma son desconocidos, se usa el texto de la API.
// No se traducen valores ni cifras: las cifras salen del propio texto de la API.
import { numero } from "./formato";
import { T } from "./textos";

const NUM = String.raw`(\d+(?:[.,]\d+)?)`;
const VENTANA_CORTA = new RegExp(String.raw`ventana de datos es de ${NUM} d[ií]as.*?\(${NUM} d\)`);
const ESPECTRO = new RegExp(String.raw`mes sin[oó]dico \(${NUM} d\).*?anomal[ií]stico \(${NUM} d\).*?drac[oó]nico \(${NUM} d\)`);
const R2_DENTRO = /^R² y residuos son del ajuste DENTRO de los datos/;

/** Reescribe una cifra del texto de la API (punto o coma) con el separador del idioma activo y los mismos decimales. */
const decimal = (n: string): string => {
  const [, fraccion = ""] = n.split(/[.,]/);
  return numero(parseFloat(n.replace(",", ".")), fraccion.length);
};

export function textoLimitacion(codigo: string, mensaje: string): string {
  const n = T.notasApi;
  if (codigo === "ventana_corta") {
    const m = VENTANA_CORTA.exec(mensaje);
    return m ? n.ventanaCorta(decimal(m[1]), decimal(m[2])) : mensaje;
  }
  return n.limitaciones[codigo] ?? mensaje;
}

export function textoNotaEspectro(nota: string): string {
  const m = ESPECTRO.exec(nota);
  return m ? T.notasApi.espectro(decimal(m[1]), decimal(m[2]), decimal(m[3])) : nota;
}

export function textoNotaAjuste(nota: string | null | undefined): string | null {
  if (!nota) return null;
  return R2_DENTRO.test(nota) ? T.notasApi.r2 : nota;
}
