// Error de la API con el formato de FastAPI: {"detail": ...}.
import { API } from "./constants";
import type { InformeCsv } from "./tipos";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string | InformeCsv,
  ) {
    super(typeof detail === "string" ? detail : `Error ${status}`);
    this.name = "ApiError";
  }
  get esNoEncontrado(): boolean {
    return this.status === API.NO_ENCONTRADO;
  }
  get esNoProcesable(): boolean {
    return this.status === API.NO_PROCESABLE;
  }
}
/** Fallo de red o de tiempo de espera: la API no llegó a responder. */
export class ErrorDeRed extends Error {
  constructor(readonly causa?: unknown) {
    super("No se pudo conectar con la API");
    this.name = "ErrorDeRed";
  }
}
/** La API no está (red caída, ruta sin registrar o servicio caído): único caso en que vale la muestra. */
export function esApiAusente(error: unknown): boolean {
  if (error instanceof ErrorDeRed) return true;
  if (!(error instanceof ApiError)) return false;
  if (error.status === API.NO_ENCONTRADO) return error.detail === API.DETALLE_RUTA_INEXISTENTE;
  return (API.ESTADOS_SIN_SERVICIO as readonly number[]).includes(error.status);
}
export const mensajeDeError = (error: unknown, porDefecto: string): string =>
  error instanceof ApiError && typeof error.detail === "string" ? error.detail : porDefecto;
