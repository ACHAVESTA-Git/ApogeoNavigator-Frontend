import { UserRound } from "lucide-react";
import { Navigate } from "react-router";
import { PantallaAcceso } from "../components/auth/PantallaAcceso";
import { TituloPagina } from "../components/layout/TituloPagina";
import { Boton } from "../components/ui/Boton";
import { EstadoCarga } from "../components/ui/Estados";
import { useSesion } from "../hooks/useSesion";
import { RUTAS } from "../lib/constants";
import { T } from "../lib/textos";

/** Mi perfil: quién soy, mi rol y las HUELLAS de mis claves post-cuánticas. Nunca hay material privado aquí. */
export default function Perfil() {
  const t = T.perfil;
  const { usuario, comprobando, salir } = useSesion();
  if (comprobando) return <PantallaAcceso><EstadoCarga /></PantallaAcceso>;
  if (!usuario) return <Navigate to={RUTAS.ACCESO} replace />;
  return (
    <PantallaAcceso>
      <p className="rotulo">{t.rotulo}</p>
      <TituloPagina documento={t.documento} className="mt-3">{usuario.nombre}</TituloPagina>
      <p className="rotulo mt-5">{t.rol}</p>
      <p className="bg-sol-tenue text-apoyo text-texto mt-2 inline-flex min-h-8 items-center gap-2 rounded-full px-3 py-1 font-semibold">
        <UserRound aria-hidden="true" className="text-sol size-3.5 shrink-0" />
        {T.sesion.roles[usuario.rol]}
      </p>
      <h2 className="text-texto mt-7 font-semibold">{t.huellas}</h2>
      <p className="text-apoyo text-texto-2 mt-2">{t.explicacion}</p>
      {usuario.huellas.length === 0 ? (
        <p className="text-apoyo text-texto-2 mt-4">{t.sinHuellas}</p>
      ) : (
        <dl className="mt-4 space-y-3">
          {usuario.huellas.map((h) => (
            <div key={`${h.algoritmo}-${h.huella}`} className="bg-texto/[0.045] rounded-control border border-texto/10 p-3">
              <dt className="text-texto font-semibold">{h.algoritmo}</dt>
              {t.algoritmos[h.algoritmo] && <dd className="text-apoyo text-texto-2 mt-1">{t.algoritmos[h.algoritmo]}</dd>}
              <dd className="text-dato-sm text-texto mt-2 font-mono break-all" data-dato>{h.huella}</dd>
            </div>
          ))}
        </dl>
      )}
      <Boton variante="secundario" className="mt-7" onClick={() => void salir()}>{T.sesion.cerrar}</Boton>
    </PantallaAcceso>
  );
}
