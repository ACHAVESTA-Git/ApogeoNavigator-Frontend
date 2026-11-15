// Pintor de la escena inmersiva del cielo en <canvas> 2D. Todo lo que se dibuja sale de los datos (posición del
// Sol y de la Tierra) salvo el relieve, las rocas y las estrellas, que son ilustrativos y deterministas.
import { ESCENA, GRADOS_VUELTA } from "../../lib/constants";
import { diferenciaAngular } from "../../lib/escalas";
import type { PosicionCielo } from "../../lib/interpolar";

const RAD = Math.PI / 180;
const limitar = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const suavizar = (a: number, b: number, v: number) => {
  const x = limitar((v - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
};
/** Generador determinista (mulberry32): la misma semilla da siempre el mismo paisaje. */
function azar(semilla: number) {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const semillaDe = (texto: string): number => [...texto].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261);

export interface Paisaje {
  estrellas: { az: number; el: number; brillo: number; r: number }[];
  rocas: { az: number; fondo: number; talla: number }[];
  /** Armónicos del perfil (periódicos en 360°): amplitud relativa, frecuencia entera y fase. */
  perfil: { lejano: Armonicos; medio: Armonicos; cercano: Armonicos };
}
type Armonicos = [number, number, number][];
type Lienzo2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/** Grano de regolito: una tesela de ruido determinista que se pinta una sola vez y se repite como patrón. */
let teselaGrano: OffscreenCanvas | HTMLCanvasElement | null | undefined;
function grano(): OffscreenCanvas | HTMLCanvasElement | null {
  if (teselaGrano !== undefined) return teselaGrano;
  const lado = ESCENA.GRANO.TESELA_PX;
  try {
    const tesela = typeof OffscreenCanvas === "undefined" ? Object.assign(document.createElement("canvas"), { width: lado, height: lado }) : new OffscreenCanvas(lado, lado);
    const g = tesela.getContext("2d") as Lienzo2D | null;
    if (!g) return (teselaGrano = null);
    const r = azar(0x9e3779b9);
    const datos = g.createImageData(lado, lado);
    for (let i = 0; i < datos.data.length; i += 4) {
      const claro = r() > 0.5;
      datos.data[i] = datos.data[i + 1] = datos.data[i + 2] = claro ? 255 : 0;
      datos.data[i + 3] = Math.round(r() ** 2 * 255);
    }
    g.putImageData(datos, 0, 0);
    teselaGrano = tesela;
  } catch {
    teselaGrano = null; // sin canvas (pruebas): la escena se pinta igual, sin grano
  }
  return teselaGrano;
}
export function crearPaisaje(semilla: number): Paisaje {
  const r = azar(semilla);
  const armonicos = (frecuencias: number[]) => frecuencias.map((f) => [0.35 + r() * 0.65, f, r() * 360] as [number, number, number]);
  return {
    estrellas: Array.from({ length: ESCENA.ESTRELLAS }, () => ({ az: r() * 360, el: Math.asin(r()) / RAD, brillo: 0.25 + r() ** 3 * 0.75, r: 0.5 + r() * 0.8 })),
    rocas: Array.from({ length: ESCENA.ROCAS }, () => ({ az: r() * 360, fondo: 0.08 + r() * 0.92, talla: 0.5 + r() })),
    perfil: { lejano: armonicos([2, 3, 5, 9, 14, 23]), medio: armonicos([1, 3, 6, 10, 17]), cercano: armonicos([1, 2, 4, 7, 11]) },
  };
}
/** Altura relativa (0…1) del perfil en un azimut. */
function altura(armonicos: Armonicos, az: number): number {
  let suma = 0;
  let total = 0;
  for (const [amp, f, fase] of armonicos) {
    suma += amp * Math.sin((az * f + fase) * RAD);
    total += amp;
  }
  return 0.5 + (0.5 * suma) / total;
}

export interface Colores {
  vacio: string; regolito: string; superficie: string; horizonte: string; sol: string; solNucleo: string; tierra: string; texto: string;
}
export function leerColores(el: Element): Colores {
  const css = getComputedStyle(el);
  const v = (nombre: string) => css.getPropertyValue(`--color-${nombre}`).trim();
  return { vacio: v("vacio"), regolito: v("regolito"), superficie: v("superficie"), horizonte: v("horizonte"), sol: v("sol"), solNucleo: v("sol-nucleo"), tierra: v("tierra"), texto: v("texto") };
}

export interface Encuadre {
  ancho: number;
  alto: number;
  yHorizonte: number;
  /** píxeles por grado de azimut */
  ppd: number;
  /** azimut en el centro de la vista */
  centro: number;
  yDe: (elevacion: number) => number;
  /** incertidumbre de la proyección en grados (0 si es dato) */
  incertidumbre: number;
}

/** Fracción iluminada de la Tierra: (1 − cos elongación) / 2, con la separación angular real Sol–Tierra. */
export function faseTierra(p: PosicionCielo): number {
  const cosE = Math.sin(p.sol_el_deg * RAD) * Math.sin(p.tierra_el_deg * RAD) +
    Math.cos(p.sol_el_deg * RAD) * Math.cos(p.tierra_el_deg * RAD) * Math.cos((p.sol_az_deg - p.tierra_az_deg) * RAD);
  return (1 - limitar(cosE, -1, 1)) / 2;
}

export function pintarEscena(ctx: CanvasRenderingContext2D, e: Encuadre, p: PosicionCielo, paisaje: Paisaje, c: Colores): void {
  const { ancho, alto, yHorizonte: yH, ppd, centro } = e;
  const x = (az: number) => ancho / 2 + diferenciaAngular(centro, az) * ppd;
  const periodo = GRADOS_VUELTA * ppd;
  /** Llama a `fn` en cada copia visible de una posición (la vista puede abarcar los 360°). */
  const enCopias = (x0: number, margen: number, fn: (x: number) => void) => {
    for (const k of [-1, 0, 1]) {
      const xk = x0 + k * periodo;
      if (xk > -margen && xk < ancho + margen) fn(xk);
    }
  };
  const dia = suavizar(ESCENA.CREPUSCULO_DEG.desde, ESCENA.CREPUSCULO_DEG.hasta, p.sol_el_deg); // 0 noche … 1 día
  const rasante = p.sol_el_deg > 0 ? 1 - suavizar(2, 30, p.sol_el_deg) : 0; // 1 = luz muy rasante
  const xs = x(p.sol_az_deg);
  const ys = e.yDe(p.sol_el_deg);
  const xt = x(p.tierra_az_deg);
  const yt = e.yDe(p.tierra_el_deg);
  const rSol = ESCENA.RADIO_SOL_PX;
  const rTierra = rSol * ESCENA.RAZON_TIERRA_SOL;

  // 1 · Cielo: negro, sin atmósfera. Solo un resplandor bajo junto al Sol.
  ctx.globalAlpha = 1;
  ctx.fillStyle = c.vacio;
  ctx.fillRect(0, 0, ancho, alto);

  // 2 · Estrellas sutiles: se atenúan cuando el Sol está alto (el ojo y la cámara se adaptan al suelo iluminado).
  ctx.fillStyle = c.texto;
  for (const s of paisaje.estrellas) {
    const sy = e.yDe(s.el);
    if (sy > yH) continue;
    ctx.globalAlpha = s.brillo * (0.75 - 0.5 * dia);
    enCopias(x(s.az), 2, (sx) => ctx.fillRect(sx, sy, s.r, s.r));
  }

  // 3 · Tierra: disco con su fase real; el limbo iluminado mira al Sol.
  const fase = faseTierra(p);
  const haciaSol = Math.atan2(-(p.sol_el_deg - p.tierra_el_deg), diferenciaAngular(p.tierra_az_deg, p.sol_az_deg) * Math.cos(p.tierra_el_deg * RAD));
  enCopias(xt, rTierra * 3, (cx) => {
    ctx.save();
    ctx.translate(cx, yt);
    ctx.globalAlpha = 0.5;
    const halo = ctx.createRadialGradient(0, 0, rTierra * 0.6, 0, 0, rTierra * 2.6);
    halo.addColorStop(0, c.tierra);
    halo.addColorStop(1, "transparent");
    ctx.globalAlpha = 0.16 + 0.2 * fase;
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, rTierra * 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = c.regolito; // lado nocturno
    ctx.beginPath();
    ctx.arc(0, 0, rTierra, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(haciaSol);
    ctx.fillStyle = c.tierra;
    ctx.beginPath();
    ctx.arc(0, 0, rTierra, -Math.PI / 2, Math.PI / 2); // semidisco hacia el Sol
    // terminador: elipse que añade (gibosa) o quita (creciente) superficie iluminada
    ctx.ellipse(0, 0, rTierra * Math.abs(1 - 2 * fase), rTierra, 0, Math.PI / 2, -Math.PI / 2, fase < 0.5);
    ctx.fill();
    ctx.restore();
  });

  // 4 · Sol: resplandor por capas y disco. Bajo el horizonte lo tapa el terreno.
  if (p.sol_el_deg > -3) {
    enCopias(xs, ESCENA.HALO_SOL.RADIO_PX, (cx) => {
      // halo ancho y tenue + bloom de dos capas pegado al disco
      const capas: [number, number][] = [
        [ESCENA.HALO_SOL.RADIO_PX, ESCENA.HALO_SOL.OPACIDAD + ESCENA.HALO_SOL.OPACIDAD_RASANTE * rasante],
        ...ESCENA.BLOOM_SOL.map(([radios, alfa]) => [rSol * radios, alfa] as [number, number]),
      ];
      for (const [r, alfa] of capas) {
        const g = ctx.createRadialGradient(cx, ys, 0, cx, ys, r);
        g.addColorStop(0, c.sol);
        g.addColorStop(1, "transparent");
        ctx.globalAlpha = alfa;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, ys, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = c.solNucleo;
      ctx.beginPath();
      ctx.arc(cx, ys, rSol, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // 5 · Terreno: tres perfiles ilustrativos con paralaje. El lejano asoma apenas sobre el horizonte ideal.
  const perfil = (armonicos: Armonicos, amplitud: number, base: number, paralaje: number) => {
    ctx.beginPath();
    ctx.moveTo(0, alto);
    for (let px = 0; px <= ancho + ESCENA.PASO_PERFIL_PX; px += ESCENA.PASO_PERFIL_PX) {
      const az = centro * paralaje + (px - ancho / 2) / ppd;
      ctx.lineTo(px, base - altura(armonicos, az) * amplitud);
    }
    ctx.lineTo(ancho, alto);
    ctx.closePath();
  };
  const suelo = alto - yH;
  const R = ESCENA.RELIEVE;
  const lejano = () => perfil(paisaje.perfil.lejano, R.lejano.px, yH + R.lejano.px - R.lejano.asoma, R.lejano.paralaje);
  lejano();
  ctx.globalAlpha = 1;
  ctx.fillStyle = c.regolito;
  ctx.fill();
  // luz sobre el suelo: más intensa hacia el azimut del Sol y cuanto más alto esté
  // Charco de luz ancho y poco profundo junto al horizonte, bajo el Sol: así se ve la luz rasante.
  const radioLuz = Math.max(ancho * 0.5, 360);
  const pintarLuz = (cx: number, alfa: number) => {
    ctx.save();
    ctx.translate(cx, yH);
    ctx.scale(1, Math.min(1, (suelo * 1.1) / radioLuz));
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, radioLuz);
    g.addColorStop(0, c.sol);
    g.addColorStop(0.18, c.horizonte);
    g.addColorStop(1, "transparent");
    ctx.globalAlpha = alfa;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, radioLuz, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  if (dia > 0) {
    ctx.save();
    lejano();
    ctx.clip();
    ctx.globalAlpha = dia * (0.16 + 0.34 * (1 - rasante));
    ctx.fillStyle = c.horizonte; // luz general del día
    ctx.fillRect(0, yH - R.lejano.px, ancho, suelo + R.lejano.px);
    enCopias(xs, radioLuz, (cx) => pintarLuz(cx, dia * (0.22 + 0.2 * rasante)));
    ctx.restore();
  }
  // luz cenicienta de la Tierra en la noche: un tinte azul muy leve
  if (p.tierra_el_deg > 0 && dia < 1) {
    ctx.globalAlpha = (1 - dia) * 0.1 * fase * suavizar(0, 10, p.tierra_el_deg);
    ctx.fillStyle = c.tierra;
    ctx.fillRect(0, yH, ancho, suelo);
  }

  // capa media: una ondulación a media distancia; su ladera se oscurece con la luz rasante
  perfil(paisaje.perfil.medio, R.medio.px, yH + suelo * R.medio.fondo, R.medio.paralaje);
  ctx.globalAlpha = R.medio.opacidad * (0.35 + 0.65 * Math.max(rasante, 1 - dia));
  ctx.fillStyle = c.vacio;
  ctx.fill();
  // grano de regolito sobre todo el suelo
  const tesela = grano();
  const patron = tesela && ctx.createPattern(tesela, "repeat");
  if (patron) {
    ctx.save();
    lejano();
    ctx.clip();
    ctx.globalAlpha = ESCENA.GRANO.OPACIDAD * (0.5 + 0.5 * dia);
    ctx.fillStyle = patron;
    ctx.translate(-((centro * ppd) % ESCENA.GRANO.TESELA_PX), 0); // el grano gira con el suelo
    ctx.fillRect(-ESCENA.GRANO.TESELA_PX, yH - R.lejano.px, ancho + 2 * ESCENA.GRANO.TESELA_PX, suelo + R.lejano.px);
    ctx.restore();
  }

  // 6 · Rocas con sombras largas: longitud ∝ 1 / tan(elevación), siempre en dirección contraria al Sol.
  const largoSombra = p.sol_el_deg > 0.05 ? limitar(5 / Math.tan(p.sol_el_deg * RAD), 4, ESCENA.SOMBRA_MAX_PX) : 0;
  for (const roca of paisaje.rocas) {
    // Perspectiva: cerca del horizonte son pequeñas y están apretadas; abajo, grandes.
    const ry = yH + 8 + roca.fondo ** 1.8 * (suelo - 12);
    const escala = 0.22 + roca.fondo ** 1.4 * 1.9;
    const w = 6 * roca.talla * escala;
    const h = w * 0.62;
    enCopias(x(roca.az), ESCENA.SOMBRA_MAX_PX + 20, (rx) => {
      // lado = hacia dónde cae la sombra (contrario al Sol); la cara iluminada mira al azimut del Sol
      const lado = Math.sign(diferenciaAngular(p.sol_az_deg, centro + (rx - ancho / 2) / ppd)) || 1;
      if (largoSombra && dia > 0) {
        const largo = largoSombra * escala;
        const g = ctx.createLinearGradient(rx, 0, rx + lado * largo, 0);
        g.addColorStop(0, c.vacio);
        g.addColorStop(1, "transparent");
        ctx.globalAlpha = 0.75 * dia;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(rx + (lado * largo) / 2, ry + 0.5, largo / 2 + w * 0.5, Math.max(1, h * 0.55), 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 0.3 + 0.55 * dia;
      ctx.fillStyle = c.horizonte; // cuerpo
      ctx.beginPath();
      ctx.ellipse(rx, ry, w, h, 0, Math.PI, 0);
      ctx.fill();
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = c.vacio; // cara en sombra, la opuesta al Sol
      ctx.beginPath();
      ctx.ellipse(rx + lado * w * 0.32, ry, w * 0.68, h, 0, Math.PI, 0);
      ctx.fill();
      if (dia > 0 && w > 2) {
        ctx.globalAlpha = dia * (0.35 + 0.4 * rasante);
        ctx.fillStyle = c.sol; // cara iluminada: un filo cálido del lado del Sol
        ctx.beginPath();
        ctx.ellipse(rx - lado * w * 0.5, ry, w * 0.42, h * 0.8, 0, Math.PI, 0);
        ctx.fill();
      }
    });
  }
  // capa cercana: una loma oscura al pie que da profundidad
  perfil(paisaje.perfil.cercano, R.cercano.px, yH + suelo * R.cercano.fondo, R.cercano.paralaje);
  ctx.globalAlpha = R.cercano.opacidad;
  ctx.fillStyle = c.vacio;
  ctx.fill();

  // 7 · Astros bajo el horizonte: fantasmas (contorno discontinuo) sobre el suelo.
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.55;
  if (p.sol_el_deg <= 0) {
    ctx.strokeStyle = c.sol;
    enCopias(xs, 20, (cx) => { ctx.beginPath(); ctx.arc(cx, ys, rSol + 2, 0, Math.PI * 2); ctx.stroke(); });
  }
  if (p.tierra_el_deg <= 0) {
    ctx.strokeStyle = c.tierra;
    enCopias(xt, 40, (cx) => { ctx.beginPath(); ctx.arc(cx, yt, rTierra, 0, Math.PI * 2); ctx.stroke(); });
  }
  // 8 · Proyección: anillo de incertidumbre alrededor de cada astro.
  if (e.incertidumbre > 0) {
    const r = Math.max(rTierra + 6, e.incertidumbre * ppd);
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = c.texto;
    for (const [cx0, cy] of [[xs, ys], [xt, yt]]) enCopias(cx0, r, (cx) => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); });
  }
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}
