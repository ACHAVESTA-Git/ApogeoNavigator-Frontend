import { afterEach, describe, expect, it, vi } from "vitest";
import { obtenerEfemerides, obtenerHorizons, obtenerMetricas, olvidarHorizons } from "./api";
import { PUNTO_PROPIO, REGEX } from "./constants";
import { ApiError, errorDeRespuesta, traducirError } from "./errores";
import { esPuntoPropio, idDePunto, leerCoordenada, puntoDeId, sitioDePunto } from "./puntoPropio";
import { T } from "./textos";

describe("identificador de un punto propio", () => {
  it("lleva las coordenadas dentro de un site_id válido y se lee de vuelta", () => {
    const id = idDePunto({ lat: -89.66, lon: 129.2 });
    expect(id).toBe("punto_s89p66_e129p2");
    expect(REGEX.SITE_ID.test(id)).toBe(true);
    expect(puntoDeId(id)).toEqual({ lat: -89.66, lon: 129.2 });
    expect(puntoDeId(idDePunto({ lat: 0.6742, lon: -23.4731 }))).toEqual({ lat: 0.6742, lon: -23.4731 });
    expect(puntoDeId(idDePunto({ lat: 90, lon: -180 }))).toEqual({ lat: 90, lon: -180 });
  });
  it("no confunde un sitio del catálogo ni acepta coordenadas fuera de rango", () => {
    for (const id of ["shackleton", "apollo11", "punto_s91_e0", "punto_n10_e181", "punto_x10_e10", undefined]) expect(esPuntoPropio(id)).toBe(false);
  });
  it("se presenta como un sitio más, de categoría personalizada", () => {
    const sitio = sitioDePunto("punto_s45_e10", { lat: -45, lon: 10 });
    expect(sitio).toMatchObject({ site_id: "punto_s45_e10", categoria: "personalizado", lat_deg: -45, lon_este_deg: 10, nombre: T.puntoPropio.nombre });
  });
});

describe("validación en vivo de las coordenadas", () => {
  it("acepta punto o coma decimal y redondea a 4 decimales", () => {
    expect(leerCoordenada("-89,66", "lat")).toEqual({ valor: -89.66, error: null });
    expect(leerCoordenada(" 129.123456 ", "lon")).toEqual({ valor: 129.1235, error: null });
    expect(leerCoordenada("-180", "lon").valor).toBe(-180);
  });
  it("explica el rango y el signo: Sur negativo, Este positivo", () => {
    expect(leerCoordenada("90.01", "lat").error).toBe(T.puntoPropio.errores.lat);
    expect(leerCoordenada("-181", "lon").error).toBe(T.puntoPropio.errores.lon);
    expect(leerCoordenada("12a", "lat").error).toBe(T.puntoPropio.errores.numero);
    expect(leerCoordenada("", "lat")).toEqual({ valor: null, error: "" }); // vacío: todavía no es un error
    expect(T.puntoPropio.ayudaLat).toMatch(/Sur, negativo/);
    expect(T.puntoPropio.ayudaLon).toMatch(/Este, positivo/);
  });
});

describe("GET /api/horizons", () => {
  const RANGO = { desde: "2026-12-01T00:00Z", hasta: "2027-01-01T00:00Z" } as const;
  const METRICA = { site_id: "personalizado", inicio_utc: RANGO.desde, fin_utc: RANGO.hasta, horas_total: 744, horas_sol: 744, pct_sol: 100, horas_tierra_visible: 0, pct_tierra: 0, origen: "horizons_en_vivo", referencia: null };
  const CUERPO = { site_id: "personalizado", inicio_utc: RANGO.desde, fin_utc: RANGO.hasta, paso_horas: 1, filas: [{ utc: RANGO.desde, sol_az_deg: 1, sol_el_deg: 2, tierra_az_deg: 3, tierra_el_deg: -4 }], fuente: "JPL Horizons", lat_deg: -45, lon_este_deg: 10, en_cache: false, consultado_utc: RANGO.desde, metricas: METRICA, puestas: {} };
  const json = (cuerpo: unknown, status = 200, headers: Record<string, string> = {}) => new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json", ...headers } });
  const simular = (respuesta: () => Response) => {
    const llamadas: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (u: RequestInfo | URL) => { llamadas.push(String(u)); return respuesta(); }));
    return llamadas;
  };
  afterEach(() => { vi.unstubAllGlobals(); olvidarHorizons(); });

  it("efemérides y métricas de un punto salen de UNA sola petición, con lat, lon y el rango obligatorio", async () => {
    const llamadas = simular(() => json(CUERPO));
    const id = idDePunto({ lat: -45, lon: 10 });
    const [efemerides, metricas] = await Promise.all([obtenerEfemerides(id, RANGO), obtenerMetricas([id], RANGO)]);
    expect(llamadas).toEqual(["/api/horizons?lat=-45&lon=10&desde=2026-12-01T00%3A00Z&hasta=2027-01-01T00%3A00Z"]);
    expect(efemerides.filas).toHaveLength(1);
    expect(metricas.resultados[0]).toMatchObject({ site_id: id, horas_sol: 744, origen: "horizons_en_vivo" });
  });
  it("el periodo por defecto respeta el máximo de 35 días", () => {
    const dias = (Date.parse("2027-01-01T00:00Z") - Date.parse("2026-12-01T00:00Z")) / 86_400_000;
    expect(dias).toBeLessThanOrEqual(PUNTO_PROPIO.RANGO_MAX_DIAS);
  });
  it("429 con Retry-After: «Espera N s» y botón de reintentar; el error no se queda en caché", async () => {
    const llamadas = simular(() => json({ detail: "Demasiadas consultas" }, 429, { "Retry-After": "12" }));
    const error = await obtenerHorizons({ lat: 1, lon: 2 }, RANGO).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(traducirError(error)).toMatchObject({ estado: 429, accion: "reintentar", sugerencia: "Espera 12 s y reintenta.", esperaS: 12 });
    await obtenerHorizons({ lat: 1, lon: 2 }, RANGO).catch(() => undefined);
    expect(llamadas).toHaveLength(2);
  });
  it.each([[502, "SERVICIO_EXTERNO_FALLO"], [504, "TIEMPO_AGOTADO"]] as const)("%i de JPL es un error con «Reintentar», nunca datos de ejemplo", async (estado, codigo) => {
    simular(() => json({ detail: "JPL Horizons no respondió" }, estado));
    const error = await obtenerHorizons({ lat: 1, lon: 2 }, RANGO).catch((e: unknown) => e);
    expect(traducirError(error)).toMatchObject({ estado, codigo, accion: "reintentar", mensaje: "JPL Horizons no respondió" });
  });
  it("sin Retry-After, el 429 conserva la sugerencia del catálogo", () => {
    const t = traducirError(errorDeRespuesta({ status: 429, headers: { get: () => null } }, null, "/api/horizons"));
    expect(t.sugerencia).toBe("Espera unos segundos y reintenta.");
    expect(t.esperaS).toBeUndefined();
  });
});

describe("sin respaldo de ejemplo", () => {
  afterEach(() => { vi.unstubAllGlobals(); olvidarHorizons(); });
  it("si el servidor no tiene /api/horizons, el punto da el error: nunca datos de otro sitio", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ detail: "Not Found" }), { status: 404, headers: { "Content-Type": "application/json" } })));
    const error = await obtenerHorizons({ lat: 1, lon: 2 }, { desde: "2026-12-01T00:00Z", hasta: "2027-01-01T00:00Z" }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
  });
});
