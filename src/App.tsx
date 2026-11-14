// Página temporal: muestra los tokens de diseño hasta que exista el layout.
const COLORES = ["vacio", "regolito", "superficie", "elevada", "linea", "horizonte", "texto", "texto-2", "texto-3",
  "sol", "tierra", "viable", "reservas", "critico"] as const;

export default function App() {
  return (
    <main className="contenedor py-10">
      <p className="rotulo">Apogeo · Navegador lunar</p>
      <h1 className="titulo-instrumento text-titulo mt-2">Tokens de diseño «Rasante»</h1>
      <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {COLORES.map((color) => (
          <li key={color} className="border-linea flex items-center gap-3 border p-3">
            <span className="border-horizonte size-6 border" style={{ background: `var(--color-${color})` }} />
            <span className="text-dato-sm font-mono">{color}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
