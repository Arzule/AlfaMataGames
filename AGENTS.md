# AGENTS.md — AlfaMataGames

Contexto para agentes. Detalle completo en [README.md](README.md); roadmap, estado y
decisiones en [docs/PLAN.md](docs/PLAN.md); criterios de evaluación en
[docs/RUBRICAS.md](docs/RUBRICAS.md). Leer los tres al empezar una sesión.

> **Expo HAS CHANGED.** Lee la documentación versionada exacta en
> https://docs.expo.dev/versions/v57.0.0/ antes de escribir código.

## Proyecto

AlfaMataGames: biblioteca de videojuegos (catálogo de IGDB + biblioteca personal por usuario:
favorito, estado, puntuación 0-5 y reseña). Proyecto académico del curso Desarrollo de
Aplicaciones Móviles (UTP). Avances 1 y 2 entregados; Avance 3 (Unidad 3) terminado; en
curso: entrega final (Avance 4, Unidad 4). Fase actual y decisiones: `docs/PLAN.md`.

## Stack

- App: Expo SDK 57 (`expo ~57.0.21`), React Native 0.86.3, React 19.2.3. **JavaScript puro**
  (plantilla blank, sin TypeScript, sin Expo Router). Entrada: `index.js` → `App.js`.
- Navegación: React Navigation 7 (`native-stack` + `bottom-tabs`). Estado: Context API.
- Variables de la app: solo `EXPO_PUBLIC_API_URL` (`process.env.EXPO_PUBLIC_API_URL`, la inyecta
  Expo desde `.env` y EAS desde sus variables). Nunca poner secretos en `EXPO_PUBLIC_*`.
- Backend (`backend/`): Node 20 (`node:20-alpine`), Express 4, mysql2, jsonwebtoken, bcryptjs, cors.
- BD: MySQL 8.0. Orquestación local: Docker Compose (`db`, `backend`, `adminer`).
- Datos de juegos: API de IGDB (Twitch) **a través del backend** (`/games`, `/games/random`,
  `/games/:gameId`), ya normalizados; `IGDB_CLIENT_ID`/`IGDB_CLIENT_SECRET` solo están en el
  backend (token de aplicación en memoria, renovado solo). RAWG se abandonó en A4-1b.
- Producción: **VM de Azure** (`vm-alfamatagames`, Chile Central, grupo `rg-alfamatagames`) con
  Docker Compose (`deploy/`: MySQL + backend + Caddy HTTPS) en
  https://alfamatagames-api.chilecentral.cloudapp.azure.com. Se apaga sola el 1/1/2027. Ver
  `docs/DEPLOY.md` (por qué no Container Apps/MySQL Flexible y cómo redesplegar).

## Cómo correrlo en local (Windows, PowerShell)

```powershell
docker compose up -d --build   # db -> host 3307, api -> 3000, adminer -> 8080
npx expo start -c              # Expo Go (QR) o 'w' para web
```

- `EXPO_PUBLIC_API_URL` debe ser la **IP LAN de la PC** (ej. `http://192.168.x.x:3000`), no `localhost`.
- Variables: ver `.env.example` y la tabla del README. Salud del backend: `GET /health`.

## Mapa del código

`src/`
- `components/` — UI reutilizable sin red, todos con PropTypes: Header, SearchBar,
  RecentSearches, CategoryButton, FormInput, EmptyState, ErrorState, GameCard, Rating, StatusChips,
  Avatar (foto o iniciales), ReviewCard (reseña de otro usuario), ReminderSheet (opciones de
  recordatorio), DateTimePickerModal (fecha/hora: diálogos en Android, modal en iOS),
  ErrorBoundary (pantalla de reintento global), OfflineBanner (aviso de red), Synopsis
  (sinopsis con etiqueta de traducción, "Ver original" y "Ver más"), ConfirmDialog (diálogo de
  confirmación propio y `ConfirmDialogHost`, montado en `App.js`), LibraryStats (estadísticas
  de la biblioteca en Perfil), SocialLoginButtons (Google/Discord configurados en el backend),
  SteamCard (conectar Steam y sincronizar con progreso).
- `context/` — `AuthContext.js` (sesión, token, login/register/logout, restaura con `/auth/me`;
  updateName, changePassword y deleteAccount, que también borra los datos locales del usuario);
  `LibraryContext.js` (biblioteca del usuario con cambios optimistas).
- `hooks/` — `useAuth`, `useLibrary` (consumen contextos), `useGames` (catálogo con
  búsqueda, paginación, caché y `offline`), `useRecentSearches` (AsyncStorage, por usuario),
  `usePermission` (permisos: explicación previa, bloqueado, abrir ajustes), `useAvatarPicker`
  (cámara/galería → recorte → subida), `useShakeDetector` (acelerómetro con umbral y
  antirrebote, solo con la pantalla enfocada y la app activa), `useRandomGame` (juego al azar del
  catálogo), `useGameReviews` (reseñas de la comunidad paginadas), `useNotificationPermission`,
  `useGameReminder` (recordatorio de un juego), `useDailyReminder` (diario, por usuario),
  `useNotificationBridge` (tocar notificación → navegar; restaura el diario al iniciar sesión),
  `useNetworkStatus` (NetInfo), `useOAuthProviders` (proveedores de login social), `useSteam` (conectar, desconectar y sincronizar Steam por lotes), `useGameDescription` (sinopsis traducida con respaldo al texto original),
  `useDebounce`, `useGridColumns` (2/3/4 columnas y
  `GRID_PERFORMANCE_PROPS` para las FlatList).
- `navigation/` — `AppNavigator.js`: Stack según sesión; Tabs Catálogo/Favoritos/Perfil +
  `GameDetail` + `Reminders` + `Account`; `navigationRef` para navegar desde notificaciones.
- `screens/` — Login, Register, GameCatalog, GameDetail, Favorites, Profile (con estadísticas),
  Reminders, Account (nombre, contraseña y eliminar cuenta).
- `services/` — `apiClient.js` (fetch al backend, timeout 10 s, Bearer, aviso de 401),
  `authApi.js`, `oauthApi.js`, `steamApi.js` y `socialAuth.js` (login social y conectar Steam:
  navegador + deep link + PKCE),
  `libraryApi.js`, `reviewsApi.js`, `gamesApi.js` (catálogo, detalle, juego al azar y sinopsis, todo vía backend), `catalogCache.js` / `catalogCache.web.js` (caché del catálogo: expo-file-system
  en nativo, AsyncStorage en web), `preferences.js` (preferencias en AsyncStorage),
  `notifications.js` / `notifications.web.js` (expo-notifications; en web, misma API sin efecto).
- `theme/` — `colors.js`, `typography.js` (`fonts`, `fontSizes`).
- `utils/` — `storage.js` (token seguro nativo/web), `confirm.js` (`confirmAction`: abre ConfirmDialog),
  `mapGame.js` (`mapCatalogGame`: juego del backend → formato de GameCard), `cacheEntry.js` (formato y vencimiento de 7 días), `avatarImage.js` (recorte cuadrado 256 px JPEG),
  `dateFormat.js` (fechas y horas sin Intl), `logger.js` (logger central), `libraryStats.js`
  (estadísticas calculadas en la app desde LibraryContext, sin endpoint).
- `shims/` — `TopicSubscriptionModule.android.js` (lo usa `metro.config.js`).

`backend/src/`
- `server.js` (aplica migraciones y escucha en `PORT`), `app.js` (cors, json, `/health`, rutas,
  errores), `migrate.js` (runner de migraciones; `npm run migrate`).
- `config/db.js` — pool mysql2/promise: `DATABASE_URL`/`MYSQL_URL` o variables sueltas
  (`DB_HOST`, `DB_PORT`, `MYSQL_*`), `DB_SSL` opcional; exporta `getConnectionOptions`.
- `controllers/` — `auth.controller.js`, `library.controller.js`, `reviews.controller.js`,
  `catalog.controller.js` (catálogo, juego al azar y detalle de IGDB),
  `descriptions.controller.js` (sinopsis: caché → IGDB → DeepL), `oauth.controller.js` (login
  social: state firmado, lista permitida de retornos, PKCE, vincular/desvincular),
  `steam.controller.js` (Steam OpenID, sincronización por lotes, correspondencia con IGDB y reglas
  por tiempo jugado).
- `services/` — `igdb.service.js` (token de Twitch y normalización), `oauth.service.js` (Google y
  Discord: URL de autorización, canje y perfil), `steam.service.js` (OpenID y Web API de Steam) y `deepl.service.js` (APIs externas con timeout; sus errores
  llevan `status`/`code` o `reason`).
- `middleware/` — `auth.middleware.js` (`authRequired`), `error.middleware.js` (404 y errores JSON),
  `requestLogger.middleware.js` (una línea por petición, `req.id` y `X-Request-Id`).
- `routes/` — `/auth` (register, login, GET/PUT/DELETE `me`, PUT `me/password`, PUT/DELETE `me/avatar`), `/library` (GET lista,
  GET/PUT/DELETE `:gameId`) y `/games` (GET `/`, `/random` y `:gameId`: catálogo de IGDB; GET `:gameId/reviews`: reseñas de los demás usuarios;
  GET `:gameId/description`: sinopsis en español) y `/steam` (estado, conectar/desconectar,
  `callback` de OpenID y `sync` / `sync/next`).
  El usuario público incluye `avatar` (data URI o null) y `hasPassword`.
- `utils/users.js` — `signToken`, `publicUser` y `findUser` (compartidos por auth y oauth).
- `utils/oneTimeCodes.js` — códigos de un solo uso con PKCE (login social y Steam).
- `utils/validators.js` — validaciones manuales y constantes (`STATUSES`, `REVIEW_MAX_LENGTH`).
- `utils/logger.js` — `createLogger(ambito)`; nivel con `LOG_LEVEL`; oculta campos sensibles.

`assets/` — `logo.png` (login, 512 px) e iconos generados desde el logo de Figma (1000 px):
`icon.png` (fondo `#0f0f14`), `android-icon-foreground/monochrome.png` (zona segura de 640 px
en 1024) y `favicon.png`. El fondo del icono adaptativo es `backgroundColor` en `app.json`.

`database/init/` — `01-schema.sql` (users, user_games) y `02-seed.sql` (usuarios de prueba).
`backend/migrations/` — migraciones SQL numeradas (`NNN-nombre.sql`), registradas en
`schema_migrations`. El build del backend usa el contexto `./backend` (copia `src` y `migrations`).

## Decisiones vigentes

- **Token** en `expo-secure-store` (nativo) y `localStorage` (web) vía `src/utils/storage.js`:
  SecureStore no funciona en web; las funciones nunca lanzan.
- **Confirmaciones** siempre con `confirmAction` de `src/utils/confirm.js` (nunca `Alert.alert`):
  muestra `ConfirmDialog` con el estilo de la app (`destructive` → botón rojo, `icon` de Feather).
  Si `ConfirmDialogHost` no está montado usa el diálogo del sistema (`window.confirm` en web).
  En iOS resuelve al terminar de cerrarse, para poder abrir la cámara o el selector después.
- **Navegación según sesión**: `AppNavigator` renderiza un Stack u otro según `user`; no se usa
  `navigation.replace` (el cambio de sesión cambia el árbol solo).
- **Biblioteca optimista** en `LibraryContext`: aplica el cambio, llama al backend y revierte si
  falla. `PUT /library/:gameId` es upsert parcial (el primer guardado envía name/image/rating).
  Si la entrada queda vacía (sin favorito, estado, puntuación ni reseña) **el contexto** la
  borra con `DELETE` (el backend no borra en el PUT).
- **Fuentes Sora/Inter**: cada peso es una familia (`fonts.heading`, `fonts.bodySemiBold`...).
  Nunca combinar `fontWeight` con `fontFamily` (rompe la fuente en Android).
- **Caché**: primera página del catálogo (sin búsqueda) en `Paths.cache` con vencimiento de 7
  días; expo-file-system no funciona en web, por eso existe `catalogCache.web.js` (Metro elige
  el archivo por plataforma). Imágenes con `expo-image` (no usar `Image` de react-native).
- **Permisos**: siempre con `usePermission` (explicación previa con `confirmAction`, estado
  `blocked` con "Abrir ajustes"). La galería no pide permiso (selector del sistema). Nunca
  pedir ubicación. Textos de uso en los plugins de `app.json`.
- **Foto de perfil** como data URI en `users.avatar` (≤ 200 KB, firma del archivo validada en
  el backend); `express.json` acepta hasta 400 KB y los 413 responden JSON.
- **Notificaciones locales**: siempre por `services/notifications` (nunca importar
  expo-notifications en pantallas; en web no existe). Identificadores fijos: `game-<id>` (uno
  por juego) y `daily-reminder`; `data` lleva `type`, `userId` y `fireAt`. `clearSession` cancela
  todas; tocar una de otra cuenta no navega.
- **Agitar para descubrir**: acelerómetro solo con el Catálogo enfocado y la app activa
  (`useFocusEffect` + `AppState`); preferencia en AsyncStorage (activada por defecto). En web no
  hay sensor: se oculta el interruptor y queda el botón "Juego al azar" del encabezado.
- **Reseñas de la comunidad**: excluyen la del usuario actual y se ordenan por
  `review_updated_at` (solo cambia al editar el texto, no con favorito/estado).
- **Teclado**: pantallas con campos de texto usan `KeyboardAvoidingView` (`padding` en nativo) y
  desplazan el campo enfocado a la vista; `react-native-keyboard-controller` no sirve en Expo Go.
- **BD en el puerto 3307** del host (`DB_HOST_PORT`) porque hay un MySQL local en 3306.
- **Errores del backend**: siempre JSON `{ message }`; los 401 del token devuelven
  `{ message, code }` con `TOKEN_EXPIRED` o `TOKEN_INVALID`, y `apiClient` cierra la sesión.
  Los 500 responden "Error interno del servidor" (el detalle solo va al log).
- **Logging**: en la app, siempre `createLogger` de `src/utils/logger.js` (nunca `console.*`);
  fallos de red esperados en `info`, para no abrir LogBox. En el backend, `createLogger` de
  `utils/logger.js`; nunca registrar cuerpos, cabeceras, query strings, contraseñas ni tokens.
- **Errores de render**: `ErrorBoundary` global en `App.js` (envuelve también los contextos);
  "Reintentar" vuelve a montar el árbol.
- **Sinopsis traducidas**: el backend traduce con DeepL (`target_lang` `ES`) y guarda en
  `game_translations`; un acierto de caché no llama a IGDB ni a DeepL. Sin traducción (sin
  clave, cuota, error) devuelve el original con `notice` y no guarda nada. La app nunca
  muestra la sinopsis vacía por un error: usa `description` del detalle como respaldo.
- **Diseño**: colores solo desde `src/theme/colors.js` (nada de hex sueltos; `danger` para
  destructivo). `Header` suma el área segura superior (no poner `paddingTop` fijo); pantallas
  sin `Header` usan `useSafeAreaInsets`. En tablets y web el contenido lleva ancho máximo
  centrado (formularios 420, Perfil 480, detalle y listas 720) y las grillas van de 2 a 6
  columnas (`useGridColumns`). Pantallas con datos remotos: carga, vacío (`EmptyState`) y error
  con "Reintentar" (`ErrorState`); al refrescar no se reemplaza una lista ya visible.
- **Rendimiento**: componentes de listas con `React.memo` y handlers estables (`onPress`
  recibe el elemento); valores de contexto con `useMemo`.
- **Steam**: no es un método de acceso (tabla propia `steam_accounts`, no `user_identities`).
  Sincronización por lotes de 100 (`/steam/sync` + `/steam/sync/next`), ninguna petición larga.
  Correspondencia con IGDB por `external_games` y, si falta, por nombre exacto; caché en
  `steam_igdb_map`. `PUT /library` marca `status_source`/`favorite_source` = `user` y Steam ya no
  toca esos campos; un juego borrado por el usuario no se vuelve a agregar.
- **Esquema**: todo cambio de BD va **siempre por migraciones** (`backend/migrations`, archivo
  nuevo con el siguiente número; nunca editar uno ya aplicado). `database/init` solo crea la BD
  local desde cero con datos de prueba; no editarlo de forma que rompa una BD existente.
- **Login social y Steam**: OAuth/OpenID mediado por el backend, con el navegador del sistema
  (`expo-web-browser`) y regreso a la app por deep link validado contra una lista permitida
  (en Expo Go el retorno es `exp://...`; en el APK, el `scheme` propio). **En web no hay ventana
  emergente**: Google corta `window.opener` (COOP) y nunca volvía; la misma pestaña va al
  proveedor y vuelve a `/oauth`, y `completeWebRedirect` (socialAuth, llamado en `AuthContext`
  al restaurar la sesión) canjea con el secreto PKCE guardado en sessionStorage.

## Problemas conocidos

- **Cambia la IP de la PC** → actualizar `EXPO_PUBLIC_API_URL` en `.env` y reiniciar con `npx expo start -c`.
- **Firewall / red "Public" de Windows** bloquea el 3000 desde el celular → el usuario cambia la
  red a Privada o abre el puerto (el agente solo da el comando).
- **Cambios en `.env`** no se aplican sin `npx expo start -c` (Metro cachea las `EXPO_PUBLIC_*`).
- **`database/init` solo corre con el volumen vacío**; `docker compose down -v` borra los datos.
- **Expo Go en Android no soporta push remotas**: se prueban con el APK; en Expo Go solo
  funcionan las notificaciones locales.
- **"Cannot find native module 'ExpoTopicSubscriptionModule'"** en Expo Go Android: lo evita
  `metro.config.js` (sustituye ese módulo por `src/shims/TopicSubscriptionModule.android.js`).
  No borrar el shim ni el `resolveRequest`; al actualizar expo-notifications, revisar si sigue
  haciendo falta.
- "Respuesta inesperada del servidor" suele indicar un `EXPO_PUBLIC_API_URL` incorrecto.

## Reglas de trabajo para el agente

- **Ramas**: una fase del plan por rama, creada desde `develop`: `feature/<id-fase>-<nombre>` o
  `fix/<nombre>`. Integrar con `git merge --no-ff` a `develop` sin borrar la rama.
  Al terminar y verificar una fase, el agente hace `git push` de `develop` y de la rama de la
  fase. **Nunca** tocar `main`: los merges a `main`, su push y los tags los hace el usuario.
- **Commits**: Conventional Commits en español **sin tildes** (evita problemas de codificación en
  PowerShell), uno por cambio lógico.
- **Secretos**: no leer ni imprimir `.env` salvo permiso explícito; nunca commitearlo; nunca
  mostrar contraseñas, `JWT_SECRET`, claves ni tokens completos. Toda variable nueva se
  documenta en `.env.example` sin valor real.
- **Dependencias de la app**: instalar con `npx expo install <paquete>`.
- **Plataformas**: la app debe seguir funcionando en Expo Go (Android/iOS) y en web, salvo
  funciones que lo impidan técnicamente: documentarlo y degradar con elegancia (por ejemplo,
  ocultar la opción).
- **Sistema**: no detener ni modificar servicios locales de Windows ni el firewall; si hace
  falta, dar el comando al usuario sin ejecutarlo.
- **Producción**: solo se redespliega en Azure cuando el usuario dice que la versión está lista
  para `main` (ver `docs/DEPLOY.md`); las fases nuevas se prueban en local.
- **Azure**: el agente puede crear, configurar y desplegar recursos con Azure CLI, solo en
  `rg-alfamatagames` y con el plan más barato; nunca tocar otros grupos de recursos (por ejemplo
  `rg-mantenio-pradosj`, de otro proyecto). Avisar al usuario si algo requiere su intervención.
- **Externo**: creación de cuentas (Google Cloud, Discord, Steam, DeepL, Expo/EAS), claves,
  builds en EAS y publicación los hace el usuario; el agente da los pasos exactos y ayuda con
  errores.
- **Proveedores**: si el usuario cambia de plataforma o de proveedor de MySQL, adaptar la
  configuración sin romper el entorno local.
- **Verificación mínima por fase**:
  - `npx expo export --platform android --output-dir <tmp fuera del repo>` y lo mismo con
    `--platform web`; borrar la carpeta temporal después.
  - Si cambia el backend: `docker compose up -d --build` y probar con un script Node temporal
    fuera del repo, borrando los datos de prueba al final.
- **Al terminar una fase**: marcarla en `docs/PLAN.md` (y actualizar "Estado") y reportar en
  español y breve: archivos creados/modificados, verificación, pasos que debe hacer el usuario
  (si los hay), `git log --oneline --graph -15` y una lista de pruebas manuales.
- **Respuestas** al usuario en español, concretas y sin relleno.
