import { Navigate } from "react-router";
import { PantallaSimple } from "../components/layout/PantallaSimple";
import { Boton } from "../components/ui/Boton";
import { EstadoCarga } from "../components/ui/Estados";
import { useSesion } from "../hooks/useSesion";
import { RUTAS } from "../lib/constants";
import { T } from "../lib/textos";

/** Mi perfil: quién soy, mi rol y las HUELLAS de mis claves post-cuánticas. Nunca hay material privado aquí. */
export default function Perfil() {
  const t = T.perfil;
  const { usuario, comprobando, salir } = useSesion();
  if (comprobando) return <PantallaSimple documento={t.documento} rotulo={t.rotulo} titulo={t.documento}><EstadoCarga /></PantallaSimple>;
  if (!usuario) return <Navigate to={RUTAS.ACCESO} replace />;
  return (
    <PantallaSimple documento={t.documento} rotulo={t.rotulo} titulo={usuario.nombre}>
      <p><span className="rotulo mr-2">{t.rol}</span><span className="text-texto font-semibold">{T.sesion.roles[usuario.rol]}</span></p>
      <h2 className="text-texto mt-7 font-semibold">{t.huellas}</h2>
      <p className="text-apoyo mt-2 max-w-medida">{t.explicacion}</p>
      {usuario.huellas.length === 0 ? (
        <p className="text-apoyo mt-4">{t.sinHuellas}</p>
      ) : (
        <dl className="mt-4 space-y-4">
          {usuario.huellas.map((h) => (
            <div key={`${h.algoritmo}-${h.huella}`} className="border-linea border-t pt-3">
              <dt className="text-texto font-semibold">{h.algoritmo}</dt>
              {t.algoritmos[h.algoritmo] && <dd className="text-apoyo mt-1">{t.algoritmos[h.algoritmo]}</dd>}
              <dd className="text-dato-sm text-texto mt-2 font-mono break-all" data-dato>{h.huella}</dd>
            </div>
          ))}
        </dl>
      )}
      <Boton variante="secundario" className="mt-7" onClick={() => void salir()}>{T.sesion.cerrar}</Boton>
    </PantallaSimple>
  );
}
