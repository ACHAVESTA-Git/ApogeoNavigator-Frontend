import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, CODIGO_MES_SIN_DATOS, CODIGO_SIN_CONEXION, ErrorDeRed, errorDeRespuesta, esMesSinDatos, traducirError } from "./errores";
import { ERRORES_POR_ESTADO } from "./textos";

const respuesta = (status: number, requestId?: string) => ({ status, headers: { get: (n: string) => (n === "X-Request-ID" ? requestId ?? null : null) } });
const CRUDO = /Failed to fetch|Error \d{3}|^\s*[[{]|"detail"|Internal Server Error|undefined|\[object/;

describe("traductor de errores", () => {
  let warn: ReturnType<typeof vi.spyOn>;
  let error: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    error = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  it("usa título, mensaje, acción y request_id del objeto `error` del backend", () => {
    const cuerpo = { detail: "El sitio no existe en sites.csv", error: { codigo: "SITIO_NO_ENCONTRADO", estado: 404, titulo: "Sitio no encontrado", mensaje: "No hay ningún sitio con el identificador «shakleton».", accion: "Elige un sitio del catálogo.", request_id: "9f2c1e7a4b" } };
    const t = traducirError(errorDeRespuesta(respuesta(404), cuerpo, "/api/efemerides/shakleton?desde=2026-12-01"));
    expect(t).toMatchObject({ codigo: "SITIO_NO_ENCONTRADO", estado: 404, titulo: "Sitio no encontrado", mensaje: "No hay ningún sitio con el identificador «shakleton».", sugerencia: "Elige un sitio del catálogo.", accion: "sitios", requestId: "9f2c1e7a4b" });
  });

  it("sin objeto `error`, usa la tabla por estado y la cabecera X-Request-ID", () => {
    const t = traducirError(errorDeRespuesta(respuesta(503, "abc123"), null, "/api/sites"));
    expect(t).toMatchObject({ codigo: "SERVICIO_NO_DISPONIBLE", titulo: ERRORES_POR_ESTADO[503].titulo, accion: "reintentar", requestId: "abc123" });
  });

  it.each([
    [401, "clave"], [403, "clave"], [404, "sitios"], [413, "ninguna"], [422, "ninguna"], [429, "reintentar"], [500, "reintentar"], [502, "reintentar"], [504, "reintentar"],
  ] as const)("estado %i → acción «%s», con textos del catálogo", (estado, accion) => {
    const t = traducirError(errorDeRespuesta(respuesta(estado), { detail: [{ loc: ["query", "desde"], msg: "x" }] }, "/api/x"));
    expect(t.accion).toBe(accion);
    expect(t.titulo).toBe(ERRORES_POR_ESTADO[estado].titulo);
    expect(t.mensaje).toBe(ERRORES_POR_ESTADO[estado].mensaje);
    expect(t.sugerencia).toBe(ERRORES_POR_ESTADO[estado].accion);
  });

  it("un estado sin entrada propia cae en el genérico de su familia", () => {
    expect(traducirError(new ApiError(507, "")).titulo).toBe(ERRORES_POR_ESTADO[500].titulo);
    expect(traducirError(new ApiError(418, "")).titulo).toBe(ERRORES_POR_ESTADO[400].titulo);
  });

  it("conserva un `detail` escrito para personas y descarta el texto por defecto del servidor", () => {
    expect(traducirError(new ApiError(422, "'hasta' debe ser posterior a 'desde'")).mensaje).toBe("'hasta' debe ser posterior a 'desde'");
    expect(traducirError(new ApiError(404, "Not Found")).mensaje).toBe(ERRORES_POR_ESTADO[404].mensaje);
    expect(traducirError(new ApiError(500, "Internal Server Error")).mensaje).toBe(ERRORES_POR_ESTADO[500].mensaje);
    expect(traducirError(new ApiError(500, '{"traza": "..."}')).mensaje).toBe(ERRORES_POR_ESTADO[500].mensaje);
  });

  it("sin conexión: mensaje propio y reintentar", () => {
    const t = traducirError(new ErrorDeRed(new TypeError("Failed to fetch"), "/api/sites"));
    expect(t).toMatchObject({ codigo: CODIGO_SIN_CONEXION, estado: 0, titulo: "No hay conexión con el servidor", accion: "reintentar" });
  });

  it("nunca filtra «Failed to fetch», «Error 500» ni JSON crudo", () => {
    const casos: unknown[] = [
      new ErrorDeRed(new TypeError("Failed to fetch")), new TypeError("Failed to fetch"), new Error('{"detail":"x"}'), "cadena suelta", null,
      errorDeRespuesta(respuesta(500), { detail: { traza: "Traceback…" } }, "/api/x"), errorDeRespuesta(respuesta(422), { detail: [{ msg: "field required" }] }, "/api/x"),
      ...Object.keys(ERRORES_POR_ESTADO).map((e) => new ApiError(Number(e), "")),
    ];
    for (const caso of casos) {
      const t = traducirError(caso);
      for (const texto of [t.titulo, t.mensaje, t.sugerencia]) {
        expect(texto.length).toBeGreaterThan(0);
        expect(texto).not.toMatch(CRUDO);
      }
    }
  });

  it("registra «[API] estado codigo request_id ruta» sin parámetros: warn en 4xx y error en 5xx", () => {
    errorDeRespuesta(respuesta(404, "rid1"), null, "http://localhost:8080/api/efemerides/x?desde=2026-12-01&clave=secreta");
    expect(warn).toHaveBeenCalledWith("[API] 404 NO_ENCONTRADO rid1 /api/efemerides/x");
    errorDeRespuesta(respuesta(500), null, "/api/metricas?site_id=a");
    expect(error).toHaveBeenCalledWith("[API] 500 ERROR_INTERNO - /api/metricas");
  });
});

describe("mes sin datos (422 de un periodo fuera de los datos)", () => {
  const cuerpo = (mensaje: string) => ({ detail: mensaje, error: { codigo: "RANGO_FECHAS_INVALIDO", estado: 422, titulo: "Rango de fechas inválido", mensaje, accion: "Usa fechas UTC…", request_id: "ab81498be1" } });
  const respuesta422 = { status: 422, headers: { get: () => null } };

  it("se traduce a un estado vacío con acción de elegir otro mes, no al error del backend", () => {
    for (const param of ["desde", "hasta"]) {
      const e = errorDeRespuesta(respuesta422, cuerpo(`'${param}' está fuera del rango de datos disponible`), "/api/metricas");
      expect(esMesSinDatos(e)).toBe(true);
      expect(traducirError(e)).toMatchObject({ codigo: CODIGO_MES_SIN_DATOS, estado: 422, titulo: "No hay datos de ese mes", sugerencia: "Elige otro mes.", accion: "mes" });
    }
  });

  it("vale también con el detail a secas (respuesta sin objeto error)", () => {
    expect(traducirError(new ApiError(422, "'hasta' está fuera del rango de datos disponible")).accion).toBe("mes");
  });

  it("otros 422 siguen siendo errores que corregir", () => {
    const orden = errorDeRespuesta(respuesta422, cuerpo("'hasta' debe ser posterior a 'desde'"), "/api/metricas");
    expect(esMesSinDatos(orden)).toBe(false);
    expect(traducirError(orden).accion).toBe("ninguna");
    expect(esMesSinDatos(new ApiError(404, "fuera del rango de datos"))).toBe(false);
    expect(esMesSinDatos(new Error("fuera del rango de datos"))).toBe(false);
  });
});
