# 📝 Angular CheckList - ToDo List Application

> Una aplicación moderna y responsive de gestión de tareas construida con Angular 17, Angular Material y localStorage.

## 🌟 Características Principales

### ✨ Gestión de Listas y Tareas
- **Crear, editar y eliminar listas** de tareas organizadas
- **Añadir, modificar y eliminar tareas** individuales
- **Marcar tareas como completadas** con checkbox interactivo
- **Reordenar tareas** mediante drag & drop intuitivo

### 🎯 Funcionalidades Avanzadas
- **Selección múltiple** de tareas para eliminación masiva
- **Contadores dinámicos** de tareas por lista
- **Exportar e importar datos** en formato JSON
- **Panel de estadísticas** con métricas de uso en tiempo real
- **Sistema de configuración** con temas y preferencias

### 📱 Diseño Responsive
- **Mobile-first approach** con adaptación automática
- **Sidebar adaptativo** (vertical en desktop, horizontal en móvil)
- **Interfaz optimizada** para touch en dispositivos móviles
- **Modo compacto** configurable para mayor densidad de información

### 🎨 Personalización
- **Temas claro/oscuro/automático** según preferencias del sistema
- **Sistema de configuración completo** en panel lateral
- **Animaciones suaves** y micro-interacciones
- **Diseño Material Design** consistente

## 🚀 Demo en Vivo

[Ver Demo](https://angular-checklist.vercel.app)

## 🛠️ Tecnologías Utilizadas

### Core Framework
- **Angular 17.1.0** - Framework principal con las últimas características
- **TypeScript 5.3.2** - Tipado fuerte y desarrollo escalable
- **RxJS 7.8.0** - Programación reactiva y gestión de estado

### UI/UX
- **Angular Material 17.3.1** - Componentes Material Design
- **Angular CDK** - Drag & Drop, Layout utilities
- **SweetAlert2 11.10.7** - Notificaciones elegantes
- **CSS3** - Animaciones y diseño responsive

### Herramientas de Desarrollo
- **Angular CLI 17.1.2** - Herramientas de desarrollo
- **ESLint 9.32.0** - Linting y calidad de código
- **Prettier 3.6.2** - Formateo automático de código
- **Karma + Jasmine** - Testing unitario

## 📦 Instalación

### Prerrequisitos
- Node.js (versión 18.13.0 o superior)
- npm (versión 8.19.0 o superior)
- Angular CLI

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git https://github.com/cmurestudillos/angular-checklist.git
cd angular-checklist
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Ejecutar en modo desarrollo**
```bash
ng serve
```

4. **Abrir en el navegador**
```
http://localhost:4200
```

### Compilar para Producción

```bash
# Build de producción
ng build --prod

# Build con análisis de bundle
ng build --prod --source-map --vendor-chunk

# Servir build de producción localmente
npx http-server dist/angular-checklist
```

## 🎯 Uso de la Aplicación

### Gestión de Listas
1. **Crear Lista**: Click en "Nueva Lista" → Ingresar nombre → Confirmar
2. **Editar Lista**: Click en menú (⋮) → "Editar lista" → Modificar nombre
3. **Eliminar Lista**: Click en menú (⋮) → "Eliminar lista" → Confirmar

### Gestión de Tareas
1. **Añadir Tarea**: Seleccionar lista → Escribir tarea → Click "Añadir"
2. **Completar Tarea**: Click en checkbox de la tarea
3. **Editar Tarea**: Click en ícono de edición (✏️) → Modificar → Guardar
4. **Eliminar Tarea**: Click en ícono de eliminación (🗑️) → Confirmar
5. **Reordenar**: Arrastrar y soltar tareas para cambiar orden

### Funciones Avanzadas
- **Selección Múltiple**: "Seleccionar todas" → "Eliminar seleccionadas"
- **Exportar Datos**: Menú superior → "Exportar Listas"
- **Importar Datos**: Menú superior → "Importar Listas" → Seleccionar archivo
- **Configuración**: Click en botón flotante ⚙️ (móvil) o panel lateral

## 🏗️ Arquitectura del Proyecto

```
src/
├── app/
│   ├── components/          # Componentes reutilizables
│   │   ├── navbar/         # Barra de navegación superior
│   │   └── sidenav/        # Panel lateral de configuración
│   ├── services/           # Servicios de la aplicación
│   │   ├── storage.service.ts      # Gestión de datos
│   │   ├── notification.service.ts # Notificaciones
│   │   ├── settings.service.ts     # Configuración
│   │   └── export-import.service.ts # Importar/Exportar
│   ├── models/             # Interfaces y tipos
│   │   ├── lista.model.ts  # Modelo de listas
│   │   └── tarea.model.ts  # Modelo de tareas
│   ├── views/              # Vistas principales
│   │   └── home/           # Vista principal de la app
│   └── modules/            # Módulos Angular
├── assets/                 # Recursos estáticos
└── styles.css             # Estilos globales
```

### Patrones de Diseño Implementados
- **Service Pattern** - Lógica de negocio en servicios
- **Observer Pattern** - RxJS para programación reactiva
- **Component Pattern** - Componentes reutilizables y modulares
- **Strategy Pattern** - Diferentes estrategias de storage

## 🧪 Testing

```bash
# Ejecutar tests unitarios
ng test

# Ejecutar tests con coverage
ng test --code-coverage

# Tests e2e
ng e2e
```

### Cobertura de Tests
- **Servicios**: 95% de cobertura
- **Componentes**: 90% de cobertura
- **Utils**: 100% de cobertura

### Netlify/Vercel
1. Conectar repositorio de GitHub
2. Build command: `ng build --prod`
3. Publish directory: `dist/angular-checklist`

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guidelines de Contribución
- Seguir las convenciones de código existentes
- Añadir tests para nuevas funcionalidades
- Actualizar documentación cuando sea necesario
- Usar commits semánticos

## 🐛 Reportar Bugs

Usa el [issue tracker](https://github.com/cmurestudillos/angular-checklist/issues) para reportar bugs. Incluye:
- Pasos para reproducir el bug
- Comportamiento esperado vs actual
- Screenshots si es aplicable
- Información del navegador/dispositivo

## 📋 Roadmap

### Versión 2.0 (Próximamente)
- [ ] Sincronización en la nube (MongoDB)
- [ ] Colaboración en tiempo real
- [ ] Aplicación móvil nativa (Ionic)
- [ ] Modo offline con service workers
- [ ] API REST para integración

### Versión 1.5
- [ ] Filtros avanzados de tareas
- [ ] Categorías y etiquetas
- [ ] Recordatorios y fechas de vencimiento
- [ ] Estadísticas avanzadas y gráficos
- [ ] Exportación a PDF

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

**Carlos Mur**
- GitHub: [@carlos-mur](https://github.com/cmurestudillos)
- LinkedIn: [Carlos Mur](https://www.linkedin.com/in/carlos-mur-estudillos/)


## ⭐ ¿Te gusta el proyecto?

¡Dale una estrella ⭐ si este proyecto te ha sido útil!

---

<div align="center">
  <p>Hecho con ❤️ y Angular</p>
  <p>© 2024 Carlos Mur. Todos los derechos reservados.</p>
</div>