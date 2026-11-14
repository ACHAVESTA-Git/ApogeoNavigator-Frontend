import { AnimatePresence, m } from "motion/react";
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useOutlet } from "react-router";
import { useComparacion } from "../../hooks/useComparacion";
import { useMovimientoReducido } from "../../hooks/useMovimientoReducido";
import { MOVIMIENTO, RUTAS } from "../../lib/constants";
import { T } from "../../lib/textos";
import { EstadoCarga } from "../ui/Estados";
import { BannerDatosEjemplo } from "./BannerDatosEjemplo";
import { BarraInferior } from "./BarraInferior";
import { ContextoAppReact, type ContextoApp } from "./contexto";
import { HorizonteContinuo } from "./HorizonteContinuo";
import { ContextoHorizonte, type RegistroHorizonte } from "./horizonteContexto";
import { NavPrincipal } from "./NavPrincipal";
import { marcarNavegacion } from "./TituloPagina";

// Diferida: solo se descarga cuando hay algún sitio fijado para comparar.
const BandejaComparacion = lazy(() => import("./BandejaComparacion"));
const MS = 1000;
/** Las pestañas de un sitio comparten clave: cambiar de pestaña no reanima todo el layout del sitio. */
function claveDeRuta(pathname: string): string {
  const partes = pathname.split("/").filter(Boolean);
  return `/${partes[0] === RUTAS.SITIOS.slice(1) ? partes.slice(0, 2).join("/") : partes.join("/")}`;
}

export function AppShell() {
  const { pathname } = useLocation();
  const outlet = useOutlet();
  const reducido = useMovimientoReducido();
  const contenedor = useRef<HTMLDivElement>(null);
  const registro = useMemo<RegistroHorizonte>(() => ({ anclas: new Map() }), []);
  const [anuncio, setAnuncio] = useState("");
  const [cargaAbierta, setCargaAbierta] = useState(false);
  const clave = claveDeRuta(pathname);
  const hayFijados = useComparacion().ids.length > 0;
  const primera = useRef(true);

  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    marcarNavegacion();
    window.scrollTo(0, 0);
  }, [clave]);

  const anunciar = useCallback((mensaje: string) => setAnuncio(mensaje), []);
  const abrirCarga = useCallback(() => setCargaAbierta(true), []);
  const precargarCarga = useCallback(() => undefined, []);
  const app = useMemo<ContextoApp>(
    () => ({ abrirCarga, precargarCarga, modalAbierto: cargaAbierta, anunciar }),
    [abrirCarga, precargarCarga, cargaAbierta, anunciar],
  );

  const entrada = reducido ? { opacity: 0 } : { opacity: 0, y: MOVIMIENTO.DESPLAZAMIENTO_ENTRADA_PX };
  return (
    <ContextoAppReact.Provider value={app}>
      <ContextoHorizonte.Provider value={registro}>
        <a href="#contenido" className="bg-texto text-vacio sr-only z-50 rounded-xs px-4 py-3 font-semibold focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
          {T.saltar}
        </a>
        <NavPrincipal />
        <BannerDatosEjemplo />
        <div ref={contenedor} className="relative overflow-x-clip">
          <HorizonteContinuo registro={registro} contenedor={contenedor} />
          <main id="contenido" tabIndex={-1} className="pb-[calc(var(--barra-inferior-alto)+var(--bandeja-alto)+env(safe-area-inset-bottom))] outline-none md:pb-(--bandeja-alto)">
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={clave}
                initial={entrada}
                animate={{ opacity: 1, y: 0, transition: { duration: (reducido ? MOVIMIENTO.MICRO : MOVIMIENTO.CORTA) / MS, ease: MOVIMIENTO.EASE_SALIDA } }}
                exit={{ opacity: 0, transition: { duration: reducido ? 0 : MOVIMIENTO.SALIDA_RUTA / MS, ease: MOVIMIENTO.EASE_ENTRADA } }}
              >
                <Suspense fallback={<div className="contenedor min-h-[60svh]"><EstadoCarga /></div>}>{outlet}</Suspense>
              </m.div>
            </AnimatePresence>
          </main>
        </div>
        {hayFijados && <Suspense fallback={null}><BandejaComparacion /></Suspense>}
        <BarraInferior />
        <div aria-live="polite" role="status" className="sr-only">{anuncio}</div>
      </ContextoHorizonte.Provider>
    </ContextoAppReact.Provider>
  );
}
