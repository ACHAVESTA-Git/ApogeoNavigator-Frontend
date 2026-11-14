# Apogeo · Frontend (React + Vite + TS)

## Desarrollo
```bash
npm install
npm run dev        # http://localhost:5173, /api → http://localhost:8080
```
Otro backend: `VITE_API_TARGET=https://... npm run dev`.

## Build y Docker
```bash
npm run build
docker build -t apogeo-frontend .
docker run --rm -p 5173:80 -e BACKEND_URL=http://host.docker.internal:8080 apogeo-frontend
```
En producción se publica en Firebase Hosting (carpeta `dist`), que reenvía `/api/**` a Cloud Run. Ver `docs/manuales/firebase-gcp.md` en el espacio de trabajo.
