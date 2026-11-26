# Changelog

Cambios relevantes de AlfaMataGames, de la versión más nueva a la más antigua. Formato basado en
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y versiones
[SemVer](https://semver.org/lang/es/). Detalle por fase en [docs/PLAN.md](docs/PLAN.md).

## [1.0.0] - 2026-11-26 — Entrega final (Avance 4)

### Agregado

- **Producción en Azure**: VM con Docker Compose (MySQL, backend y Caddy con HTTPS de Let's
  Encrypt) en https://alfamatagames-api.chilecentral.cloudapp.azure.com, que sirve también la
  versión web de la app. Apagado programado el 1/1/2027 ([docs/DEPLOY.md](docs/DEPLOY.md)).
- **APK con EAS Build**: `eas.json` con perfiles `development`, `preview` (APK) y `production`
  (AAB), `scheme` `alfamatagames`, splash e iconos ([docs/APK.md](docs/APK.md)).
- **Gestión de cuenta**: cambiar nombre y contraseña, y eliminar la cuenta con borrado en cascada.
- **Estadísticas** de la biblioteca en Perfil (juegos por estado, favoritos y puntuación media).
- **Login con Google y Discord** (OAuth mediado por el backend, deep link validado y PKCE);
  vincular y desvincular cuentas sin quedarse sin método de acceso ([docs/OAUTH.md](docs/OAUTH.md)).
- **Conectar Steam**: verificación con OpenID, importación por lotes con progreso,
  correspondencia con IGDB y reglas por tiempo jugado; re-sincronizar no pisa los cambios manuales.
- **Push remotas** para los recordatorios en el APK (Expo Push → FCM), enviadas por un programador
  del backend; respaldo con notificaciones locales en Expo Go.
- **Mi ciudad**: ciudad y país en Perfil con expo-location y Nominatim, sin guardar coordenadas.
- Política de privacidad ([docs/PRIVACY.md](docs/PRIVACY.md)), guía de publicación en las tiendas
  ([docs/PUBLICACION.md](docs/PUBLICACION.md)) y este changelog.

### Cambiado

- **Catálogo de IGDB a través del backend** (RAWG dejó de responder); las credenciales ya no
  están en la app. Migración `005` reinicia la biblioteca (los ids de RAWG no coinciden).
- Variables de la app con `EXPO_PUBLIC_*` (se quitó `react-native-dotenv`).
- **Accesibilidad**: roles y etiquetas en todos los táctiles, zonas de 44x44, contraste ≥ 4.5:1 y
  soporte de la letra grande del sistema. Detalle del juego en web con banner a pantalla ancha.

### Seguridad

- `helmet`, límite de peticiones en `/auth`, CORS por entorno, `trust proxy`, validación de
  variables al arrancar y `/health` que comprueba la BD.

## [0.3.0] - 2026-10-21 — Avance 3

### Agregado

- Migraciones de BD numeradas con runner automático (`schema_migrations`).
- Foto de perfil con cámara o galería (recorte a 256 px) y gestión de permisos con explicación
  previa, estado bloqueado y "Abrir ajustes".
- **Agitar para descubrir** (acelerómetro y vibración) y botón "Juego al azar".
- Recordatorios con notificaciones locales (por juego y diario) y pantalla de recordatorios.
- Sinopsis traducidas al español con DeepL y caché en la BD.
- Reseñas de la comunidad en el detalle del juego.
- Búsquedas recientes, caché del catálogo para uso sin conexión e imágenes con caché de disco.
- ErrorBoundary global, aviso sin conexión, logger central y registro de peticiones en el backend.
- PropTypes en todos los componentes, diálogos de confirmación propios, logo e icono de la app.

### Corregido

- Error "Cannot find native module 'ExpoTopicSubscriptionModule'" de expo-notifications en
  Expo Go Android (shim en `metro.config.js`).

## [0.2.0] - 2026-10-13 — Avance 2

### Agregado

- Backend Express con autenticación JWT (bcrypt) y MySQL en Docker Compose.
- Registro, inicio y cierre de sesión con sesión persistente (nativo y web).
- Catálogo con búsqueda y paginación, detalle del juego y Favoritos.
- Biblioteca por usuario: favorito, estado, puntuación y reseña, con cambios optimistas.
- Tipografías Sora e Inter, componentes reutilizables y grilla responsive.

## [0.1.0] - 2026-09-09 — Avance 1

### Agregado

- Prototipo inicial: inicio de sesión, catálogo y detalle del juego (diseño en Figma).

[1.0.0]: https://github.com/Arzule/AlfaMataGames/compare/v0.3.0-avance3...v1.0.0
[0.3.0]: https://github.com/Arzule/AlfaMataGames/compare/v0.2.0-avance2...v0.3.0-avance3
[0.2.0]: https://github.com/Arzule/AlfaMataGames/releases/tag/v0.2.0-avance2
