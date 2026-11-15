import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router";
import { useSesion } from "../../hooks/useSesion";
import { RUTAS } from "../../lib/constants";
import { iniciales } from "../../lib/sesion";
import { T } from "../../lib/textos";

const ITEM = "tactil hover:bg-texto/[0.07] text-apoyo text-texto flex w-full items-center rounded-control px-3 text-left font-semibold";

/** Estado de sesión en la cabecera: avatar con las iniciales y un menú (perfil, gestor de claves si es admin, cerrar sesión). */
export function MenuSesion() {
  const { usuario, salir } = useSesion();
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const idMenu = useId();

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => !raiz.current?.contains(e.target as Node) && setAbierto(false);
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setAbierto(false);
      boton.current?.focus();
    };
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  if (!usuario) return null;
  const cerrar = () => setAbierto(false);
  return (
    <div ref={raiz} className="relative" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && cerrar()}>
      <button ref={boton} type="button" aria-label={T.sesion.menu(usuario.nombre)} aria-haspopup="true" aria-expanded={abierto} aria-controls={abierto ? idMenu : undefined}
        onClick={() => setAbierto((v) => !v)} className="tactil inline-flex items-center justify-center rounded-full">
        <span aria-hidden="true" className="bg-sol text-vacio inline-flex size-9 items-center justify-center rounded-full text-[0.8125rem] font-bold">{iniciales(usuario.nombre)}</span>
      </button>
      {abierto && (
        <div id={idMenu} className="bg-elevada shadow-flotante absolute top-full right-0 z-40 mt-2 w-60 rounded-panel border border-texto/10 p-2">
          <p className="px-3 pt-1 pb-2">
            <span className="text-texto block truncate font-semibold">{usuario.nombre}</span>
            <span className="text-apoyo text-texto-2">{T.sesion.roles[usuario.rol]}</span>
          </p>
          <ul className="border-linea border-t pt-2">
            <li><Link to={RUTAS.PERFIL} onClick={cerrar} className={ITEM}>{T.sesion.perfil}</Link></li>
            {usuario.rol === "admin" && <li><Link to={RUTAS.CLAVES} onClick={cerrar} className={ITEM}>{T.acceso.claves}</Link></li>}
            <li><button type="button" className={ITEM} onClick={() => { cerrar(); void salir(); }}>{T.sesion.cerrar}</button></li>
          </ul>
        </div>
      )}
    </div>
  );
}
