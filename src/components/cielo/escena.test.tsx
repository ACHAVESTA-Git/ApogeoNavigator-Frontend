import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { motionValue } from "motion/react";
import { igualSuperficial, useValorMotion } from "../../hooks/useValorMotion";
import { ESCENA } from "../../lib/constants";
import type { PosicionCielo } from "../../lib/interpolar";
import { EscenaInmersiva, aislar, altoDeEscena } from "./EscenaInmersiva";
import { conAlfa, crearPaisaje, direccionSombra, luzSuelo, pintarEscena, razonSombra, semillaDe, type Colores, type Encuadre } from "./lienzoLunar";

const COLORES: Colores = { vacio: "#0A0A09", regolito: "#14130F", superficie: "#1D1C18", horizonte: "#77736A", sol: "#FFB547", solNucleo: "#FFF2D9", tierra: "#5AA9FF", texto: "#EDEBE4" };
const posicion = (sol_el_deg: number, sol_az_deg = 90): PosicionCielo => ({ sol_az_deg, sol_el_deg, tierra_az_deg: 250, tierra_el_deg: 20 }) as PosicionCielo;
const encuadre = (extra: Partial<Encuadre> = {}): Encuadre => ({
  ancho: 800, alto: 500, yHorizonte: 280, ppd: 800 / 360, centro: 90, incertidumbre: 0, yDe: (el) => 280 - el * 2, ...extra,
});

// jsdom no tiene <canvas>: sin contexto, la escena se pinta sin grano (y sin el aviso de jsdom en la consola).
beforeAll(() => void vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null));

/** Contexto 2D simulado: anota cada llamada y cada estilo que se le da. */
function lienzoSimulado() {
  const llamadas: string[] = [];
  const estilos: unknown[] = [];
  const degradado = { addColorStop: (_: number, color: string) => estilos.push(color) };
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (_, clave: string) => {
      if (clave === "createLinearGradient" || clave === "createRadialGradient") return () => degradado;
      if (clave === "createPattern") return () => null;
      return (...args: unknown[]) => void llamadas.push(`${clave}(${args.map((a) => (typeof a === "number" ? a.toFixed(1) : String(a))).join(",")})`);
    },
    set: (_, clave: string, valor) => {
      if (clave === "fillStyle" || clave === "strokeStyle") estilos.push(valor);
      return true;
    },
  });
  return { ctx: ctx as unknown as CanvasRenderingContext2D, llamadas, estilos };
}

describe("luz del suelo según la elevación real del Sol", () => {
  it("crece con la elevación (Lambert) y nunca supera el tope que deja legibles los rótulos", () => {
    const luz = [0.5, 1.7, 9, 30, 60, 88].map((el) => luzSuelo(el, 1));
    for (let i = 1; i < luz.length; i++) expect(luz[i]).toBeGreaterThan(luz[i - 1]);
    expect(luz[luz.length - 1]).toBeLessThanOrEqual(ESCENA.REALISTA.LUZ_MAX);
    expect(luzSuelo(1.7, 1) / luzSuelo(88, 1)).toBeLessThan(0.3); // el Sol rasante ilumina mucho menos que el alto
  });
  it("de noche no hay luz solar", () => {
    expect(luzSuelo(-10, 0)).toBe(0);
  });
});

describe("sombras", () => {
  it("su largo es 1 / tan(elevación): larguísimas con el Sol rasante y cortas con el Sol alto", () => {
    expect(razonSombra(45)).toBeCloseTo(1, 5);
    expect(razonSombra(10)).toBeCloseTo(5.671, 2);
    expect(razonSombra(1.7)).toBeCloseTo(33.69, 1);
    expect(razonSombra(0.5)).toBe(ESCENA.REALISTA.SOMBRA.RAZON_MAX); // tope
    expect(razonSombra(-2)).toBe(0); // sin Sol no hay sombra
  });
  it("caen en dirección contraria al Sol, en perspectiva", () => {
    expect(direccionSombra(0, 0.3).y).toBeCloseTo(0.3, 5); // mirando al Sol: hacia el observador (abajo)
    expect(direccionSombra(0, 0.3).x).toBeCloseTo(0, 5);
    expect(direccionSombra(90, 0.3).x).toBeCloseTo(1, 5); // objeto a la derecha del Sol: sombra hacia la derecha
    expect(direccionSombra(-90, 0.3).x).toBeCloseTo(-1, 5);
    expect(direccionSombra(180, 0.3).y).toBeCloseTo(-0.3, 5); // Sol a la espalda: se aleja hacia el horizonte
  });
});

describe("conAlfa", () => {
  it("convierte un token a rgba y limita la opacidad", () => {
    expect(conAlfa("#FFB547", 0.5)).toBe("rgba(255,181,71,0.500)");
    expect(conAlfa("#fff", 2)).toBe("rgba(255,255,255,1.000)");
    expect(conAlfa("", 0.5)).toBe("transparent");
  });
});

describe("paisaje ilustrativo", () => {
  it("es determinista y los añadidos de la escena realista no cambian lo que ya había", () => {
    const a = crearPaisaje(semillaDe("shackleton"));
    const b = crearPaisaje(semillaDe("shackleton"));
    expect(a).toEqual(b);
    expect(a.estrellas).toHaveLength(ESCENA.ESTRELLAS);
    expect(a.rocas).toHaveLength(ESCENA.ROCAS);
    expect(a.crateres).toHaveLength(ESCENA.REALISTA.CRATERES);
    expect(a.motas).toHaveLength(ESCENA.REALISTA.MOTAS);
    expect(a.ondas).toHaveLength(ESCENA.REALISTA.ONDAS.length);
    // Valores de la portada (misma semilla que antes de la escena realista): si se mueven, cambia la primera pantalla.
    expect(a.estrellas[0]).toEqual({ az: 102.34568439424038, el: 14.276726395972908, brillo: 0.5040345621083763, r: 0.8625807769596576 });
    expect(a.rocas[0]).toEqual({ az: 320.7216450199485, fondo: 0.5272705774381757, talla: 1.225721538066864 });
    expect(a.perfil.cercano[4]).toEqual([0.3910606743302196, 11, 338.60998526215553]);
    expect(crearPaisaje(semillaDe("apollo11"))).not.toEqual(a);
  });
});

describe("pintarEscena", () => {
  it("sin `realista` pinta el suelo de la portada: tres perfiles y ninguna franja de ladera", () => {
    const { ctx, llamadas } = lienzoSimulado();
    pintarEscena(ctx, encuadre(), posicion(1.7), crearPaisaje(1), COLORES);
    expect(llamadas.filter((l) => l.startsWith("clip")).length).toBeLessThanOrEqual(2);
  });
  it("con `realista` sombrea las laderas de cinco capas y traza sombras en perspectiva", () => {
    const { ctx, llamadas, estilos } = lienzoSimulado();
    pintarEscena(ctx, encuadre({ realista: { paralaje: 0 } }), posicion(1.7), crearPaisaje(1), COLORES);
    const franjas = llamadas.filter((l) => l.startsWith("fillRect(0.0,")).length;
    expect(franjas).toBeGreaterThanOrEqual(5 * ESCENA.REALISTA.LADERA.franjas);
    expect(estilos.some((e) => typeof e === "string" && e.startsWith("rgba(119,115,106"))).toBe(true); // luz sobre el regolito
    expect(llamadas.some((l) => l.startsWith("closePath"))).toBe(true);
  });
  it("de noche no enciende laderas ni dibuja sombras", () => {
    const dia = lienzoSimulado();
    const noche = lienzoSimulado();
    const paisaje = crearPaisaje(1);
    pintarEscena(dia.ctx, encuadre({ realista: { paralaje: 0 } }), posicion(9), paisaje, COLORES);
    pintarEscena(noche.ctx, encuadre({ realista: { paralaje: 0 } }), posicion(-20), paisaje, COLORES);
    expect(noche.llamadas.length).toBeLessThan(dia.llamadas.length);
    expect(noche.llamadas.filter((l) => l.startsWith("fillRect(0.0,")).length).toBeLessThan(ESCENA.REALISTA.LADERA.franjas);
  });
  it("el paralaje del puntero mueve el suelo cercano pero no los astros", () => {
    const quieto = lienzoSimulado();
    const movido = lienzoSimulado();
    const paisaje = crearPaisaje(1);
    pintarEscena(quieto.ctx, encuadre({ realista: { paralaje: 0 } }), posicion(1.7), paisaje, COLORES);
    pintarEscena(movido.ctx, encuadre({ realista: { paralaje: 1 } }), posicion(1.7), paisaje, COLORES);
    const arcos = (l: string[]) => l.filter((x) => x.startsWith("arc(") || x.startsWith("translate("));
    expect(arcos(movido.llamadas).slice(0, 6)).toEqual(arcos(quieto.llamadas).slice(0, 6)); // Tierra y Sol, primero
    expect(movido.llamadas.filter((x) => x.startsWith("ellipse("))).not.toEqual(quieto.llamadas.filter((x) => x.startsWith("ellipse(")));
  });
});

describe("alto de la escena", () => {
  it("en escritorio llega hasta el borde inferior de la ventana y en móvil ocupa una fracción", () => {
    expect(altoDeEscena(900, true)).toBe(900 - ESCENA.ALTO.escritorio.descuento);
    expect(altoDeEscena(500, true)).toBe(ESCENA.ALTO.escritorio.min);
    expect(altoDeEscena(780, false)).toBe(Math.round(780 * ESCENA.ALTO.movil.fraccion));
    expect(altoDeEscena(2000, false)).toBe(ESCENA.ALTO.movil.max);
  });
});

describe("pantalla completa", () => {
  it("aislar deja inerte lo que queda fuera y lo restaura", () => {
    document.body.innerHTML = `<nav id="n"></nav><main><section id="a"></section><section id="b"><div id="escena"></div><p id="c"></p></section></main><div aria-live="polite" id="vivo"></div>`;
    const deshacer = aislar(document.getElementById("escena")!);
    expect(["n", "a", "c"].every((id) => document.getElementById(id)!.hasAttribute("inert"))).toBe(true);
    expect(document.getElementById("escena")!.hasAttribute("inert")).toBe(false);
    expect(document.getElementById("b")!.hasAttribute("inert")).toBe(false);
    expect(document.getElementById("vivo")!.hasAttribute("inert")).toBe(false); // los anuncios siguen llegando
    deshacer();
    expect(document.querySelectorAll("[inert]")).toHaveLength(0);
  });

  function Caja({ alSalir }: { alSalir: () => void }) {
    return (
      <EscenaInmersiva activa alSalir={alSalir} alto={400} barra={(fijada) => <p>{fijada ? "barra fijada" : "barra"}</p>} pie={<p>pie</p>}>
        {(fijada) => <p>{fijada ? "escena fijada" : "escena"}</p>}
      </EscenaInmersiva>
    );
  }
  it("al activarse fija la caja, bloquea el desplazamiento de la página y Escape la cierra", () => {
    const alSalir = vi.fn();
    const { unmount } = render(<Caja alSalir={alSalir} />);
    expect(screen.getByText("escena fijada")).toBeInTheDocument();
    expect(screen.getByText("barra fijada")).toBeInTheDocument();
    expect(document.documentElement.dataset.inmersivo).toBe("");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(alSalir).toHaveBeenCalledTimes(1);
    unmount();
    expect(document.documentElement.dataset.inmersivo).toBeUndefined(); // al desmontar no queda nada bloqueado
    expect(document.querySelectorAll("[inert]")).toHaveLength(0);
  });
});

describe("useValorMotion", () => {
  it("igualSuperficial compara objetos planos por sus campos", () => {
    expect(igualSuperficial({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    expect(igualSuperficial({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
    expect(igualSuperficial(3, 3)).toBe(true);
    expect(igualSuperficial({ a: 1 }, { a: 1, b: 2 } as { a: number })).toBe(false);
  });
  it("no vuelve a renderizar si llega un objeto distinto con los mismos valores", async () => {
    const valor = motionValue({ az: 10, el: 2 });
    let renders = 0;
    const { result } = renderHook(() => {
      renders++;
      return useValorMotion(valor, 1000);
    });
    const antes = renders;
    act(() => valor.set({ az: 10, el: 2 }));
    expect(renders).toBe(antes);
    await act(async () => {
      valor.set({ az: 11, el: 2 });
      await new Promise((ok) => setTimeout(ok, 20)); // el refresco va limitado en frecuencia
    });
    expect(result.current).toEqual({ az: 11, el: 2 });
  });
});
