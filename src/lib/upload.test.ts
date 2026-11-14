import { describe, expect, it, vi } from "vitest";
import { ApiError, ErrorDeRed } from "./errores";
import type { InformeCsv, ResultadoGuardado } from "./tipos";
import { ClaveInvalida, ServicioNoDisponible, agregarArchivos, agrupar, contar, crearArchivo, detectarTipo, guardarEnSecuencia,
  puedeValidar, reiniciar, soloNoGuardados, validarEnSecuencia, type ArchivoCarga, type Envio } from "./upload";

const csv = (nombre: string, bytes = 100) => new File([new Uint8Array(bytes)], nombre, { type: "text/csv" });
const informe = (archivo: string, extra: Partial<InformeCsv> = {}): InformeCsv => ({
  archivo, tipo: "efemerides", valido: true, total_filas: 744, total_errores: 0, errores: [], advertencias: [], ...extra,
});
/** Aplica los cambios como lo hace el hook, para ver el estado final de cada archivo. */
function seguir(lista: ArchivoCarga[]) {
  const estado = new Map(lista.map((a) => [a.id, a]));
  const pasos: string[] = [];
  return {
    alCambiar: (id: string, cambio: Partial<ArchivoCarga>) => {
      estado.set(id, { ...estado.get(id)!, ...cambio });
      pasos.push(`${estado.get(id)!.archivo.name}:${cambio.estado}`);
    },
    final: () => lista.map((a) => estado.get(a.id)!),
    pasos,
  };
}
const envio = (validar: Envio["validar"], guardar: Envio["guardar"] = vi.fn()): Envio => ({ validar, guardar });

describe("tipo por nombre y límites", () => {
  it("detecta el tipo por el nombre del archivo", () => {
    expect(detectarTipo("sites.csv")).toEqual({ tipo: "sites", siteId: null });
    expect(detectarTipo("metricas.csv")).toEqual({ tipo: "metricas", siteId: null });
    expect(detectarTipo("efemerides_im1_odysseus.csv")).toEqual({ tipo: "efemerides", siteId: "im1_odysseus" });
    expect(detectarTipo("efemerides_sitio-con-guion.csv")?.siteId).toBe("sitio-con-guion");
    expect(detectarTipo("foo.csv")).toBeNull();
    expect(detectarTipo("Sites.csv")).toBeNull();
  });
  it("marca los archivos que no pueden continuar", () => {
    expect(crearArchivo(csv("foo.csv")).errorLocal).toMatch(/Nombre no reconocido/);
    expect(crearArchivo(csv("sites.txt")).errorLocal).toMatch(/\.csv/);
    expect(crearArchivo(csv("sites.csv", 5 * 1024 * 1024 + 1)).errorLocal).toMatch(/5 MB/);
    expect(crearArchivo(csv("sites.csv", 0)).errorLocal).toMatch(/vacío/);
    expect(crearArchivo(csv("sites.csv")).errorLocal).toBeNull();
  });
  it("un nombre no reconocido bloquea «Validar» hasta quitarlo", () => {
    const { lista } = agregarArchivos([], [csv("sites.csv"), csv("foo.csv")]);
    expect(puedeValidar(lista)).toBe(false);
    expect(puedeValidar(lista.filter((a) => !a.errorLocal))).toBe(true);
    expect(puedeValidar([])).toBe(false);
  });
  it("rechaza el archivo número 11 y los repetidos", () => {
    const diez = Array.from({ length: 10 }, (_, i) => csv(`efemerides_sitio${i}.csv`));
    const lleno = agregarArchivos([], diez);
    expect(lleno.aviso).toBeNull();
    const once = agregarArchivos(lleno.lista, [csv("sites.csv")]);
    expect(once.lista).toHaveLength(10);
    expect(once.aviso).toMatch(/10 archivos/);
    expect(agregarArchivos(lleno.lista.slice(0, 2), [csv("efemerides_sitio0.csv")]).aviso).toMatch(/ya estaba/);
  });
});

describe("validación en secuencia", () => {
  const lista = agregarArchivos([], [csv("efemerides_shackleton.csv"), csv("metricas.csv"), csv("sites.csv")]).lista;
  it("envía un archivo tras otro, con los sitios primero, y no cambia el orden de la lista", async () => {
    const enCurso: number[] = [];
    let activos = 0;
    const validar = vi.fn(async (_tipo, archivo: File) => {
      enCurso.push(++activos);
      await Promise.resolve();
      activos--;
      return informe(archivo.name);
    });
    const s = seguir(lista);
    await validarEnSecuencia(lista, "clave", s.alCambiar, envio(validar));
    expect(validar.mock.calls.map((c) => c[1].name)).toEqual(["sites.csv", "efemerides_shackleton.csv", "metricas.csv"]);
    expect(Math.max(...enCurso)).toBe(1); // nunca dos peticiones a la vez
    expect(s.final().map((a) => a.archivo.name)).toEqual(lista.map((a) => a.archivo.name));
    expect(s.final().every((a) => a.estado === "valido")).toBe(true);
  });
  it("interpreta el informe del 422 y las advertencias", async () => {
    const error = { fila: 12, columna: "sol_el_deg", codigo: "E_RANGO", mensaje: "Debe estar entre -90 y 90", valor: "123.4" };
    const validar = vi.fn(async (_t, archivo: File) => {
      if (archivo.name === "efemerides_shackleton.csv") throw new ApiError(422, informe(archivo.name, { valido: false, total_errores: 1, errores: [error] }));
      if (archivo.name === "sites.csv") return informe(archivo.name, { advertencias: [{ ...error, codigo: "W_COORD_DUPLICADA" }] });
      return informe(archivo.name);
    });
    const s = seguir(lista);
    await validarEnSecuencia(lista, "clave", s.alCambiar, envio(validar));
    const final = s.final();
    expect(final.map((a) => a.estado)).toEqual(["errores", "valido", "advertencias"]);
    expect(final[0].informe?.errores[0]).toMatchObject({ fila: 12, columna: "sol_el_deg" });
    // Agrupación única: válido → advertencias → errores
    expect(agrupar(final).map((a) => a.archivo.name)).toEqual(["metricas.csv", "sites.csv", "efemerides_shackleton.csv"]);
    expect(contar(final)).toMatchObject({ guardables: 2, conErrores: 1 });
  });
  it("un rechazo sin informe (413, 415) deja el mensaje del servidor", async () => {
    const s = seguir(lista.slice(0, 1));
    await validarEnSecuencia(lista.slice(0, 1), "k", s.alCambiar, envio(async () => { throw new ApiError(413, "Máximo 5 MB"); }));
    expect(s.final()[0]).toMatchObject({ estado: "errores", mensaje: "Máximo 5 MB" });
  });
  it("un 401 corta la tanda para volver a pedir la clave", async () => {
    const validar = vi.fn(async () => { throw new ApiError(401, "API key inválida o ausente"); });
    const s = seguir(lista);
    await expect(validarEnSecuencia(lista, "mala", s.alCambiar, envio(validar))).rejects.toBeInstanceOf(ClaveInvalida);
    expect(validar).toHaveBeenCalledTimes(1);
    expect(s.final().every((a) => a.estado === "pendiente")).toBe(true);
  });
  it("la red caída o un 5xx se pueden reintentar sin perder nada", async () => {
    const s = seguir(lista);
    await expect(validarEnSecuencia(lista, "k", s.alCambiar, envio(async () => { throw new ErrorDeRed(); }))).rejects.toBeInstanceOf(ServicioNoDisponible);
    await expect(validarEnSecuencia(lista, "k", s.alCambiar, envio(async () => { throw new ApiError(503, "x"); }))).rejects.toBeInstanceOf(ServicioNoDisponible);
    expect(s.final()).toHaveLength(3);
    expect(s.final().every((a) => a.estado === "pendiente")).toBe(true);
  });
});

describe("guardado", () => {
  const base = agregarArchivos([], [csv("sites.csv"), csv("metricas.csv"), csv("efemerides_shackleton.csv")]).lista;
  const lista: ArchivoCarga[] = [{ ...base[0], estado: "valido" }, { ...base[1], estado: "advertencias" }, { ...base[2], estado: "errores" }];
  const guardado = (archivo: string): ResultadoGuardado => ({ ...informe(archivo), guardado: true, copia_historial: null });
  it("guarda solo los válidos y los que tienen advertencias", async () => {
    const guardar = vi.fn(async (_t, archivo: File) => guardado(archivo.name));
    const s = seguir(lista);
    await guardarEnSecuencia(lista, "k", s.alCambiar, envio(vi.fn(), guardar));
    expect(guardar.mock.calls.map((c) => c[1].name)).toEqual(["sites.csv", "metricas.csv"]);
    expect(s.final().map((a) => a.estado)).toEqual(["guardado", "guardado", "errores"]);
    expect(contar(s.final())).toMatchObject({ guardados: 2, noGuardados: 1 });
  });
  it("un doble clic envía un solo POST por archivo", async () => {
    const guardar = vi.fn(async (_t, archivo: File) => guardado(archivo.name));
    const s = seguir(lista);
    const [primero, segundo] = await Promise.all([
      guardarEnSecuencia(lista, "k", s.alCambiar, envio(vi.fn(), guardar)),
      guardarEnSecuencia(lista, "k", s.alCambiar, envio(vi.fn(), guardar)),
    ]);
    expect([primero, segundo]).toEqual([true, false]);
    expect(guardar).toHaveBeenCalledTimes(2);
  });
  it("«Anterior» no pierde archivos y «Revisar los no guardados» deja solo esos", () => {
    const mezcla: ArchivoCarga[] = [{ ...base[0], estado: "guardado" }, { ...base[1], estado: "no_guardado" }, { ...base[2], estado: "errores" }];
    expect(reiniciar(lista).map((a) => a.estado)).toEqual(["pendiente", "pendiente", "pendiente"]);
    expect(soloNoGuardados(mezcla).map((a) => [a.archivo.name, a.estado])).toEqual([["metricas.csv", "errores"], ["efemerides_shackleton.csv", "errores"]]);
  });
  it("si el servidor rechaza al guardar, el archivo queda como no guardado con su informe", async () => {
    const guardar = vi.fn(async (_t, archivo: File) => { throw new ApiError(422, informe(archivo.name, { valido: false, total_errores: 3 })); });
    const s = seguir(lista.slice(0, 1));
    await guardarEnSecuencia(lista.slice(0, 1), "k", s.alCambiar, envio(vi.fn(), guardar));
    expect(s.final()[0]).toMatchObject({ estado: "no_guardado", informe: { total_errores: 3 } });
  });
});
