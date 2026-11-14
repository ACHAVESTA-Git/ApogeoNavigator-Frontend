import { X } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "react-router";
import { useComparacion } from "../../hooks/useComparacion";
import { useSites } from "../../hooks/useSites";
import { DATOS, PARAM_URL, RUTAS } from "../../lib/constants";
import { nombreCorto } from "../../lib/formato";
import { T } from "../../lib/textos";
import { clasesBoton } from "../ui/clases";

const ALTO = "48px";
/** Franja fija con los sitios fijados para comparar. Aparece con 1 o más y lleva a Comparar con 2 o 3. */
export default function BandejaComparacion() {
  const { ids, lista, quitar } = useComparacion();
  const { data: sitios } = useSites();
  const { pathname } = useLocation();
  const visible = ids.length > 0 && pathname !== RUTAS.COMPARAR;
  useEffect(() => {
    document.documentElement.style.setProperty("--bandeja-alto", visible ? ALTO : "0px");
    return () => document.documentElement.style.setProperty("--bandeja-alto", "0px");
  }, [visible]);
  if (!visible) return null;
  const nombre = (id: string) => nombreCorto(sitios?.find((s) => s.site_id === id)?.nombre ?? id);
  return (
    <aside aria-label={T.comparacion.bandeja}
      className="bg-elevada border-horizonte fixed inset-x-0 bottom-[calc(var(--barra-inferior-alto)+env(safe-area-inset-bottom))] z-30 border-t md:bottom-0">
      <div className="contenedor flex h-12 items-center gap-2">
        <ul className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {ids.map((id) => (
            <li key={id} className="text-apoyo text-texto border-linea flex shrink-0 items-center border pl-2.5">
              <span className="max-w-28 truncate sm:max-w-none">{nombre(id)}</span>
              <button type="button" onClick={() => quitar(id)} aria-label={T.comparacion.quitarDe(nombre(id))}
                className="text-texto-2 hover:text-texto inline-flex size-9 items-center justify-center">
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
        {lista ? (
          <Link to={`${RUTAS.COMPARAR}?${PARAM_URL.SITIOS}=${ids.join(",")}`} className={clasesBoton("primario", "min-h-9! shrink-0")}>
            {T.comparacion.comparar}
          </Link>
        ) : (
          <span className="text-apoyo text-texto-2 shrink-0">{T.comparacion.faltan(DATOS.MIN_COMPARAR)}</span>
        )}
      </div>
    </aside>
  );
}
