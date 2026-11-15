import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { aplicarIdiomaAlDocumento } from "./lib/idioma";
import { T } from "./lib/textos";
import "./styles/index.css";

aplicarIdiomaAlDocumento();
// El HTML base va en español; en otro idioma, la descripción y el título de arranque se ponen al día aquí.
document.querySelector('meta[name="description"]')?.setAttribute("content", T.descripcion);
document.title = `${T.marca} · ${T.producto}`;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
