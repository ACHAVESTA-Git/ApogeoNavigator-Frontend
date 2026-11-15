import { useId, useState } from "react";
import { IDIOMA, IDIOMAS, cambiarIdioma, type Idioma } from "../../lib/idioma";
import { T } from "../../lib/textos";
import { Popup } from "../ui/Popup";
import { Segmentado } from "../ui/Segmentado";

const ANCHO = "26rem";
const OPCIONES = IDIOMAS.map((valor) => ({ valor, etiqueta: T.config.idiomas[valor] }));

/** Configuración de la app. Por ahora, el idioma: elegirlo lo guarda en este navegador y recarga la página. */
export default function DialogoConfiguracion({ alCerrar }: { alCerrar: () => void }) {
  const idTitulo = useId();
  const [sinGuardar, setSinGuardar] = useState(false);
  const t = T.config;
  const elegir = (idioma: Idioma) => {
    if (idioma !== IDIOMA && !cambiarIdioma(idioma)) setSinGuardar(true);
  };
  return (
    <Popup titulo={t.titulo} idTitulo={idTitulo} ancho={ANCHO} alCerrar={alCerrar}>
      <div className="flex flex-col gap-3 pb-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-texto font-semibold">{t.idioma}</p>
          <Segmentado comoRadio etiqueta={t.idioma} opciones={OPCIONES} valor={IDIOMA} alCambiar={elegir} />
        </div>
        <p className="text-apoyo text-texto-2">{t.nota}</p>
        <p className="text-apoyo text-texto-2">{t.notaDatos}</p>
        {sinGuardar && <p role="alert" className="text-apoyo text-texto">{t.sinAlmacenamiento}</p>}
      </div>
    </Popup>
  );
}
