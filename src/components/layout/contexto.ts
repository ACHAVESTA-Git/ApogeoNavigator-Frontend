import { createContext, useContext } from "react";

export interface ContextoApp {
  /** Abre el popup «Subir datos». */
  abrirCarga: () => void;
  /** Precarga el código del popup (hover o foco sobre el botón). */
  precargarCarga: () => void;
  /** Hay una capa modal abierta: las animaciones autónomas se pausan. */
  modalAbierto: boolean;
  /** Mensaje para la región aria-live única de la app. */
  anunciar: (mensaje: string) => void;
}
const sinProveedor = () => undefined;
export const ContextoAppReact = createContext<ContextoApp>({
  abrirCarga: sinProveedor, precargarCarga: sinProveedor, modalAbierto: false, anunciar: sinProveedor,
});
export const useApp = (): ContextoApp => useContext(ContextoAppReact);
