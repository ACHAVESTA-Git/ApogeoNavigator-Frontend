# Apogeo Navigator · Frontend

**See where the Sun and the Earth sit on the horizon of any lunar landing site.**
Web interface of *Lunar Landing Site Navigator*, the Apogeo Team project for the NASA Space Apps Challenge 2026 ([challenge](https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/)).

![Home: the Sun rolls along the horizon above Shackleton crater, December 2026](docs/images/home.png)

- **Live app:** https://apogeo-514716.web.app
- **Backend repository:** https://github.com/ACHAVESTA-Git/ApogeoNavigator-Backend
- The interface is in **Spanish** with an **ES/EN** selector (see "Language"). A short Spanish summary is at the end (*Resumen en español*).

## What it does
Pick a lunar site and a period and the app shows, from that site's horizon, where the Sun and the Earth are, hour by hour, and what that means for a lander:

- **Hours of sunlight** (energy) and **hours of direct line of sight to Earth** (communications).
- **Time until the next sunset and Earthset.**
- A **traffic light** for energy and communications, with the reason in words and a different shape per level (not only colour).
- A **terrain-sensitivity** warning when the Sun never rises above 3° over the ideal horizon.
- **Comparison** of sites and dates, and a **Top 5 ranking** of where landing is most favourable.
- **CSV upload**, validated by the backend before anything is saved.

All figures assume an **ideal horizon** (a smooth Moon, no terrain); the app says so next to each result.

## Screens
Routes live in `src/routes/` and are lazy-loaded (the initial JS only carries the layout and the Home page).

| Screen | Route | What it does |
|---|---|---|
| **Home** (immersive) | `/` | A scroll story over the real sky above Shackleton crater, with key figures read from the data, the "Three steps to decide" tour (Sky, Compare, Analysis), why the pole is extreme, a glossary and the data sources. |
| **Sites** | `/sitios` | Polar map and catalogue of sites, filterable by category. |
| **Sky** | `/sitios/:id/cielo` | Azimuth and elevation of the Sun and the Earth seen from the site, with a full-screen scene and a reading panel (UTC, local time, whether each body is above the horizon and when it sets). |
| **Light windows** | `/sitios/:id/ventanas` | Hour-by-hour bars of when the Sun and the Earth are up, metrics with their meaning, and the traffic light. |
| **Lunar day** | `/sitios/:id/dia-lunar` | Elevation of the Sun and the Earth over the period, with the horizon as the zero axis and marks at every rise and set. |
| **Analysis** | `/sitios/:id/analisis` | Analysis transparency: the path of every figure from the CSV file to the chart, with file fingerprints and the manifest signature. |
| **Projection** (administration only) | `/sitios/:id/proyeccion` | Values projected by a statistical model up to 2028, always labelled as a projection, not an ephemeris, and shown with the error measured against JPL Horizons. Without the administration role the tab asks to sign in and requests no data. |
| **Landing window** | `/sitios/:id/ventana` | "When to land?": for a stay length (3, 6.5 or 14 days) it finds the best window with Sun and Earth up at the same time and shows it in a heat calendar. |
| **Compare** | `/comparar` | Two or three sites in the same month, or one site in different months, with horizon rows, a comparison table, a single time control and a one-sentence verdict. It includes the **Top 5** ranking (order: energy and communications verdict first; then the most consecutive hours with Sun and Earth up together). State is kept in the URL. |
| **Upload data** | header button | A pop-up to drop CSV files (`sites`, `metricas`, `efemerides_<site>`); the backend validates them and a table shows errors by row and column before saving. |
| **Sign in** | `/acceso` | Sign-in with **email and password**. The session lives in a cookie the page code cannot read. The public app is read-only and needs no account. |
| **Profile** | `/perfil` | Who you are, your role (analyst, reviewer or administrator) and the public fingerprints of your post-quantum keys. It never shows private material. |
| **Key manager** | `/admin/claves` | Administrator role only: list, generate, rotate and revoke keys per user. |

Custom coordinates are also supported (`punto_…` sites): Sky and Light windows can query an arbitrary point live through the backend (`/api/horizons`, at most 35 days per query).

![Sites: polar map and catalogue](docs/images/sites.png)

![Sky from Shackleton crater: the Sun at 1.7° and the Earth on the horizon](docs/images/sky-shackleton.png)

![Lunar day at Shackleton crater, December 2026](docs/images/lunar-day.png)

## Language
The settings dialog ("Configuración" button in the header) lets you choose **Español** or **English**. Dates and figures follow the chosen language and the page reloads on change. The choice is stored in the browser; if the browser does not allow storage, the selector says so. Strings live in `src/lib/textos.es.ts` and `src/lib/textos.en.ts` (every new key goes in both). Site names, notes and analysis steps come from the dataset and are shown in Spanish in both languages.

## Run it locally
You need Node.js and the backend running. In two terminals:

```bash
# Terminal 1 · backend (see its README)
git clone https://github.com/ACHAVESTA-Git/ApogeoNavigator-Backend && cd ApogeoNavigator-Backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
DATA_DIR=data uvicorn app.main:app --port 8080       # API docs: http://localhost:8080/docs

# Terminal 2 · frontend
git clone https://github.com/ACHAVESTA-Git/ApogeoNavigator-Frontend && cd ApogeoNavigator-Frontend
npm ci
npm run dev                                           # http://localhost:5173 (/api is proxied to http://localhost:8080)
```

### Scripts (`package.json`)
| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server. |
| `npm run build` | Checks palette contrast (`scripts/contraste.mjs`), type-checks (`tsc -b`) and builds for production. |
| `npm run preview` | Serves the built app. |
| `npm test` | Vitest in watch mode. |
| `npm run test:run` | Vitest, single run (Testing Library and jsdom). |
| `npm run contraste` | Only the palette contrast check. |
| `npm run datos:muestra` | Regenerates the bundled sample data. |

**No backend?** With `VITE_USE_SAMPLE_DATA=auto` (the default) the app falls back to the bundled sample data in `public/muestra/` when the API does not respond, and shows a banner saying so.

## Configuration
Copy `.env.example` to `.env` and edit. Every `VITE_*` variable is **public** (it ends up in the browser): never put secrets here.

| Variable | Default | Meaning |
|---|---|---|
| `VITE_API_BASE_URL` | empty | Base URL of the API, **without a trailing slash**. Empty means the same origin (relative `/api/...` calls): in production Firebase Hosting rewrites `/api/**` to the backend, and locally the Vite proxy does it. Only fill it in if the API is on another origin (e.g. `https://your-api.example.com`); the backend must then allow that origin with CORS. |
| `VITE_USE_SAMPLE_DATA` | `auto` | `auto`: use the API and fall back to sample data only if it does not respond; `true`: always sample data; `false`: API only. |
| `VITE_API_TARGET` | `http://localhost:8080` | Only for `npm run dev` and `npm run preview`: where `/api` is proxied. |

Vite reads these at build time: change them and rebuild.

## Tests and build
```bash
npm run test:run    # Vitest
npm run build       # contrast + types + production build (dist/ folder)
```
Tests live next to the code (`*.test.ts` and `*.test.tsx`). Verification results and screenshots are in [`docs/verificacion.md`](docs/verificacion.md) and `docs/frontend/capturas/`.

## Tech stack
React 18 · Vite · TypeScript · Tailwind CSS 4 · TanStack Query · React Router 7 · d3-scale and d3-shape (charts) · Motion (animation) · Vitest and Testing Library. Fonts: Archivo and JetBrains Mono (SIL Open Font License) via Fontsource. Layout: `src/routes` (screens), `src/components`, `src/hooks`, `src/lib` (API client, astronomy helpers, constants in `constants.ts`, interface texts). The repository includes a `Dockerfile` with nginx for local use.

## NASA data and sources
The position of the Sun and the Earth (azimuth and elevation, hourly, seen from each lunar site) comes from **NASA/JPL Horizons** ([system](https://ssd.jpl.nasa.gov/horizons/), [API](https://ssd-api.jpl.nasa.gov/doc/horizons.html)). Site coordinates come from **NSSDC** (Apollo sites), **LROC** (Shackleton and recent landings) and **NASA/LRO** (IM-1 Odysseus). The data files and their sources live in the [backend repository](https://github.com/ACHAVESTA-Git/ApogeoNavigator-Backend). Model projections, traffic-light thresholds and the illustrative terrain are **not** NASA data and are labelled as such in the interface.

## Mission patches (Apollo 11, 15 and 17)
The Apollo 11, 15 and 17 sites show the authentic patch of their mission, uncropped and uncoloured, from the NASA Image and Video Library, with the credit **"Imagen: NASA"** and the note "NASA does not endorse this project". This is informational and educational use, **without NASA endorsement or written approval**; if NASA asks, they are removed. All other sites use a neutral monogram generated in code. Sources, conditions and accepted risk: [`public/insignias/README.md`](public/insignias/README.md).

## Limitations
- **Ideal horizon:** no terrain. A real hill can hide the Sun or the Earth.
- **Bounded ephemeris data:** a six-month period and the catalogue sites; outside it the API answers 422 and the interface shows an empty state.
- **Provisional traffic-light thresholds:** team engineering judgement, not mission requirements.
- **The projection** is a statistical model, not an ephemeris, and only administrators see it.

## Contributing
Read [CONTRIBUTING.md](CONTRIBUTING.md): branches, commits with the user-story ID and pull requests.

## License
[MIT](LICENSE) © 2026 Apogeo Team. NASA does not endorse or sponsor this project; NASA names and data are used only to identify their sources.

---

## Resumen en español
**Apogeo Navigator** muestra dónde están el Sol y la Tierra sobre el horizonte de un sitio de alunizaje lunar, hora por hora, y lo traduce en horas de energía, horas de enlace directo con la Tierra, tiempo hasta las puestas y un semáforo de viabilidad. Pantallas: Inicio inmersivo, Sitios, Cielo, Ventanas de luz, Día lunar, Análisis, Ventana de alunizaje, Comparar (Top 5, sitios y fechas), Subir datos, Acceso (correo y contraseña), Perfil, Gestor de claves y una pestaña Proyección solo para administración. Selector ES/EN. App en producción: https://apogeo-514716.web.app. **Ejecutar:** `npm ci` y `npm run dev` con el backend en el puerto 8080; `VITE_API_BASE_URL` va vacía en producción porque Firebase Hosting reenvía `/api/**`. **Datos:** posiciones del Sol y la Tierra de NASA/JPL Horizons; la NASA no respalda este proyecto. **Licencia:** MIT.
