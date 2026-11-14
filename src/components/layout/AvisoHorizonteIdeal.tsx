import { Info } from "lucide-react";
import { T } from "../../lib/textos";
import { unir } from "../ui/clases";

/** Aviso fijo y obligatorio: la elevación es contra el horizonte ideal, sin relieve. */
export function AvisoHorizonteIdeal({ className }: { className?: string }) {
  return (
    <p className={unir("text-apoyo text-texto-2 flex items-start gap-2", className)}>
      <Info aria-hidden="true" className="text-horizonte mt-0.5 size-4 shrink-0" />
      {T.avisoHorizonte}
    </p>
  );
}
