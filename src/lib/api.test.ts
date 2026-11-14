import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { obtenerEfemerides, obtenerMetricas, obtenerSitios, urlApi, validarCsv } from "./api";
import { ApiError, ErrorDeRed, esApiAusente } from "./errores";
import { reiniciarMuestra } from "./muestra";

const SITIOS = [{ site_id: "shackleton", nombre: "Cráter Shackleton (centro)" }];
const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });

/** fetch simulado: la API responde con `api()` y los JSON de /muestra con datos fijos. */
function simularFetch(api: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const llamadas: string[] = [];
  vi.stubGlobal("fetch", vi.fn(async (entrada: RequestInfo | URL, init?: RequestInit) => {
    const url = String(entrada);
    llamadas.push(url);
    if (url.startsWith("/muestra/sites.json")) return json(SITIOS);
    return api(url, init);
  }));
  return llamadas;
}

beforeEach(() => reiniciarMuestra());
afterEach(() => vi.unstubAllGlobals());

describe("urlApi", () => {
  it("devuelve la ruta relativa cuando no hay base (mismo origen)", () => {
    expect(urlApi("/api/sites", {}, "")).toBe("/api/sites");
    expect(urlApi("/api/efemerides/shackleton", { desde: "2026-12-01T00:00Z", hasta: undefined }, "")).toBe(
      "/api/efemerides/shackleton?desde=2026-12-01T00%3A00Z",
    );
  });
  it("construye la URL absoluta contra otra base (p. ej. Cloud Run)", () => {
    expect(urlApi("/api/sites", {}, "https://backend-dev.example.run.app")).toBe("https://backend-dev.example.run.app/api/sites");
  });
  it("repite site_id para comparar varios sitios", () => {
    expect(urlApi("/api/metricas", { site_id: ["a11", "b22"], desde: "2026-12-01T00:00Z" }, "")).toBe(
      "/api/metricas?site_id=a11&site_id=b22&desde=2026-12-01T00%3A00Z",
    );
  });
});

describe("respaldo a datos de ejemplo", () => {
  it("usa la API cuando responde", async () => {
    const llamadas = simularFetch(() => json([{ site_id: "desde_api" }]));
    expect(await obtenerSitios({ modo: "auto" })).toEqual([{ site_id: "desde_api" }]);
    expect(llamadas).toEqual(["/api/sites"]);
  });
  it("auto: con la red caída sirve la muestra", async () => {
    simularFetch(() => { throw new TypeError("Failed to fetch"); });
    expect(await obtenerSitios({ modo: "auto" })).toEqual(SITIOS);
  });
  it("auto: un 404 «Not Found» (ruta sin registrar) sirve la muestra", async () => {
    simularFetch(() => json({ detail: "Not Found" }, 404));
    expect(await obtenerSitios({ modo: "auto" })).toEqual(SITIOS);
  });
  it("auto: un 503 sirve la muestra", async () => {
    simularFetch(() => json({ detail: "No se encontró sites.csv" }, 503));
    expect(await obtenerSitios({ modo: "auto" })).toEqual(SITIOS);
  });
  it("auto: un 404 en español es un error real y se muestra", async () => {
    simularFetch(() => json({ detail: "El sitio no tiene efemérides cargadas" }, 404));
    await expect(obtenerEfemerides("shackleton", {}, { modo: "auto" })).rejects.toMatchObject({
      status: 404, detail: "El sitio no tiene efemérides cargadas",
    });
  });
  it("auto: un 422 no activa el respaldo", async () => {
    simularFetch(() => json({ detail: "'hasta' debe ser posterior a 'desde'" }, 422));
    await expect(obtenerMetricas(["shackleton"], {}, { modo: "auto" })).rejects.toBeInstanceOf(ApiError);
  });
  it("false: la red caída es un error", async () => {
    simularFetch(() => { throw new TypeError("Failed to fetch"); });
    await expect(obtenerSitios({ modo: "false" })).rejects.toBeInstanceOf(ErrorDeRed);
  });
  it("true: no llama a la API", async () => {
    const llamadas = simularFetch(() => json([]));
    expect(await obtenerSitios({ modo: "true" })).toEqual(SITIOS);
    expect(llamadas).toEqual(["/muestra/sites.json"]);
  });
  it("clasifica qué errores significan «la API no está»", () => {
    expect(esApiAusente(new ErrorDeRed())).toBe(true);
    expect(esApiAusente(new ApiError(404, "Not Found"))).toBe(true);
    expect(esApiAusente(new ApiError(502, "Bad Gateway"))).toBe(true);
    expect(esApiAusente(new ApiError(404, "El sitio no existe en sites.csv"))).toBe(false);
    expect(esApiAusente(new ApiError(401, "API key inválida o ausente"))).toBe(false);
  });
});

describe("métricas", () => {
  const base = { site_id: "shackleton", pct_sol: 100, pct_tierra: 39.11, sol_el_max_deg: 1.7385 };
  it("respeta el semáforo y los avisos de la API cuando coinciden con la leyenda", async () => {
    const semaforo = { energia: "verde", comunicacion: "rojo", global: "rojo" };
    const avisos = [{ codigo: "sensible_al_relieve", mensaje: "Texto de la API" }];
    simularFetch(() => json({ resultados: [{ ...base, semaforo, avisos }] }));
    const { resultados } = await obtenerMetricas(["shackleton"], {}, { modo: "false" });
    expect(resultados[0].semaforo).toEqual(semaforo);
    expect(resultados[0].avisos).toEqual(avisos);
  });
  it("si la API usa umbrales antiguos, pinta el nivel coherente con la leyenda", async () => {
    // Chang'e 4, dic 2026: 49,73 % de sol. Con 70/40 la API decía «amarillo»; con 45/25 es «verde».
    const antiguo = { energia: "amarillo", comunicacion: "rojo", global: "rojo" };
    simularFetch(() => json({ resultados: [{ site_id: "change4", pct_sol: 49.73, pct_tierra: 0, sol_el_max_deg: 45.98, semaforo: antiguo }] }));
    const { resultados } = await obtenerMetricas(["change4"], {}, { modo: "false" });
    expect(resultados[0].semaforo).toEqual({ energia: "verde", comunicacion: "rojo", global: "rojo" });
    expect(resultados[0].avisos).toEqual([]);
  });
  it("recalcula si el semáforo no tiene la forma esperada o faltan los avisos", async () => {
    simularFetch(() => json({ resultados: [{ ...base, semaforo: { energia: "x" } }] }));
    const { resultados } = await obtenerMetricas(["shackleton"], {}, { modo: "false" });
    expect(resultados[0].semaforo).toEqual({ energia: "verde", comunicacion: "rojo", global: "rojo" });
    expect(resultados[0].avisos[0].codigo).toBe("sensible_al_relieve");
  });
});

describe("carga de CSV", () => {
  const archivo = new File(["utc\n"], "efemerides_shackleton.csv", { type: "text/csv" });
  it("envía el archivo en multipart con la cabecera de la clave", async () => {
    let recibido: RequestInit | undefined;
    const llamadas = simularFetch((_, init) => { recibido = init; return json({ valido: true }); });
    await validarCsv("efemerides", archivo, "clave-de-prueba");
    expect(llamadas).toEqual(["/api/datos/validar/efemerides"]);
    expect(recibido?.method).toBe("POST");
    expect((recibido?.headers as Record<string, string>)["X-API-Key"]).toBe("clave-de-prueba");
    expect((recibido?.body as FormData).get("file")).toBeInstanceOf(File);
  });
  it("nunca cae a la muestra y propaga el informe del 422", async () => {
    simularFetch(() => json({ detail: { valido: false, total_errores: 2, errores: [] } }, 422));
    await expect(validarCsv("efemerides", archivo, "k")).rejects.toMatchObject({ status: 422, detail: { total_errores: 2 } });
  });
});
