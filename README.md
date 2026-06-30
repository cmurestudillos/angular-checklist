# Angular CheckList

> Aplicación web PWA de gestión de listas de tareas. Sin backend — toda la persistencia va a `localStorage`.

**Demo:** [https://angular-checklist.vercel.app](https://angular-checklist.vercel.app)

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Angular 22 · standalone components |
| UI | Angular Material 22 · CDK Drag & Drop |
| Notificaciones | SweetAlert2 11 |
| Estilos | CSS custom properties · tema claro/oscuro/auto |
| Tests | Karma · Jasmine (40 tests) |
| PWA | `@angular/service-worker` · Web App Manifest |
| Linting | ESLint 9 flat config · Prettier |
| Gestor paquetes | pnpm 11 |
| Deploy | Vercel |

---

## Características

- Crear, editar y eliminar listas y tareas
- Reordenar tareas con drag & drop
- Selección múltiple y eliminación masiva
- Exportar e importar datos en JSON
- Panel de estadísticas y configuración
- Tema claro / oscuro / automático (sigue el sistema)
- Modo compacto y sin animaciones
- Instalable como PWA (offline-ready)

---

## Instalación

**Requisitos:** Node.js ≥ 20 · pnpm ≥ 9

```bash
git clone https://github.com/cmurestudillos/angular-checklist.git
cd angular-checklist
pnpm install
pnpm start          # http://localhost:4200
```

### Comandos

```bash
pnpm run build      # Build de producción → dist/browser/
pnpm test           # Unit tests (Karma headless)
pnpm run lint       # ESLint
pnpm run lint:fix   # ESLint + autofix
```

---

## Arquitectura

```
src/app/
├── components/
│   ├── navbar/          # Barra superior + botón instalar PWA
│   └── sidenav/         # Panel configuración, stats, export/import
├── services/
│   ├── storage.service.ts        # CRUD listas y tareas en localStorage
│   ├── settings.service.ts       # Tema, modo compacto, animaciones
│   ├── export-import.service.ts  # Serialización JSON
│   ├── pwa.service.ts            # beforeinstallprompt / appinstalled
│   └── notificacion.service.ts   # Wrapper SweetAlert2
├── views/
│   └── home/            # Vista principal
├── enums/               # StorageKeys
├── models/              # Interfaces TS
├── types/               # ServiceResponse<T>
└── utils/               # UuidUtil
```

### Patrones clave

- **`inject()`** en lugar de constructor injection (Angular 14+)
- **`@if` / `@for`** control flow (Angular 17+)
- **Signals** para estado PWA (`canInstall`, `isInstalled`)
- **`ServiceResponse<T>`** como envoltorio tipado de todas las operaciones
- **`BehaviorSubject<Lista[]>`** como fuente reactiva del estado global

---

## Deploy en Vercel

El repositorio ya incluye `vercel.json` con la rewrite SPA y el `outputDirectory` correcto:

```json
{
  "buildCommand": "pnpm run build",
  "outputDirectory": "dist/browser",
  "installCommand": "pnpm install",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Tests

```bash
pnpm test
# TOTAL: 40 SUCCESS
```

Cobertura actual: `UuidUtil`, `StorageService` (CRUD completo), `PwaService`, `AppComponent`.

---

## Autor

**Carlos Mur** · [GitHub](https://github.com/cmurestudillos) · [LinkedIn](https://www.linkedin.com/in/carlos-mur-estudillos/)
