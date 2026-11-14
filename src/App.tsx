import { useEffect, useState } from "react";

type Site = { site_id: string; nombre: string };

export default function App() {
  const [sites, setSites] = useState<Site[]>([]);

  useEffect(() => {
    fetch("/api/sites")
      .then((r) => r.json())
      .then(setSites)
      .catch(() => setSites([]));
  }, []);

  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem" }}>
      <h1>Hola Apogeo</h1>
      <p>Sitios cargados desde la API: {sites.length}</p>
      <ul>
        {sites.map((s) => (
          <li key={s.site_id}>{s.nombre}</li>
        ))}
      </ul>
    </main>
  );
}
