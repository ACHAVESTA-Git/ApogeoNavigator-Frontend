import { ArrowBigUpDash, CircleAlert, Eye, EyeOff, LoaderCircle, LogIn, ShieldCheck } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useMovimientoReducido } from "../../hooks/useMovimientoReducido";
import { ACCESO, ENLACES, MOVIMIENTO } from "../../lib/constants";
import { T } from "../../lib/textos";
import { TituloPagina } from "../layout/TituloPagina";
import { Boton, EnlaceExterno } from "../ui/Boton";
import { CampoFlotante } from "./CampoFlotante";

export interface ErrorAcceso {
  titulo: string;
  mensaje: string;
  sugerencia: string;
  requestId?: string;
}
interface Props {
  /** Envía las credenciales; rechaza si el servidor no las acepta. */
  entrar: (credenciales: { email: string; password: string }) => Promise<unknown>;
  entrando: boolean;
  /** Error del último intento, ya traducido por el estándar de errores. */
  error: ErrorAcceso | null;
  /** Llevar el foco al correo al montar (al volver de cerrar sesión). */
  enfocar?: boolean;
}

const PX = ACCESO.SACUDIDA_PX;
const SACUDIDA = [0, -PX, PX * 0.66, -PX * 0.33, 0].map((x) => ({ transform: `translateX(${x}px)` }));

/** Formulario de inicio de sesión. La contraseña solo vive en el estado mientras se escribe y se envía. */
export function FormularioAcceso({ entrar, entrando, error, enfocar = false }: Props) {
  const t = T.acceso;
  const reducido = useMovimientoReducido();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [mayus, setMayus] = useState(false);
  const [faltan, setFaltan] = useState(false);
  // Cada intento fallido: sacude los campos y lleva el foco al que hay que corregir.
  const [fallo, setFallo] = useState<{ n: number; campo: "email" | "password" }>({ n: 0, campo: "email" });
  const id = useId();
  const idError = `${id}-error`;
  const idMayus = `${id}-mayus`;
  const campos = useRef<HTMLDivElement>(null);
  const refEmail = useRef<HTMLInputElement>(null);
  const refPassword = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (enfocar) refEmail.current?.focus({ preventScroll: true });
  }, [enfocar]);
  useEffect(() => {
    if (fallo.n === 0) return;
    (fallo.campo === "email" ? refEmail : refPassword).current?.focus();
    if (reducido || typeof campos.current?.animate !== "function") return;
    const sacudida = campos.current.animate(SACUDIDA, { duration: ACCESO.SACUDIDA_MS, easing: `cubic-bezier(${MOVIMIENTO.EASE_SALIDA.join(",")})` });
    return () => sacudida.cancel();
  }, [fallo, reducido]);

  const fallar = (campo: "email" | "password") => setFallo((f) => ({ n: f.n + 1, campo }));
  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    if (entrando) return;
    const correo = email.trim();
    if (!correo || !password) {
      setFaltan(true);
      return fallar(correo ? "password" : "email");
    }
    setFaltan(false);
    setVisible(false);
    // La contraseña sale del estado en cuanto se envía, acierte o no.
    void entrar({ email: correo, password }).catch(() => fallar("password")).finally(() => setPassword(""));
  };
  // Bloq Mayús: se lee del propio evento de teclado; no se guarda nada más que si está activo.
  const leerMayus = (e: KeyboardEvent<HTMLInputElement>) => setMayus(e.getModifierState?.("CapsLock") ?? false);

  const hayError = faltan || Boolean(error);
  const describe = [hayError ? idError : "", mayus ? idMayus : ""].filter(Boolean).join(" ") || undefined;
  return (
    <>
      <p className="rotulo">{t.rotulo}</p>
      <TituloPagina documento={t.documento} className="mt-3">{t.titulo}</TituloPagina>
      <p className="text-apoyo text-texto-2 mt-3">{t.texto}</p>
      <form className="mt-6" noValidate onSubmit={enviar} aria-busy={entrando}>
        <div ref={campos} className="space-y-3">
          <CampoFlotante ref={refEmail} id={`${id}-email`} etiqueta={t.email} name="email" type="email" inputMode="email" autoComplete="username"
            autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="next" value={email} onChange={(e) => setEmail(e.target.value)}
            aria-invalid={hayError} aria-describedby={hayError ? idError : undefined} />
          <CampoFlotante ref={refPassword} id={`${id}-password`} etiqueta={t.password} name="password" type={visible ? "text" : "password"}
            autoComplete="current-password" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="go" value={password}
            onChange={(e) => setPassword(e.target.value)} onKeyDown={leerMayus} onKeyUp={leerMayus} onBlur={() => setMayus(false)}
            aria-invalid={hayError} aria-describedby={describe}
            accion={
              <button type="button" aria-label={t.mostrarPassword} aria-pressed={visible} onClick={() => setVisible((v) => !v)}
                className="tactil text-texto-2 hover:text-texto inline-flex items-center justify-center rounded-control transition-[color,transform] duration-(--dur-micro) ease-salida active:scale-[0.94]">
                {visible ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
              </button>
            } />
        </div>
        {/* Avisos bajo los campos: altura reservada, para que el botón no salte al aparecer uno */}
        <div className="text-apoyo mt-3 min-h-6">
          <p id={idMayus} role="status" className="text-reservas flex items-center gap-2 font-semibold empty:hidden">
            {mayus && <><ArrowBigUpDash aria-hidden="true" className="size-4 shrink-0" />{t.bloqMayus}</>}
          </p>
          <div id={idError} role="alert">
            {hayError && (
              <div className="bg-critico/12 animate-aparecer mt-1 flex items-start gap-2.5 rounded-control p-3">
                <CircleAlert aria-hidden="true" className="text-critico mt-0.5 size-4 shrink-0" />
                <div className="min-w-0">
                  {faltan ? <p className="text-critico font-semibold">{t.faltan}</p> : error && (
                    <>
                      <p className="text-critico font-semibold">{error.titulo}</p>
                      <p className="text-texto-2">{`${error.mensaje} ${error.sugerencia}`.trim()}</p>
                      {error.requestId && <p className="text-texto-2 text-dato-sm mt-1 font-mono break-all" data-dato>{T.errores.seguimiento}: {error.requestId}</p>}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* aria-disabled (no disabled): el botón conserva el foco mientras se envía */}
        <Boton type="submit" variante="primario" className="mt-3 w-full" aria-disabled={entrando}>
          {entrando ? <LoaderCircle aria-hidden="true" className="animate-girar size-4" /> : <LogIn aria-hidden="true" className="size-4" />}
          {entrando ? t.entrando : t.entrar}
        </Boton>
      </form>
      <p className="text-apoyo text-texto mt-6 flex items-center gap-2 font-semibold">
        <ShieldCheck aria-hidden="true" className="text-viable size-4 shrink-0" />
        {t.seguridad}
      </p>
      <p className="text-apoyo text-texto-2 mt-2">{t.privacidad}</p>
      <p className="text-apoyo mt-3"><EnlaceExterno href={ENLACES.SEGURIDAD}>{t.documentoSeguridad}</EnlaceExterno></p>
    </>
  );
}
