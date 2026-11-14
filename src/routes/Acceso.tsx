import { LockKeyhole } from "lucide-react";
import { PantallaSimple } from "../components/layout/PantallaSimple";
import { Boton, EnlaceExterno } from "../components/ui/Boton";
import { ENLACES } from "../lib/constants";
import { T } from "../lib/textos";

/** Marcador de acceso: no hay campos de usuario ni de contraseña. El inicio de sesión llegará con OAuth 2.0. */
export default function Acceso() {
  const t = T.acceso;
  return (
    <PantallaSimple documento={t.documento} rotulo={t.rotulo} titulo={t.titulo}>
      <p className="max-w-[60ch]">{t.texto}</p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Boton variante="primario" aria-disabled="true" aria-describedby="acceso-nota" onClick={(e) => e.preventDefault()}>
          <LockKeyhole aria-hidden="true" className="size-4" />
          {t.boton}
        </Boton>
      </div>
      <p id="acceso-nota" className="text-apoyo text-texto-3 mt-3">{t.nota}</p>
      <p className="text-apoyo mt-6"><EnlaceExterno href={ENLACES.SEGURIDAD}>{t.documentoSeguridad}</EnlaceExterno></p>
    </PantallaSimple>
  );
}
