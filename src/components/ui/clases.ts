// Clases compartidas por botones y enlaces con aspecto de botón (un solo sitio: nada de estilos repetidos).
export type VarianteBoton = "primario" | "secundario" | "texto" | "peligro";

// Botones en píldora, con profundidad: el primario lleva brillo interior; el secundario es una capa translúcida.
const BASE =
  "tactil inline-flex items-center justify-center gap-2 rounded-full px-5 text-apoyo font-semibold select-none " +
  "transition-[background-color,border-color,color,transform,box-shadow] duration-(--dur-micro) ease-salida active:scale-[0.97] " +
  "disabled:opacity-40 disabled:active:scale-100 aria-disabled:opacity-40 aria-disabled:active:scale-100";

const VARIANTES: Record<VarianteBoton, string> = {
  primario: "bg-texto text-vacio shadow-boton hover:bg-foco",
  secundario: "border border-texto/14 bg-texto/[0.045] text-texto hover:border-texto/30 hover:bg-texto/[0.09]",
  texto: "px-3 text-texto-2 hover:bg-texto/[0.06] hover:text-texto",
  peligro: "border border-critico/60 bg-critico/[0.06] text-critico hover:bg-critico/[0.12]",
};

export const clasesBoton = (variante: VarianteBoton = "secundario", extra = ""): string =>
  `${BASE} ${VARIANTES[variante]} ${extra}`.trim();

export const unir = (...clases: (string | false | null | undefined)[]): string => clases.filter(Boolean).join(" ");
