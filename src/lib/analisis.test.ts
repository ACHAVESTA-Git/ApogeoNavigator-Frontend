import { ANALISIS_GRAFICO } from "./constants";
import { describe, expect, it } from "vitest";
import {
  CODIGO_VALIDACION_AJENA, PASOS_CONOCIDOS, estadoValidacion, lienzoGrafico, limitacionesQueAplican, nombreMedida, quienCargo, rmseDeValidacion,
  textoFirma, textoOrigen, textoPaso, tramosSerie, unidadMedida, valorTextoMedida, type OrigenDatos, type TipoOrigen, type ValidacionAnalisis,
} from "./analisis";
import * as en from "./textos.en";
import * as es from "./textos.es";
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

describe("textos del análisis que escribe la API", () => {
  // Lo que manda hoy GET /api/analisis/{site_id} (contrato del backend): los siete pasos y el rótulo de cada medida.
  const PASOS_API = [
    { id: "carga", nombre: "Carga del archivo", descripcion: "Se lee el CSV de efemérides del sitio, con la misma lectura segura que usa la carga de datos." },
    { id: "validacion_csv", nombre: "Validación del archivo", descripcion: "Se comprueba el estándar de CSV: cabecera, tipos, rangos, fechas en UTC, paso constante y saltos físicos." },
    { id: "features", nombre: "Cálculo de características con Polars", descripcion: "Se miden las ventanas de luz solar y de Tierra visible, las horas de Sol por día lunar y la libración." },
    { id: "fft", nombre: "Búsqueda de periodicidades (FFT)", descripcion: "Una transformada de Fourier busca los ritmos de la serie; el más fuerte es el mes sinódico, de unos 29,5 días." },
    { id: "ajuste", nombre: "Ajuste del modelo armónico", descripcion: "Se ajusta una suma de senos y cosenos con los periodos lunares." },
    { id: "validacion_horizons", nombre: "Validación contra Horizons", descripcion: "El modelo, entrenado solo con estos datos, predijo 12 meses que luego se compararon con los de JPL Horizons." },
    { id: "proyeccion", nombre: "Proyección", descripcion: "El modelo se extiende más allá del último dato, con la incertidumbre medida en esa validación." },
  ];
  const MEDIDAS_API = [
    "Filas leídas", "Tamaño del archivo", "Rango cubierto", "Paso entre filas", "Filas válidas", "Filas con error", "Huecos de tiempo",
    "Ventanas de Sol completas", "Duración media de una ventana de Sol", "Días lunares completos", "Horas de Sol por día lunar (media)",
    "Oscilación de la Tierra en azimut", "Oscilación de la Tierra en elevación", "Pico del mes sinódico (elevación del Sol)",
    "Periodo del pico más fuerte", "Resolución de la FFT en el mes sinódico", "Mes sinódico afinado", "Términos del modelo (cos y sen)",
    "R² medio del ajuste", "RMSE medio del ajuste dentro de los datos", "RMSE de la elevación del Sol", "RMSE del azimut de la Tierra",
    "Meses con el semáforo bien predicho", "Validación vigente", "Meses proyectables", "Incertidumbre del mes 1 (elevación del Sol)",
    "Incertidumbre del mes 12 (elevación del Sol)",
  ];
  const ESPANOL = /[áéíóúñ¿¡]|\b(el|la|los|las|del|de|con|que|se|un|una|y|en|por|más)\b/i;
  const ESTADOS = [validacion({}), validacion({ vigente: false }), validacion({ disponible: false })];

  it("los siete ids conocidos tienen nombre y descripción en inglés, con cualquier estado de la validación", () => {
    expect(PASOS_API.map((p) => p.id)).toEqual([...PASOS_CONOCIDOS]);
    expect(Object.keys(en.ANALISIS_API.pasos).sort()).toEqual([...PASOS_CONOCIDOS].sort());
    for (const paso of PASOS_API) {
      for (const v of ESTADOS) {
        const { nombre, descripcion } = textoPaso(paso, v, en.ANALISIS_API);
        expect(nombre, paso.id).not.toBe(paso.nombre);
        expect(descripcion, paso.id).not.toBe(paso.descripcion);
        expect(nombre.length, paso.id).toBeGreaterThan(3);
        expect(descripcion.length, paso.id).toBeGreaterThan(20);
        expect(`${nombre} ${descripcion}`, paso.id).not.toMatch(ESPANOL);
      }
    }
  });
  it("un id desconocido se muestra con el texto de la API, y también uno que coincida con una propiedad heredada", () => {
    const nuevo = { id: "paso_nuevo", nombre: "Paso que aún no existe", descripcion: "Texto de la API." };
    expect(textoPaso(nuevo, validacion({}), en.ANALISIS_API)).toEqual({ nombre: nuevo.nombre, descripcion: nuevo.descripcion });
    expect(textoPaso({ ...nuevo, id: "constructor" }, validacion({}), en.ANALISIS_API)).toEqual({ nombre: nuevo.nombre, descripcion: nuevo.descripcion });
    expect(nombreMedida("Medida nueva", en.ANALISIS_API)).toBe("Medida nueva");
    expect(nombreMedida("toString", en.ANALISIS_API)).toBe("toString");
    expect(unidadMedida("km", en.ANALISIS_API)).toBe("km");
  });
  it("en español no se traduce nada: pasa el texto de la API", () => {
    for (const paso of PASOS_API) expect(textoPaso(paso, validacion({}), es.ANALISIS_API)).toEqual({ nombre: paso.nombre, descripcion: paso.descripcion });
    for (const m of MEDIDAS_API) expect(nombreMedida(m, es.ANALISIS_API)).toBe(m);
    expect(unidadMedida("filas", es.ANALISIS_API)).toBe("filas");
    expect(valorTextoMedida("10 de 12", es.T.analisis.validacion.deMeses)).toBe("10 de 12");
    // y el idioma activo de las pruebas es el español
    expect(textoPaso(PASOS_API[0], validacion({})).nombre).toBe("Carga del archivo");
    expect(nombreMedida("Filas leídas")).toBe("Filas leídas");
  });
  it("regla 1 · la descripción de la validación y de la proyección solo es la propia si la validación es vigente", () => {
    const [vigente, referencia, ausente] = ESTADOS;
    const de = (id: string, v: ValidacionAnalisis) => textoPaso({ id, nombre: "", descripcion: "" }, v, en.ANALISIS_API).descripcion;
    expect(de("validacion_horizons", vigente)).toMatch(/trained only on this data/);
    expect(de("validacion_horizons", referencia)).toMatch(/another validation/);
    expect(de("validacion_horizons", referencia)).toMatch(/not on yours/);
    expect(de("validacion_horizons", referencia)).not.toMatch(/trained only on this data/);
    expect(de("validacion_horizons", ausente)).toMatch(/no validation/);
    expect(de("proyeccion", vigente)).toMatch(/uncertainty measured in that validation/);
    expect(de("proyeccion", referencia)).toMatch(/for reference/);
    expect(de("proyeccion", referencia)).toMatch(/may be larger/);
    expect(de("proyeccion", ausente)).toMatch(/no measured uncertainty/);
  });
  it("cada medida del contrato tiene su rótulo en inglés; regla 3: el RMSE del ajuste sigue diciendo que es dentro de los datos", () => {
    for (const m of MEDIDAS_API) {
      const rotulo = nombreMedida(m, en.ANALISIS_API);
      expect(rotulo, m).not.toBe(m);
      expect(rotulo, m).not.toMatch(ESPANOL);
    }
    expect(nombreMedida("RMSE medio del ajuste dentro de los datos", en.ANALISIS_API)).toMatch(/within the data/);
    expect(nombreMedida("R² medio del ajuste", en.ANALISIS_API)).toMatch(/R² of the fit/);
    expect(["filas", "días", "meses", "términos"].map((u) => unidadMedida(u, en.ANALISIS_API))).toEqual(["rows", "days", "months", "terms"]);
    expect(["°", "h", "%", "bytes", ""].map((u) => unidadMedida(u, en.ANALISIS_API))).toEqual(["°", "h", "%", "bytes", ""]);
  });
  it("los valores no se traducen: «N de M» conserva sus cifras y cualquier otro texto pasa tal cual", () => {
    const deMeses = en.T.analisis.validacion.deMeses;
    expect(valorTextoMedida("10 de 12", deMeses)).toBe("10 of 12");
    expect(valorTextoMedida("0 de 12", deMeses)).toBe("0 of 12");
    expect(valorTextoMedida("None de 12", deMeses)).toBe("None de 12");
    expect(valorTextoMedida("efemerides_shackleton.csv", deMeses)).toBe("efemerides_shackleton.csv");
    expect(valorTextoMedida("2026-12-01T00:00Z", deMeses)).toBe("2026-12-01T00:00Z");
  });
});
