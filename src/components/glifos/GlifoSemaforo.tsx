import { NOMBRE_NIVEL } from "../../lib/textos";
import type { NivelSemaforo } from "../../lib/tipos";
import { unir } from "../ui/clases";

const COLOR: Record<NivelSemaforo, string> = { verde: "text-viable", amarillo: "text-reservas", rojo: "text-critico" };

/** Forma por nivel (nunca solo color): círculo lleno, triángulo, cuadrado con aspa. */
function Forma({ nivel }: { nivel: NivelSemaforo }) {
  if (nivel === "verde") return <circle cx="8" cy="8" r="6" fill="currentColor" />;
  if (nivel === "amarillo") return <path d="M8 1.5 15 14H1Z" fill="currentColor" />;
  return (
    <>
      <rect x="1.5" y="1.5" width="13" height="13" fill="currentColor" />
      <path d="M5 5l6 6M11 5l-6 6" className="stroke-vacio" strokeWidth="1.8" />
    </>
  );
}

/** Semáforo con glifo + palabra. `nota` añade el asterisco de «sensible al relieve». */
export function GlifoSemaforo({ nivel, conTexto = true, nota, className }: {
  nivel: NivelSemaforo; conTexto?: boolean; nota?: boolean; className?: string;
}) {
  return (
    <span className={unir("inline-flex items-center gap-2 whitespace-nowrap", className)}>
      <svg aria-hidden="true" viewBox="0 0 16 16" className={unir("size-3.5 shrink-0", COLOR[nivel])}>
        <Forma nivel={nivel} />
      </svg>
      <span className={conTexto ? "text-apoyo text-texto font-semibold" : "sr-only"}>
        {NOMBRE_NIVEL[nivel]}
        {nota && <span aria-hidden="true">*</span>}
      </span>
    </span>
  );
}
