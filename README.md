# AlfaMataGames

Aplicación móvil (Expo / React Native) de biblioteca de videojuegos. Cada usuario puede
registrarse e iniciar sesión con autenticación real (JWT), explorar un catálogo de juegos,
ver el detalle de cada uno, marcarlos como favoritos y guardar su propio progreso: estado,
puntuación y reseña.

Este repositorio corresponde al Avance 2 del proyecto: se conectó la app móvil con un
backend propio (autenticación y biblioteca por usuario), se agregó el catálogo con búsqueda
y paginación, la pantalla de detalle, la sección de favoritos y un conjunto de componentes
reutilizables, además de la documentación del proyecto.

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
- Manejo de estados de carga y de error en toda la app.
- Cuadrícula responsive (2, 3 o 4 columnas según el ancho de pantalla).
- Interfaz con tipografías propias (Sora e Inter) y componentes reutilizables con PropTypes.
- Búsquedas recientes (últimas 5 por usuario) al enfocar la barra de búsqueda, con opción de borrar.
- Catálogo disponible sin conexión: la primera página se guarda en caché 7 días y se muestra
  mientras carga o sin red, con un aviso.
- Imágenes con caché de disco (expo-image) y botón "Borrar caché" en Perfil.

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
| expo-font / @expo-google-fonts | ~57.0.4 / ^0.4.2 | Fuentes Sora e Inter |
| Node.js + Express | Express ^4.21.2 (Node >= 20) | Backend / API REST |
| MySQL | 8.0 (`mysql:8.0`) | Base de datos |
| Docker Compose | — | Orquestación de backend, BD y Adminer |
| JWT (`jsonwebtoken`) | ^9.0.2 | Autenticación con token |
| bcrypt (`bcryptjs`) | ^2.4.3 | Cifrado de contraseñas |
| mysql2 | ^3.11.5 | Conexión a MySQL |
| cors | ^2.8.5 | CORS en el backend |
| API de RAWG | `https://api.rawg.io/api` | Datos de videojuegos |

---

## Arquitectura

La app Expo corre en el celular (Expo Go) o en el navegador. La app consume la API de RAWG
directamente para los datos de los juegos, y consume el backend propio (Node/Express) para
la autenticación y la biblioteca del usuario. El backend y MySQL corren en Docker.

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
   |   API de RAWG       |   |              Docker (PC)                  |
   |   api.rawg.io/api   |   |                                           |
   |  (catálogo/detalle) |   |  +----------------+   +----------------+  |
   +---------------------+   |  | backend (api)  |   | MySQL 8 (db)   |  |
                             |  | Node + Express |-->| user_games     |  |
                             |  | puerto 3000    |   | puerto 3306    |  |
                             |  +----------------+   +--------+-------+  |
                             |                           |  volumen      |
                             |  +----------------+       |  db_data      |
                             |  | Adminer :8080  |-------+               |
                             |  +----------------+                       |
                             +-------------------------------------------+
```

- **App (Expo):** pantallas, componentes, contextos y servicios. Habla con RAWG y con el backend.
- **backend (`alfamatagames-api`):** API REST en Express; valida, cifra contraseñas y firma tokens.
- **db (`alfamatagames-db`):** MySQL 8 con las tablas `users` y `user_games`.
- **adminer (`alfamatagames-adminer`):** interfaz web para inspeccionar la base de datos.

---

## Estructura del repositorio

```
AlfaMataGames/
├── App.js                      # Raíz de la app: carga fuentes y monta los providers
├── index.js                    # Punto de entrada de Expo (registerRootComponent)
├── app.json                    # Configuración de Expo (name, slug, icon, plugins)
├── babel.config.js             # Preset de Expo + plugin react-native-dotenv (@env)
├── package.json                # Dependencias y scripts de la app
├── docker-compose.yml          # Servicios db, backend y adminer
├── .env.example                # Plantilla de variables de entorno (sin valores reales)
├── .gitignore                  # Ignora node_modules, .env, .expo, dist, etc.
├── assets/                     # Iconos y splash de la app
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
│       ├── controllers/        # auth.controller.js, library.controller.js
│       ├── middleware/         # auth.middleware.js, error.middleware.js
│       ├── routes/             # auth.routes.js, library.routes.js
│       └── utils/validators.js # Validaciones y constantes
└── src/
    ├── components/             # Header, SearchBar, RecentSearches, CategoryButton, FormInput,
    │                           #   EmptyState, ErrorState, GameCard, Rating, StatusChips
    ├── context/                # AuthContext.js, LibraryContext.js
    ├── hooks/                  # useAuth, useLibrary, useGames, useRecentSearches, useDebounce,
    │                           #   useGridColumns
    ├── navigation/             # AppNavigator.js (Stack + Tab)
    ├── screens/                # Login, Register, GameCatalog, GameDetail, Favorites, Profile
    ├── services/               # apiClient, authApi, libraryApi, rawgApi, catalogCache (.web)
    ├── theme/                  # colors.js, typography.js
    └── utils/                  # storage.js, confirm.js, mapGame.js, cacheEntry.js
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
| `RAWG_API_KEY` | Tu API key de RAWG (https://rawg.io/apidocs). La usa la app, no el backend. |
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
| GET | `/auth/me` | Bearer JWT | Devuelve `{ user }` del token actual. |
| GET | `/library` | Bearer JWT | Lista la biblioteca. Acepta `?favorite=true`. |
| GET | `/library/:gameId` | Bearer JWT | Devuelve `{ entry }` de un juego (o `null`). |
| PUT | `/library/:gameId` | Bearer JWT | Crea o actualiza (upsert parcial) la entrada. |
| DELETE | `/library/:gameId` | Bearer JWT | Elimina la entrada de un juego (204). |

Las rutas de `/library` requieren la cabecera `Authorization: Bearer <token>`.

---

## Modelo de datos

Definido en `database/init/01-schema.sql` (MySQL 8, `utf8mb4`).

### Tabla `users`

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | INT AUTO_INCREMENT | Clave primaria. |
| `name` | VARCHAR(80) | Nombre del usuario. |
| `email` | VARCHAR(255) | Único. |
| `password_hash` | VARCHAR(255) | Hash bcrypt (nunca en texto plano). |
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
| `created_at` | TIMESTAMP | Por defecto `CURRENT_TIMESTAMP`. |
| `updated_at` | TIMESTAMP | Con `ON UPDATE CURRENT_TIMESTAMP`. |

Restricciones: `UNIQUE (user_id, game_id)` y `CHECK (user_score BETWEEN 0 AND 5)`.

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

## Trabajo futuro

- **Traducir al español las descripciones de los juegos.** Hoy se muestran en su idioma
  original (RAWG las entrega en inglés). Se planea traducirlas **en el backend** y guardar la
  traducción en caché en la base de datos, para no depender de un servicio externo en cada petición.
- Mejoras menores: más datos en el detalle, filtros por género/plataforma, mejoras de UI y
  accesibilidad, y pruebas automatizadas.

---

## Créditos

- Datos de videojuegos proporcionados por **RAWG** (https://rawg.io).
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
-->
