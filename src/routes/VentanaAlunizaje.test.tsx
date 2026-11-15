import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DiaVentana, RespuestaVentanas, VentanaAlunizaje as Ventana } from "../lib/tipos";
import VentanaAlunizaje from "./VentanaAlunizaje";

// Respuestas simuladas CON LA FORMA DEL CONTRATO de GET /api/ventanas-alunizaje (solo para pruebas).
const json = (estado: number, cuerpo: unknown) => new Response(JSON.stringify(cuerpo), { status: estado, headers: { "Content-Type": "application/json" } });
const sitio = (site_id: string, nombre: string) => ({ site_id, nombre, categoria: "artemis", mision: "", agencia: "NASA", lat_deg: -89.9, lon_este_deg: 0, alt_km: 0, fuente_url: "https://example.org", notas: null });
const SITIOS = [sitio("shackleton", "Cráter Shackleton"), sitio("change4", "Chang'e 4")];
const dia = (d: string, hora: string, horas: number, estancia: number): DiaVentana => ({ dia_utc: d, llegada_utc: `${d}T${hora}Z`, horas_sol_y_tierra: horas, pct_sol_y_tierra: Math.round((horas / estancia) * 10000) / 100 });
const ventana = (llegada: string, salida: string, horas: number, estancia: number, resto: Partial<Ventana> = {}): Ventana => ({
  llegada_utc: llegada, salida_utc: salida, horas_sol: estancia, horas_tierra: horas, horas_sol_y_tierra: horas, pct_sol: 100,
  pct_tierra: Math.round((horas / estancia) * 10000) / 100, pct_sol_y_tierra: Math.round((horas / estancia) * 10000) / 100,
  sol_al_llegar: true, tierra_al_llegar: true, racha_sin_tierra_h: 0, ...resto,
});
const respuesta = (site_id: string, estancia_h: number, serie_diaria: DiaVentana[], mejores: Ventana[]): RespuestaVentanas => ({
  estancia_h, mejor_global: null,
  resultados: [{ site_id, inicio_utc: "2026-12-01T00:00Z", fin_utc: "2027-06-01T00:00Z", paso_horas: 1, ventanas_evaluadas: 4214, ventanas_descartadas: 155, trunca: true, serie_diaria, mejores }],
});
const EMPATE = respuesta("shackleton", 156,
  [dia("2026-12-13", "23:00", 132, 156), dia("2026-12-14", "23:00", 156, 156), dia("2026-12-15", "00:00", 156, 156), dia("2027-01-11", "02:00", 156, 156)],
  [ventana("2026-12-14T23:00Z", "2026-12-21T11:00Z", 156, 156), ventana("2027-01-11T02:00Z", "2027-01-17T14:00Z", 156, 156)]);
const UNICA = respuesta("shackleton", 336,
  [dia("2027-01-09", "12:00", 298, 336), dia("2026-12-13", "02:00", 291, 336)],
  [ventana("2027-01-09T12:00Z", "2027-01-23T12:00Z", 298, 336, { tierra_al_llegar: false, racha_sin_tierra_h: 38 }), ventana("2026-12-13T02:00Z", "2026-12-27T02:00Z", 291, 336, { tierra_al_llegar: false, racha_sin_tierra_h: 45 })]);
const SIN_TIERRA = respuesta("change4", 72, [dia("2026-12-01", "22:00", 0, 72), dia("2026-12-02", "00:00", 0, 72)],
  [ventana("2026-12-01T22:00Z", "2026-12-04T22:00Z", 0, 72, { tierra_al_llegar: false, racha_sin_tierra_h: 72 })]);
const metrica = (site_id: string, rasante: boolean) => ({
  site_id, inicio_utc: "2026-12-01T00:00Z", fin_utc: "2027-01-01T00:00Z", horas_sol: 744, pct_sol: 100, sol_el_max_deg: rasante ? 1.7 : 40, sol_el_media_deg: 1,
  horas_tierra_visible: 400, pct_tierra: 53.76, semaforo: { energia: "verde", comunicacion: "amarillo", global: "amarillo" },
  avisos: rasante ? [{ codigo: "sensible_al_relieve", mensaje: "El Sol no supera 3°" }] : [], origen: "calculado", referencia: null,
});

let ventanas: (url: URL) => Response;
let rasante = true;
beforeEach(() => {
  rasante = true;
  vi.stubGlobal("fetch", vi.fn(async (entrada: RequestInfo | URL) => {
    const url = new URL(String(entrada), "http://localhost");
    if (url.pathname === "/api/sites") return json(200, SITIOS);
    if (url.pathname === "/api/ventanas-alunizaje") return ventanas(url);
    if (url.pathname === "/api/metricas") return json(200, { resultados: [metrica(url.searchParams.get("site_id") ?? "", rasante)] });
    if (url.pathname.startsWith("/api/efemerides/")) return json(200, { site_id: url.pathname.split("/").pop(), filas: [] });
    return json(404, { detail: "Not Found" });
  }));
});
afterEach(() => vi.unstubAllGlobals());

function montar(ruta: string) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })}>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/sitios/:siteId/ventana" element={<VentanaAlunizaje />} />
          <Route path="/sitios/:siteId/cielo" element={<p>cielo</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Ventana de alunizaje", () => {
  it("pide la estancia de referencia (156 h) del sitio de la ruta, sin cabecera de sesión", async () => {
    ventanas = () => json(200, EMPATE);
    montar("/sitios/shackleton/ventana");
    await screen.findByText("Llega el 14 dic. a las 23:00 UTC");
    const llamada = vi.mocked(fetch).mock.calls.find(([u]) => String(u).includes("ventanas-alunizaje"));
    expect(String(llamada?.[0])).toBe("/api/ventanas-alunizaje?site_id=shackleton&estancia_h=156");
    expect(JSON.stringify(llamada?.[1])).not.toContain("X-Requested-With");
  });

  it("dice la mejor llegada en lenguaje operativo, con las horas reales y el salto al cielo en ese instante", async () => {
    ventanas = () => json(200, EMPATE);
    montar("/sitios/shackleton/ventana");
    expect(await screen.findByRole("heading", { name: "Llega el 14 dic. a las 23:00 UTC" })).toBeInTheDocument();
    expect(screen.getByText("156 h", { selector: ".sr-only" })).toBeInTheDocument();
    expect(screen.getByText("Sol al llegar")).toBeInTheDocument();
    expect(screen.getByText("Tierra al llegar")).toBeInTheDocument();
    expect(screen.getByText("Enlace con la Tierra durante toda la estancia")).toBeInTheDocument();
    expect(decodeURIComponent(screen.getByRole("link", { name: /Ver el cielo al llegar/ }).getAttribute("href") ?? "")).toBe("/sitios/shackleton/cielo?desde=2026-12-01T00:00Z&hasta=2027-01-01T00:00Z&t=2026-12-14T23:00Z");
  });

  it("regla 3: con empate en el máximo dice «Primera de varias ventanas equivalentes» y remite al calendario", async () => {
    ventanas = () => json(200, EMPATE);
    montar("/sitios/shackleton/ventana");
    expect(await screen.findByText("Primera de varias ventanas equivalentes.")).toBeInTheDocument();
    expect(screen.getByText("Las demás están en el calendario de calor.")).toBeInTheDocument();
  });

  it("regla 2: la mejor ventana lleva siempre el aviso de horizonte ideal y, con Sol rasante, «*» y «sensible al relieve»", async () => {
    ventanas = () => json(200, EMPATE);
    montar("/sitios/shackleton/ventana");
    expect(await screen.findByText(/sensible al relieve/)).toBeInTheDocument();
    expect(screen.getByText(/con Sol y Tierra a la vez\*/)).toBeInTheDocument();
    expect(screen.getByText(/horizonte ideal/)).toBeInTheDocument();
  });
  it("regla 2: sin Sol rasante no hay asterisco, pero el aviso de horizonte ideal sigue", async () => {
    rasante = false;
    ventanas = () => json(200, UNICA);
    montar("/sitios/shackleton/ventana?estancia=336");
    await screen.findByRole("heading", { name: "Llega el 9 ene. a las 12:00 UTC" });
    expect(screen.getByText(/horizonte ideal/)).toBeInTheDocument();
    expect(screen.queryByText(/sensible al relieve/)).not.toBeInTheDocument();
    expect(screen.queryByText("Primera de varias ventanas equivalentes.")).not.toBeInTheDocument();
    expect(screen.getByText("Sin Tierra al llegar")).toBeInTheDocument();
    expect(screen.getByText("Sin enlace con la Tierra durante 38 h seguidas")).toBeInTheDocument();
  });

  it("regla 1: si la mejor ventana tiene 0 h con Sol y Tierra no hay fecha ni cifra héroe, solo el aviso", async () => {
    ventanas = () => json(200, SIN_TIERRA);
    montar("/sitios/change4/ventana?estancia=72");
    expect(await screen.findByRole("heading", { name: "Sin ventana con Sol y enlace directo con la Tierra en este periodo" })).toBeInTheDocument();
    expect(screen.queryByText(/Llega el/)).not.toBeInTheDocument();
    expect(document.querySelector(".text-heroe")).toBeNull();
    expect(screen.queryByRole("link", { name: /Ver el cielo al llegar/ })).not.toBeInTheDocument();
    expect(screen.getByText(/horizonte ideal/)).toBeInTheDocument();
  });

  it("sin ventanas evaluadas lo dice, sin inventar nada", async () => {
    ventanas = () => json(200, respuesta("shackleton", 156, [], []));
    montar("/sitios/shackleton/ventana");
    expect(await screen.findByRole("heading", { name: "No hay ventanas evaluadas para esta estancia" })).toBeInTheDocument();
    expect(document.querySelector(".text-heroe")).toBeNull();
  });

  it("el calendario es una rejilla con el valor escrito en cada celda; al elegir un día se ve su estancia", async () => {
    ventanas = () => json(200, EMPATE);
    montar("/sitios/shackleton/ventana");
    await screen.findByRole("heading", { name: "Llega el 14 dic. a las 23:00 UTC" });
    const rejilla = screen.getByRole("grid");
    const celdas = within(rejilla).getAllByRole("gridcell");
    expect(celdas).toHaveLength(31);
    expect(celdas.filter((c) => c.tabIndex === 0)).toHaveLength(1);
    const mejor = within(rejilla).getByRole("gridcell", { name: /14 dic\.: 100 % de la estancia con Sol y Tierra \(156 h\), llegando a las 23:00 UTC\. Mejor ventana/ });
    expect(mejor).toHaveAttribute("aria-selected", "true");
    expect(within(rejilla).getByRole("gridcell", { name: /^1 dic\.: sin datos/ })).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(within(rejilla).getByRole("gridcell", { name: /13 dic\.: 84,62 %/ }));
    expect(await screen.findByRole("heading", { name: "Si llegas el 13 dic. a las 23:00 UTC" })).toBeInTheDocument();
    // Flechas: el foco pasa al día siguiente (foco itinerante)
    act(() => mejor.focus());
    fireEvent.keyDown(mejor, { key: "ArrowRight" });
    expect(document.activeElement).toHaveAttribute("data-dia", "2026-12-15");
  });

  it("los chips de estancia son un grupo de radios y cambian la consulta", async () => {
    ventanas = (url) => json(200, url.searchParams.get("estancia_h") === "336" ? UNICA : EMPATE);
    montar("/sitios/shackleton/ventana");
    await screen.findByRole("heading", { name: "Llega el 14 dic. a las 23:00 UTC" });
    expect(screen.getByRole("radio", { name: "6,5 días (referencia)" })).toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: "14 días" }));
    expect(await screen.findByRole("heading", { name: "Llega el 9 ene. a las 12:00 UTC" })).toBeInTheDocument();
  });

  it("si la API aún no ofrece el endpoint lo dice y no enseña datos de ejemplo", async () => {
    ventanas = () => json(404, { detail: "Not Found" });
    montar("/sitios/shackleton/ventana");
    expect(await screen.findByText("La ventana de alunizaje aún no está disponible")).toBeInTheDocument();
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("un error del contrato (ESTANCIA_INVALIDA) se enseña con el aviso estándar", async () => {
    ventanas = () => json(422, { detail: "x", error: { codigo: "ESTANCIA_INVALIDA", estado: 422, titulo: "Estancia no válida", mensaje: "'estancia_h' debe ser una de 72, 156, 336 horas", accion: "Elige una estancia de 72, 156 o 336 horas.", request_id: "3e4bd6f402" } });
    montar("/sitios/shackleton/ventana");
    expect(await screen.findByText("Estancia no válida")).toBeInTheDocument();
  });
});
