import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, CircleCheck, Download, KeyRound, RefreshCw, ShieldAlert, TriangleAlert } from "lucide-react";
import { useDeferredValue, useId, useState, type FormEvent, type ReactNode } from "react";
import { PantallaSimple } from "../components/layout/PantallaSimple";
import { useAnclaHorizonte } from "../components/layout/horizonteContexto";
import { TituloPagina } from "../components/layout/TituloPagina";
import { Boton } from "../components/ui/Boton";
import { EstadoCarga, EstadoError } from "../components/ui/Estados";
import { Popup } from "../components/ui/Popup";
import { Segmentado } from "../components/ui/Segmentado";
import { unir } from "../components/ui/clases";
import { CampoClave } from "../components/upload/CampoClave";
import { Plegable } from "../components/ui/Plegable";
import { SuccessCheck } from "../components/upload/SuccessCheck";
import { Navigate } from "react-router";
import { useClaveGuardada } from "../hooks/useClaveCarga";
import { useSesion } from "../hooks/useSesion";
import { CLAVE_DE_SESION } from "../lib/sesion";
import { API, CLAVES_PQC, RUTAS } from "../lib/constants";
import { CLAVES_EJEMPLO, descargarTexto, entregaDeEjemplo, generarClaves, listarClaves, obtenerPublicaPem, revocarClave, rotarClave,
  type Clave, type ClaveEntregada, type EstadoClave, type FiltrosClaves, type TipoClave } from "../lib/claves";
import { ApiError } from "../lib/errores";
import { T } from "../lib/textos";

const t = T.claves;
const CAMPO = "tactil bg-superficie border-texto/12 text-texto mt-1.5 w-full rounded-control border px-3 focus-visible:-outline-offset-2 aria-[invalid=true]:border-critico";
const fecha = (iso: string) => iso.slice(0, 16).replace("T", " ");
type Accion = { tipo: "generar" } | { tipo: "rotar" | "revocar" | "publica"; clave: Clave };

/**
 * Entrega única de la clave privada: descarga inmediata y aviso destacado. La privada vive SOLO en el estado de
 * este popup (ni localStorage, ni sessionStorage, ni URL, ni caché de consultas) y se descarta al cerrarlo.
 * No existe ningún botón para volver a descargarla: si se pierde, se revoca y se reemite.
 */
function Entrega({ claves, alTerminar }: { claves: ClaveEntregada[]; alTerminar: () => void }) {
  const id = useId();
  const [descargadas, setDescargadas] = useState<string[]>([]);
  const [confirmado, setConfirmado] = useState(false);
  const [hecho, setHecho] = useState(false);
  const todas = descargadas.length === claves.length;
  return (
    <Popup titulo={hecho ? t.entrega.hecho : t.entrega.titulo} rotulo={t.entrega.paso} idTitulo={id} ancho="34rem" bloqueado={!hecho} alCerrar={alTerminar}
      pie={<div className="flex justify-end">
        {hecho ? <Boton variante="primario" className="min-w-36" onClick={(e) => e.currentTarget.closest("dialog")?.dispatchEvent(new Event("cancel", { cancelable: true }))}>{t.entrega.listo}</Boton>
          : <Boton variante="primario" className="min-w-36" disabled={!todas || !confirmado} onClick={() => setHecho(true)}>{t.entrega.listo}</Boton>}
      </div>}>
      <Plegable abierto={hecho}><SuccessCheck guardados={claves.length} noGuardados={0} /><p className="text-apoyo text-texto-2 -mt-6 pb-4 text-center">{t.entrega.detalle(claves.length)}</p></Plegable>
      <Plegable abierto={!hecho}>
        <p role="alert" className="border-reservas text-texto flex gap-3 rounded-control border border-dashed p-3">
          <ShieldAlert aria-hidden="true" className="text-reservas mt-0.5 size-5 shrink-0" />
          <span>{t.entrega.aviso}</span>
        </p>
        <ul className="capilar-t mt-4">
          {claves.map((c) => {
            const lista = descargadas.includes(c.id);
            return (
              <li key={c.id} className="capilar-b flex min-h-15 items-center gap-3 py-2">
                <span className="bg-superficie flex size-8 shrink-0 items-center justify-center rounded-control"><KeyRound aria-hidden="true" className="text-texto-2 size-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-apoyo text-texto truncate font-semibold">{c.nombre_archivo_privada}</p>
                  <p className="text-texto-3 flex items-center gap-1.5 text-[0.8125rem]">
                    {lista && <span role="img" aria-label={t.entrega.descargada} className="text-viable animate-aparecer inline-flex"><CircleCheck aria-hidden="true" className="size-3.5" /></span>}
                    {c.algoritmo} · {t.tamanos(c.tamano_publica, c.tamano_privada_fips)}
                  </p>
                </div>
                <Boton variante={lista ? "secundario" : "primario"} aria-label={t.entrega.descargar(c.nombre_archivo_privada)}
                  onClick={() => { descargarTexto(c.nombre_archivo_privada, c.privada_pem); setDescargadas((d) => [...new Set([...d, c.id])]); }}>
                  <Download aria-hidden="true" className="size-4" />
                </Boton>
              </li>
            );
          })}
        </ul>
        <label className="text-apoyo text-texto mt-4 flex items-start gap-3">
          <input type="checkbox" checked={confirmado} disabled={!todas} onChange={(e) => setConfirmado(e.target.checked)} className="accent-texto mt-1 size-4 shrink-0" />
          {t.entrega.confirmo}
        </label>
      </Plegable>
    </Popup>
  );
}

/** Confirmación de una acción (generar, rotar, revocar, descargar la pública) con su formulario mínimo. */
function Confirmacion({ accion, claveAdmin, ejemplo, alCerrar, alEntregar, alIntroducirClave }: {
  accion: Accion; claveAdmin: string; ejemplo: boolean; alCerrar: () => void; alEntregar: (claves: ClaveEntregada[]) => void; alIntroducirClave: () => void;
}) {
  const id = useId();
  const queryClient = useQueryClient();
  const [usuario, setUsuario] = useState("");
  const [tipos, setTipos] = useState<TipoClave[]>([...CLAVES_PQC.TIPOS]);
  const [motivo, setMotivo] = useState("");
  const textos = accion.tipo === "generar" ? { titulo: t.formGenerar.titulo, texto: "", accion: t.formGenerar.accion }
    : accion.tipo === "rotar" ? t.confirmarRotar : accion.tipo === "revocar" ? t.confirmarRevocar : t.confirmarPublica;
  // gcTime 0: el resultado (que puede llevar la privada) no se queda en la caché de mutaciones.
  const mutacion = useMutation({
    gcTime: 0,
    mutationFn: async (): Promise<ClaveEntregada[] | null> => {
      if (accion.tipo === "publica") {
        const pem = ejemplo ? "-----BEGIN PUBLIC KEY-----\nEJEMPLO: NO ES UNA CLAVE REAL\n-----END PUBLIC KEY-----\n" : await obtenerPublicaPem(claveAdmin, accion.clave.id);
        descargarTexto(`${accion.clave.tipo}-${accion.clave.id.slice(0, 12)}.publica.pem`, pem);
        return null;
      }
      if (ejemplo) return accion.tipo === "revocar" ? null : entregaDeEjemplo(accion.tipo === "generar" ? tipos : [accion.clave.tipo]).claves;
      if (accion.tipo === "generar") return (await generarClaves(claveAdmin, usuario.trim(), tipos)).claves;
      if (accion.tipo === "rotar") return (await rotarClave(claveAdmin, accion.clave.id, motivo.trim())).claves;
      await revocarClave(claveAdmin, accion.clave.id, motivo.trim());
      return null;
    },
    onSuccess: (entregadas) => {
      void queryClient.invalidateQueries({ queryKey: ["claves"] });
      if (entregadas?.length) alEntregar(entregadas);
      else alCerrar();
    },
  });
  const uuidValido = CLAVES_PQC.UUID.test(usuario.trim());
  const motivoValido = motivo.trim().length >= CLAVES_PQC.MOTIVO.MIN && motivo.trim().length <= CLAVES_PQC.MOTIVO.MAX;
  const listo = accion.tipo === "generar" ? (ejemplo || uuidValido) && tipos.length > 0 : accion.tipo === "revocar" ? motivoValido : true;
  const enviar = (e: FormEvent) => { e.preventDefault(); if (listo && !mutacion.isPending) mutacion.mutate(); };
  return (
    <Popup titulo={textos.titulo} rotulo={accion.tipo === "generar" ? t.formGenerar.paso : undefined} idTitulo={id} ancho="32rem" bloqueado={mutacion.isPending} alCerrar={alCerrar}
      pie={<div className="flex justify-end"><Boton type="submit" form={`${id}-f`} variante={accion.tipo === "revocar" ? "peligro" : "primario"} className="min-w-36" disabled={!listo || mutacion.isPending}>{textos.accion}</Boton></div>}>
      <form id={`${id}-f`} onSubmit={enviar} className="space-y-4">
        {"clave" in accion && <p className="text-dato-sm text-texto-2 font-mono" data-dato>{accion.clave.algoritmo} · {accion.clave.usuario_email}</p>}
        {textos.texto && <p className="text-texto">{textos.texto}</p>}
        {accion.tipo === "generar" && (
          <>
            <label className="block">
              <span className="rotulo">{t.formGenerar.usuario}</span>
              <input value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="off" spellCheck={false} aria-invalid={usuario !== "" && !uuidValido} className={`${CAMPO} font-mono`} />
              <span className="text-texto-3 mt-1 block text-[0.8125rem]">{usuario !== "" && !uuidValido ? <strong className="text-critico font-semibold">{t.formGenerar.usuarioError} </strong> : null}{t.formGenerar.usuarioAyuda}</span>
            </label>
            <fieldset>
              <legend className="rotulo">{t.formGenerar.tipos}</legend>
              {CLAVES_PQC.TIPOS.map((tipo) => (
                <label key={tipo} className="tactil text-texto flex items-center gap-3">
                  <input type="checkbox" className="accent-texto size-4" checked={tipos.includes(tipo)} onChange={() => setTipos((a) => (a.includes(tipo) ? a.filter((v) => v !== tipo) : [...a, tipo]))} />
                  {t.tipos[tipo]} <span className="text-texto-3 font-mono text-[0.8125rem]">{tipo === "kem" ? "ML-KEM-1024" : "ML-DSA-65"}</span>
                </label>
              ))}
            </fieldset>
          </>
        )}
        {(accion.tipo === "rotar" || accion.tipo === "revocar") && (
          <label className="block">
            <span className="rotulo">{accion.tipo === "rotar" ? t.confirmarRotar.motivo : t.confirmarRevocar.motivo}</span>
            <input value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={CLAVES_PQC.MOTIVO.MAX} className={CAMPO} />
            {accion.tipo === "revocar" && <span className="text-texto-3 mt-1 block text-[0.8125rem]">{t.confirmarRevocar.motivoAyuda(CLAVES_PQC.MOTIVO.MIN, CLAVES_PQC.MOTIVO.MAX)}</span>}
          </label>
        )}
        {/* Un 401 aquí (clave caducada o cambiada) lleva de vuelta al formulario de la clave. */}
        {mutacion.error && <EstadoError error={mutacion.error} compacto alIntroducirClave={alIntroducirClave} />}
      </form>
    </Popup>
  );
}

const Contador = ({ rotulo, valor }: { rotulo: string; valor: number }) => (
  <div className="panel p-4">
    <dt className="rotulo">{rotulo}</dt>
    <dd className="text-dato-xl text-texto mt-2 font-mono font-medium" data-dato>{valor}</dd>
  </div>
);
const Celda = ({ children, className }: { children: ReactNode; className?: string }) => <td className={unir("px-3 py-2.5 align-middle", className)}>{children}</td>;

export default function GestorClaves() {
  const { usuario, comprobando } = useSesion();
  const { clave: claveGuardada, guardar, borrar } = useClaveGuardada(CLAVES_PQC.SESSION_STORAGE);
  // Con sesión de administración no hace falta la clave: las peticiones van con la cookie.
  const conSesion = usuario?.rol === "admin";
  const claveAdmin = conSesion ? CLAVE_DE_SESION : claveGuardada;
  const [borrador, setBorrador] = useState("");
  const [estado, setEstado] = useState<EstadoClave | "todas">("todas");
  const [tipo, setTipo] = useState<TipoClave | "todos">("todos");
  const [q, setQ] = useState("");
  const [accion, setAccion] = useState<Accion | null>(null);
  const [entrega, setEntrega] = useState<ClaveEntregada[] | null>(null); // la privada solo vive aquí, mientras dure el popup
  const busqueda = useDeferredValue(q.trim());
  const filtros: FiltrosClaves = { estado: estado === "todas" ? undefined : estado, tipo: tipo === "todos" ? undefined : tipo, q: busqueda };
  // Cada «Entrar» abre una consulta nueva: así sale con la clave recién escrita y no con la anterior (vacía o rechazada).
  const [intento, setIntento] = useState(0);
  const consulta = useQuery({
    queryKey: ["claves", conSesion, intento, filtros.estado, filtros.tipo, filtros.q],
    queryFn: () => listarClaves(claveAdmin, filtros, CLAVES_PQC.LIMITE),
    enabled: Boolean(claveAdmin) && !comprobando,
    retry: false,
  });
  const ancla = useAnclaHorizonte("linea");
  const noAutorizado = consulta.error instanceof ApiError && consulta.error.status === API.NO_AUTORIZADO;

  // Con sesión pero sin el rol de administración, el gestor no existe: se vuelve a Acceso.
  if (usuario && !conSesion) return <Navigate to={RUTAS.ACCESO} replace />;
  if (comprobando) return <PantallaSimple documento={t.documento} rotulo={t.rotulo} titulo={t.titulo}><EstadoCarga /></PantallaSimple>;
  if (!claveAdmin || (noAutorizado && !conSesion)) {
    return (
      <PantallaSimple documento={t.documento} rotulo={t.rotulo} titulo={t.titulo}>
        <form className="max-w-md" onSubmit={(e) => { e.preventDefault(); if (borrador) { guardar(borrador); setBorrador(""); setIntento((n) => n + 1); } }}>
          <CampoClave etiqueta={t.pedirClave} ayuda={t.pedirClaveAyuda} valor={borrador} invalida={noAutorizado} alCambiar={setBorrador} />
          <Boton type="submit" variante="primario" className="mt-4 min-w-36" disabled={!borrador}>{t.entrar}</Boton>
        </form>
      </PantallaSimple>
    );
  }
  const items = consulta.data?.items ?? [];
  const ejemplo = Boolean(consulta.data?.ejemplo);
  // Los contadores describen todo lo emitido, no solo lo filtrado: en ejemplo se cuentan las filas ficticias.
  const base = ejemplo ? CLAVES_EJEMPLO : items;
  const de = (c: Clave) => c.usuario_nombre || c.usuario_email;
  return (
    <div className="contenedor py-8 lg:py-10">
      <p className="rotulo">{t.rotulo}</p>
      <TituloPagina documento={t.documento} className="mt-2">{t.titulo}</TituloPagina>
      <p className="text-texto-2 mt-3 max-w-[70ch]">{t.entrada}</p>
      {ejemplo && (
        <p role="status" className="border-reservas text-texto mt-5 flex gap-3 rounded-control border border-dashed p-3">
          <TriangleAlert aria-hidden="true" className="text-reservas mt-0.5 size-5 shrink-0" />
          {t.ejemplo}
        </p>
      )}
      <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Contador rotulo={t.contadores.pares} valor={base.length} />
        <Contador rotulo={t.contadores.activas} valor={base.filter((c) => c.estado === "activa").length} />
        <Contador rotulo={t.contadores.revocadas} valor={base.filter((c) => c.estado === "revocada").length} />
        <Contador rotulo={t.contadores.pqc} valor={base.filter((c) => c.algoritmo.startsWith("ML-")).length} />
      </dl>
      <div ref={ancla} aria-hidden="true" className="mt-8 h-px w-full" />

      <div className="mt-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div role="group" aria-label={t.filtros} className="flex flex-wrap items-end gap-3">
          <Segmentado comoRadio etiqueta={t.estado} valor={estado} alCambiar={setEstado}
            opciones={(["todas", "activa", "revocada"] as const).map((v) => ({ valor: v, etiqueta: t.estados[v] }))} />
          <Segmentado comoRadio etiqueta={t.tipo} valor={tipo} alCambiar={setTipo}
            opciones={(["todos", "kem", "firma"] as const).map((v) => ({ valor: v, etiqueta: t.tipos[v] }))} />
          <label className="block w-full sm:w-64">
            <span className="sr-only">{t.buscar}</span>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.buscar} maxLength={100} className={CAMPO.replace("mt-1.5 ", "")} />
          </label>
        </div>
        <div className="flex gap-2">
          {!conSesion && <Boton variante="texto" onClick={borrar}>{t.cambiarClave}</Boton>}
          <Boton variante="primario" onClick={() => setAccion({ tipo: "generar" })}><KeyRound aria-hidden="true" className="size-4" />{t.generar}</Boton>
        </div>
      </div>

      {consulta.isPending && <EstadoCarga />}
      {consulta.error && !noAutorizado && <EstadoError error={consulta.error} alReintentar={() => void consulta.refetch()} className="mt-6" />}
      {consulta.data && (
        <div className="panel mt-4 overflow-x-auto">
          <table className="text-dato-sm w-full min-w-[60rem] border-collapse text-left">
            <caption className="sr-only">{t.tabla}</caption>
            <thead>
              <tr>{t.columnas.map((c) => <th key={c} scope="col" className="rotulo px-3 py-3">{c}</th>)}</tr>
            </thead>
            <tbody>
              {items.map((c) => {
                const activa = c.estado === "activa";
                const Icono = activa ? CircleCheck : Ban;
                const accionBoton = "tactil text-texto-2 hover:bg-texto/[0.07] hover:text-texto inline-flex items-center justify-center rounded-full transition-[background-color,color,transform] duration-(--dur-micro) active:scale-[0.97] disabled:opacity-30";
                return (
                  <tr key={c.id} className="capilar-t">
                    {/* estado: solo icono de color + palabra, sin fondos de color */}
                    <Celda><span className="inline-flex items-center gap-2 whitespace-nowrap"><Icono aria-hidden="true" className={unir("size-4", activa ? "text-viable" : "text-critico")} />{t.estadoClave[c.estado]}</span></Celda>
                    <Celda><span className="text-texto block font-medium">{c.usuario_nombre}</span><span className="text-texto-3 block">{c.usuario_email}</span></Celda>
                    <Celda className="font-mono whitespace-nowrap"><time dateTime={c.creada_utc}>{fecha(c.creada_utc)}</time>
                      {c.revocada_utc && <span className="text-texto-3 block max-w-[22rem] font-sans whitespace-normal">{t.revocadaEl(fecha(c.revocada_utc), c.motivo_revocacion)}</span>}</Celda>
                    <Celda className="text-texto font-mono whitespace-nowrap">{c.algoritmo}</Celda>
                    <Celda className="text-texto-2 font-mono whitespace-nowrap">{t.tamanos(c.tamano_publica, c.tamano_privada_fips)}</Celda>
                    <Celda className="text-texto-2 font-mono"><abbr title={c.huella_sha3_256} className="no-underline">{c.huella_sha3_256.slice(0, CLAVES_PQC.HUELLA_VISIBLE)}…</abbr></Celda>
                    <Celda className="font-mono">{c.backups}</Celda>
                    <Celda>
                      <div className="flex">
                        <button type="button" className={accionBoton} aria-label={t.descargarPublica(de(c))} title={t.descargarPublica(de(c))} onClick={() => setAccion({ tipo: "publica", clave: c })}><Download aria-hidden="true" className="size-4" /></button>
                        <button type="button" className={accionBoton} disabled={!activa} aria-label={t.rotar(de(c))} title={t.rotar(de(c))} onClick={() => setAccion({ tipo: "rotar", clave: c })}><RefreshCw aria-hidden="true" className="size-4" /></button>
                        <button type="button" className={unir(accionBoton, "hover:text-critico!")} disabled={!activa} aria-label={t.revocar(de(c))} title={t.revocar(de(c))} onClick={() => setAccion({ tipo: "revocar", clave: c })}><Ban aria-hidden="true" className="size-4" /></button>
                      </div>
                    </Celda>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {items.length === 0 && <p className="text-texto-2 p-4">{t.vacia}</p>}
        </div>
      )}

      {accion && <Confirmacion accion={accion} claveAdmin={claveAdmin} ejemplo={ejemplo} alCerrar={() => setAccion(null)} alIntroducirClave={() => { setAccion(null); borrar(); }}
        alEntregar={(claves) => { setAccion(null); setEntrega(claves); }} />}
      {entrega && <Entrega claves={entrega} alTerminar={() => setEntrega(null)} />}
    </div>
  );
}
