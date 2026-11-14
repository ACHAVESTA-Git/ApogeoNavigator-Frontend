import { Link } from "react-router";
import { ENLACES, RUTAS } from "../../lib/constants";
import { T } from "../../lib/textos";
import { EnlaceExterno } from "../ui/Boton";

export function Pie() {
  const t = T.inicio.pie;
  return (
    <footer className="border-linea border-t">
      <div className="contenedor text-apoyo text-texto-2 grid gap-6 py-10 md:grid-cols-12">
        <p className="max-w-[68ch] md:col-span-7">{t.aviso}</p>
        <ul className="space-y-2 md:col-span-4 md:col-start-9">
          <li>{t.licencia}</li>
          <li><EnlaceExterno href={ENLACES.REPO_FRONTEND}>{t.repoFrontend}</EnlaceExterno></li>
          <li><EnlaceExterno href={ENLACES.REPO_BACKEND}>{t.repoBackend}</EnlaceExterno></li>
          <li><Link to={RUTAS.ACCESO} className="text-texto decoration-horizonte underline underline-offset-4">{t.acceso}</Link></li>
        </ul>
      </div>
    </footer>
  );
}
