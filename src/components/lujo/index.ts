// Primitivas del lenguaje «lujo sobrio» (docs/frontend/plan-rediseno-final-fable.md, §1 y §2).
// Regla dura: ninguna comunica estado con una línea lateral; siempre icono + texto + chip o halo.
export { CifraHeroe, type CifraHeroeProps } from "./CifraHeroe";
export { Medidor, type MedidorProps } from "./Medidor";
export { PanelVidrio, type PanelVidrioProps } from "./PanelVidrio";
export { Sello, estadoSello, type EstadoSello, type SelloProps } from "./Sello";
export { Veredicto, type VeredictoProps } from "./Veredicto";
export { nivelPorUmbrales, type UmbralesMedidor } from "../../lib/lujo";
