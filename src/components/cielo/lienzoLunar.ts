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
  /** Solo en la escena realista: ondulaciones intermedias, cráteres y motas de regolito que destellan. */
  ondas: Armonicos[];
  crateres: { az: number; fondo: number; radio: number }[];
  motas: { az: number; fondo: number; fase: number }[];
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
/** Grano grueso (primer plano): la misma tesela al doble de tamaño, también precalculada. */
let teselaGruesa: OffscreenCanvas | HTMLCanvasElement | null | undefined;
function granoGrueso(): OffscreenCanvas | HTMLCanvasElement | null {
  if (teselaGruesa !== undefined) return teselaGruesa;
  const fina = grano();
  if (!fina) return (teselaGruesa = null);
  const lado = ESCENA.GRANO.TESELA_PX * 2;
  try {
    const tesela = typeof OffscreenCanvas === "undefined" ? Object.assign(document.createElement("canvas"), { width: lado, height: lado }) : new OffscreenCanvas(lado, lado);
    const g = tesela.getContext("2d") as Lienzo2D | null;
    if (!g) return (teselaGruesa = null);
    g.imageSmoothingEnabled = false;
    g.drawImage(fina, 0, 0, lado, lado);
    teselaGruesa = tesela;
  } catch {
    teselaGruesa = null;
  }
  return teselaGruesa;
}
export function crearPaisaje(semilla: number): Paisaje {
  const r = azar(semilla);
  const armonicos = (frecuencias: number[]) => frecuencias.map((f) => [0.35 + r() * 0.65, f, r() * 360] as [number, number, number]);
  return {
    estrellas: Array.from({ length: ESCENA.ESTRELLAS }, () => ({ az: r() * 360, el: Math.asin(r()) / RAD, brillo: 0.25 + r() ** 3 * 0.75, r: 0.5 + r() * 0.8 })),
    rocas: Array.from({ length: ESCENA.ROCAS }, () => ({ az: r() * 360, fondo: 0.08 + r() * 0.92, talla: 0.5 + r() })),
    perfil: { lejano: armonicos([2, 3, 5, 9, 14, 23]), medio: armonicos([1, 3, 6, 10, 17]), cercano: armonicos([1, 2, 4, 7, 11]) },
    // Lo que sigue se genera después de lo anterior: con la misma semilla, la portada conserva su paisaje.
    ondas: [armonicos([2, 4, 7, 12, 19]), armonicos([1, 3, 5, 8, 13])],
    crateres: Array.from({ length: ESCENA.REALISTA.CRATERES }, () => ({ az: r() * 360, fondo: 0.06 + r() ** 1.5 * 0.82, radio: 0.6 + r() ** 2 * 1.7 })),
    motas: Array.from({ length: ESCENA.REALISTA.MOTAS }, () => ({ az: r() * 360, fondo: r() ** 1.6, fase: r() * Math.PI * 2 })),
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
/** Pendiente relativa (−1…1) del perfil en un azimut: positiva si el terreno sube hacia la derecha. */
function pendiente(armonicos: Armonicos, az: number): number {
  let suma = 0;
  let total = 0;
  for (const [amp, f, fase] of armonicos) {
    suma += amp * f * Math.cos((az * f + fase) * RAD);
    total += amp * f;
  }
  return suma / total;
}
/** Color de un token (#rgb o #rrggbb) con opacidad, para las paradas de un degradado. */
export function conAlfa(hex: string, alfa: number): string {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "transparent";
  const h = m[1].length === 3 ? [...m[1]].map((d) => d + d).join("") : m[1];
  const n = parseInt(h, 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${limitar(alfa, 0, 1).toFixed(3)})`;
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
  /**
   * Escena realista (vista del cielo): luz del suelo según la elevación real del Sol, laderas y cráteres
   * sombreados, sombras en perspectiva y polvo en el horizonte. `paralaje` (−1…1) desplaza las capas cercanas
   * con el puntero; los astros y la línea del horizonte no se mueven. Sin este campo la escena es la de la portada.
   */
  realista?: { paralaje: number };
}

/** Luz general del suelo (0…LUZ_MAX): irradiancia de Lambert, sin(elevación), llevada a brillo percibido. */
export function luzSuelo(elevacionSol: number, dia: number): number {
  const Q = ESCENA.REALISTA;
  return dia * Q.LUZ_MAX * Math.max(Math.sin(Math.max(elevacionSol, 0) * RAD), Q.LUZ_MIN) ** Q.GAMMA;
}
/** Largo de una sombra en alturas del objeto: 1 / tan(elevación), con tope. Sin Sol sobre el horizonte, 0. */
export function razonSombra(elevacionSol: number): number {
  return elevacionSol > 0.05 ? Math.min(1 / Math.tan(elevacionSol * RAD), ESCENA.REALISTA.SOMBRA.RAZON_MAX) : 0;
}
/**
 * Dirección en pantalla de la sombra de un objeto del suelo: `dAz` es su azimut menos el del Sol y `acorta`
 * cuánto se acortan las distancias en profundidad. Mirando al Sol la sombra viene hacia el observador (abajo);
 * con el Sol a un lado cae hacia el lado contrario; con el Sol a la espalda se aleja hacia el horizonte (arriba).
 */
export function direccionSombra(dAz: number, acorta: number): { x: number; y: number } {
  return { x: Math.sin(dAz * RAD), y: Math.cos(dAz * RAD) * acorta };
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
    if (e.realista) {
      // Esfera, no disco: el limbo se oscurece y el borde iluminado lleva el filo claro de la atmósfera.
      const limbo = ctx.createRadialGradient(rTierra * 0.25, 0, rTierra * 0.2, 0, 0, rTierra);
      limbo.addColorStop(0, "transparent");
      limbo.addColorStop(1, conAlfa(c.vacio, 0.6));
      ctx.fillStyle = limbo;
      ctx.beginPath();
      ctx.arc(0, 0, rTierra, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.35 + 0.35 * fase;
      ctx.strokeStyle = c.texto;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, rTierra - 0.5, -Math.PI / 2.4, Math.PI / 2.4);
      ctx.stroke();
    }
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

  if (e.realista) {
    pintarSueloRealista(ctx, e, p, paisaje, c, { x, enCopias, dia, rasante, xs });
  } else {
    pintarSuelo();
  }
  function pintarSuelo(): void {
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
  }

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

interface Mundo {
  x: (az: number) => number;
  enCopias: (x0: number, margen: number, fn: (x: number) => void) => void;
  dia: number;
  rasante: number;
  xs: number;
}
interface Capa { arm: Armonicos; px: number; base: number; paralaje: number; fondo: number; luz: number }

/**
 * Suelo de la escena realista. El relieve, las rocas, los cráteres y el polvo siguen siendo ilustrativos; lo que
 * sale de los datos es la luz: su intensidad depende de la elevación real del Sol y su dirección, del azimut real.
 * Las capas se pintan de la más lejana a la más cercana y cada una tapa a las anteriores (profundidad por oclusión).
 */
function pintarSueloRealista(ctx: CanvasRenderingContext2D, e: Encuadre, p: PosicionCielo, paisaje: Paisaje, c: Colores, m: Mundo): void {
  const { ancho, alto, yHorizonte: yH, ppd, centro } = e;
  const Q = ESCENA.REALISTA;
  const R = ESCENA.RELIEVE;
  const suelo = alto - yH;
  const puntero = e.realista?.paralaje ?? 0;
  const luz = luzSuelo(p.sol_el_deg, m.dia);
  const direccional = m.dia * (Q.LADERA.base + Q.LADERA.rasante * m.rasante);
  const razon = razonSombra(p.sol_el_deg);
  const fase = faseTierra(p);
  const cenicienta = p.tierra_el_deg > 0 && m.dia < 1 ? (1 - m.dia) * 0.1 * fase * suavizar(0, 10, p.tierra_el_deg) : 0;
  /** Azimut real que se ve en una columna de la pantalla. */
  const azDe = (px: number) => centro + (px - ancho / 2) / ppd;
  /** Separación en grados entre una columna y el azimut del Sol (0 = mirando al Sol). */
  const alSol = (px: number) => diferenciaAngular(p.sol_az_deg, azDe(px));
  const fondoDe = (y: number) => limitar((y - yH) / suelo, 0, 1);
  const acortaEn = (fondo: number) => Q.PERSPECTIVA.horizonte + (Q.PERSPECTIVA.pie - Q.PERSPECTIVA.horizonte) * fondo;
  const desvioEn = (fondo: number) => puntero * (Q.PARALAJE_PX.lejos + (Q.PARALAJE_PX.cerca - Q.PARALAJE_PX.lejos) * fondo);

  // Polvo en el horizonte: con el Sol rasante, una franja baja de luz dispersada lo ciñe por su azimut.
  const polvo = Q.POLVO.OPACIDAD * (1 - suavizar(0, Q.POLVO.HASTA_DEG, Math.abs(p.sol_el_deg))) * suavizar(-3, -0.5, p.sol_el_deg);
  if (polvo > 0.01) {
    const rx = Math.max(160, Math.min(Q.POLVO.ANCHO_DEG * ppd, ancho * 0.7));
    m.enCopias(m.xs, rx, (cx) => {
      ctx.save();
      ctx.translate(cx, yH);
      ctx.scale(1, Q.POLVO.ALTO_PX / rx);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      g.addColorStop(0, conAlfa(c.sol, polvo));
      g.addColorStop(0.35, conAlfa(c.sol, polvo * 0.35));
      g.addColorStop(1, "transparent");
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, rx, Math.PI, 0); // solo la mitad que queda sobre el horizonte
      ctx.fill();
      ctx.restore();
    });
  }

  const capas: Capa[] = [
    { arm: paisaje.perfil.lejano, px: R.lejano.px, base: yH + R.lejano.px - R.lejano.asoma, paralaje: R.lejano.paralaje, fondo: 0, luz: 1 },
    { arm: paisaje.ondas[0], px: Q.ONDAS[0].px, base: yH + suelo * Q.ONDAS[0].fondo, paralaje: Q.ONDAS[0].paralaje, fondo: Q.ONDAS[0].fondo, luz: 0.95 },
    { arm: paisaje.perfil.medio, px: R.medio.px, base: yH + suelo * R.medio.fondo, paralaje: R.medio.paralaje, fondo: R.medio.fondo, luz: 0.85 },
    { arm: paisaje.ondas[1], px: Q.ONDAS[1].px, base: yH + suelo * Q.ONDAS[1].fondo, paralaje: Q.ONDAS[1].paralaje, fondo: Q.ONDAS[1].fondo, luz: 0.68 },
    { arm: paisaje.perfil.cercano, px: R.cercano.px, base: yH + suelo * R.cercano.fondo, paralaje: R.cercano.paralaje, fondo: 1, luz: 0.3 },
  ];
  const azPerfil = (capa: Capa, px: number) => centro * capa.paralaje + (px - desvioEn(capa.fondo) - ancho / 2) / ppd;
  /** Perfil de una capa; cerrada, baja solo hasta `pie` (más abajo la tapa la capa siguiente: no se pinta dos veces). */
  const trazar = (capa: Capa, cerrada: boolean, pie = alto) => {
    ctx.beginPath();
    if (cerrada) ctx.moveTo(0, pie);
    for (let px = 0; px <= ancho + ESCENA.PASO_PERFIL_PX; px += ESCENA.PASO_PERFIL_PX) {
      const y = capa.base - altura(capa.arm, azPerfil(capa, px)) * capa.px;
      if (px === 0 && !cerrada) ctx.moveTo(px, y);
      else ctx.lineTo(px, y);
    }
    if (cerrada) {
      ctx.lineTo(ancho, pie);
      ctx.closePath();
    }
  };
  /** Degradado horizontal con una parada cada pocos píxeles: el valor (0…1) es la opacidad del color. */
  const degradado = (valor: (px: number) => number, color: string) => {
    const g = ctx.createLinearGradient(0, 0, ancho, 0);
    const n = Math.max(2, Math.ceil(ancho / Q.PASO_SOMBREADO_PX));
    for (let k = 0; k <= n; k++) g.addColorStop(k / n, conAlfa(color, valor((k / n) * ancho)));
    return g;
  };
  /** Luz general de una columna: menos a contraluz (se ven las caras en sombra) y un realce con el Sol a la espalda. */
  const general = (capa: Capa) => (px: number) => {
    const d = alSol(px) * RAD;
    const frente = (1 - Math.cos(d)) / 2; // 0 a contraluz … 1 con el Sol a la espalda
    const oposicion = Q.OPOSICION.BRILLO * m.dia * m.rasante * Math.exp(-(((Math.PI - Math.abs(d)) / (Q.OPOSICION.ANCHO_DEG * RAD)) ** 2));
    return capa.luz * (luz * (1 - Q.CONTRALUZ * m.rasante * (1 - frente)) + oposicion);
  };
  /** Ladera: positiva si mira al Sol (sube hacia la derecha con el Sol a la izquierda, o al revés). */
  const ladera = (capa: Capa, px: number) => limitar(pendiente(capa.arm, azPerfil(capa, px)) * Q.LADERA.realce, -1, 1) * Math.sin(alSol(px) * RAD);
  const filo = (px: number) => m.dia * m.rasante * Q.FILO.OPACIDAD * Math.exp(-((alSol(px) / Q.FILO.ANCHO_DEG) ** 2));

  const pintarGrano = (capa: Capa, hasta: number) => {
    const gruesa = capa.fondo >= Q.GRANO_GRUESO_DESDE;
    const tesela = gruesa ? granoGrueso() : grano();
    const patron = tesela && ctx.createPattern(tesela, "repeat");
    if (!patron) return;
    const lado = ESCENA.GRANO.TESELA_PX * (gruesa ? 2 : 1);
    ctx.save();
    ctx.clip(); // el perfil de la capa sigue siendo la ruta en curso
    ctx.globalAlpha = ESCENA.GRANO.OPACIDAD * (0.5 + 0.5 * m.dia);
    ctx.fillStyle = patron;
    ctx.translate(-((((centro * ppd * capa.paralaje - desvioEn(capa.fondo)) % lado) + lado) % lado), 0); // el grano gira con su capa
    ctx.fillRect(0, capa.base - capa.px, ancho + lado, hasta - capa.base + capa.px);
    ctx.restore();
  };

  // Rocas y cráteres en pantalla, repartidos por la capa sobre la que se apoyan.
  const capaDe = (y: number) => {
    let i = 0;
    for (let k = 1; k < capas.length; k++) if (y >= capas[k].base - capas[k].px * 0.5) i = k;
    return i;
  };
  const rocas = paisaje.rocas.map((roca) => {
    const y = yH + 8 + roca.fondo ** 1.8 * (suelo - 12);
    return { ...roca, y, capa: capaDe(y) };
  });
  const crateres = paisaje.crateres.map((crater) => {
    const y = yH + 10 + crater.fondo ** 1.5 * (suelo - 16);
    return { ...crater, y, capa: capaDe(y) };
  });

  const pintarCrater = (cx: number, cy: number, radio: number) => {
    const f = fondoDe(cy);
    const rx = radio * (3 + 24 * f ** 1.3);
    const ry = rx * (0.16 + 0.3 * f);
    const u = direccionSombra(alSol(cx), 1);
    // pared del fondo, la que mira al Sol: encendida
    ctx.globalAlpha = 1;
    ctx.fillStyle = conAlfa(c.horizonte, 0.1 + m.dia * (0.2 + 0.3 * m.rasante));
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    // sombra de la pared más cercana al Sol, que cubre el interior: queda una media luna de luz al otro lado
    ctx.save();
    ctx.clip();
    ctx.fillStyle = conAlfa(c.vacio, 0.45 + 0.4 * m.dia * m.rasante);
    ctx.beginPath();
    ctx.ellipse(cx - u.x * rx * 0.36, cy - u.y * ry * 0.36, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // borde levantado: su cara exterior hacia el Sol recoge la luz
    if (m.dia > 0 && rx > 3) {
      const haciaSol = Math.atan2(-u.y * rx, -u.x * ry);
      ctx.strokeStyle = conAlfa(c.sol, m.dia * (0.08 + 0.2 * m.rasante));
      ctx.lineWidth = Math.max(1, rx * 0.06);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, haciaSol - 1.15, haciaSol + 1.15);
      ctx.stroke();
    }
  };

  const pintarRoca = (rx: number, ry: number, fondo: number, talla: number) => {
    const escala = 0.22 + fondo ** 1.4 * 1.9;
    const w = 6 * talla * escala;
    const h = w * 0.62;
    const dAz = alSol(rx);
    const lado = Math.sign(dAz) || 1; // hacia dónde cae la sombra (contrario al Sol)
    if (razon && m.dia > 0) {
      // Sombra en perspectiva: sale de la base, en dirección contraria al Sol, y se estrecha y aclara hacia la punta.
      const u = direccionSombra(dAz, acortaEn(fondoDe(ry)));
      const largo = Math.min(h * 1.6 * razon, ancho * Q.SOMBRA.FRACCION_ANCHO * (0.3 + 0.7 * fondo));
      const tx = rx + u.x * largo;
      const ty = ry + u.y * largo;
      const norma = Math.hypot(u.x, u.y) || 1;
      const nx = -u.y / norma;
      const ny = u.x / norma;
      const semi = Math.abs(nx) * w * 0.9 + Math.abs(ny) * h * 0.55;
      // La punta se estrecha al alejarse; si la sombra viene hacia el observador, la perspectiva la ensancha.
      const punta = Q.SOMBRA.PUNTA + (Q.SOMBRA.PUNTA_CERCA - Q.SOMBRA.PUNTA) * Math.max(0, Math.cos(dAz * RAD));
      const g = ctx.createLinearGradient(rx, ry, tx, ty);
      g.addColorStop(0, conAlfa(c.vacio, Q.SOMBRA.OPACIDAD * m.dia));
      g.addColorStop(1, "transparent");
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(rx + nx * semi, ry + ny * semi);
      ctx.lineTo(tx + nx * semi * punta, ty + ny * semi * punta);
      ctx.lineTo(tx - nx * semi * punta, ty - ny * semi * punta);
      ctx.lineTo(rx - nx * semi, ry - ny * semi);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 0.3 + 0.55 * m.dia;
    ctx.fillStyle = c.horizonte; // cuerpo
    ctx.beginPath();
    ctx.ellipse(rx, ry, w, h, 0, Math.PI, 0);
    ctx.fill();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = c.vacio; // cara en sombra, la opuesta al Sol
    ctx.beginPath();
    ctx.ellipse(rx + lado * w * 0.32, ry, w * 0.68, h, 0, Math.PI, 0);
    ctx.fill();
    if (m.dia > 0 && w > 2) {
      ctx.globalAlpha = m.dia * (0.35 + 0.4 * m.rasante);
      ctx.fillStyle = c.sol; // cara iluminada: un filo cálido del lado del Sol
      ctx.beginPath();
      ctx.ellipse(rx - lado * w * 0.5, ry, w * 0.42, h * 0.8, 0, Math.PI, 0);
      ctx.fill();
    }
  };

  capas.forEach((capa, i) => {
    const hasta = i + 1 < capas.length ? Math.min(alto, capas[i + 1].base) : alto;
    trazar(capa, true, hasta);
    ctx.globalAlpha = 1;
    ctx.fillStyle = c.regolito;
    ctx.fill();
    if (m.dia > 0) {
      ctx.fillStyle = degradado(general(capa), c.horizonte);
      ctx.fill();
    }
    if (cenicienta > 0.004) {
      ctx.fillStyle = conAlfa(c.tierra, cenicienta * capa.luz); // luz cenicienta de la Tierra en la noche
      ctx.fill();
    }
    // volumen: cada loma se oscurece hacia su pie, donde la tapa la siguiente
    const volumen = ctx.createLinearGradient(0, capa.base - capa.px, 0, Math.max(hasta, capa.base + 1));
    volumen.addColorStop(0, "transparent");
    volumen.addColorStop(1, conAlfa(c.vacio, Q.VOLUMEN * (0.45 + 0.55 * Math.max(m.rasante, 1 - m.dia))));
    ctx.fillStyle = volumen;
    ctx.fill();
    pintarGrano(capa, hasta);
    if (m.dia > 0) {
      // Laderas: las que miran al Sol se encienden y las que le dan la espalda se apagan (un solo degradado: en
      // cada columna solo ocurre una de las dos cosas). La luz se queda en lo alto de la loma y se pierde hacia
      // abajo, en franjas cada vez más tenues: con el Sol rasante las cimas la recogen y las hondonadas no.
      const sombra = Q.LADERA.sombra * m.dia * (0.3 + 0.7 * m.rasante);
      const g = ctx.createLinearGradient(0, 0, ancho, 0);
      const n = Math.max(2, Math.ceil(ancho / Q.PASO_SOMBREADO_PX));
      for (let k = 0; k <= n; k++) {
        const v = ladera(capa, (k / n) * ancho);
        g.addColorStop(k / n, v >= 0 ? conAlfa(c.horizonte, capa.luz * direccional * v) : conAlfa(c.vacio, capa.luz * sombra * -v));
      }
      const franja = Math.max(3, (capa.px * Q.LADERA.alcance) / Q.LADERA.franjas);
      ctx.save();
      ctx.clip();
      ctx.fillStyle = g;
      for (let k = 0; k < Q.LADERA.franjas; k++) {
        ctx.globalAlpha = (1 - k / Q.LADERA.franjas) ** 1.6;
        ctx.fillRect(0, capa.base - capa.px + k * franja, ancho, franja + 0.5);
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    if (m.dia * m.rasante > 0.02 && capa.fondo < Q.FILO.HASTA_FONDO) {
      // cresta lejana a contraluz: el filo que enciende el Sol rasante, solo cerca de su azimut
      trazar(capa, false);
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;
      ctx.strokeStyle = degradado((px) => filo(px) * (1 - capa.fondo / Q.FILO.HASTA_FONDO), c.sol);
      ctx.stroke();
    }
    for (const crater of crateres) {
      if (crater.capa !== i) continue;
      const rx = crater.radio * (3 + 24 * fondoDe(crater.y) ** 1.3);
      m.enCopias(m.x(crater.az) + desvioEn(fondoDe(crater.y)), rx + 4, (cx) => pintarCrater(cx, crater.y, crater.radio));
    }
    for (const roca of rocas) {
      if (roca.capa !== i) continue;
      m.enCopias(m.x(roca.az) + desvioEn(fondoDe(roca.y)), ancho * Q.SOMBRA.FRACCION_ANCHO + 20, (rx) => pintarRoca(rx, roca.y, roca.fondo, roca.talla));
    }
  });

  // Motas de regolito que devuelven la luz rasante: se encienden y se apagan al moverse el Sol.
  const chispa = m.dia * m.rasante;
  if (chispa > 0.05) {
    ctx.fillStyle = c.solNucleo;
    for (const mota of paisaje.motas) {
      const a = chispa * Math.max(0, Math.sin((mota.az - p.sol_az_deg) * 9 * RAD + mota.fase)) ** 10;
      if (a < 0.05) continue;
      const y = yH + 5 + mota.fondo * (suelo * 0.8);
      const lado = 1 + mota.fondo * 1.2;
      ctx.globalAlpha = a * 0.9;
      m.enCopias(m.x(mota.az) + desvioEn(mota.fondo), 3, (mx) => ctx.fillRect(mx, y, lado, lado));
    }
  }
  ctx.globalAlpha = 1;
}
