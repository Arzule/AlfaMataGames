# Rúbricas de evaluación

Resumen de las rúbricas del Avance 3 (APF3) y del Proyecto Final, con las fases de
[PLAN.md](PLAN.md) que cubren cada criterio. El video demo y la defensa los prepara el
usuario fuera del repositorio.

## APF3 — Avance 3

| Criterio | Peso | Qué se evalúa |
| --- | --- | --- |
| Arquitectura y estructura del proyecto | 15% | Organización y modularidad, navegación, separación en pantallas/hooks/contextos/servicios, uso de GitHub, configuración de entorno (`.env`, dependencias). |
| Integración con backend API REST / JWT | 20% | Autenticación JWT, manejo de errores, validación de tokens, consumo de endpoints. |
| Funcionalidades nativas | 25% | Al menos dos características nativas estables, con permisos gestionados correctamente y control de errores (sin control de errores la nota baja a 4). |
| UI/UX | 25% | Coherencia visual, navegación intuitiva, tipografía, colores, adaptación a distintos tamaños de pantalla. |
| Innovación y valor agregado | 10% | Mejoras frente al APF2. |
| Documentación | 5% | README completo. |

### Cobertura en el plan (APF3)

| Criterio | Fases que lo cubren |
| --- | --- |
| Arquitectura y estructura | A3-0 (migraciones, configuración de BD), A3-1 (PropTypes), A3-5 (logger central), A3-7 |
| Backend API REST / JWT | A3-0, A3-2 (endpoint autenticado de avatar), A3-5 (errores y logging del backend), A3-6 (endpoint de traducción) |
| Funcionalidades nativas | A3-2 (cámara, galería y permisos), A3-3 (acelerómetro y vibración), A3-4 (notificaciones locales), A3-1 (sistema de archivos para caché) |
| UI/UX | A3-1 (búsquedas recientes), A3-2 (avatar en Perfil y Header), A3-5 (ErrorBoundary, aviso sin conexión), A3-7 (pulido de UI/UX) |
| Innovación y valor agregado | A3-1 (uso sin red), A3-3 (agitar para descubrir), A3-6 (sinopsis en español) |
| Documentación | A3-7 |

## Proyecto Final

| Criterio | Peso | Qué se evalúa |
| --- | --- | --- |
| Arquitectura | 20% | Estructura del proyecto, configuración de publicación (`app.json`, dependencias, EAS Build) y control de versiones. |
| Integración de servicios y backend en la nube | 20% | Autenticación segura, manejo de errores, seguridad en la comunicación, buenas prácticas de asincronía. |
| Funcionalidades nativas | 20% | Al menos dos, estables, con permisos y errores bien manejados. |
| UI/UX | 20% | Interfaz profesional y coherente, componentes reutilizables, adaptabilidad. |
| Innovación y valor agregado | 10% | Mejoras frente al APF3 (nuevas funciones, rendimiento, seguridad, accesibilidad o estética). |
| Documentación | 10% | README completo. |

### Cobertura en el plan (Final)

| Criterio | Fases que lo cubren |
| --- | --- |
| Arquitectura | A4-1 (variables `EXPO_PUBLIC_*`), A4-7 (`app.json` de producción, `eas.json`), A4-8 (CHANGELOG); flujo de ramas de `AGENTS.md` |
| Backend en la nube | A4-1 (proxy de RAWG), A4-2 (seguridad, HTTPS en Railway), A4-3 (gestión de cuenta), A4-4 (OAuth), A4-6 (push desde el servidor) |
| Funcionalidades nativas | A3-2, A3-3, A3-4 y A4-6 (push remotas en el APK) |
| UI/UX | A4-3 (estadísticas en Perfil), A4-7b (accesibilidad y pulido final), A3-7 |
| Innovación y valor agregado | A4-4 (Google y Discord), A4-5 (Steam), A4-6 (push), A4-2 (seguridad), A4-7b (accesibilidad) |
| Documentación | A4-8 (README, PRIVACY), A4-2 (`DEPLOY.md`), A4-7 (`APK.md`) |
