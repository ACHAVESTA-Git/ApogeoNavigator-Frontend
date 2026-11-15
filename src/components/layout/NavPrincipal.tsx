import { CloudUpload, Settings } from "lucide-react";
import { Suspense, lazy, useState } from "react";
import { Link, NavLink } from "react-router";
import { useSesion } from "../../hooks/useSesion";
import { RUTAS } from "../../lib/constants";
import { T } from "../../lib/textos";
import { Logo } from "../marca/Logo";
import { clasesBoton, unir } from "../ui/clases";
import { useApp } from "./contexto";
import { MenuSesion } from "./MenuSesion";
import { RelojUtc } from "./RelojUtc";

const enlace = ({ isActive }: { isActive: boolean }) =>
  unir(
    "tactil inline-flex items-center px-3 text-apoyo font-semibold transition-colors duration-(--dur-micro)",
    isActive ? "text-texto" : "text-texto-2 hover:text-texto",
  );

// El diálogo de configuración se descarga al pasar el ratón o el foco por el botón y se monta al pulsar.
const cargarConfiguracion = () => import("./DialogoConfiguracion");
const DialogoConfiguracion = lazy(cargarConfiguracion);

/** Botón de ajustes de la cabecera: abre la configuración (idioma). */
function BotonConfiguracion() {
  const [abierta, setAbierta] = useState(false);
  const precargar = () => void cargarConfiguracion();
  return (
    <>
      <button
        type="button"
        aria-label={T.config.abrir}
        title={T.config.abrir}
        aria-haspopup="dialog"
        onClick={() => setAbierta(true)}
        onPointerEnter={precargar}
        onFocus={precargar}
        className="tactil text-texto-2 hover:bg-texto/[0.07] hover:text-texto inline-flex shrink-0 items-center justify-center rounded-full transition-[background-color,color,transform] duration-(--dur-micro) ease-salida active:scale-[0.97]"
      >
        <Settings aria-hidden="true" className="size-5" />
      </button>
      {abierta && <Suspense fallback={null}><DialogoConfiguracion alCerrar={() => setAbierta(false)} /></Suspense>}
    </>
  );
}

/** El único botón «Subir datos» de la app: abre el popup de carga (no hay pantalla de carga). */
export function BotonSubirDatos() {
  const { abrirCarga, precargarCarga } = useApp();
  return (
    <button
      type="button"
      aria-label={T.nav.subir}
      data-subir-datos
      onClick={abrirCarga}
      onPointerEnter={precargarCarga}
      onFocus={precargarCarga}
      className={clasesBoton("secundario", "px-3 md:px-4")}
    >
      <CloudUpload aria-hidden="true" className="size-4.5 shrink-0" />
      <span aria-hidden="true" className="hidden min-[400px]:inline md:hidden">{T.nav.subirCorto}</span>
      <span aria-hidden="true" className="hidden md:inline">{T.nav.subir}</span>
    </button>
  );
}

export function NavPrincipal() {
  const { usuario } = useSesion();
  return (
    <header className="material-denso capilar-b sticky top-0 z-30">
      <div className="contenedor flex h-(--nav-alto-movil) items-center gap-4 md:h-(--nav-alto)">
        <Link to={RUTAS.INICIO} aria-label={`${T.marca} · ${T.nav.inicio}`} className="tactil inline-flex items-center">
          <Logo compacto />
        </Link>
        <nav aria-label={T.nav.principal} className="hidden md:flex">
          <NavLink to={RUTAS.SITIOS} className={enlace}>{T.nav.sitios}</NavLink>
          <NavLink to={RUTAS.COMPARAR} className={enlace}>{T.nav.comparar}</NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-3 md:gap-5">
          <RelojUtc className="hidden lg:flex" />
          <BotonSubirDatos />
          {usuario ? <MenuSesion /> : (
            <span className="hidden md:block">
              <NavLink to={RUTAS.ACCESO} className={enlace}>{T.nav.acceso}</NavLink>
            </span>
          )}
          <BotonConfiguracion />
        </div>
      </div>
    </header>
  );
}
