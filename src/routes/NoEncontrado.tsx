import { PantallaSimple } from "../components/layout/PantallaSimple";
import { EnlaceBoton } from "../components/ui/Boton";
import { RUTAS } from "../lib/constants";
import { T } from "../lib/textos";

export default function NoEncontrado() {
  const t = T.noEncontrado;
  return (
    <PantallaSimple documento={t.documento} rotulo={t.rotulo} titulo={t.titulo}>
      <p className="max-w-[68ch]">{t.texto}</p>
      <EnlaceBoton to={RUTAS.SITIOS} variante="primario" className="mt-6">{t.volver}</EnlaceBoton>
    </PantallaSimple>
  );
}
