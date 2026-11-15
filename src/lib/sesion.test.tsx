import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Acceso, { errorDeAcceso } from "../routes/Acceso";
import Perfil from "../routes/Perfil";
import { ApiError } from "./errores";
import { CLAVE_DE_SESION, accesoApi, cerrarSesion, iniciales, iniciarSesion, leerHuellas, leerUsuario, obtenerSesion } from "./sesion";

const url = (ruta: string) => ruta;
const YO = { id: "u-1", nombre: "Persona de Prueba", rol: "analista", huellas: [{ algoritmo: "ML-KEM-1024", huella: "aa11" }, { algoritmo: "ML-DSA-65", huella: "bb22" }] };
const SECRETO = "contraseña-de-la-prueba";
const json = (estado: number, cuerpo: unknown) => new Response(JSON.stringify(cuerpo), { status: estado, headers: { "Content-Type": "application/json" } });

/** Backend simulado: login correcto solo con SECRETO; /me responde según haya «cookie». */
function simularBackend({ yo = YO as unknown } = {}) {
  let sesion = false;
  const llamadas: { ruta: string; init: RequestInit }[] = [];
  const fetchFalso = vi.fn(async (ruta: RequestInfo | URL, init: RequestInit = {}) => {
    llamadas.push({ ruta: String(ruta), init });
    if (String(ruta).endsWith("/api/auth/login")) {
      const { password } = JSON.parse(String(init.body)) as { password: string };
      if (password !== SECRETO) return json(401, { detail: "Credenciales no válidas" });
      sesion = true;
      return json(200, yo); // el login real devuelve el usuario (UsuarioActualOut)
    }
    if (String(ruta).endsWith("/api/auth/logout")) {
      sesion = false;
      return json(200, {});
    }
    return sesion ? json(200, yo) : json(401, { detail: "Sin sesión" });
  });
  vi.stubGlobal("fetch", fetchFalso);
  return { llamadas, fetchFalso, abrir: () => { sesion = true; }, caducar: () => { sesion = false; } };
}
const almacenado = () => JSON.stringify([{ ...localStorage }, { ...sessionStorage }]);

beforeEach(() => {
  localStorage.removeItem("apogeo.sesion");
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("contrato de la sesión", () => {
  it("lee la respuesta real de /api/auth/me: las huellas vienen en `claves` como huella_sha3_256", () => {
    const real = {
      id: "6f1c1c1e-6a52-4c53-a4f0-3b6c6c3d9a10", nombre: "Analista de prueba", rol: "analista",
      claves: [
        { id: "0d9f2c1a-4b7e-4f43-9d0e-6d7c1a2b3c4d", tipo: "kem", algoritmo: "ML-KEM-1024", estado: "activa", huella_sha3_256: "9b2f0c4d" },
        { id: "1d9f2c1a-4b7e-4f43-9d0e-6d7c1a2b3c4d", tipo: "firma", algoritmo: "ML-DSA-65", estado: "activa", huella_sha3_256: "7e1a3b5c" },
      ],
    };
    expect(leerUsuario(real)).toEqual({
      id: real.id, nombre: real.nombre, rol: "analista",
      huellas: [{ algoritmo: "ML-KEM-1024", huella: "9b2f0c4d" }, { algoritmo: "ML-DSA-65", huella: "7e1a3b5c" }],
    });
    expect(leerUsuario({ ...real, claves: [] })?.huellas).toEqual([]);
  });
  it("lee solo id, nombre, rol y huellas; sin un rol conocido no hay sesión", () => {
    expect(leerUsuario({ ...YO, privada_pem: "NO", token: "NO" })).toEqual(YO);
    expect(leerUsuario({ ...YO, rol: "superusuario" })).toBeNull();
    expect(leerUsuario({ nombre: "x", rol: "admin" })).toBeNull();
    expect(leerUsuario(null)).toBeNull();
  });
  it("las huellas admiten lista u objeto y nunca arrastran otros campos", () => {
    expect(leerHuellas([{ algoritmo: "ML-DSA-65", huella_sha3_256: "cc33", privada_pem: "NO" }, { algoritmo: "x" }])).toEqual([{ algoritmo: "ML-DSA-65", huella: "cc33" }]);
    expect(leerHuellas({ "ML-KEM-1024": "aa11", vacia: "" })).toEqual([{ algoritmo: "ML-KEM-1024", huella: "aa11" }]);
    expect(leerHuellas(undefined)).toEqual([]);
  });
  it("con sesión las peticiones llevan credenciales y X-Requested-With; sin ella, la clave de API", () => {
    expect(accesoApi(CLAVE_DE_SESION)).toEqual({ headers: { "X-Requested-With": "XMLHttpRequest" }, credentials: "include" });
    expect(accesoApi("clave")).toEqual({ headers: { "X-API-Key": "clave" } });
  });
  it("saca las iniciales del nombre", () => {
    expect(iniciales("Persona de Prueba")).toBe("PP");
    expect(iniciales("ñandú")).toBe("Ñ");
    expect(iniciales("  ")).toBe("?");
  });
});

describe("flujo de sesión con respuestas simuladas", () => {
  it("sin indicio de sesión no se pregunta al servidor", async () => {
    const { fetchFalso } = simularBackend();
    expect(await obtenerSesion(url)).toBeNull();
    expect(fetchFalso).not.toHaveBeenCalled();
  });
  it("entrar → me → salir; la contraseña solo viaja en el cuerpo del login y nada sensible se guarda", async () => {
    const { llamadas } = simularBackend();
    expect(await iniciarSesion(url, "persona@ejemplo.test", SECRETO)).toEqual(YO);
    expect(llamadas.map((l) => `${l.init.method ?? "GET"} ${l.ruta}`)).toEqual(["POST /api/auth/login"]);
    for (const { init } of llamadas) {
      expect(init.credentials).toBe("include");
      expect((init.headers as Record<string, string>)["X-Requested-With"]).toBe("XMLHttpRequest");
    }
    expect(almacenado()).not.toContain(SECRETO);
    expect(almacenado()).not.toContain("persona@ejemplo.test");
    expect(localStorage.getItem("apogeo.sesion")).toBe("1"); // solo el indicio
    expect(await obtenerSesion(url)).toEqual(YO);
    expect(llamadas[1]).toMatchObject({ ruta: "/api/auth/me" });
    expect(llamadas[1].init.body).toBeUndefined(); // /me no lleva cuerpo: la contraseña no vuelve a viajar
    await cerrarSesion(url);
    expect(localStorage.getItem("apogeo.sesion")).toBeNull();
    expect(await obtenerSesion(url)).toBeNull();
  });
  it("una contraseña incorrecta lanza un 401 y no deja indicio", async () => {
    simularBackend();
    await expect(iniciarSesion(url, "persona@ejemplo.test", "otra")).rejects.toMatchObject({ status: 401 });
    expect(localStorage.getItem("apogeo.sesion")).toBeNull();
  });
  it("si la sesión caduca, el 401 de /me borra el indicio", async () => {
    const backend = simularBackend();
    await iniciarSesion(url, "persona@ejemplo.test", SECRETO);
    backend.caducar();
    expect(await obtenerSesion(url)).toBeNull();
    expect(localStorage.getItem("apogeo.sesion")).toBeNull();
  });
  it("el error de acceso habla de correo y contraseña, y respeta el título del backend en español", () => {
    expect(errorDeAcceso(new ApiError(401, "Credenciales no válidas"), "es").mensaje).toBe("El correo o la contraseña no son correctos.");
    const backend = { codigo: "CREDENCIALES_INVALIDAS", estado: 401, titulo: "Acceso denegado", mensaje: "Correo o contraseña incorrectos.", accion: "Inténtalo de nuevo." };
    expect(errorDeAcceso(new ApiError(401, "", backend), "es")).toMatchObject({ titulo: "Acceso denegado", mensaje: "Correo o contraseña incorrectos." });
    expect(errorDeAcceso(new ApiError(401, "", backend), "en").titulo).toBe("No se pudo iniciar sesión"); // catálogo propio (en las pruebas, el español)
    expect(errorDeAcceso(new ApiError(429, "")).titulo).toBe("Demasiadas peticiones");
  });
});

describe("pantallas de Acceso y Mi perfil", () => {
  const montar = (ruta: string, pantalla: JSX.Element) =>
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter initialEntries={[ruta]}>{pantalla}</MemoryRouter></QueryClientProvider>);
  const rellenar = (password: string) => {
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "persona@ejemplo.test" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: password } });
    fireEvent.click(screen.getByRole("button", { name: "Iniciar sesión" }));
  };
  it("valida los campos vacíos sin llamar al servidor", async () => {
    const { fetchFalso } = simularBackend();
    montar("/acceso", <Acceso />);
    fireEvent.click(await screen.findByRole("button", { name: "Iniciar sesión" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Escribe el correo y la contraseña.");
    expect(fetchFalso).not.toHaveBeenCalled();
  });
  it("con credenciales incorrectas avisa y vacía la contraseña", async () => {
    simularBackend();
    montar("/acceso", <Acceso />);
    await screen.findByRole("button", { name: "Iniciar sesión" });
    rellenar("otra");
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("El correo o la contraseña no son correctos."));
    expect(screen.getByLabelText("Contraseña")).toHaveValue("");
    expect(screen.getByLabelText("Correo")).toHaveAttribute("aria-invalid", "true");
  });
  it("con credenciales correctas muestra quién ha entrado y su rol", async () => {
    simularBackend();
    montar("/acceso", <Acceso />);
    await screen.findByRole("button", { name: "Iniciar sesión" });
    rellenar(SECRETO);
    expect(await screen.findByText("Sesión iniciada como Persona de Prueba (Analista).")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Gestor de claves" })).not.toBeInTheDocument(); // solo para admin
    expect(screen.getByRole("link", { name: "Mi perfil" })).toBeInTheDocument();
  });
  it("Mi perfil muestra las huellas de las dos claves y qué protegen, nunca una privada", async () => {
    const backend = simularBackend({ yo: { ...YO, privada_pem: "-----BEGIN PRIVATE KEY-----" } });
    backend.abrir();
    localStorage.setItem("apogeo.sesion", "1");
    montar("/perfil", <Perfil />);
    expect(await screen.findByText("aa11")).toBeInTheDocument();
    expect(screen.getByText("bb22")).toBeInTheDocument();
    expect(screen.getByText(/^Cifrado\./)).toBeInTheDocument();
    expect(screen.getByText(/^Firma\./)).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("PRIVATE KEY");
  });
});
