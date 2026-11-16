import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PROYECCION_MODELO } from "../lib/constants";
import type { ErrorModelo, ModeloProyeccion, ProyeccionModelo, ResultadoProyeccion } from "../lib/proyeccionModelo";
import type { Rol } from "../lib/sesion";
import type { Site } from "../lib/tipos";
import Proyeccion from "./Proyeccion";
import SitioLayout from "./SitioLayout";

// Datos de PRUEBA (no salen de ninguna API real): solo viven en este archivo.
const SITIO: Site = { site_id: "shackleton", nombre: "Cráter Shackleton", categoria: "artemis", mision: "", agencia: "NASA", lat_deg: -89.9, lon_este_deg: 0, alt_km: 0, fuente_url: "https://example.test", notas: null };
const HUELLA = "ab12".repeat(16);
type Completa = ProyeccionModelo & { modelo: ModeloProyeccion; resultados: ResultadoProyeccion[] };
const mock = (cambios: Partial<ErrorModelo> | null = {}, resultado: Partial<ResultadoProyeccion> = {}): Completa => ({
  origen: "proyeccion",
  modelo: {
    version: "v-prueba", metodo: "Armónicos de prueba", entrenado_desde: "2026-12-01T00:00Z", entrenado_hasta: "2027-06-01T00:00Z", proyectado_hasta: "2028-07-31T23:00Z",
    error: cambios === null ? null : {
      rmse_deg: { sol_el_deg: 0.31, tierra_el_deg: 0.52, sol_az_deg: null, tierra_az_deg: null },
      por_horizonte: [{ meses: 1, rmse_sol_el_deg: 0.2, rmse_tierra_el_deg: 0.3 }, { meses: 14, rmse_sol_el_deg: 0.9, rmse_tierra_el_deg: 1.1 }],
      control_horizons: [
        { site_id: "shackleton", utc: "2027-09-01T00:00Z", variable: "sol_el_deg", error_deg: 0.25 },
        { site_id: "shackleton", utc: "2028-03-01T00:00Z", variable: "tierra_el_deg", error_deg: -0.75 },
      ],
      aciertos_semaforo_control: { aciertos: 5, total: 6 },
      ...cambios,
    },
  },
  limitaciones: [
    { codigo: "proyeccion_no_es_efemeride", mensaje: "Limitación de prueba: no es efeméride." },
    { codigo: "horizonte_ideal", mensaje: "Limitación de prueba: horizonte ideal." },
  ],
  resultados: [{
    site_id: "shackleton", sha3_256: HUELLA,
    serie: [
      { utc: "2027-06-12T00:00Z", sol_az_deg: 10, sol_el_deg: 1.2, tierra_az_deg: 20, tierra_el_deg: 4.5 },
      { utc: "2027-07-10T00:00Z", sol_az_deg: 10, sol_el_deg: -0.8, tierra_az_deg: 20, tierra_el_deg: 5.5 },
      { utc: "2027-08-31T20:00Z", sol_az_deg: 10, sol_el_deg: 0.4, tierra_az_deg: 20, tierra_el_deg: -2 },
    ],
    meses: [
      { mes: "2027-06", pct_sol: 80, pct_tierra: 75, semaforo: { energia: "verde", comunicacion: "verde" } },
      { mes: "2027-07", pct_sol: 44.5, pct_tierra: 30, semaforo: { energia: "amarillo", comunicacion: "rojo" }, indicadores_astronauta: { noche_mas_larga: { horas: 120, inicio_utc: null, fin_utc: null, trunca_inicio: false, trunca_fin: true } } },
      { mes: "2027-08", pct_sol: 60, pct_tierra: 50, semaforo: { energia: "verde", comunicacion: "amarillo" }, indicadores_astronauta: null },
    ],
    ...resultado,
  }],
});

const respuesta = (cuerpo: unknown, status = 200) => new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });
let proyeccion: () => Response;
const pedidas = () => vi.mocked(fetch).mock.calls.map(([url]) => String(url));
const aProyeccion = () => pedidas().filter((u) => u.includes("/api/proyeccion"));

beforeEach(() => {
  proyeccion = () => respuesta(mock());
  vi.stubGlobal("fetch", vi.fn((url: RequestInfo | URL) => {
    const ruta = String(url);
    if (ruta.includes("/api/proyeccion")) return Promise.resolve(proyeccion());
    if (ruta.includes("/api/sites")) return Promise.resolve(respuesta([SITIO]));
    return Promise.resolve(respuesta({ detail: "Not Found" }, 404));
  }));
});
afterEach(() => vi.unstubAllGlobals());

function cliente(rol: Rol | null) {
  const c = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  c.setQueryData(["sesion"], rol ? { id: "1", nombre: "Persona de prueba", rol, huellas: [] } : null);
  return c;
}
/** La ruta de la pestaña con el contexto que le da SitioLayout. */
function montarRuta(rol: Rol | null, consulta = "") {
  return render(
    <QueryClientProvider client={cliente(rol)}>
      <MemoryRouter initialEntries={[`/sitios/shackleton/proyeccion${consulta}`]}>
        <Routes>
          <Route element={<Outlet context={{ sitio: SITIO, desde: "2026-12-01T00:00Z", hasta: "2027-01-01T00:00Z" }} />}>
            <Route path="/sitios/:siteId/proyeccion" element={<Proyeccion />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
function montarLayout(rol: Rol | null) {
  return render(
    <QueryClientProvider client={cliente(rol)}>
      <MemoryRouter initialEntries={["/sitios/shackleton/cielo"]}>
        <Routes>
          <Route path="/sitios/:siteId" element={<SitioLayout />}>
            <Route path="*" element={<p>contenido</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("pestaña «Proyección»: visibilidad por rol", () => {
  it("admin la ve y enlaza a /sitios/:id/proyeccion", async () => {
    montarLayout("admin");
    const pestanas = await screen.findByRole("navigation", { name: "Vistas del sitio" });
    expect(within(pestanas).getByRole("link", { name: "Proyección" }).getAttribute("href")).toContain("/sitios/shackleton/proyeccion");
  });
  it.each([["analista"], ["revisor"], [null]] as [Rol | null][])("%s no la ve", async (rol) => {
    montarLayout(rol);
    const pestanas = await screen.findByRole("navigation", { name: "Vistas del sitio" });
    expect(within(pestanas).getByRole("link", { name: "Análisis" })).toBeTruthy();
    expect(within(pestanas).queryByRole("link", { name: "Proyección" })).toBeNull();
  });
});

describe("ruta /sitios/:id/proyeccion sin rol admin", () => {
  it.each([["analista"], ["revisor"]] as [Rol][])("%s: «Necesitas rol de administración», sin pedir datos", async (rol) => {
    montarRuta(rol);
    expect(screen.getByText("Necesitas rol de administración")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Iniciar sesión" })).toBeNull();
    await new Promise((r) => setTimeout(r, 20));
    expect(pedidas()).toEqual([]);
  });
  it("anónimo: el mismo estado, con la entrada a Acceso, y sin pedir datos", async () => {
    montarRuta(null);
    expect(screen.getByText("Necesitas rol de administración")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Iniciar sesión" }).getAttribute("href")).toBe("/acceso");
    await new Promise((r) => setTimeout(r, 20));
    expect(pedidas()).toEqual([]);
    expect(screen.queryByText("Proyección del modelo, no efeméride")).toBeNull();
  });
});

describe("ruta /sitios/:id/proyeccion con rol admin", () => {
  it("pide la proyección con la sesión (cookie) y el paso por defecto", async () => {
    montarRuta("admin");
    await screen.findByRole("heading", { level: 2, name: /^Hasta agosto de 2027/ });
    expect(aProyeccion()).toHaveLength(1);
    expect(aProyeccion()[0]).toBe("/api/proyeccion?site_id=shackleton&paso_horas=6");
    const init = vi.mocked(fetch).mock.calls.find(([u]) => String(u).includes("/api/proyeccion"))?.[1];
    expect(init?.credentials).toBe("include");
  });
  it("acto 1: veredicto con meses viables y críticos y el error medido contra Horizons como cifra héroe", async () => {
    montarRuta("admin");
    const frase = await screen.findByRole("heading", { level: 2, name: /^Hasta agosto de 2027/ });
    expect(frase.textContent).toBe("Hasta agosto de 2027, Cráter Shackleton es viable en 1 de 3 meses y es crítico en 1.");
    expect(screen.getByText("Con meses a vigilar")).toBeTruthy();
    expect(screen.getByText("Error medido contra JPL Horizons · elevación")).toBeTruthy();
    expect(screen.getByText("0,50 °")).toBeTruthy(); // media de |0,25| y |−0,75|
    expect(screen.getByText(/Media del error absoluto en 2 puntos de control de este sitio/)).toBeTruthy();
    expect(screen.getByText("El semáforo proyectado coincidió con Horizons en 5 de 6 controles.")).toBeTruthy();
    expect(document.querySelector("[data-error-pendiente]")).toBeNull();
  });
  it("la etiqueta «no efeméride», el aviso de horizonte ideal y las limitaciones de la API están siempre a la vista", async () => {
    montarRuta("admin");
    expect(screen.getAllByText("Proyección del modelo, no efeméride").length).toBeGreaterThan(0); // ya durante la carga
    expect(screen.getByText(/horizonte ideal \(Luna lisa, sin relieve\)/)).toBeTruthy();
    await screen.findByText("Limitación de prueba: no es efeméride.");
    expect(screen.getByText("Limitación de prueba: horizonte ideal.")).toBeTruthy();
    expect(screen.getByText("Limitación de prueba: no es efeméride.").closest("[inert]")).toBeNull(); // no van plegadas
  });
  it("acto 2: cada mes es un botón de 48 px con el semáforo en glifo + palabra; elegirlo muestra su detalle", async () => {
    montarRuta("admin");
    const lista = await screen.findByRole("list", { name: "Meses proyectados" });
    const meses = within(lista).getAllByRole("button");
    expect(meses).toHaveLength(3);
    for (const b of meses) expect(b).toHaveStyle({ minHeight: `${PROYECCION_MODELO.TACTIL_MIN_PX}px`, minWidth: `${PROYECCION_MODELO.TACTIL_MIN_PX}px` });
    const julio = within(lista).getByRole("button", { name: /^julio de 2027\. Energía: Con reservas\. Comunicación: Crítico\./ });
    expect(within(julio).getByText("Con reservas")).toBeTruthy();
    expect(within(julio).getByText("Crítico")).toBeTruthy();
    fireEvent.click(julio);
    expect(julio.getAttribute("aria-pressed")).toBe("true");
    const detalle = document.querySelector("[data-detalle-mes='2027-07']") as HTMLElement;
    expect(within(detalle).getByText("44,5 %")).toBeTruthy();
    expect(within(detalle).getByText("≥ 120 h")).toBeTruthy(); // indicador que sí llegó
    expect(within(detalle).queryByText("Sin enlace con la Tierra")).toBeNull(); // el que no llegó no se inventa
    fireEvent.click(julio);
    expect(julio.getAttribute("aria-pressed")).toBe("false");
  });
  it("marca como parciales el primer y el último mes cuando la serie no los cubre", async () => {
    montarRuta("admin");
    const lista = await screen.findByRole("list", { name: "Meses proyectados" });
    expect(within(lista).getByRole("button", { name: /^junio de 2027.*Mes parcial\.$/ })).toBeTruthy();
    expect(within(lista).getByRole("button", { name: /^agosto de 2027/ }).getAttribute("aria-label")).not.toMatch(/Mes parcial/);
    expect(lista.querySelectorAll("[data-mes-parcial]")).toHaveLength(1);
  });
  it("la serie lleva la banda que crece con el horizonte y sus cifras en texto", async () => {
    montarRuta("admin");
    const grafico = await screen.findByRole("img", { name: /Elevación proyectada del Sol y de la Tierra en Cráter Shackleton.*no efeméride/ });
    const figura = grafico.closest("figure") as HTMLElement;
    expect(figura.dataset.banda).toBe("horizonte");
    expect(figura.querySelectorAll("[data-banda-astro]")).toHaveLength(2);
    expect(within(figura).getByText(/Sol: entre −0,8° y 1,2° · Tierra: entre −2,0° y 5,5°/)).toBeTruthy();
    expect(within(figura).getByText(/se ensancha cuanto más lejos del entrenamiento/)).toBeTruthy();
    expect(within(figura).getByText(/Fechas en UTC/)).toBeTruthy();
  });
  it("acto 3: método, entrenamiento y el Sello con la huella del sitio", async () => {
    montarRuta("admin");
    await screen.findByRole("heading", { level: 2, name: "Cómo se hizo esta proyección" });
    expect(screen.getByText("Armónicos de prueba")).toBeTruthy();
    expect(screen.getByText("2026-12-01 → 2027-06-01")).toBeTruthy();
    const sello = screen.getByRole("region", { name: "Certificado de procedencia" });
    expect(within(sello).getByTitle(HUELLA)).toBeTruthy();
    expect(within(sello).getByText("Sin verificar")).toBeTruthy(); // sin certificado del análisis no se presta ninguna firma
  });
  it("cambiar el detalle de la serie vuelve a pedir con ese paso", async () => {
    montarRuta("admin");
    await screen.findByRole("list", { name: "Meses proyectados" });
    fireEvent.click(screen.getByRole("radio", { name: "24 h" }));
    await waitFor(() => expect(aProyeccion().at(-1)).toBe("/api/proyeccion?site_id=shackleton&paso_horas=24"));
  });
});

describe("campos de error en null: se deja el hueco, no se inventa", () => {
  it("sin por_horizonte ni control: «pendiente de validar», RMSE como héroe y banda fija", async () => {
    proyeccion = () => respuesta(mock({ por_horizonte: null, control_horizons: null, aciertos_semaforo_control: null }));
    montarRuta("admin");
    await screen.findByText("Error típico (RMSE) · elevación del Sol");
    expect(screen.getByText("0,31 °")).toBeTruthy();
    expect(screen.getAllByText("Error a largo plazo pendiente de validar.").length).toBeGreaterThan(0);
    expect(screen.queryByText("Error medido contra JPL Horizons · elevación")).toBeNull();
    expect(screen.queryByText(/coincidió con Horizons/)).toBeNull();
    expect((screen.getByRole("img", { name: /Elevación proyectada/ }).closest("figure") as HTMLElement).dataset.banda).toBe("fija");
  });
  it("sin ningún error (error: null): ni cifra héroe ni banda", async () => {
    proyeccion = () => respuesta(mock(null));
    montarRuta("admin");
    await screen.findByText("El modelo no informa de su error medido: toma la proyección solo como orientación.");
    expect(document.querySelector("[data-error-heroe]")?.getAttribute("data-error-heroe")).toBe("ninguno");
    const figura = screen.getByRole("img", { name: /Elevación proyectada/ }).closest("figure") as HTMLElement;
    expect(figura.dataset.banda).toBe("ninguna");
    expect(figura.querySelectorAll("[data-banda-astro]")).toHaveLength(0);
    expect(within(figura).getByText("El modelo no informa de su error: la serie se dibuja sin banda.")).toBeTruthy();
  });
  it("sitio sin archivo (serie y meses vacíos, huella null): sin veredicto, sin serie y sin Sello", async () => {
    proyeccion = () => respuesta(mock({}, { serie: [], meses: [], sha3_256: null }));
    montarRuta("admin");
    await screen.findByText("Sin veredicto");
    expect(screen.queryByRole("list", { name: "Meses proyectados" })).toBeNull();
    expect(screen.getByText("No hay muestras de la serie en este periodo.")).toBeTruthy();
    expect(screen.queryByRole("region", { name: "Certificado de procedencia" })).toBeNull();
    expect(screen.getByText(/no tiene archivo de efemérides/)).toBeTruthy();
  });
});

describe("respuesta vacía real (aún no hay CSV): nada se cae", () => {
  const LIMITACIONES = [
    { codigo: "proyeccion_no_es_efemeride", mensaje: "Limitación de prueba: no es efeméride." },
    { codigo: "horizonte_ideal", mensaje: "Limitación de prueba: horizonte ideal." },
    { codigo: "sin_datos_de_proyeccion", mensaje: "Limitación de prueba: sin datos." },
    { codigo: "modelo_no_disponible", mensaje: "Limitación de prueba: sin modelo." },
  ];
  const sinDatos = [{ site_id: "shackleton", sha3_256: null, serie: [], meses: [] }];
  const comprobar = async () => {
    await screen.findByText("Sin veredicto");
    for (const l of LIMITACIONES) expect(screen.getByText(l.mensaje)).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Cómo se hizo esta proyección" })).toBeTruthy();
    expect(screen.getAllByText("Error a largo plazo pendiente de validar.").length).toBeGreaterThan(0);
    expect(screen.getByText("No hay muestras de la serie en este periodo.")).toBeTruthy();
    expect(screen.getByText(/no tiene archivo de efemérides/)).toBeTruthy();
    expect(screen.queryByText("Método")).toBeNull(); // lo que llega en null no se rotula ni se rellena
    expect(screen.queryByText("Entrenado con datos de")).toBeNull();
    expect(document.body.textContent).not.toMatch(/undefined|null|NaN/);
  };
  it("modelo con todos sus campos en null, serie y meses vacíos y huella null", async () => {
    proyeccion = () => respuesta({
      origen: "proyeccion",
      modelo: { version: null, metodo: null, entrenado_desde: null, entrenado_hasta: null, proyectado_hasta: null,
        error: { rmse_deg: null, por_horizonte: null, control_horizons: null, aciertos_semaforo_control: null } },
      limitaciones: LIMITACIONES, resultados: sinDatos,
    });
    montarRuta("admin");
    await comprobar();
  });
  it("modelo null entero, o con el error en null", async () => {
    proyeccion = () => respuesta({ origen: "proyeccion", modelo: null, limitaciones: LIMITACIONES, resultados: sinDatos });
    const { unmount } = montarRuta("admin");
    await comprobar();
    unmount();
    proyeccion = () => respuesta({ origen: "proyeccion", modelo: { version: null, metodo: null, entrenado_desde: null, entrenado_hasta: null, proyectado_hasta: null, error: null }, limitaciones: LIMITACIONES, resultados: sinDatos });
    montarRuta("admin");
    await comprobar();
  });
  it("campos sueltos en null dentro de una respuesta con datos (limitaciones, control, meses sin semáforo)", async () => {
    const base = mock({ control_horizons: [{ site_id: "shackleton", utc: null, variable: null, error_deg: 0.3 }] as never });
    proyeccion = () => respuesta({ ...base, limitaciones: null, modelo: { ...base.modelo, metodo: null, entrenado_hasta: null },
      resultados: [{ ...base.resultados[0], meses: [...base.resultados[0].meses, { mes: "2027-09", pct_sol: null, pct_tierra: null, semaforo: null }] }] });
    montarRuta("admin");
    const lista = await screen.findByRole("list", { name: "Meses proyectados" });
    expect(within(lista).getAllByRole("button")).toHaveLength(3); // el mes sin semáforo no se pinta
    expect(screen.getByText("v-prueba")).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/undefined|NaN/);
  });
});

describe("errores del servidor: el traductor existente", () => {
  const error = (codigo: string, estado: number, titulo: string) => respuesta({ detail: titulo, error: { codigo, estado, titulo, mensaje: "Mensaje de prueba.", accion: "Acción de prueba.", request_id: "req-prueba" } }, estado);
  it("403 ROL_INSUFICIENTE: aviso estándar, sin reintentos automáticos", async () => {
    proyeccion = () => error("ROL_INSUFICIENTE", 403, "Sin permiso");
    montarRuta("admin");
    const aviso = await screen.findByRole("alert");
    expect(within(aviso).getByText("Sin permiso")).toBeTruthy();
    expect(within(aviso).getByText("req-prueba")).toBeTruthy();
    expect(aProyeccion()).toHaveLength(1);
    expect(screen.queryByRole("heading", { level: 2 })).toBeNull();
  });
  it("401 sin sesión válida y 503 PROYECCION_INVALIDA", async () => {
    proyeccion = () => error("NO_AUTORIZADO", 401, "Falta autorización");
    const { unmount } = montarRuta("admin");
    expect(within(await screen.findByRole("alert")).getByText("Falta autorización")).toBeTruthy();
    unmount();
    proyeccion = () => error("PROYECCION_INVALIDA", 503, "Proyección no disponible");
    montarRuta("admin");
    const aviso = await screen.findByRole("alert");
    expect(within(aviso).getByText("Proyección no disponible")).toBeTruthy();
    expect(within(aviso).getByRole("button", { name: "Reintentar" })).toBeTruthy();
  });
});
