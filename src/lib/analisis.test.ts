import { ANALISIS_GRAFICO } from "./constants";
import { describe, expect, it } from "vitest";
import { CODIGO_VALIDACION_AJENA, estadoValidacion, lienzoGrafico, limitacionesQueAplican, quienCargo, rmseDeValidacion, textoFirma, textoOrigen, tramosSerie, type OrigenDatos, type TipoOrigen, type ValidacionAnalisis } from "./analisis";
import { T } from "./textos";

const origen = (tipo: TipoOrigen, cargadoPor = "clave de API"): OrigenDatos => ({
  tipo, descripcion: "", sha3_256: "ab".repeat(32), coincide_con_semilla: tipo === "semilla_nasa",
  ultima_carga: tipo === "subido" ? { cargado_utc: "2026-11-14T10:00Z", archivo: "efemerides_shackleton.csv", sha3_256: "ab".repeat(32), coincide: true, cargado_por: cargadoPor } : null,
  manifiesto: null,
});
const fecha = (utc: string) => `el ${utc}`;
const LIMITACIONES = [
  { codigo: "horizonte_ideal", mensaje: "Horizonte ideal.", aplica: true },
  { codigo: "cenit_ecuador", mensaje: "Cenit.", aplica: false },
  { codigo: CODIGO_VALIDACION_AJENA, mensaje: "La validación se hizo con otros datos.", aplica: false },
];
const validacion = (extra: Partial<ValidacionAnalisis>): ValidacionAnalisis => ({ disponible: true, vigente: true, motivo: null, rmse_deg: { sol_el_deg: 0.2178 }, ...extra });

describe("regla 1 · validación vigente o de referencia", () => {
  it("si `vigente` es false, la validación es «de referencia» y aparece la limitación de otros datos", () => {
    const v = validacion({ vigente: false });
    expect(estadoValidacion(v)).toBe("referencia");
    expect(limitacionesQueAplican({ limitaciones: LIMITACIONES, validacion: v }).map((l) => l.codigo)).toEqual(["horizonte_ideal", CODIGO_VALIDACION_AJENA]);
    // aunque la API no mande la limitación, la interfaz la añade con su propio texto
    expect(limitacionesQueAplican({ limitaciones: LIMITACIONES.slice(0, 2), validacion: v }).at(-1)).toMatchObject({ codigo: CODIGO_VALIDACION_AJENA, mensaje: T.analisis.validacion.referenciaNota });
    expect(T.analisis.validacion.referencia).toBe("De referencia");
    expect(T.analisis.validacion.referenciaNota).toMatch(/otros datos/);
  });
  it("vigente: es propia y no se añade nada; sin validación: ausente", () => {
    expect(estadoValidacion(validacion({}))).toBe("propia");
    expect(limitacionesQueAplican({ limitaciones: LIMITACIONES, validacion: validacion({}) }).map((l) => l.codigo)).toEqual(["horizonte_ideal"]);
    expect(estadoValidacion(validacion({ disponible: false, vigente: false }))).toBe("ausente");
  });
});

describe("regla 2 · el origen solo afirma lo demostrable", () => {
  it("solo la semilla menciona a NASA", () => {
    expect(textoOrigen(origen("semilla_nasa"), fecha)).toMatchObject({ esNasa: true, titulo: "Datos de NASA/JPL Horizons" });
    for (const tipo of ["subido", "modificado", "sin_registro"] as const) {
      const o = textoOrigen(origen(tipo), fecha);
      expect(o.esNasa).toBe(false);
      expect(`${o.titulo} ${o.texto}`).not.toMatch(/NASA|JPL|Horizons/i);
    }
  });
  it("cada caso tiene su texto: subido da fecha, modificado dice que cambió fuera, sin registro no afirma procedencia", () => {
    expect(textoOrigen(origen("subido"), fecha).texto).toMatch(/No son la semilla.*el 2026-11-14T10:00Z, con clave de API/);
    expect(textoOrigen(origen("modificado"), fecha).texto).toMatch(/cambió fuera de la aplicación/);
    expect(textoOrigen(origen("sin_registro"), fecha).texto).toMatch(/no afirmar su procedencia/);
    expect(new Set((["semilla_nasa", "subido", "modificado", "sin_registro"] as const).map((t) => textoOrigen(origen(t), fecha).texto)).size).toBe(4);
  });
});

describe("regla 3 · R² no es acierto y el RMSE no es un intervalo", () => {
  it("los rótulos lo dicen", () => {
    expect(T.analisis.modelo.r2).toBe("Ajuste dentro de los datos (R²)");
    expect(T.analisis.modelo.r2Nota).toMatch(/No dice cuánto acierta fuera de ellos/);
    expect(T.analisis.validacion.rmse).toBe("RMSE de validación (optimista; no es un intervalo)");
    expect(T.analisis.serie.banda("0,22°")).toMatch(/RMSE de validación \(optimista; no es un intervalo\)/);
    expect(T.analisis.serie.bandaReferencia("0,22°")).toMatch(/otros datos.*no es un intervalo/);
  });
  it("la banda usa el RMSE de validación de la variable y no existe sin validación", () => {
    expect(rmseDeValidacion(validacion({}), "sol_el_deg")).toBe(0.2178);
    expect(rmseDeValidacion(validacion({}), "tierra_az_deg")).toBeNull();
    expect(rmseDeValidacion(validacion({ disponible: false }), "sol_el_deg")).toBeNull();
  });
});

describe("regla 4 · observado y ajustado dentro de los datos; proyectado, después", () => {
  it("separa los tramos y descarta lo que caiga fuera del suyo", () => {
    const tramos = tramosSerie(
      [
        { utc: "2027-05-31T00:00Z", observado: 1, ajustado: 1.1, proyectado: 9 }, // proyectado dentro de los datos: se descarta
        { utc: "2027-06-01T00:00Z", observado: 2, ajustado: 2.1, proyectado: null },
        { utc: "2027-06-02T00:00Z", observado: 7, ajustado: 7, proyectado: 3 }, // observado tras el fin: se descarta
      ],
      "2027-06-01T00:00Z",
    );
    expect(tramos.observado.map((p) => p.v)).toEqual([1, 2]);
    expect(tramos.ajustado.map((p) => p.v)).toEqual([1.1, 2.1]);
    expect(tramos.proyectado.map((p) => p.v)).toEqual([3]);
    expect(Math.max(...tramos.observado.map((p) => p.t))).toBeLessThanOrEqual(tramos.finMs);
    expect(Math.min(...tramos.proyectado.map((p) => p.t))).toBeGreaterThan(tramos.finMs);
  });
});

describe("regla 5 · quién cargó nunca es una identidad", () => {
  it("solo pasan las tres categorías del contrato", () => {
    for (const q of ["clave de API", "usuario registrado", "anónimo"]) expect(quienCargo(q)).toBe(q);
    for (const q of ["ana@ejemplo.org", "Ana Pérez", "", null, undefined]) expect(quienCargo(q)).toBe(T.analisis.origen.quienNoConsta);
    expect(textoOrigen(origen("subido", "ana@ejemplo.org"), fecha).texto).not.toMatch(/ana@/);
  });
});

describe("firma del manifiesto", () => {
  it("solo true es «firmado»; false es sin firma válida y null, no verificable", () => {
    expect(textoFirma(true)).toMatch(/^firmado/);
    expect(textoFirma(false)).toBe("sin firma válida");
    expect(textoFirma(null)).toBe("firma no verificable");
    expect(textoFirma(undefined)).toBe("firma no verificable");
    expect(textoFirma(false)).not.toMatch(/^firmado/);
  });
});

describe("lienzoGrafico", () => {
  const cfg = ANALISIS_GRAFICO.SERIE;
  it("antes de medir usa el ancho por defecto", () => {
    expect(lienzoGrafico(0, cfg)).toMatchObject({ ANCHO: cfg.ANCHO, MARGEN: cfg.MARGEN });
  });
  it("a 360 px de pantalla el viewBox mide lo que el contenedor: los rótulos no se encogen", () => {
    const l = lienzoGrafico(328, cfg);
    expect(l).toMatchObject({ ANCHO: 328, ALTO: cfg.ALTO_MIN, MARGEN: cfg.MARGEN_COMPACTO, marcasX: ANALISIS_GRAFICO.MARCAS_X.compacto });
  });
  it("nunca baja del ancho mínimo ni pasa del alto máximo", () => {
    expect(lienzoGrafico(120, cfg).ANCHO).toBe(ANALISIS_GRAFICO.ANCHO_MIN);
    expect(lienzoGrafico(2000, cfg).ALTO).toBe(cfg.ALTO_MAX);
    expect(lienzoGrafico(2000, cfg).marcasX).toBe(ANALISIS_GRAFICO.MARCAS_X.amplio);
  });
});
