import { House, MapPinned, Rows3 } from "lucide-react";
import { NavLink } from "react-router";
import { RUTAS } from "../../lib/constants";
import { T } from "../../lib/textos";
import { unir } from "../ui/clases";

const DESTINOS = [
  { a: RUTAS.INICIO, etiqueta: T.nav.inicio, Icono: House, exacto: true },
  { a: RUTAS.SITIOS, etiqueta: T.nav.sitios, Icono: MapPinned, exacto: false },
  { a: RUTAS.COMPARAR, etiqueta: T.nav.comparar, Icono: Rows3, exacto: false },
];

/** Navegación móvil: tres destinos con icono Y texto, fija abajo y con área segura. */
export function BarraInferior() {
  return (
    <nav
      aria-label={T.nav.principal}
      className="material capilar-t fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {DESTINOS.map(({ a, etiqueta, Icono, exacto }) => (
        <NavLink
          key={a}
          to={a}
          end={exacto}
          className={({ isActive }) =>
            unir("flex h-(--barra-inferior-alto) flex-col items-center justify-center gap-1 text-[0.6875rem] font-semibold tracking-wide",
              isActive ? "text-texto" : "text-texto-3")
          }
        >
          {({ isActive }) => (
            <>
              <Icono aria-hidden="true" className="size-5" strokeWidth={isActive ? 2.2 : 1.6} />
              {etiqueta}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
