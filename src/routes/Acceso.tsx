import { useState } from "react";
import { useLocation } from "react-router";
import { FormularioAcceso } from "../components/auth/FormularioAcceso";
import { PantallaAcceso } from "../components/auth/PantallaAcceso";
import { SesionIniciada } from "../components/auth/SesionIniciada";
import { EstadoCarga } from "../components/ui/Estados";
import { useSesion } from "../hooks/useSesion";
import { API } from "../lib/constants";
import { ApiError, traducirError } from "../lib/errores";
import { IDIOMA } from "../lib/idioma";
import { T } from "../lib/textos";

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
  const { usuario, comprobando, entrar, entrando, errorEntrada, salir } = useSesion();
  // Lo que pasó EN esta pantalla decide el movimiento y el foco: entrar anima «sesión iniciada»; salir enfoca el correo.
  const [ultimo, setUltimo] = useState<"entrada" | "salida" | null>(null);
  // Quien llega rebotado del gestor de claves sin el rol de administración lee por qué está aquí.
  const rebotado = Boolean((useLocation().state as { soloAdmin?: boolean } | null)?.soloAdmin);

  if (comprobando) return <PantallaAcceso><EstadoCarga /></PantallaAcceso>;
  if (usuario) {
    return (
      <PantallaAcceso>
        <SesionIniciada usuario={usuario} recien={ultimo === "entrada"} rebotado={rebotado}
          salir={() => void salir().finally(() => setUltimo("salida"))} />
      </PantallaAcceso>
    );
  }
  return (
    <PantallaAcceso>
      <FormularioAcceso entrando={entrando} error={errorEntrada ? errorDeAcceso(errorEntrada) : null} enfocar={ultimo === "salida"}
        entrar={async (credenciales) => {
          await entrar(credenciales);
          setUltimo("entrada");
        }} />
    </PantallaAcceso>
  );
}
