// Clases compartidas por botones y enlaces con aspecto de botón (un solo sitio: nada de estilos repetidos).
export type VarianteBoton = "primario" | "secundario" | "texto" | "peligro";

const BASE =
  "tactil inline-flex items-center justify-center gap-2 rounded-xs px-4 text-apoyo font-semibold select-none " +
  "transition-[background-color,border-color,color,transform] duration-(--dur-micro) ease-salida active:scale-[0.98] " +
  "disabled:opacity-45 disabled:active:scale-100 aria-disabled:opacity-45 aria-disabled:active:scale-100";

const VARIANTES: Record<VarianteBoton, string> = {
  primario: "bg-texto text-vacio hover:bg-foco",
  secundario: "border border-horizonte text-texto hover:border-texto hover:bg-superficie",
  texto: "px-2 text-texto-2 underline-offset-4 hover:text-texto hover:underline",
  peligro: "border border-critico text-critico hover:bg-superficie",
};

export const clasesBoton = (variante: VarianteBoton = "secundario", extra = ""): string =>
  `${BASE} ${VARIANTES[variante]} ${extra}`.trim();

export const unir = (...clases: (string | false | null | undefined)[]): string => clases.filter(Boolean).join(" ");
