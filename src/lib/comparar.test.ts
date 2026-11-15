import { decidir, diferencias, esPolarSur, esTruncada, frenteAlRanking, monograma, ordenarRanking, rachaDe, varianteRacha, visiblesDelRanking, type LineaComparada } from "./comparar";
import { RANKING, RUTAS } from "./constants";
import type { Racha } from "./tipos";
import * as en from "./textos.en";
import * as es from "./textos.es";

const linea = (nombre: string, horas_sol: number, horas_tierra_visible: number, semaforo: LineaComparada["semaforo"], sensible = false): LineaComparada => ({
  nombre, horas_sol, pct_sol: (horas_sol / 744) * 100, horas_tierra_visible, pct_tierra: (horas_tierra_visible / 744) * 100, semaforo, sensible,
});
// Cifras reales de la API para diciembre de 2026.
const SHACKLETON = linea("Shackleton", 744, 291, { energia: "verde", comunicacion: "rojo", global: "rojo" }, true);
const APOLO11 = linea("Apolo 11", 356, 744, { energia: "verde", comunicacion: "verde", global: "verde" });
const AMARILLO = { energia: "amarillo", comunicacion: "amarillo", global: "amarillo" } as const;

describe("diferencias", () => {
  it("resta cada fila con la mejor de las demás: horas de sol y Tierra en % relativo", () => {
    const [s, a] = diferencias([SHACKLETON, APOLO11]);
    expect(s).toMatchObject({ nombre: "Shackleton", sol_h: 388, rivalSol: "Apolo 11", tierra_h: -453, rivalTierra: "Apolo 11" });
    expect(s.tierra_pct).toBeCloseTo(-60.89, 1); // (291 − 744) / 744
    expect(a.sol_h).toBe(-388);
    expect(a.tierra_pct).toBeCloseTo(155.67, 1);
  });
  it("con tres filas, cada eje se compara con su propio rival", () => {
    const medio = linea("Medio", 500, 400, AMARILLO);
    const [s] = diferencias([SHACKLETON, APOLO11, medio]);
    expect(s).toMatchObject({ sol_h: 244, rivalSol: "Medio", tierra_h: -453, rivalTierra: "Apolo 11" });
  });
  it("si el rival no ve la Tierra no hay porcentaje (no se divide entre cero)", () => {
    const [a] = diferencias([linea("A", 10, 5, AMARILLO), linea("B", 10, 0, AMARILLO)]);
    expect(a.tierra_pct).toBeNull();
    expect(a.tierra_h).toBe(5);
  });
  it("con una sola fila no hay nada que comparar", () => {
    expect(diferencias([SHACKLETON])).toEqual([]);
    expect(decidir([SHACKLETON])).toBeNull();
  });
});

describe("decidir", () => {
  it("recomienda la fila con mejor semáforo global de la API, aunque otra tenga más sol", () => {
    const d = decidir([SHACKLETON, APOLO11])!;
    expect(d.recomendadas).toEqual([1]);
    expect([d.liderSol, d.liderTierra]).toEqual([null, null]); // sin empate no hace falta líder
    expect(d.contrapartida).toBe(0); // lo que se deja de ganar: el sol de Shackleton
  });
  it("a igual nivel global desempata con los niveles de energía y comunicación", () => {
    const a = linea("A", 300, 300, { energia: "verde", comunicacion: "amarillo", global: "amarillo" });
    const b = linea("B", 400, 200, AMARILLO);
    expect(decidir([b, a])!.recomendadas).toEqual([1]);
  });
  it("si empatan del todo, recomienda a las dos y no hay contrapartida", () => {
    const d = decidir([linea("A", 300, 200, AMARILLO), linea("B", 200, 300, AMARILLO)])!;
    expect(d.recomendadas).toEqual([0, 1]);
    expect(d.contrapartida).toBeNull();
    expect([d.liderSol, d.liderTierra]).toEqual([0, 1]);
  });
  it("en un empate, los líderes salen de las filas empatadas, no de las descartadas", () => {
    const verde = { energia: "verde", comunicacion: "verde", global: "verde" } as const;
    const d = decidir([SHACKLETON, linea("Apolo 11", 356, 744, verde), linea("Apolo 17", 380, 744, verde)])!;
    expect(d.recomendadas).toEqual([1, 2]);
    expect(d.liderSol).toBe(2); // Shackleton tiene más sol, pero no está entre las recomendadas
    expect(d.liderTierra).toBeNull();
    expect(d.contrapartida).toBe(0);
    expect(es.partesDecision([SHACKLETON, linea("Apolo 11", 356, 744, verde), linea("Apolo 17", 380, 744, verde)], "enero").principal)
      .toBe("Apolo 11 y Apolo 17 empatan en el semáforo en enero: Apolo 17 tiene más sol.");
  });
  it("sin diferencia en las cifras no hay líder", () => {
    const d = decidir([linea("A", 300, 300, AMARILLO), linea("B", 300, 300, AMARILLO)])!;
    expect([d.liderSol, d.liderTierra]).toEqual([null, null]);
  });
});

describe("relato de la diferencia", () => {
  it("cuenta la diferencia con las cifras reales, en español y en inglés", () => {
    const [s, a] = diferencias([SHACKLETON, APOLO11]);
    expect(es.relatoDiferencia(s)).toBe("+388 h de sol, pero −61 % de Tierra");
    expect(es.relatoDiferencia(a)).toBe("−388 h de sol, pero +156 % de Tierra");
    expect(en.relatoDiferencia(s)).toMatch(/^\+388 h of sunlight, but −61 ?% of Earth$/);
  });
  it("une con «y» cuando gana o pierde en los dos ejes, y dice cuándo no hay diferencia", () => {
    const [a, b] = diferencias([linea("A", 500, 500, AMARILLO), linea("B", 400, 250, AMARILLO)]);
    expect(es.relatoDiferencia(a)).toBe("+100 h de sol y +100 % de Tierra");
    expect(es.relatoDiferencia(b)).toBe("−100 h de sol y −50 % de Tierra");
    const [igual] = diferencias([linea("A", 300, 300, AMARILLO), linea("B", 300, 300, AMARILLO)]);
    expect(es.relatoDiferencia(igual)).toBe("las mismas horas de sol y la misma Tierra");
    expect(en.relatoDiferencia(igual)).toBe("the same hours of sunlight and the same view of the Earth");
  });
  it("sin Tierra en el rival, la diferencia va en horas", () => {
    const [a] = diferencias([linea("A", 10, 5, AMARILLO), linea("B", 10, 0, AMARILLO)]);
    expect(es.relatoDiferencia(a)).toBe("las mismas horas de sol y +5 h de Tierra");
  });
});

describe("veredicto para decidir", () => {
  it("una frase principal con el porqué y dos matices: lo que cuesta y la cautela del relieve", () => {
    const v = es.partesDecision([SHACKLETON, APOLO11], "diciembre de 2026");
    expect(v.principal).toBe("Apolo 11 es la opción más sólida en diciembre de 2026: viable en energía y en comunicación.");
    expect(v.matices).toHaveLength(2);
    expect(v.matices[0]).toBe("Shackleton: +388 h de sol, pero −61 % de Tierra.");
    expect(v.matices[1]).toMatch(/horizonte ideal/);
  });
  it("nombra los dos niveles cuando no coinciden", () => {
    const a = linea("A", 300, 300, { energia: "verde", comunicacion: "amarillo", global: "amarillo" });
    expect(es.partesDecision([a, SHACKLETON], "enero").principal).toBe("A es la opción más sólida en enero: energía viable y comunicación con reservas.");
  });
  it("en un empate lo dice y deja decidir a las cifras", () => {
    const v = es.partesDecision([linea("A", 300, 200, AMARILLO), linea("B", 200, 300, AMARILLO)], "enero");
    expect(v.principal).toBe("A y B empatan en el semáforo en enero: A tiene más sol y B ve más la Tierra.");
    expect(v.matices).toHaveLength(0);
  });
  it("en inglés dice lo mismo", () => {
    const v = en.partesDecision([SHACKLETON, APOLO11], "December 2026");
    expect(v.principal).toBe("Apolo 11 is the most solid option in December 2026: viable for power and for communication.");
    expect(v.matices[0]).toMatch(/^Shackleton: \+388 h of sunlight, but −61 ?% of Earth\.$/);
  });
  it("los textos nuevos de la pantalla existen en los dos idiomas", () => {
    const nuevas = ["veredicto", "diferencias", "frenteAlMejor", "frenteADos", "recomendada", "mismoInstante", "mismoInstanteAyuda", "horizonteDe", "instante", "tiempo", "reproducir", "pausar", "bajo", "actualizando", "verCielo"] as const;
    for (const clave of nuevas) {
      expect(es.T.comparar[clave], `es: ${clave}`).toBeTruthy();
      expect(en.T.comparar[clave], `en: ${clave}`).toBeTruthy();
      expect(typeof en.T.comparar[clave]).toBe(typeof es.T.comparar[clave]);
    }
    expect(Object.keys(en.T.comparar).sort()).toEqual(Object.keys(es.T.comparar).sort());
  });
});

describe("ranking de sitios", () => {
  const c = (id: string, global: "verde" | "amarillo" | "rojo", ventana_h: number | null) => ({ id, semaforo: { energia: global, comunicacion: global, global }, ventana_h });
  it("ordena por el veredicto combinado de la API y, a igualdad, por más horas seguidas con Sol y Tierra", () => {
    // Ventanas reales de la API (diciembre de 2026): Shackleton 291 h (crítico), IM-1 383 h y Apolo 11 356 h (viables).
    const orden = ordenarRanking([c("shackleton", "rojo", 291), c("apollo11", "verde", 356), c("im1", "verde", 383), c("medio", "amarillo", 700)]);
    expect(orden.map((o) => [o.puesto, o.id])).toEqual([[1, "im1"], [2, "apollo11"], [3, "medio"], [4, "shackleton"]]);
  });
  it("sin dato de ventana un sitio va detrás de los de su mismo veredicto, y un empate total conserva el orden de llegada", () => {
    expect(ordenarRanking([c("a", "verde", null), c("b", "verde", 0), c("c", "verde", 10)]).map((o) => o.id)).toEqual(["c", "b", "a"]);
    expect(ordenarRanking([c("x", "amarillo", 5), c("y", "amarillo", 5)]).map((o) => o.id)).toEqual(["x", "y"]);
    expect(ordenarRanking([])).toEqual([]);
  });
  it("se ven los cinco primeros y, con su puesto real, los elegidos que quedan fuera", () => {
    const orden = ordenarRanking(Array.from({ length: 8 }, (_, i) => c(`s${i}`, "verde", 100 - i)));
    expect(visiblesDelRanking(orden, () => false).map((o) => o.puesto)).toEqual([1, 2, 3, 4, 5]);
    expect(visiblesDelRanking(orden, (o) => o.id === "s6").map((o) => o.puesto)).toEqual([1, 2, 3, 4, 5, 7]);
  });
  it("la cifra decisiva se compara a la vista: el primero con el segundo y los demás con el primero", () => {
    const v = (horas: number, trunca_fin = false) => ({ horas, inicio_utc: null, fin_utc: null, trunca_inicio: false, trunca_fin });
    const orden = [{ puesto: 1, ventana: v(383) }, { puesto: 2, ventana: v(369) }, { puesto: 3, ventana: v(100, true) }, { puesto: 4, ventana: null }];
    expect(frenteAlRanking(orden, orden[0])).toMatchObject({ dif_h: 14, rival: { puesto: 2 } });
    expect(frenteAlRanking(orden, orden[1])).toMatchObject({ dif_h: -14, rival: { puesto: 1 } });
    expect(frenteAlRanking(orden, orden[2])).toBeNull(); // «≥ 100 h» no se resta
    expect(frenteAlRanking(orden, orden[3])).toBeNull(); // sin dato
    expect(frenteAlRanking([orden[0]], orden[0])).toBeNull(); // nadie con quien comparar
    expect(es.T.comparar.top.frente(14, "14 h", "Chandrayaan-3", 2)).toBe("14 h más que Chandrayaan-3 (puesto 2)");
    expect(en.T.comparar.top.frente(-14, "14 h", "IM-1 Odysseus", 1)).toBe("14 h less than IM-1 Odysseus (rank 1)");
  });
  it("la región polar sur empieza en el paralelo 80° S (constante RANKING.POLAR_SUR_LAT_MAX_DEG)", () => {
    expect(RANKING.POLAR_SUR_LAT_MAX_DEG).toBe(-80);
    // Latitudes del catálogo: Shackleton −89,66° e IM-1 −80,13° son polares; Chandrayaan-3 −69,37° y Apolo 11 0,67° no.
    expect([-89.66, -80.13, -80, -79.99, -69.3741, 0.67416].map(esPolarSur)).toEqual([true, true, true, false, false, false]);
  });
  it("el monograma sale del nombre: iniciales y número, sin logotipos", () => {
    const nombres = ["Apolo 11", "Apolo 15", "Apolo 17", "Cráter Shackleton (centro)", "IM-1 Odysseus", "Blue Ghost 1", "Chandrayaan-3", "Chang'e 4", "Chang'e 6", "SLIM"];
    expect(nombres.map(monograma)).toEqual(["A11", "A15", "A17", "CS", "IM1", "BG1", "C3", "C4", "C6", "SLIM"]);
  });
  it("el acceso a «Planear alunizaje» solo se activa si la ruta existe: nunca un enlace roto", () => {
    const rutas = Object.values(import.meta.glob<string>("../rutas.tsx", { query: "?raw", import: "default", eager: true }))[0];
    const registrada = /VENTANA_ALUNIZAJE/.test(rutas) || /path=["'{][^>]*ventana["'}]/.test(rutas.replace(/VENTANAS/g, ""));
    expect(RANKING.VENTANA_ALUNIZAJE && !registrada).toBe(false);
    expect(RUTAS.VENTANA_ALUNIZAJE("shackleton")).toBe("/sitios/shackleton/ventana");
  });
});

describe("rachas de los indicadores para astronautas", () => {
  const racha = (horas: number, trunca_inicio = false, trunca_fin = false): Racha =>
    ({ horas, inicio_utc: horas ? "2026-12-01T00:00Z" : null, fin_utc: horas ? "2026-12-14T17:00Z" : null, trunca_inicio, trunca_fin });
  it("sin el bloque de la API (o con un valor no válido) no hay racha: sin dato no es cero", () => {
    expect(rachaDe(undefined, "noche_mas_larga")).toBeNull();
    expect(rachaDe({}, "noche_mas_larga")).toBeNull();
    expect(rachaDe({ noche_mas_larga: { ...racha(1), horas: Number.NaN } }, "noche_mas_larga")).toBeNull();
    expect(rachaDe({ noche_mas_larga: racha(0) }, "noche_mas_larga")?.horas).toBe(0);
  });
  it("elige la frase según el valor y los bordes, sin afirmar lo que no se sabe", () => {
    expect(varianteRacha(racha(0), 744, true)).toBe("cero");
    expect(varianteRacha(racha(120), 744, true)).toBe("normal");
    expect(varianteRacha(racha(744, true, true), 744, true)).toBe("todo");
    expect(varianteRacha(racha(200, false, true), 744, true)).toBe("sigue"); // la corta el final de un mes natural
    expect(varianteRacha(racha(329, true, false), 744, true)).toBe("borde"); // empezó antes: no «continúa el mes siguiente»
    expect(varianteRacha(racha(100, false, true), 168, false)).toBe("borde"); // periodo que no es un mes natural
  });
  it("una racha cortada por cualquiera de los dos bordes se escribe con «≥»", () => {
    expect([racha(329, true), racha(329, false, true), racha(329)].map(esTruncada)).toEqual([true, true, false]);
    expect(es.T.comparar.podio.alMenos("329 h")).toBe("≥ 329 h");
  });
  it("las frases salen del documento de indicadores, en español y en inglés, con la unidad a la vista", () => {
    const f = { horas: "329 h", sitio: "Apolo 11", mes: "diciembre de 2026" };
    expect(es.T.comparar.podio.frases.noche_mas_larga.normal(f)).toBe("Hasta 329 h seguidas sin Sol en Apolo 11 (diciembre de 2026). Dimensiona la batería para cubrir esa noche.");
    expect(en.T.comparar.podio.frases.noche_mas_larga.normal({ ...f, mes: "December 2026" })).toBe("Up to 329 h in a row without Sun at Apolo 11 (December 2026). Size the battery to cover that night.");
    expect(es.T.comparar.podio.frases.apagon_tierra_mas_largo.borde(f)).toMatch(/^Al menos 329 h sin ver la Tierra/);
    expect(en.T.comparar.podio.frases.ventana_sol_y_tierra.cero(f)).toMatch(/never up together/);
  });
});
