import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, traducirError } from "./errores";
import { CLAVE_IDIOMA, IDIOMA, aplicarIdiomaAlDocumento, cambiarIdioma, detectarIdioma } from "./idioma";
import * as en from "./textos.en";
import * as es from "./textos.es";

/** Rutas de todas las hojas de un árbol de textos, con su tipo: 'carga.filas:function'. */
function hojas(valor: unknown, ruta = ""): string[] {
  if (Array.isArray(valor)) return [`${ruta}:lista(${valor.length})`, ...valor.flatMap((v, i) => hojas(v, `${ruta}[${i}]`))];
  if (valor && typeof valor === "object") return Object.entries(valor).flatMap(([k, v]) => hojas(v, ruta ? `${ruta}.${k}` : k));
  return [`${ruta}:${typeof valor}`];
}
function textos(valor: unknown): string[] {
  if (typeof valor === "string") return [valor];
  if (valor && typeof valor === "object") return Object.values(valor).flatMap(textos);
  return [];
}

describe("idioma de la interfaz", () => {
  afterEach(() => vi.restoreAllMocks());

  it("usa el guardado; si no, el del navegador; y si no se reconoce, inglés", () => {
    expect(detectarIdioma("es", ["en-US"])).toBe("es");
    expect(detectarIdioma("en", ["es-PE"])).toBe("en");
    expect(detectarIdioma(null, ["es-PE", "en"])).toBe("es");
    expect(detectarIdioma(null, ["ES"])).toBe("es");
    expect(detectarIdioma(null, ["en-GB"])).toBe("en");
    expect(detectarIdioma(null, ["fr-FR", "es-ES"])).toBe("es");
    expect(detectarIdioma(null, ["qu-PE", "de"])).toBe("en");
    expect(detectarIdioma("klingon", [])).toBe("en");
    expect(detectarIdioma(undefined)).toBe("en");
  });
  it("las pruebas corren en español y la clave guardada es la que fija el arranque de las pruebas", () => {
    expect(IDIOMA).toBe("es");
    expect(CLAVE_IDIOMA).toBe("apogeo.idioma");
  });
  it("pone el idioma en <html lang>", () => {
    aplicarIdiomaAlDocumento("en");
    expect(document.documentElement.lang).toBe("en");
    aplicarIdiomaAlDocumento();
    expect(document.documentElement.lang).toBe("es");
  });
  it("no recarga si el idioma ya es el activo ni si el navegador no deja guardar", () => {
    expect(cambiarIdioma("es")).toBe(false);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    expect(cambiarIdioma("en")).toBe(false);
  });
});

describe("textos en los dos idiomas", () => {
  it("no falta ni sobra ninguna clave, y cada una es del mismo tipo", () => {
    expect(hojas(en.T).sort()).toEqual(hojas(es.T).sort());
  });
  it("los dos módulos exportan lo mismo", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort());
    for (const [nombre, valor] of Object.entries(es)) expect(typeof (en as Record<string, unknown>)[nombre], nombre).toBe(typeof valor);
    for (const mapa of ["NOMBRE_ASTRO", "ARTICULO_ASTRO", "DEL_ASTRO", "NOMBRE_NIVEL", "FORMA_NIVEL", "NOMBRE_CATEGORIA", "FORMA_CATEGORIA"] as const) {
      expect(Object.keys(en[mapa]).sort(), mapa).toEqual(Object.keys(es[mapa]).sort());
    }
  });
  it("el catálogo de errores tiene los mismos estados y códigos", () => {
    expect(Object.keys(en.ERRORES_POR_ESTADO)).toEqual(Object.keys(es.ERRORES_POR_ESTADO));
    for (const [estado, e] of Object.entries(es.ERRORES_POR_ESTADO)) expect(en.ERRORES_POR_ESTADO[Number(estado)].codigo).toBe(e.codigo);
  });
  it("ningún texto en inglés queda vacío ni igual al español sin querer", () => {
    const vacios = hojas(en.T).filter((h) => h.endsWith(":string")).map((h) => h.split(":")[0]).filter((ruta) => {
      const valor = ruta.split(/[.[\]]+/).filter(Boolean).reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], en.T);
      return valor === "";
    });
    expect(vacios).toEqual([]);
    expect(en.T.nav.subir).not.toBe(es.T.nav.subir);
  });
  it("el pie conserva los nombres propios sin traducir", () => {
    expect(en.T.inicio.pie.autoria).toBe("Apogeo Team · Anthony Chavesta Pisfil · NASA Space Apps Chiclayo 2026");
    expect(en.T.inicio.pie.autoria).toBe(es.T.inicio.pie.autoria);
  });
});

describe("reglas de presentación del análisis, también en inglés", () => {
  const o = en.T.analisis.origen;
  it("lo subido y lo modificado nunca se presentan como datos de NASA", () => {
    for (const texto of [...textos(o.subido), o.subido.texto("2026-11-14 10:00", "API key"), ...textos(o.modificado), ...textos(o.sinRegistro)]) {
      expect(texto).not.toMatch(/NASA|JPL|Horizons/i);
    }
    expect(o.subido.sinFecha).toMatch(/not the project's seed data/);
    expect(o.semilla.titulo).toMatch(/NASA/);
  });
  it("el R² se presenta como ajuste interno", () => {
    expect(en.T.analisis.modelo.r2).toBe("Fit within the data (R²)");
    expect(en.T.analisis.modelo.r2Nota).toMatch(/does not say how well it does beyond/);
  });
  it("el RMSE es optimista y no es un intervalo, en la cifra y en las dos bandas", () => {
    const s = en.T.analisis.serie;
    for (const texto of [en.T.analisis.validacion.rmse, s.banda("0.5°"), s.bandaReferencia("0.5°")]) expect(texto).toContain("optimistic; not an interval");
  });
  it("observado y ajustado solo existen dentro de los datos; lo proyectado, fuera", () => {
    const s = en.T.analisis.serie;
    expect(s.observado).toMatch(/data/);
    expect(s.ajustado).toMatch(/within the data/);
    expect(s.proyectado).toMatch(/estimate, beyond the data/);
  });
  it("cargado_por solo admite las tres categorías del contrato, nunca una identidad", () => {
    expect(Object.keys(o.quienes).sort()).toEqual(Object.keys(es.T.analisis.origen.quienes).sort());
    expect(Object.keys(o.quienes)).toHaveLength(3);
    expect(Object.values(o.quienes)).toEqual(["API key", "registered user", "anonymous"]);
    expect(o.quienNoConsta).toBe("unidentified origin");
  });
});

describe("errores del backend según el idioma", () => {
  const backend = { codigo: "DATOS_INVALIDOS", estado: 422, titulo: "Datos inválidos", mensaje: "La latitud no es válida", accion: "Corrige la latitud" };
  it("en español se muestran el título y el mensaje del backend tal cual", () => {
    expect(traducirError(new ApiError(422, "", backend), "es")).toMatchObject({ titulo: "Datos inválidos", mensaje: "La latitud no es válida", sugerencia: "Corrige la latitud" });
  });
  it("en otro idioma se traducen por su código y, si no se conoce, por el estado", () => {
    // El catálogo activo en las pruebas es el español: se comprueba que NO se cuela el texto del backend.
    const porCodigo = traducirError(new ApiError(400, "", { ...backend, codigo: "DEMASIADAS_PETICIONES" }), "en");
    expect(porCodigo).toMatchObject({ codigo: "DEMASIADAS_PETICIONES", titulo: es.ERRORES_POR_ESTADO[429].titulo, mensaje: es.ERRORES_POR_ESTADO[429].mensaje });
    const porEstado = traducirError(new ApiError(422, "detalle en español", { ...backend, codigo: "CODIGO_NUEVO" }), "en");
    expect(porEstado).toMatchObject({ codigo: "CODIGO_NUEVO", titulo: es.ERRORES_POR_ESTADO[422].titulo, mensaje: es.ERRORES_POR_ESTADO[422].mensaje });
    expect(JSON.stringify([porCodigo, porEstado])).not.toMatch(/latitud|detalle en español/);
  });
});

/** Códigos del catálogo del backend (`app/core/mensajes.py`: BASE + DOMINIO). Si allí se añade uno, se añade aquí y en los dos idiomas. */
const CODIGOS_BACKEND = [
  "PETICION_INVALIDA", "NO_AUTORIZADO", "PROHIBIDO", "NO_ENCONTRADO", "METODO_NO_PERMITIDO", "CONFLICTO", "ARCHIVO_DEMASIADO_GRANDE",
  "TIPO_NO_SOPORTADO", "DATOS_INVALIDOS", "DEMASIADAS_PETICIONES", "ERROR_INTERNO", "SERVICIO_EXTERNO_FALLO", "SERVICIO_NO_DISPONIBLE", "TIEMPO_AGOTADO",
  "SITIO_NO_ENCONTRADO", "EFEMERIDES_NO_ENCONTRADAS", "MANIFIESTO_NO_GENERADO", "TIPO_DATOS_DESCONOCIDO", "USUARIO_NO_ENCONTRADO", "CLAVE_NO_ENCONTRADA",
  "CLAVE_INVALIDA", "RANGO_FECHAS_INVALIDO", "VARIABLE_INVALIDA", "RANGO_DEMASIADO_LARGO", "CSV_INVALIDO", "DATOS_NO_DISPONIBLES", "BD_NO_DISPONIBLE",
  "ALMACEN_NO_DISPONIBLE", "FIRMA_NO_DISPONIBLE", "CLAVE_DUPLICADA", "CLAVE_YA_REVOCADA", "USUARIO_INACTIVO",
  "CREDENCIALES_INVALIDAS", "SESION_INVALIDA", "ROL_INSUFICIENTE", "ORIGEN_NO_PERMITIDO", "DEMASIADOS_INTENTOS", // login (app/routers/auth.py)
  // backend PR 41: fechas y rangos, Horizons, carga y datos no disponibles
  "PASO_HORAS_INVALIDO", "DEMASIADOS_PUNTOS", "FECHA_FUERA_DE_DATOS", "FECHA_ANTES_DE_LOS_DATOS", "FECHA_FUERA_DE_PROYECCION",
  "RANGO_SIN_DATOS", "SITIO_REQUERIDO", "COMPARACION_SITIOS_INVALIDA", "HORIZONS_FECHAS_FUERA_DE_RANGO", "HORIZONS_LIMITE",
  "HORIZONS_OCUPADO", "HORIZONS_TIEMPO_AGOTADO", "HORIZONS_NO_DISPONIBLE", "HORIZONS_RESPUESTA_INVALIDA", "HORIZONS_RESULTADO_NO_VALIDO",
  "CARGA_EN_CONFLICTO", "AUDITORIA_NO_DISPONIBLE", "CATALOGO_NO_DISPONIBLE", "CATALOGO_INVALIDO", "EFEMERIDES_INVALIDAS",
  "METRICAS_INVALIDAS", "SIMULACION_NO_DISPONIBLE",
];
describe("catálogo de códigos de error del backend", () => {
  const catalogo = (m: typeof es | typeof en) => ({ ...Object.fromEntries(Object.values(m.ERRORES_POR_ESTADO).map((e) => [e.codigo, e])), ...m.ERRORES_DE_DOMINIO });
  it.each(CODIGOS_BACKEND)("%s tiene título, mensaje y acción en español y en inglés", (codigo) => {
    for (const entrada of [catalogo(es)[codigo], catalogo(en)[codigo]]) {
      expect(entrada, codigo).toBeDefined();
      for (const campo of [entrada.titulo, entrada.mensaje, entrada.accion]) expect(campo.trim().length).toBeGreaterThan(3);
      expect(entrada.titulo.length).toBeLessThanOrEqual(40);
      expect(`${entrada.titulo}${entrada.mensaje}${entrada.accion}`).not.toMatch(/[{}]/); // sin plantillas sin rellenar
    }
  });
  it("los dos idiomas tienen exactamente los mismos códigos y ninguno fuera del catálogo del backend", () => {
    expect(Object.keys(catalogo(en)).sort()).toEqual([...CODIGOS_BACKEND].sort());
    expect(Object.keys(catalogo(es)).sort()).toEqual([...CODIGOS_BACKEND].sort());
  });
  it("el inglés de un código de dominio no repite el español ni el genérico de su estado", () => {
    for (const [codigo, e] of Object.entries(en.ERRORES_DE_DOMINIO)) expect(e.titulo, codigo).not.toBe(es.ERRORES_DE_DOMINIO[codigo].titulo);
    expect(en.ERRORES_DE_DOMINIO.SITIO_NO_ENCONTRADO.titulo).not.toBe(en.ERRORES_POR_ESTADO[404].titulo);
  });
  it("el traductor usa la entrada del código de dominio, no la genérica del estado", () => {
    // El catálogo activo en las pruebas es el español: se comprueba que se elige la entrada de dominio.
    const backend = { codigo: "SITIO_NO_ENCONTRADO", estado: 404, titulo: "Sitio no encontrado", mensaje: "No hay ningún sitio con el identificador «x».", accion: "Revisa" };
    const t = traducirError(new ApiError(404, "", backend), "en");
    expect(t).toMatchObject({ codigo: "SITIO_NO_ENCONTRADO", titulo: es.ERRORES_DE_DOMINIO.SITIO_NO_ENCONTRADO.titulo, mensaje: es.ERRORES_DE_DOMINIO.SITIO_NO_ENCONTRADO.mensaje, accion: "sitios" });
    expect(t.mensaje).not.toMatch(/«x»/);
    expect(traducirError(new ApiError(404, "", { ...backend, codigo: "constructor" }), "en").titulo).toBe(es.ERRORES_POR_ESTADO[404].titulo);
  });
  it("login: el 429 dice cuánto esperar y un rol insuficiente no ofrece introducir una clave", () => {
    const e = (codigo: string, estado: number) => ({ codigo, estado, titulo: "t", mensaje: "m", accion: "a" });
    const intentos = traducirError(new ApiError(429, "", e("DEMASIADOS_INTENTOS", 429), undefined, 42), "en");
    expect(intentos).toMatchObject({ codigo: "DEMASIADOS_INTENTOS", titulo: es.ERRORES_DE_DOMINIO.DEMASIADOS_INTENTOS.titulo, accion: "reintentar", esperaS: 42 });
    expect(intentos.sugerencia).toContain("42");
    expect(traducirError(new ApiError(403, "", e("ROL_INSUFICIENTE", 403)), "es")).toMatchObject({ titulo: "t", accion: "ninguna" });
    expect(traducirError(new ApiError(403, "", e("ORIGEN_NO_PERMITIDO", 403)), "en")).toMatchObject({ titulo: es.ERRORES_DE_DOMINIO.ORIGEN_NO_PERMITIDO.titulo, accion: "reintentar" });
    expect(traducirError(new ApiError(403, "", e("PROHIBIDO", 403)), "es").accion).toBe("clave");
  });
});
