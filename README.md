# AlfaMataGames

Aplicación móvil (Expo / React Native) de biblioteca de videojuegos. Cada usuario puede
registrarse e iniciar sesión con autenticación real (JWT), explorar un catálogo de juegos,
ver el detalle de cada uno, marcarlos como favoritos y guardar su propio progreso: estado,
puntuación y reseña.

Este repositorio corresponde al **Avance 3** del proyecto. Sobre la base del Avance 2 (app
conectada a un backend propio con autenticación JWT, catálogo, detalle, favoritos y biblioteca
por usuario) se agregaron funcionalidades nativas (cámara y galería, acelerómetro y vibración,
notificaciones locales, sistema de archivos y estado de la red), sinopsis traducidas al español,
reseñas de la comunidad, manejo de errores y logging, y un pulido de la interfaz para distintos
tamaños de pantalla. La tabla de [cumplimiento de la rúbrica del Avance 3](#cumplimiento-de-la-rúbrica-del-avance-3)
enlaza cada criterio con su evidencia.

---

## Funcionalidades implementadas

- Registro de usuarios con contraseña cifrada (bcrypt) y validaciones.
- Inicio y cierre de sesión con token JWT persistente (nativo y web).
- Restauración automática de la sesión al abrir la app.
- Catálogo de juegos con búsqueda (con *debounce*) y paginación "infinita".
- Filtro por estado usando la biblioteca del usuario (Jugando, Completado, Pendiente, Abandonado).
- Pantalla de detalle del juego (portada, año, desarrollador, plataformas, sinopsis).
- Biblioteca por usuario: favorito, estado, puntuación (0-5) y reseña (hasta 1000 caracteres).
- Pantalla de Favoritos con actualización por *pull-to-refresh*.
- Cambios optimistas con reversión si el backend falla.
- Estados de carga, vacío y error en todas las pantallas, con "Reintentar" donde aplica.
- Cuadrícula responsive (de 2 a 6 columnas según el ancho de pantalla) y contenido con ancho
  máximo en tablets y web.
- Interfaz con tipografías propias (Sora e Inter) y componentes reutilizables con PropTypes.
- Búsquedas recientes (últimas 5 por usuario) al enfocar la barra de búsqueda, con opción de borrar.
- Catálogo disponible sin conexión: la primera página se guarda en caché 7 días y se muestra
  mientras carga o sin red, con un aviso.
- Imágenes con caché de disco (expo-image) y botón "Borrar caché" en Perfil.
- Foto de perfil con la cámara o la galería: recorte cuadrado, reducción a 256 px (JPEG) y
  guardado en el backend; se muestra en Perfil y en el encabezado del catálogo (iniciales si no hay).
- Gestión de permisos con explicación previa, estado bloqueado y acceso a "Abrir ajustes".
- **Agitar para descubrir**: agitando el celular en el Catálogo se abre un juego al azar (con
  vibración); también con el botón "Juego al azar" del encabezado (única opción en web).
  Se puede desactivar en Perfil.
- Reseñas de la comunidad en el detalle del juego: las de los demás usuarios, la más reciente
  primero, con "Ver más".
- El campo de reseña se mantiene visible sobre el teclado.
- **Recordatorios (notificaciones locales)**: "Recordarme jugar esto" en el detalle (en 1 hora,
  mañana, en una semana o fecha y hora a elección), recordatorio diario configurable en Perfil,
  pantalla de recordatorios activos (campana del Catálogo) con opción de cancelar. Tocar la
  notificación abre el juego. Al cerrar sesión se cancelan todos.
- **Sinopsis en español**: el backend traduce la descripción de RAWG con DeepL API Free y la
  guarda en caché; la app indica si el texto es traducido (con "Ver original") o el original sin
  traducir, y permite expandirlo con "Ver más".
- **Robustez**: pantalla "Algo salió mal" con "Reintentar" ante cualquier error de render
  (ErrorBoundary global) y aviso en la parte inferior cuando no hay conexión, que pasa a
  "Conexión restablecida" al volver la red.
- **Logging**: logger central en la app (detallado en desarrollo, solo advertencias y errores en
  producción, sin datos sensibles) y registro de cada petición en el backend con un id
  (`X-Request-Id`).
- **Rendimiento**: tarjetas memorizadas (`React.memo`), contextos memorizados y grillas con
  ajustes de virtualización.
- **Confirmaciones con el estilo de la app** (borrar caché, cerrar sesión, eliminar foto,
  cancelar recordatorios y explicaciones de permisos) en lugar de los diálogos del sistema.
- Logo propio en el inicio de sesión y como icono de la app (incluido el icono adaptativo y
  monocromático de Android).

---

## Tecnologías

Versiones tomadas de `package.json` (app), `backend/package.json` y `docker-compose.yml`.

| Tecnología | Versión | Uso |
| --- | --- | --- |
| Expo | ~57.0.21 | Plataforma de la app |
| React Native | 0.86.3 | UI nativa |
| React | 19.2.3 | Librería de UI |
| React Navigation (`native`, `native-stack`, `bottom-tabs`) | ^7.3.18 / ^7.18.10 / ^7.18.18 | Navegación |
| react-native-web | ^0.21.2 | Soporte web |
| react-native-dotenv | ^4.1.1 | Variables de entorno (`@env`) |
| expo-secure-store | ~57.0.4 | Guardar el token (nativo) |
| @react-native-async-storage/async-storage | 2.2.0 | Búsquedas recientes y caché en web |
| expo-file-system | ~57.0.7 | Caché del catálogo (nativo) |
| expo-image | ~57.0.5 | Imágenes con caché de disco |
| prop-types | ^15.8.1 | Validación de props de los componentes |
| expo-image-picker | ~57.0.20 | Cámara y galería para la foto de perfil |
| expo-image-manipulator | ~57.0.21 | Recorte y reducción de la foto a 256 px |
| expo-sensors | ~57.0.3 | Acelerómetro para "Agitar para descubrir" |
| expo-haptics | ~57.0.3 | Vibración al detectar la sacudida |
| expo-notifications | ~57.0.23 | Recordatorios con notificaciones locales |
| @react-native-community/datetimepicker | 9.1.0 | Selector de fecha y hora del recordatorio |
| @react-native-community/netinfo | 12.0.1 | Aviso de sin conexión |
| react-native-safe-area-context | ~5.7.0 | Márgenes de la barra de estado, el notch y la barra de navegación |
| expo-font / @expo-google-fonts | ~57.0.4 / ^0.4.2 | Fuentes Sora e Inter |
| Node.js + Express | Express ^4.21.2 (Node >= 20) | Backend / API REST |
| MySQL | 8.0 (`mysql:8.0`) | Base de datos |
| Docker Compose | — | Orquestación de backend, BD y Adminer |
| JWT (`jsonwebtoken`) | ^9.0.2 | Autenticación con token |
| bcrypt (`bcryptjs`) | ^2.4.3 | Cifrado de contraseñas |
| mysql2 | ^3.11.5 | Conexión a MySQL |
| cors | ^2.8.5 | CORS en el backend |
| API de RAWG | `https://api.rawg.io/api` | Datos de videojuegos |
| DeepL API Free | `https://api-free.deepl.com/v2` | Traducción de las sinopsis (solo desde el backend) |

---

## Arquitectura

La app Expo corre en el celular (Expo Go) o en el navegador. La app consume la API de RAWG
directamente para el catálogo y el detalle, y el backend propio (Node/Express) para la
autenticación, la biblioteca, las reseñas de la comunidad, la foto de perfil y las sinopsis
traducidas. El backend consulta RAWG y DeepL para las sinopsis. El backend y MySQL corren en
Docker. (En el Avance 4 el catálogo de RAWG pasa a consultarse a través del backend.)

```
          Celular (Expo Go) / Navegador (web)
       +-----------------------------------------+
       |            App AlfaMataGames            |
       |              (Expo / RN)                |
       +--------------------+--------------------+
                |                        |
        HTTPS   |                        |  HTTP (API_URL, ej. :3000)
                v                        v
   +---------------------+   +-------------------------------------------+
   |    API de RAWG      |   |               Docker (PC)                 |
   | (catálogo, detalle) |   |                                           |
   +---------------------+   |  +----------------+   +----------------+  |
             ^               |  | backend (api)  |   | MySQL 8 (db)   |  |
             |  sinopsis     |  | Node + Express |-->| users          |  |
             +---------------+--| puerto 3000    |   | user_games     |  |
   +---------------------+   |  |                |   | game_transl... |  |
   |   DeepL API Free    |<--+--|                |   | puerto 3306    |  |
   |    (traducción)     |   |  +----------------+   +--------+-------+  |
   +---------------------+   |                                |          |
                             |  +----------------+   volumen db_data     |
                             |  | Adminer :8080  |------------+          |
                             |  +----------------+                       |
                             +-------------------------------------------+
```

- **App (Expo):** pantallas, componentes, contextos y servicios. Habla con RAWG y con el backend.
- **backend (`alfamatagames-api`):** API REST en Express; valida, cifra contraseñas, firma
  tokens, aplica las migraciones y traduce las sinopsis (RAWG + DeepL, con caché).
- **db (`alfamatagames-db`):** MySQL 8 con las tablas `users`, `user_games`,
  `game_translations` y `schema_migrations`.
- **adminer (`alfamatagames-adminer`):** interfaz web para inspeccionar la base de datos.

---

## Estructura del repositorio

```
AlfaMataGames/
├── App.js                      # Raíz de la app: carga fuentes y monta los providers
├── index.js                    # Punto de entrada de Expo (registerRootComponent)
├── app.json                    # Configuración de Expo (name, slug, icon, plugins)
├── babel.config.js             # Preset de Expo + plugin react-native-dotenv (@env)
├── metro.config.js             # Config. de Metro: shim de expo-notifications para Expo Go Android
├── package.json                # Dependencias y scripts de la app
├── docker-compose.yml          # Servicios db, backend y adminer
├── .env.example                # Plantilla de variables de entorno (sin valores reales)
├── .gitignore                  # Ignora node_modules, .env, .expo, dist, etc.
├── assets/                     # logo.png (login) e iconos de la app generados desde el logo
├── docs/
│   └── screenshots/            # Carpeta para las capturas de pantalla (vacía)
├── database/
│   └── init/
│       ├── 01-schema.sql       # Tablas users y user_games
│       └── 02-seed.sql         # Usuarios de prueba (contraseñas con hash bcrypt)
├── backend/
│   ├── Dockerfile              # Imagen Node 20 para el backend
│   ├── package.json            # Dependencias del backend
│   ├── migrations/             # Migraciones SQL numeradas (001-esquema-base.sql, ...)
│   └── src/
│       ├── server.js           # Arranque: aplica migraciones y escucha en PORT
│       ├── migrate.js          # Runner de migraciones (npm run migrate)
│       ├── app.js              # Express: middlewares, /health y rutas
│       ├── config/db.js        # Pool MySQL (mysql2): URL única o variables sueltas, SSL opcional
│       ├── controllers/        # auth, library, reviews y descriptions (sinopsis traducida)
│       ├── services/           # rawg.service.js y deepl.service.js (clientes de APIs externas)
│       ├── middleware/         # auth, error y requestLogger (registro de cada petición)
│       ├── routes/             # auth.routes.js, library.routes.js, games.routes.js
│       └── utils/              # validators.js (validaciones y constantes), logger.js
└── src/
    ├── components/             # Header, SearchBar, RecentSearches, CategoryButton, FormInput,
    │                           #   EmptyState, ErrorState, GameCard, Rating, StatusChips, Avatar,
    │                           #   ReviewCard, ReminderSheet, DateTimePickerModal, ErrorBoundary,
    │                           #   OfflineBanner, Synopsis, ConfirmDialog
    ├── context/                # AuthContext.js, LibraryContext.js
    ├── hooks/                  # useAuth, useLibrary, useGames, useRecentSearches, useDebounce,
    │                           #   useGridColumns, usePermission, useAvatarPicker,
    │                           #   useShakeDetector, useRandomGame, useGameReviews, useNotificationPermission,
    │                           #   useGameReminder, useDailyReminder, useNotificationBridge,
    │                           #   useNetworkStatus, useGameDescription
    ├── navigation/             # AppNavigator.js (Stack + Tab)
    ├── screens/                # Login, Register, GameCatalog, GameDetail, Favorites, Profile,
    │                           #   Reminders
    ├── services/               # apiClient, authApi, libraryApi, reviewsApi, gamesApi, rawgApi,
    │                           #   catalogCache (.web), preferences, notifications (.web)
    ├── shims/                  # TopicSubscriptionModule.android.js (ver metro.config.js)
    ├── theme/                  # colors.js, typography.js
    └── utils/                  # storage.js, confirm.js, mapGame.js, cacheEntry.js, avatarImage.js,
                                #   dateFormat.js, logger.js
```

---

## Requisitos previos

- **Node.js LTS** (se recomienda **20 o superior**; el backend declara `node >= 20`).
- **Docker Desktop** en ejecución (incluye Docker Compose).
- **Expo Go** instalado en el celular (Android o iOS) — o un navegador para el modo web.
- Una **API key gratuita de RAWG**: https://rawg.io/apidocs

---

## Instalación y ejecución paso a paso

### 1) Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd AlfaMataGames
```

### 2) Crear el archivo `.env`

Copia la plantilla `.env.example` a `.env` y completa los valores.

**Windows (PowerShell):**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**

```bash
cp .env.example .env
```

### 3) Completar las variables de `.env`

| Variable | Descripción |
| --- | --- |
| `RAWG_API_KEY` | Tu API key de RAWG (https://rawg.io/apidocs). La usan la app (catálogo) y el backend (sinopsis). |
| `DEEPL_API_KEY` | Opcional. Clave de DeepL API Free para traducir las sinopsis (solo el backend). Si falta, se muestra el texto original con una etiqueta. Ver [Sinopsis traducidas](#sinopsis-traducidas). |
| `DEEPL_API_URL` | Opcional. Fuerza el endpoint de DeepL; por defecto, `api-free.deepl.com` si la clave termina en `:fx` y `api.deepl.com` si no. |
| `API_URL` | URL base del backend, con la **IP local de tu PC**, ej. `http://192.168.1.10:3000`. No uses `localhost`: el celular no puede resolverlo. |
| `MYSQL_ROOT_PASSWORD` | Contraseña del usuario `root` de MySQL (la usa el contenedor). |
| `MYSQL_DATABASE` | Nombre de la base de datos que se crea al inicializar MySQL. |
| `MYSQL_USER` | Usuario de la aplicación. **No puede ser `root`.** |
| `MYSQL_PASSWORD` | Contraseña del usuario de la aplicación. |
| `DB_HOST_PORT` | Puerto del host para la base de datos. Por defecto `3307` (para no chocar con un MySQL local en `3306`). |
| `DATABASE_URL` / `MYSQL_URL` | Opcional (nube). URL única `mysql://usuario:contraseña@host:puerto/bd`; si existe, reemplaza a las variables sueltas. En local no se usa. |
| `DB_SSL` / `DB_SSL_REJECT_UNAUTHORIZED` | Opcional. `DB_SSL=true` activa SSL; `DB_SSL_REJECT_UNAUTHORIZED=false` acepta certificados autofirmados. |
| `JWT_SECRET` | Clave secreta para firmar los tokens JWT. |
| `JWT_EXPIRES_IN` | Duración del token (ej. `7d`). |
| `BACKEND_PORT` | Puerto del host para el backend. Por defecto `3000`. |
| `LOG_LEVEL` | Opcional. Nivel mínimo de los logs del backend: `debug`, `info` (por defecto), `warn` o `error`. |

Notas importantes:

- `MYSQL_USER` **no puede ser `root`** (es un requerimiento de la imagen oficial de MySQL).
- Evita los caracteres `$`, `#` y las comillas en las contraseñas: complican el parseo del archivo `.env`.
- **`API_URL`** debe apuntar a la **IP local de la PC** (no `localhost`) y el celular debe
  estar en la **misma red Wi-Fi** que la PC.
- Genera un `JWT_SECRET` aleatorio con Node:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copia el resultado como valor de `JWT_SECRET`.

### 4) Levantar la base de datos y el backend (Docker)

```bash
docker compose up -d --build
```

Esto construye el backend y levanta `db`, `backend` y `adminer`. La primera vez, MySQL
ejecuta automáticamente los scripts de `database/init/` (esquema y datos de prueba). Al
arrancar, el backend aplica las migraciones pendientes (ver [Migraciones](#migraciones-de-base-de-datos)).

Comprueba que el backend responde:

```
http://localhost:3000/health
```

Deberías ver algo como `{ "status": "ok" }`.

### 5) Instalar las dependencias de la app

```bash
npm install
```

Las dependencias del backend no se instalan aparte: se instalan dentro del contenedor Docker.

### 6) Iniciar la app

```bash
npx expo start
```

- Abre **Expo Go** en el celular y escanea el código QR.
- O presiona **`w`** en la terminal para abrir la app en el navegador (web).

Si cambias algo en el archivo `.env`, reinicia el servidor de Expo **limpiando la caché**:

```bash
npx expo start -c
```

### 7) Adminer (opcional): inspeccionar la base de datos

Abre `http://localhost:8080` y conéctate con:

- **System:** MySQL / MariaDB
- **Server:** `db`
- **Username:** el valor de `MYSQL_USER`
- **Password:** el valor de `MYSQL_PASSWORD`
- **Database:** el valor de `MYSQL_DATABASE`

También puedes conectar un cliente MySQL externo a `localhost:3307` (el valor de `DB_HOST_PORT`).

---

## Migraciones de base de datos

Los cambios de esquema se hacen con archivos SQL numerados en `backend/migrations/`
(`001-esquema-base.sql`, `002-...sql`). Así se puede modificar una BD que ya tiene datos, en
local o en la nube, sin borrarla.

| Migración | Cambio |
| --- | --- |
| `001-esquema-base.sql` | Tablas `users` y `user_games` (igual a `database/init/01-schema.sql`). |
| `002-avatar-usuario.sql` | Columna `users.avatar` para la foto de perfil. |
| `003-fecha-resena.sql` | Columna `user_games.review_updated_at` e índice para las reseñas de la comunidad. |
| `004-traducciones.sql` | Tabla `game_translations` (caché de sinopsis traducidas). |

- **Automático:** al arrancar, el backend aplica en orden las migraciones que faltan y las
  registra en la tabla `schema_migrations`. Si una falla, el backend no arranca y muestra el error.
- **Manual:** `docker compose exec backend npm run migrate` (o `npm run migrate` dentro de
  `backend/` con las variables de entorno configuradas).
- Cada migración se aplica una sola vez; volver a arrancar no repite nada.
- `001-esquema-base.sql` usa `CREATE TABLE IF NOT EXISTS`: en una BD creada por
  `database/init/` solo queda registrada, y en una BD vacía crea las tablas.
- **Reglas:** nunca editar una migración ya aplicada (el runner avisa si cambia); crear una
  nueva con el siguiente número. `database/init/` solo corre con el volumen vacío y se mantiene
  para crear la BD local con datos de prueba.

---

## Credenciales de prueba

Creadas por `database/init/02-seed.sql`:

| Correo | Contraseña |
| --- | --- |
| `drago@gmail.com` | `12345678` |
| `demo@alfamatagames.com` | `Demo1234` |

---

## Permisos

| Permiso | Para qué | Cuándo se pide |
| --- | --- | --- |
| Cámara | Tomar la foto de perfil | Al tocar "Cámara" en Perfil, después de una explicación |
| Fotos | — | No se pide: la galería usa el selector del sistema |
| Notificaciones | Recordatorios para jugar | Al programar el primer recordatorio o activar el diario, después de una explicación |

- Si el permiso se niega, se puede volver a intentar; si queda **bloqueado** (el sistema ya no
  pregunta), la app lo indica y ofrece **Abrir ajustes**. Al volver, el estado se actualiza solo.
- La app **no pide ubicación** ni micrófono (`microphonePermission: false` en `app.json`).
- En **web** no hay opción de cámara; "Galería" abre el selector de archivos del navegador.
- Textos de uso de los permisos: plugin `expo-image-picker` en `app.json`.
- El **acelerómetro** no necesita permiso en Android/iOS. Solo se lee con el Catálogo en
  pantalla y la app en primer plano; al salir se desuscribe. En web no se usa (la opción de
  Perfil se oculta y queda el botón "Juego al azar").

---

## Caché y almacenamiento local

| Dato | Dónde se guarda | Se borra con |
| --- | --- | --- |
| Token de sesión | expo-secure-store (nativo) / localStorage (web) | Cerrar sesión |
| Búsquedas recientes | AsyncStorage, una lista por usuario | "Borrar todo" en la lista de recientes |
| Primera página del catálogo | Carpeta de caché del sistema (`Paths.cache`, expo-file-system); en web, AsyncStorage | "Borrar caché" en Perfil; vence a los 7 días |
| Imágenes | Caché de disco de expo-image; en web, la del navegador | "Borrar caché" en Perfil |

En **Android** (Ajustes → Aplicaciones → la app → Almacenamiento):

- **Borrar caché** elimina el catálogo guardado y las imágenes, **sin cerrar sesión**.
- **Borrar almacenamiento** elimina todo: sesión, búsquedas recientes y caché.

En Expo Go esto aplica a la app Expo Go completa, no solo a AlfaMataGames.

---

## Notificaciones

- Son **locales** (programadas en el propio celular) y funcionan en **Expo Go**. Las push
  remotas llegan en el Avance 4 y se prueban con el APK.
- En Expo Go aparecen dos avisos amarillos de `expo-notifications` sobre las push remotas;
  son esperables y no afectan a las locales.
- Expo Go en Android no trae el módulo nativo de temas push (`ExpoTopicSubscriptionModule`) y
  `expo-notifications` fallaba al importarse ("Cannot find native module"). `metro.config.js`
  lo sustituye en Android por `src/shims/TopicSubscriptionModule.android.js`, que no falla si
  el módulo falta. La app no usa temas push.
- Un recordatorio por juego (programar otro lo reemplaza) y un recordatorio diario por usuario
  (preferencia en AsyncStorage). Al cerrar sesión se cancelan todos; el diario se vuelve a
  programar al iniciar sesión si estaba activado.
- Android puede retrasar unos minutos un recordatorio por el ahorro de batería.
- En **web** no hay notificaciones: la app lo indica y oculta las opciones.

---

## Sinopsis traducidas

- `GET /games/:gameId/description` obtiene la descripción de RAWG y la traduce al español con
  **DeepL API Free**. La traducción se guarda en la tabla `game_translations` (migración
  `004`): la segunda consulta de un juego sale de la caché, sin llamar a RAWG ni a DeepL.
- Las claves de RAWG y DeepL quedan en el servidor; la app nunca recibe la de DeepL.
- Si no se puede traducir (sin clave, cuota agotada o DeepL caído) se devuelve el texto
  original con un aviso (`notice`) y **no** se guarda nada, para traducir en cuanto el servicio
  esté disponible. Si el backend no responde, la app usa la descripción que ya tiene de RAWG.
- Para proteger la cuota mensual del plan Free (se ve en *Account* de DeepL) se traducen
  como máximo 6000 caracteres por juego, y dos consultas simultáneas del mismo juego comparten una sola traducción.
- **Obtener la clave**: crea una cuenta en https://www.deepl.com/pro-api (plan *DeepL API Free*;
  puede pedir una tarjeta solo para verificar la identidad; el plan Free no cobra). En *Account → API Keys* copia la clave (termina
  en `:fx`), agrégala al `.env` como `DEEPL_API_KEY=...` y reinicia el backend con
  `docker compose up -d`.

---

## Errores, logging y rendimiento

- **ErrorBoundary** (`src/components/ErrorBoundary.js`) envuelve toda la app: un error de
  render muestra "Algo salió mal" con "Reintentar", que vuelve a montar la app (la sesión se
  restaura sola). En desarrollo muestra el mensaje del error y Perfil tiene el botón "Simular
  error (solo desarrollo)" para probarlo. Los errores de red y de acciones se siguen mostrando
  en cada pantalla.
- **Sin conexión** (`OfflineBanner` + `useNetworkStatus`, con NetInfo): franja inferior en toda
  la app. En nativo cuenta como sin red estar desconectado o conectado sin internet; en web solo
  se usa el estado del navegador.
- **Logger de la app** (`src/utils/logger.js`): `createLogger('ambito')` con `debug`, `info`,
  `warn` y `error`. En desarrollo registra todo con detalles; en producción solo `warn` y
  `error`, sin el contexto. Siempre oculta contraseñas, tokens, claves (`?key=` de RAWG,
  `Bearer ...`) y fotos en base64. Nunca usar `console.*` directamente.
- **Logs del backend**: una línea por petición con método, ruta (sin query string), status,
  duración, id y usuario; nunca cuerpos ni cabeceras. Las respuestas llevan `X-Request-Id`
  con el mismo id. Los errores 500 registran la traza y responden un mensaje genérico (no
  exponen detalles internos como el SQL). `/health` y los preflight de CORS solo aparecen con
  `LOG_LEVEL=debug`. Ver los logs: `docker logs -f alfamatagames-api`.

  ```
  2026-10-20T06:46:51.040Z INFO  [http] GET /auth/me 200 6ms id=c9087e15 user=3 bytes=94
  2026-10-20T06:47:11.344Z ERROR [error] getaddrinfo ENOTFOUND db id=9ebf3801 method=POST path=/auth/login
  ```
- **Rendimiento**: `GameCard` y `ReviewCard` con `React.memo` y un handler estable por
  pantalla; valores de `AuthContext` y `LibraryContext` memorizados; `getEntry` usa un índice
  por id; las grillas usan `GRID_PERFORMANCE_PROPS` (`useGridColumns.js`).

---

## Diseño y adaptabilidad

- **Tema único** en `src/theme/` (`colors.js`, `typography.js`): fondo oscuro, morado como
  color principal, rojo (`danger`) para acciones destructivas; títulos en Sora e interfaz en
  Inter. Las pantallas no usan colores sueltos.
- **Componentes reutilizables** (`src/components/`, todos con PropTypes): encabezado, tarjetas,
  chips de estado, puntuación, campos de formulario, estados vacío y de error, diálogo de
  confirmación (`ConfirmDialog`), hoja de opciones de recordatorio, sinopsis y aviso de red.
- **Estados** en cada pantalla: indicador de carga, mensaje vacío con icono (`EmptyState`) y
  error con "Reintentar" (`ErrorState`). El detalle del juego mantiene el botón de volver
  mientras carga o si falla, y Favoritos conserva la lista al refrescar.
- **Área segura**: el encabezado (`Header`), el detalle del juego y el aviso de red respetan
  la barra de estado, el notch y la barra de navegación (`react-native-safe-area-context`).
- **Tamaños de pantalla**: grillas de 2 columnas en celulares, 3 en tablets y de 4 a 6 en
  pantallas anchas (`useGridColumns`); formularios (420 px), Perfil (480 px), detalle y
  Recordatorios (720 px) y diálogos (380 px) con ancho máximo y centrados.
- **Identidad**: logo en el inicio de sesión (`assets/logo.png`) y como icono de la app;
  prototipo inicial en Figma (inicio de sesión, catálogo y detalle).

---

## Solución de problemas

- **El puerto 3306 está ocupado por un MySQL local.** Por eso la base de datos de Docker se
  publica en **3307** (`DB_HOST_PORT=3307`). Si cambias ese puerto, actualízalo en el `.env`.
- **La IP de la PC cambió.** Actualiza `API_URL` en el `.env` con la nueva IP local y reinicia
  Expo con `npx expo start -c`. Puedes ver la IP con `ipconfig` (Windows) o `ifconfig` / `ip addr` (macOS/Linux).
- **La red de Windows está en "Public" o falta una regla de firewall.** El celular no podrá
  alcanzar el backend en el puerto **3000**. Cambia la red a "Private" o permite el puerto
  3000 en el Firewall de Windows.
- **Mensaje "Respuesta inesperada del servidor".** Suele ocurrir cuando `API_URL` apunta a
  otro servicio (por ejemplo, a RAWG o a un host incorrecto) y la respuesta no es el JSON
  esperado del backend. Verifica que `API_URL` termine en `:3000` y sea la IP correcta.
- **Reiniciar la base de datos desde cero** (borra el volumen y vuelve a ejecutar los scripts):

```bash
docker compose down -v
docker compose up -d --build
```

---

## API REST

Tabla generada a partir de `backend/src/routes/`.

| Método | Ruta | Autenticación | Descripción |
| --- | --- | --- | --- |
| GET | `/health` | No | Estado del servicio (`{ "status": "ok" }`). |
| POST | `/auth/register` | No | Registra un usuario y devuelve `{ token, user }`. |
| POST | `/auth/login` | No | Inicia sesión y devuelve `{ token, user }`. |
| GET | `/auth/me` | Bearer JWT | Devuelve `{ user }` del token actual (incluye `avatar`). |
| PUT | `/auth/me/avatar` | Bearer JWT | Guarda la foto: `{ image: "data:image/jpeg;base64,..." }` (JPEG, PNG o WebP, máx. 200 KB). Devuelve `{ user }`. |
| DELETE | `/auth/me/avatar` | Bearer JWT | Elimina la foto. Devuelve `{ user }`. |
| GET | `/library` | Bearer JWT | Lista la biblioteca. Acepta `?favorite=true`. |
| GET | `/library/:gameId` | Bearer JWT | Devuelve `{ entry }` de un juego (o `null`). |
| PUT | `/library/:gameId` | Bearer JWT | Crea o actualiza (upsert parcial) la entrada. |
| DELETE | `/library/:gameId` | Bearer JWT | Elimina la entrada de un juego (204). |
| GET | `/games/:gameId/description` | Bearer JWT | Sinopsis en español. Devuelve `{ gameId, lang, text, original, translated, source, notice }`: `source` es `cache`, `deepl` o `null`; `notice` es `null`, `empty`, `same-language`, `not-configured`, `quota` o `unavailable` (en esos casos `text` es el original). 404 si el juego no existe en RAWG; 502/503 si RAWG no responde o no está configurado. |
| GET | `/games/:gameId/reviews` | Bearer JWT | Reseñas de los demás usuarios, la más reciente primero. `?page=1&pageSize=10` (máx. 30). Devuelve `{ items, page, hasMore }`; cada item trae `review`, `userScore`, `status`, `date` y `user { id, name, avatar }`. |

Las rutas marcadas con *Bearer JWT* requieren la cabecera `Authorization: Bearer <token>`. Si
el token venció o no es válido responden 401 con `code` `TOKEN_EXPIRED` o `TOKEN_INVALID`, y la
app cierra la sesión. Todos los errores son JSON `{ message }`.

---

## Modelo de datos

Definido en `database/init/01-schema.sql` y las migraciones de `backend/migrations/`
(MySQL 8, `utf8mb4`).

### Tabla `users`

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | INT AUTO_INCREMENT | Clave primaria. |
| `name` | VARCHAR(80) | Nombre del usuario. |
| `email` | VARCHAR(255) | Único. |
| `password_hash` | VARCHAR(255) | Hash bcrypt (nunca en texto plano). |
| `avatar` | MEDIUMTEXT NULL | Foto de perfil como data URI base64 (migración `002`). |
| `created_at` | TIMESTAMP | Por defecto `CURRENT_TIMESTAMP`. |

### Tabla `user_games`

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | INT AUTO_INCREMENT | Clave primaria. |
| `user_id` | INT | FK a `users.id` (ON DELETE CASCADE). |
| `game_id` | INT | Id del juego en la API de RAWG. |
| `game_name` | VARCHAR(255) | Nombre del juego (desnormalizado). |
| `game_image` | VARCHAR(500) NULL | URL de la portada. |
| `game_rating` | DECIMAL(3,2) NULL | Rating de RAWG (0-10). |
| `is_favorite` | TINYINT(1) | Por defecto `0`. |
| `status` | ENUM(...) NULL | `Jugando`, `Completado`, `Pendiente`, `Abandonado`. |
| `user_score` | TINYINT NULL | 0-5 (con `CHECK`). |
| `review` | TEXT NULL | Reseña del usuario. |
| `review_updated_at` | TIMESTAMP NULL | Última edición del texto de la reseña (orden de las reseñas de la comunidad). |
| `created_at` | TIMESTAMP | Por defecto `CURRENT_TIMESTAMP`. |
| `updated_at` | TIMESTAMP | Con `ON UPDATE CURRENT_TIMESTAMP`. |

Restricciones: `UNIQUE (user_id, game_id)` y `CHECK (user_score BETWEEN 0 AND 5)`.

### Tabla `game_translations` (migración `004`)

Caché de sinopsis traducidas. Clave primaria `(game_id, lang)`.

| Columna | Tipo | Notas |
| --- | --- | --- |
| `game_id` | INT | Id del juego en RAWG. |
| `lang` | VARCHAR(8) | Idioma destino (`es`). |
| `source_hash` | CHAR(64) | SHA-256 del texto original (detecta si RAWG lo cambió). |
| `source_lang` | VARCHAR(8) NULL | Idioma detectado por DeepL (ej. `EN`). |
| `original_text` | MEDIUMTEXT | Descripción de RAWG que se tradujo. |
| `translated_text` | MEDIUMTEXT | Traducción. |
| `provider` | VARCHAR(20) | `deepl`. |
| `created_at` / `updated_at` | TIMESTAMP | Fechas de creación y actualización. |

---

## Cumplimiento de la rúbrica del Avance 3

Criterios del APF3 (resumen en [`docs/RUBRICAS.md`](docs/RUBRICAS.md)).

| Criterio (peso) | Cómo se cumple | Evidencia |
| --- | --- | --- |
| Arquitectura y estructura (15%) | Capas separadas (pantallas, componentes, hooks, contextos, servicios, utilidades); navegación Stack + Tabs según la sesión; backend por rutas, controladores, servicios y middlewares; esquema por migraciones; logger central; variables documentadas; ramas y Conventional Commits. | [`src/`](src), [`AppNavigator.js`](src/navigation/AppNavigator.js), [`backend/src/`](backend/src), [`backend/migrations/`](backend/migrations), [`logger.js`](src/utils/logger.js), [`.env.example`](.env.example), [Estructura](#estructura-del-repositorio), [Flujo de trabajo en Git](#flujo-de-trabajo-en-git) |
| Integración con backend REST / JWT (20%) | JWT validado en cada ruta privada con códigos `TOKEN_EXPIRED`/`TOKEN_INVALID`; la app cierra la sesión ante un 401; timeout de 10 s; errores siempre JSON y 500 genéricos; nuevos endpoints de foto de perfil, reseñas de la comunidad y sinopsis traducida; registro de cada petición con `X-Request-Id`. | [`auth.middleware.js`](backend/src/middleware/auth.middleware.js), [`apiClient.js`](src/services/apiClient.js), [`reviews.controller.js`](backend/src/controllers/reviews.controller.js), [`descriptions.controller.js`](backend/src/controllers/descriptions.controller.js), [API REST](#api-rest), [Errores y logging](#errores-logging-y-rendimiento) |
| Funcionalidades nativas (25%) | **Cámara y galería** (foto de perfil con recorte), **acelerómetro y vibración** (agitar para descubrir), **notificaciones locales** (recordatorios), **sistema de archivos** (caché del catálogo) y **estado de la red**. Permisos con explicación previa, estado bloqueado y "Abrir ajustes"; cada función controla sus errores y se degrada en web. | [`useAvatarPicker.js`](src/hooks/useAvatarPicker.js), [`usePermission.js`](src/hooks/usePermission.js), [`useShakeDetector.js`](src/hooks/useShakeDetector.js), [`notifications.js`](src/services/notifications.js), [`useGameReminder.js`](src/hooks/useGameReminder.js), [`catalogCache.js`](src/services/catalogCache.js), [`useNetworkStatus.js`](src/hooks/useNetworkStatus.js), [Permisos](#permisos), [Notificaciones](#notificaciones) |
| UI/UX (25%) | Tema y tipografías coherentes, componentes reutilizables, diálogos propios, estados de carga/vacío/error, área segura, grillas de 2 a 6 columnas y anchos máximos para tablets y web, logo e icono propios. | [`src/theme/`](src/theme), [`src/components/`](src/components), [`ConfirmDialog.js`](src/components/ConfirmDialog.js), [`ErrorBoundary.js`](src/components/ErrorBoundary.js), [`useGridColumns.js`](src/hooks/useGridColumns.js), [Diseño y adaptabilidad](#diseño-y-adaptabilidad) |
| Innovación y valor agregado (10%) | Frente al APF2: uso sin conexión con caché, agitar para descubrir un juego, sinopsis traducidas al español con DeepL (con caché en la BD), reseñas de la comunidad, recordatorios y foto de perfil. | [Sinopsis traducidas](#sinopsis-traducidas), [Caché](#caché-y-almacenamiento-local), [`useRandomGame.js`](src/hooks/useRandomGame.js), [`useGameReviews.js`](src/hooks/useGameReviews.js) |
| Documentación (5%) | README con instalación, variables, permisos, caché, notificaciones, API, modelo de datos, migraciones y esta tabla; guía para agentes y plan del proyecto. | `README.md`, [`AGENTS.md`](AGENTS.md), [`docs/PLAN.md`](docs/PLAN.md) |

---

## Cumplimiento de la rúbrica del Avance 2

| Criterio | Dónde se evidencia |
| --- | --- |
| Estructura del repositorio | `App.js`, `src/`, `backend/`, `database/init/`, `docker-compose.yml` |
| Navegación Stack + Tab | `src/navigation/AppNavigator.js` (Stack con Login/Register o MainTabs + GameDetail; Tab con Catálogo, Favoritos y Perfil) |
| Hooks `useState` / `useEffect` / `useContext` | `src/context/AuthContext.js`, `src/context/LibraryContext.js`, `src/hooks/useAuth.js`, `src/hooks/useLibrary.js` |
| Hooks propios | `src/hooks/useDebounce.js`, `src/hooks/useGames.js`, `src/hooks/useGridColumns.js` |
| Consumo de API con `try/catch` y estados `loading`/`error` | `src/services/apiClient.js`, `src/hooks/useGames.js`, `src/context/LibraryContext.js`, `src/screens/GameDetailScreen.js` |
| UI y componentes reutilizables | `src/components/` (`Header`, `SearchBar`, `CategoryButton`, `FormInput`, `EmptyState`, `ErrorState`, `GameCard`, `Rating`, `StatusChips`) y `src/theme/` |
| README | `README.md` (este archivo) |

---

## Flujo de trabajo en Git

- **`main`**: rama estable (prototipo inicial).
- **`develop`**: rama de integración donde se fusionan las funcionalidades terminadas.
- **`feature/*`**: nuevas funcionalidades (ej. `feature/library-state`, `feature/ui-components`).
- **`fix/*`**: correcciones (ej. `fix/auth-null-response`, `fix/session-web-logout`).
- **Commits** con **Conventional Commits** (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`...).

Las ramas se integran a `develop` con `git merge --no-ff` para conservar el historial.

---

## Trabajo futuro (Avance 4)

- Catálogo de RAWG a través del backend (la clave sale de la app) y variables `EXPO_PUBLIC_*`.
- Backend en la nube (Railway) con HTTPS y guía de despliegue.
- Gestión de cuenta (datos, contraseña, eliminar cuenta) y estadísticas en Perfil.
- Inicio de sesión con Google y Discord, e importación de la biblioteca de Steam.
- Recordatorios con notificaciones push desde el servidor.
- APK con EAS Build, accesibilidad y pulido final.

---

## Créditos

- Datos de videojuegos proporcionados por **RAWG** (https://rawg.io).
- Traducción de las sinopsis con **DeepL** (https://www.deepl.com).
- **Autor(es):** Gerardo Carpio

---

## Capturas de pantalla

<!--
Agregar las imágenes en docs/screenshots/ con estos nombres:
- docs/screenshots/login.png       (pantalla de inicio de sesión)
- docs/screenshots/catalogo.png    (catálogo de juegos)
- docs/screenshots/detalle.png     (detalle de un juego)
- docs/screenshots/favoritos.png   (pantalla de favoritos)
- docs/screenshots/perfil.png      (perfil del usuario)
- docs/screenshots/recordatorios.png (recordatorios activos)
- docs/screenshots/web-ancha.png   (catálogo en el navegador, pantalla ancha)
-->
