import { UserRound } from "lucide-react";
import { useEffect, useRef, type CSSProperties } from "react";
import { ACCESO, RUTAS } from "../../lib/constants";
import type { UsuarioSesion } from "../../lib/sesion";
import { T } from "../../lib/textos";
import { TituloPagina } from "../layout/TituloPagina";
import { Boton, EnlaceBoton } from "../ui/Boton";
import { HuellasPqc } from "./HuellasPqc";

interface Props {
  usuario: UsuarioSesion;
  /** Acaba de iniciar sesión en esta pantalla: el contenido entra escalonado y el título recibe el foco. */
  recien: boolean;
  /** Llegó rebotado del gestor de claves sin el rol de administración. */
  rebotado: boolean;
  salir: () => void;
}

/** «Sesión iniciada»: quién eres, tu rol y las huellas públicas de tus claves; nunca un secreto. */
export function SesionIniciada({ usuario, recien, rebotado, salir }: Props) {
  const t = T.acceso;
  const raiz = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (recien) raiz.current?.querySelector("h1")?.focus({ preventScroll: true });
  }, [recien]);
  // Tres tiempos, no uniformes: identidad, huellas, acciones. El panel no se mueve: solo entra su contenido.
  const tiempo = (i: number) => (recien ? { className: "acceso-entra", style: { "--retraso": `${ACCESO.RETRASOS_ENTRADA_MS[i]}ms` } as CSSProperties } : {});
  const rol = T.sesion.roles[usuario.rol];
  return (
    <div ref={raiz}>
      <div {...tiempo(0)}>
        <p className="rotulo flex items-center gap-2">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="text-viable size-5 fill-none stroke-current" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" pathLength={1} className={recien ? "check-circulo" : undefined} />
            <path d="m8 12.5 3 3 5-6" pathLength={1} className={recien ? "check-trazo" : undefined} />
          </svg>
          {t.sesionIniciada}
        </p>
        <TituloPagina documento={t.documento} className="mt-3">{usuario.nombre}</TituloPagina>
        <p className="text-apoyo text-texto-2 mt-2">{t.sesionDe(usuario.nombre, rol)}</p>
        {rebotado && usuario.rol !== "admin" && <p role="status" className="text-apoyo text-reservas mt-3">{t.soloAdmin}</p>}
      </div>
      <div {...tiempo(1)}>
        <p className="rotulo mt-6">{t.rol}</p>
        <p className="bg-sol-tenue text-apoyo text-texto mt-2 inline-flex min-h-8 items-center gap-2 rounded-full px-3 py-1 font-semibold">
          <UserRound aria-hidden="true" className="text-sol size-3.5 shrink-0" />
          {rol}
        </p>
        <p className="rotulo mt-5">{t.huellas}</p>
        {usuario.huellas.length > 0 ? <HuellasPqc huellas={usuario.huellas} className="mt-2" /> : <p className="text-apoyo text-texto-2 mt-2">{T.perfil.sinHuellas}</p>}
      </div>
      <div {...tiempo(2)} className={`mt-7 flex flex-wrap items-center gap-3 ${recien ? "acceso-entra" : ""}`}>
        <EnlaceBoton variante="primario" to={RUTAS.PERFIL}>{T.sesion.perfil}</EnlaceBoton>
        {usuario.rol === "admin" && <EnlaceBoton to={RUTAS.CLAVES}>{t.claves}</EnlaceBoton>}
        <Boton variante="texto" onClick={salir}>{T.sesion.cerrar}</Boton>
      </div>
    </div>
  );
}
