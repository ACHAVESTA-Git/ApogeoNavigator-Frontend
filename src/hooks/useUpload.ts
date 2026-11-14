import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";
import { CARGA } from "../lib/constants";
import { CLAVES } from "../lib/queryClient";
import { T } from "../lib/textos";
import { ClaveInvalida, agregarArchivos, agrupar, contar, esGuardable, guardarEnSecuencia, puedeValidar, reiniciar, soloNoGuardados,
  validarEnSecuencia, type ArchivoCarga } from "../lib/upload";
import { useClaveGuardada } from "./useClaveCarga";

export type PasoCarga = "elegir" | "validando" | "revisar" | "guardando" | "hecho";

/** Estado del popup «Subir datos»: máquina de pasos, archivos, progreso y errores. La lógica vive en lib/upload.ts. */
export function useUpload(anunciar: (mensaje: string) => void) {
  const queryClient = useQueryClient();
  const { clave, guardar: guardarClave, borrar: borrarClave } = useClaveGuardada(CARGA.CLAVE_SESSION_STORAGE);
  const [paso, setPaso] = useState<PasoCarga>("elegir");
  const [archivos, setArchivos] = useState<ArchivoCarga[]>([]);
  const [progreso, setProgreso] = useState({ hechos: 0, total: 0 });
  const [aviso, setAviso] = useState<string | null>(null);
  const [errorRed, setErrorRed] = useState<(() => void) | null>(null); // la acción que reintenta
  const [claveInvalida, setClaveInvalida] = useState(false);
  const afectados = useRef(new Set<string>()); // site_id cuyas efemérides hay que recargar
  const huboGuardado = useRef(false);
  // La lista autoritativa vive en un ref que se actualiza en el acto: las tandas asíncronas leen siempre lo último,
  // sin esperar al siguiente render.
  const actuales = useRef(archivos);
  const fijar = useCallback((cambiar: (lista: ArchivoCarga[]) => ArchivoCarga[]) => {
    actuales.current = cambiar(actuales.current);
    setArchivos(actuales.current);
  }, []);

  const alCambiar = useCallback((id: string, cambio: Partial<ArchivoCarga>, hechos: number, total: number) => {
    fijar((lista) => lista.map((a) => (a.id === id ? { ...a, ...cambio } : a)));
    setProgreso({ hechos, total });
  }, [fijar]);

  const ejecutar = useCallback(
    async (enCurso: PasoCarga, anterior: PasoCarga, tanda: () => Promise<boolean>, alTerminar: () => void) => {
      setErrorRed(null);
      setAviso(null);
      setPaso(enCurso);
      try {
        if (await tanda()) alTerminar();
      } catch (error) {
        if (error instanceof ClaveInvalida) {
          borrarClave();
          setClaveInvalida(true);
          setPaso("elegir");
          anunciar(T.carga.claveInvalida);
        } else {
          setPaso(anterior);
          setErrorRed(() => () => void ejecutar(enCurso, anterior, tanda, alTerminar));
          anunciar(T.carga.errorRed);
        }
      }
    },
    [borrarClave, anunciar],
  );

  const validar = useCallback(() => {
    if (!puedeValidar(actuales.current) || !clave) return;
    setClaveInvalida(false);
    void ejecutar("validando", "elegir", () => validarEnSecuencia(actuales.current, clave, alCambiar), () => {
      fijar(agrupar); // reagrupación única: válido → advertencias → errores
      setPaso("revisar");
      const c = contar(actuales.current);
      anunciar(T.carga.resultadoValidacion(c.guardables, c.conErrores));
    });
  }, [clave, ejecutar, alCambiar, anunciar, fijar]);

  const guardar = useCallback(() => {
    if (!actuales.current.some(esGuardable)) return;
    void ejecutar("guardando", "revisar", () => guardarEnSecuencia(actuales.current, clave, alCambiar), () => {
      const guardados = actuales.current.filter((a) => a.estado === "guardado");
      guardados.forEach((a) => a.siteId && afectados.current.add(a.siteId));
      if (guardados.length) {
        huboGuardado.current = true;
        setPaso("hecho");
        anunciar(T.carga.exito);
      } else {
        fijar(agrupar); // ninguno guardado: se queda en revisar con los errores
        setPaso("revisar");
        setAviso(T.carga.ningunoGuardado);
        anunciar(T.carga.ningunoGuardado);
      }
    });
  }, [clave, ejecutar, alCambiar, anunciar, fijar]);

  /** Al cerrar tras guardar: recarga el catálogo, las métricas y las efemérides afectadas UNA sola vez. */
  const alCerrar = useCallback(() => {
    if (!huboGuardado.current) return;
    huboGuardado.current = false;
    void queryClient.invalidateQueries({ queryKey: CLAVES.sites });
    void queryClient.invalidateQueries({ queryKey: CLAVES.metricasTodas });
    void queryClient.invalidateQueries({ queryKey: ["puestas"] });
    afectados.current.forEach((id) => void queryClient.invalidateQueries({ queryKey: CLAVES.efemeridesDe(id) }));
    afectados.current.clear();
  }, [queryClient]);

  return useMemo(
    () => ({
      paso, archivos, progreso, aviso, errorRed, clave, claveInvalida, guardarClave, validar, guardar, alCerrar,
      conteo: contar(archivos),
      puedeValidar: puedeValidar(archivos) && Boolean(clave),
      ocupado: paso === "validando" || paso === "guardando",
      anadir: (nuevos: File[]) => {
        const { lista, aviso: nuevoAviso } = agregarArchivos(actuales.current, nuevos);
        fijar(() => lista);
        setAviso(nuevoAviso);
        if (nuevoAviso) anunciar(nuevoAviso);
      },
      quitar: (id: string) => {
        fijar((lista) => lista.filter((a) => a.id !== id));
        setAviso(null);
      },
      /** «← Anterior»: vuelve a elegir sin perder archivos; se validarán de nuevo. */
      anterior: () => {
        fijar(reiniciar);
        setAviso(null);
        setErrorRed(null);
        setPaso("elegir");
      },
      /** «Revisar los no guardados»: vuelve al paso 3 solo con ellos. */
      revisarNoGuardados: () => {
        fijar(soloNoGuardados);
        setPaso("revisar");
      },
    }),
    [paso, archivos, progreso, aviso, errorRed, clave, claveInvalida, guardarClave, validar, guardar, alCerrar, anunciar, fijar],
  );
}
