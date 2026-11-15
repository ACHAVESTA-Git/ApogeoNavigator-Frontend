import { LogIn } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { PantallaSimple } from "../components/layout/PantallaSimple";
import { Boton, EnlaceBoton, EnlaceExterno } from "../components/ui/Boton";
import { EstadoCarga } from "../components/ui/Estados";
import { useSesion } from "../hooks/useSesion";
import { API, ENLACES, RUTAS } from "../lib/constants";
import { ApiError, traducirError } from "../lib/errores";
import { IDIOMA } from "../lib/idioma";
import { T } from "../lib/textos";

const CAMPO = "tactil bg-superficie border-linea text-texto mt-1.5 w-full rounded-control border px-3 focus-visible:-outline-offset-2 aria-[invalid=true]:border-critico";

/**
 * Qué decir cuando el inicio de sesión falla. Un 401 es «correo o contraseña incorrectos» (el catálogo general
 * habla de claves de API); si el backend trae su propio título y mensaje, en español se muestran tal cual.
 */
export function errorDeAcceso(error: unknown, idioma = IDIOMA): { titulo: string; mensaje: string; sugerencia: string; requestId?: string } {
  const e = traducirError(error, idioma);
  const credenciales = error instanceof ApiError && error.status === API.NO_AUTORIZADO && !(idioma === "es" && error.error);
  return credenciales ? { ...T.acceso.errorCredenciales, requestId: e.requestId } : e;
}

/** Acceso: formulario de correo y contraseña o, con sesión, quién eres y adónde ir. */
export default function Acceso() {
  const t = T.acceso;
  const { usuario, comprobando, entrar, entrando, errorEntrada, salir } = useSesion();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [faltan, setFaltan] = useState(false);
  const id = useId();
  const idError = `${id}-error`;

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    if (!email.trim() || !password) return setFaltan(true);
    setFaltan(false);
    // La contraseña sale del estado en cuanto se envía, acierte o no.
    void entrar({ email: email.trim(), password }).catch(() => undefined).finally(() => setPassword(""));
  };

  if (comprobando) return <PantallaSimple documento={t.documento} rotulo={t.rotulo} titulo={t.titulo}><EstadoCarga /></PantallaSimple>;
  if (usuario) {
    return (
      <PantallaSimple documento={t.documento} rotulo={t.rotulo} titulo={usuario.nombre}>
        <p>{t.sesionDe(usuario.nombre, T.sesion.roles[usuario.rol])}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <EnlaceBoton variante="primario" to={RUTAS.PERFIL}>{T.sesion.perfil}</EnlaceBoton>
          {usuario.rol === "admin" && <EnlaceBoton to={RUTAS.CLAVES}>{t.claves}</EnlaceBoton>}
          <Boton variante="texto" onClick={() => void salir()}>{T.sesion.cerrar}</Boton>
        </div>
      </PantallaSimple>
    );
  }
  const error = errorEntrada ? errorDeAcceso(errorEntrada) : null;
  const hayError = faltan || Boolean(error);
  return (
    <PantallaSimple documento={t.documento} rotulo={t.rotulo} titulo={t.titulo}>
      <p className="max-w-[60ch]">{t.texto}</p>
      <form className="mt-6 max-w-md" noValidate onSubmit={enviar}>
        <label htmlFor={`${id}-email`} className="rotulo">{t.email}</label>
        <input id={`${id}-email`} name="email" type="email" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false}
          value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={hayError} aria-describedby={hayError ? idError : undefined} className={CAMPO} />
        <label htmlFor={`${id}-password`} className="rotulo mt-4 block">{t.password}</label>
        <input id={`${id}-password`} name="password" type="password" autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={hayError} aria-describedby={hayError ? idError : undefined} className={CAMPO} />
        <div id={idError} role="alert" className="mt-3 min-h-6 text-apoyo">
          {faltan && <p className="text-critico font-semibold">{t.faltan}</p>}
          {!faltan && error && (
            <>
              <p className="text-critico font-semibold">{error.titulo}</p>
              <p className="text-texto-2">{`${error.mensaje} ${error.sugerencia}`.trim()}</p>
              {error.requestId && <p className="text-texto-3 text-dato-sm font-mono" data-dato>{T.errores.seguimiento}: {error.requestId}</p>}
            </>
          )}
        </div>
        <Boton type="submit" variante="primario" className="mt-2 min-w-40" disabled={entrando}>
          <LogIn aria-hidden="true" className="size-4" />
          {entrando ? t.entrando : t.entrar}
        </Boton>
      </form>
      <p className="text-apoyo text-texto-3 mt-5 max-w-[60ch]">{t.privacidad}</p>
      <p className="text-apoyo mt-4"><EnlaceExterno href={ENLACES.SEGURIDAD}>{t.documentoSeguridad}</EnlaceExterno></p>
    </PantallaSimple>
  );
}
