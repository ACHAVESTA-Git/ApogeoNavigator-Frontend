import { CloudUpload } from "lucide-react";
import { Link, NavLink } from "react-router";
import { RUTAS } from "../../lib/constants";
import { T } from "../../lib/textos";
import { clasesBoton, unir } from "../ui/clases";
import { useApp } from "./contexto";
import { RelojUtc } from "./RelojUtc";

const enlace = ({ isActive }: { isActive: boolean }) =>
  unir(
    "tactil inline-flex items-center px-3 text-apoyo font-semibold transition-colors duration-(--dur-micro)",
    isActive ? "text-texto" : "text-texto-2 hover:text-texto",
  );

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
  return (
    <header className="material-denso capilar-b sticky top-0 z-30">
      <div className="contenedor flex h-(--nav-alto-movil) items-center gap-4 md:h-(--nav-alto)">
        <Link to={RUTAS.INICIO} className="rotulo text-texto! tactil inline-flex items-center gap-2 whitespace-nowrap">
          {T.marca}
          <span aria-hidden="true" className="text-horizonte hidden sm:inline">·</span>
          <span className="text-texto-2 hidden sm:inline">{T.producto}</span>
        </Link>
        <nav aria-label={T.nav.principal} className="hidden md:flex">
          <NavLink to={RUTAS.SITIOS} className={enlace}>{T.nav.sitios}</NavLink>
          <NavLink to={RUTAS.COMPARAR} className={enlace}>{T.nav.comparar}</NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-3 md:gap-5">
          <RelojUtc className="hidden lg:flex" />
          <BotonSubirDatos />
          <span className="hidden md:block">
            <NavLink to={RUTAS.ACCESO} className={enlace}>{T.nav.acceso}</NavLink>
          </span>
        </div>
      </div>
    </header>
  );
}
