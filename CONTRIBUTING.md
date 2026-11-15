# Guía de contribución · ApogeoNavigator-Frontend

Proyecto **Lunar Landing Site Navigator** (Apogeo Team · NASA Space Apps 2026). Esta guía vale para este repositorio; el otro repo (ApogeoNavigator-Backend) usa las mismas reglas.

## 1. Flujo de ramas: `dev` → `qa` → `main`
- `dev`: **todo** el desarrollo. Se trabaja directamente en `dev` o en ramas `feature/HU-XX-descripcion-corta` que se fusionan en `dev`.
- `qa`: el equipo revisa y corrige. Se actualiza desde `dev` solo cuando lo ordena T1 (orquestador).
- `main`: solo lo aprobado en QA; es lo que se publica en producción. Siempre compila.
- **Nunca** se hace push directo a `qa` ni a `main`; llegan por fusión (Pull Request) desde la rama anterior.
- Ramas de apoyo, siempre salen de `dev` y vuelven a `dev`:
  - `feature/HU-XX-descripcion-corta`: historia de usuario nueva (ej. `feature/HU-02-vista-del-cielo`).
  - `fix/descripcion-corta` o `fix/HU-XX-descripcion`: corrección de un error (ej. `fix/zona-horaria-utc`).
  - `chore/...` y `docs/...`: tareas técnicas y documentación.
- Ramas pequeñas y cortas: un PR por historia o por parte de ella. Borra la rama al fusionar.
- Activa en GitHub (Settings → Branches) la protección de `main` y `qa`: PR obligatorio y al menos 1 aprobación.

```bash
git switch dev && git pull
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

Reglas:
- Un commit por **bloque lógico**: no mezcles cosas distintas en el mismo commit (por ejemplo, validación por un lado, utilitarios por otro y pruebas por otro).
- Asunto de 72 caracteres como máximo, en imperativo; el cuerpo explica el porqué.
- **No menciones a Claude ni a ninguna IA** en commits, Pull Requests ni tags: nada de `Co-Authored-By: Claude` ni «Generated with Claude Code».

Ejemplos:
- `feat(HU-02): vista del cielo con azimut y elevación`
- `fix(HU-05): corrige la puesta del Sol en el último día del rango`
- `chore: actualiza dependencias`  (sin HU cuando no corresponde a ninguna)

## 3. Pull Requests
- Usa la plantilla `.github/pull_request_template.md`: HU, qué cambia, cómo probarlo y checklist de la DoD.
- **Al menos 1 revisión** de otra persona antes de fusionar. Quien escribe el código no lo aprueba (la DoD pide que lo pruebe alguien distinto).
- El PR debe ser pequeño, tener las pruebas en verde y no mezclar temas.
- El título del PR sigue el formato de commit y su descripción tampoco menciona a Claude ni a ninguna IA.
- Los PR van hacia `dev`; `qa` y `main` solo se actualizan por fusión desde la rama anterior.
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
