# Guía de contribución · ApogeoNavigator-Frontend

Proyecto **Lunar Landing Site Navigator** (Apogeo Team · NASA Space Apps 2026). Esta guía vale para este repositorio; el otro repo (ApogeoNavigator-Backend) usa las mismas reglas.

## 1. Flujo de ramas
- `main` es la rama **protegida**: siempre compila y siempre es publicable. Nadie hace push directo.
- Todo cambio sale de `main` en una rama propia y vuelve por Pull Request:
  - `feature/HU-XX-descripcion-corta`: historia de usuario nueva (ej. `feature/HU-02-vista-del-cielo`).
  - `fix/descripcion-corta` o `fix/HU-XX-descripcion`: corrección de un error (ej. `fix/zona-horaria-utc`).
  - `chore/...` y `docs/...`: tareas técnicas y documentación.
- Ramas pequeñas y cortas: un PR por historia o por parte de ella. Borra la rama al fusionar.
- Activa en GitHub (Settings → Branches) la protección de `main`: PR obligatorio y al menos 1 aprobación.

```bash
git switch main && git pull
git switch -c feature/HU-02-vista-del-cielo
```

## 2. Mensajes de commit (Conventional Commits + ID de la HU)
Formato: `tipo(HU-XX): descripción en imperativo y en minúsculas`

| Tipo | Uso |
|---|---|
| `feat` | funcionalidad nueva |
| `fix` | corrección de un error |
| `docs` | documentación |
| `test` | pruebas |
| `refactor` | cambio interno sin cambiar el comportamiento |
| `chore` | configuración, dependencias, Docker |

Ejemplos:
- `feat(HU-02): vista del cielo con azimut y elevación`
- `fix(HU-05): corrige la puesta del Sol en el último día del rango`
- `chore: actualiza dependencias`  (sin HU cuando no corresponde a ninguna)

## 3. Pull Requests
- Usa la plantilla `.github/pull_request_template.md`: HU, qué cambia, cómo probarlo y checklist de la DoD.
- **Al menos 1 revisión** de otra persona antes de fusionar. Quien escribe el código no lo aprueba (la DoD pide que lo pruebe alguien distinto).
- El PR debe ser pequeño, tener las pruebas en verde y no mezclar temas.
- Se fusiona con *squash* para que `main` tenga un commit por PR; el título del PR sigue el formato de commit.
- Todo dato nuevo lleva su fuente (URL) registrada.

## 4. Pruebas antes de abrir el PR
```bash
npm ci
npm run build        # compila TypeScript y Vite: debe terminar sin errores
npm test             # Vitest (se añadirá con las primeras pruebas; hasta entonces no existe el script)
```
Con Docker, desde la raíz del espacio de trabajo: `docker compose up --build` y comprueba la pantalla o el endpoint afectado.

## 5. Historias y errores
Crea una issue con las plantillas de `.github/ISSUE_TEMPLATE/` (historia de usuario o bug). Una historia entra a un sprint solo si cumple la **DoR**; se da por terminada solo si cumple la **DoD** (ver checklist del PR).

## 6. Entorno
IDE recomendado: WebStorm. Convenciones: UTC en todas las fechas, nombres de columnas del contrato de datos en minúsculas y sin tildes.
