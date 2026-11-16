import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router";
import { AppShell } from "./components/layout/AppShell";
import { RUTAS, SEGMENTO } from "./lib/constants";
import Inicio from "./routes/Inicio";

// Carga diferida por ruta: el JS inicial solo lleva el layout y el Inicio.
export const cargarSitios = () => import("./routes/Sitios");
const Sitios = lazy(cargarSitios);
const SitioLayout = lazy(() => import("./routes/SitioLayout"));
const Cielo = lazy(() => import("./routes/Cielo"));
const Ventanas = lazy(() => import("./routes/Ventanas"));
const DiaLunar = lazy(() => import("./routes/DiaLunar"));
const VentanaAlunizaje = lazy(() => import("./routes/VentanaAlunizaje"));
const Analisis = lazy(() => import("./routes/Analisis"));
const Proyeccion = lazy(() => import("./routes/Proyeccion"));
const Comparar = lazy(() => import("./routes/Comparar"));
const Acceso = lazy(() => import("./routes/Acceso"));
const Perfil = lazy(() => import("./routes/Perfil"));
const GestorClaves = lazy(() => import("./routes/GestorClaves"));
const NoEncontrado = lazy(() => import("./routes/NoEncontrado"));

const PARAM_SITIO = ":siteId";

export function Rutas() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path={RUTAS.INICIO} element={<Inicio />} />
        <Route path={RUTAS.SITIOS} element={<Sitios />} />
        <Route path={RUTAS.SITIO(PARAM_SITIO)} element={<SitioLayout />}>
          <Route index element={<Navigate to={SEGMENTO.CIELO} replace />} />
          <Route path={SEGMENTO.CIELO} element={<Cielo />} />
          <Route path={SEGMENTO.VENTANAS} element={<Ventanas />} />
          <Route path={SEGMENTO.DIA_LUNAR} element={<DiaLunar />} />
          <Route path={SEGMENTO.ANALISIS} element={<Analisis />} />
          <Route path={SEGMENTO.PROYECCION} element={<Proyeccion />} />
        </Route>
        {/* Pantalla propia (sin la cabecera de mes del sitio): abarca los seis meses de datos. */}
        <Route path={RUTAS.VENTANA_ALUNIZAJE(PARAM_SITIO)} element={<VentanaAlunizaje />} />
        <Route path={RUTAS.COMPARAR} element={<Comparar />} />
        <Route path={RUTAS.ACCESO} element={<Acceso />} />
        <Route path={RUTAS.PERFIL} element={<Perfil />} />
        <Route path={RUTAS.CLAVES} element={<GestorClaves />} />
        <Route path="*" element={<NoEncontrado />} />
      </Route>
    </Routes>
  );
}
