# Apogeo Navigator · Frontend

Interfaz web de **Lunar Landing Site Navigator**: muestra el Sol y la Tierra sobre el horizonte de un sitio lunar y permite comparar sitios y fechas en una sola pantalla. Proyecto de Apogeo Team para NASA Space Apps Challenge 2026.

## Stack
React 18 · Vite · TypeScript · nginx (imagen Docker) · Firebase Hosting (producción).

## Ejecutar en local
```bash
npm install
npm run dev        # http://localhost:5173, /api → http://localhost:8080
```
Otro backend: `VITE_API_TARGET=https://... npm run dev`. Para levantar todo con Docker, usa `docker compose up --build` desde la raíz del espacio de trabajo.

## Build y Docker
```bash
npm run build
docker build -t apogeo-frontend .
docker run --rm -p 5173:80 -e BACKEND_URL=http://host.docker.internal:8080 apogeo-frontend
```
En producción se publica la carpeta `dist` en Firebase Hosting, que reenvía `/api/**` a Cloud Run.

## Repositorios del proyecto
- Frontend: https://github.com/ACHAVESTA-Git/ApogeoNavigator-Frontend
- Backend: https://github.com/ACHAVESTA-Git/ApogeoNavigator-Backend

Los CSV de datos (`sites.csv`, `efemerides_<site_id>.csv`, `metricas.csv`) viven en la carpeta `data/` del espacio de trabajo y, en producción, en Cloud Storage.

## Contribuir
Lee [CONTRIBUTING.md](CONTRIBUTING.md): ramas, commits con ID de la HU y Pull Requests.

## Licencia
[MIT](LICENSE) © 2026 Apogeo Team.

Los datos provienen de fuentes de la NASA (JPL Horizons, NSSDC, Moon Trek). NASA no respalda este proyecto.
