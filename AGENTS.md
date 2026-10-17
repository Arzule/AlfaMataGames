# AGENTS.md — AlfaMataGames

Contexto para agentes. Detalle completo en [README.md](README.md); plan de trabajo en
[docs/PLAN.md](docs/PLAN.md).

> **Expo HAS CHANGED.** Lee la documentación versionada exacta en
> https://docs.expo.dev/versions/v57.0.0/ antes de escribir código.

## Proyecto

AlfaMataGames: biblioteca de videojuegos (catálogo de RAWG + biblioteca personal por usuario:
favorito, estado, puntuación 0-5 y reseña). Proyecto académico del curso Desarrollo de
Aplicaciones Móviles (UTP). Avance 1 y Avance 2 entregados; en curso: Avance 3 y entrega
final (Avance 4).

## Stack

- App: Expo SDK 57 (`expo ~57.0.21`), React Native 0.86.3, React 19.2.3. **JavaScript puro**
  (plantilla blank, sin TypeScript, sin Expo Router). Entrada: `index.js` → `App.js`.
- Navegación: React Navigation 7 (`native-stack` + `bottom-tabs`). Estado: Context API.
- Variables de la app: `react-native-dotenv` (`import { API_URL, RAWG_API_KEY } from '@env'`,
  configurado en `babel.config.js`).
- Backend (`backend/`): Node 20 (`node:20-alpine`), Express 4, mysql2, jsonwebtoken, bcryptjs, cors.
- BD: MySQL 8.0. Orquestación: Docker Compose (`db`, `backend`, `adminer`).
- Datos de juegos: API de RAWG, consumida **directamente desde la app** (`src/services/rawgApi.js`).

## Cómo correrlo (Windows, PowerShell)

```powershell
docker compose up -d --build   # db -> host 3307, api -> 3000, adminer -> 8080
npx expo start -c              # Expo Go (QR) o 'w' para web
```

- `API_URL` debe ser la **IP LAN de la PC** (ej. `http://192.168.x.x:3000`), no `localhost`.
- Variables: ver `.env.example` y la tabla del README. Salud del backend: `GET /health`.

## Mapa del código

`src/`
- `components/` — UI reutilizable sin red: Header, SearchBar, CategoryButton, FormInput,
  EmptyState, ErrorState, GameCard, Rating, StatusChips.
- `context/` — `AuthContext.js` (sesión, token, login/register/logout, restaura con `/auth/me`);
  `LibraryContext.js` (biblioteca del usuario con cambios optimistas).
- `hooks/` — `useAuth`, `useLibrary` (consumen contextos), `useGames` (catálogo RAWG con
  búsqueda y paginación), `useDebounce`, `useGridColumns` (2/3/4 columnas).
- `navigation/` — `AppNavigator.js`: Stack según sesión; Tabs Catálogo/Favoritos/Perfil +
  `GameDetail`.
- `screens/` — Login, Register, GameCatalog, GameDetail, Favorites, Profile.
- `services/` — `apiClient.js` (fetch al backend, timeout 10 s, Bearer, aviso de 401),
  `authApi.js`, `libraryApi.js`, `rawgApi.js` (RAWG con `RAWG_API_KEY`).
- `theme/` — `colors.js`, `typography.js` (`fonts`, `fontSizes`).
- `utils/` — `storage.js` (token seguro nativo/web), `confirm.js` (confirmación multiplataforma),
  `mapGame.js` (RAWG → formato de GameCard).

`backend/src/`
- `server.js` (arranque, `PORT`), `app.js` (cors, json, `/health`, rutas, errores).
- `config/db.js` — pool mysql2/promise.
- `controllers/` — `auth.controller.js`, `library.controller.js`.
- `middleware/` — `auth.middleware.js` (`authRequired`), `error.middleware.js` (404 y errores JSON).
- `routes/` — `/auth` (register, login, me) y `/library` (GET lista, GET/PUT/DELETE `:gameId`).
- `utils/validators.js` — validaciones manuales y constantes (`STATUSES`, `REVIEW_MAX_LENGTH`).

`database/init/` — `01-schema.sql` (users, user_games) y `02-seed.sql` (usuarios de prueba).

## Decisiones vigentes

- **Token** en `expo-secure-store` (nativo) y `localStorage` (web) vía `src/utils/storage.js`:
  SecureStore no funciona en web; las funciones nunca lanzan.
- **Confirmaciones** con `src/utils/confirm.js` (`confirmAction`): `Alert.alert` con botones no
  funciona en react-native-web, ahí se usa `window.confirm`.
- **Navegación según sesión**: `AppNavigator` renderiza un Stack u otro según `user`; no se usa
  `navigation.replace` (el cambio de sesión cambia el árbol solo).
- **Biblioteca optimista** en `LibraryContext`: aplica el cambio, llama al backend y revierte si
  falla. `PUT /library/:gameId` es upsert parcial (el primer guardado envía name/image/rating).
  Si la entrada queda vacía (sin favorito, estado, puntuación ni reseña) el contexto la borra
  con `DELETE`.
- **Fuentes Sora/Inter**: cada peso es una familia (`fonts.heading`, `fonts.bodySemiBold`...).
  Nunca combinar `fontWeight` con `fontFamily` (rompe la fuente en Android).
- **BD en el puerto 3307** del host (`DB_HOST_PORT`) porque hay un MySQL local en 3306.
- **Errores del backend**: siempre JSON `{ message }`; los 401 del token devuelven
  `{ message, code }` con `TOKEN_EXPIRED` o `TOKEN_INVALID`, y `apiClient` cierra la sesión.

## Problemas conocidos

- **Cambia la IP de la PC** → actualizar `API_URL` en `.env` y reiniciar con `npx expo start -c`.
- **Firewall / red "Public" de Windows** bloquea el 3000 desde el celular → el usuario cambia la
  red a Privada o abre el puerto (el agente solo da el comando).
- **Cambios en `.env`** no se aplican sin `npx expo start -c` (babel cachea `@env`).
- **`database/init` solo corre con el volumen vacío**; cambios de esquema sobre una BD existente
  van por migraciones (ver fase A3-0 en `docs/PLAN.md`). `docker compose down -v` borra datos.
- "Respuesta inesperada del servidor" suele indicar un `API_URL` incorrecto.

## Reglas de trabajo para el agente

- **Ramas**: una fase del plan por rama, creada desde `develop`: `feature/<id-fase>-<nombre>` o
  `fix/<nombre>`. Integrar con `git merge --no-ff` a `develop` sin borrar la rama.
  **Nunca** `git push` ni tocar `main`: el usuario hace los push y los merges a `main`.
- **Commits**: Conventional Commits en español **sin tildes** (evita problemas de codificación en
  PowerShell), uno por cambio lógico.
- **Secretos**: no leer ni imprimir `.env` salvo permiso explícito; nunca commitearlo; nunca
  mostrar contraseñas, `JWT_SECRET`, claves ni tokens completos.
- **Dependencias de Expo**: instalar con `npx expo install <paquete>`.
- **Plataformas**: la app debe funcionar en Expo Go (Android/iOS) y en web.
- **Sistema**: no detener ni modificar servicios locales de Windows ni el firewall; si hace
  falta, dar el comando al usuario sin ejecutarlo.
- **Externo**: despliegue en la nube, cuentas externas, claves y publicación en tiendas los hace
  el usuario; el agente da los pasos y ayuda con errores.
- **Verificación mínima por fase**:
  - `npx expo export --platform android --output-dir <tmp fuera del repo>` y lo mismo con
    `--platform web`; borrar la carpeta temporal después.
  - Si cambia el backend: `docker compose up -d --build` y probar con un script Node temporal
    fuera del repo, borrando los datos de prueba al final.
- **Al terminar una fase**: marcarla en `docs/PLAN.md` y reportar en español y breve: archivos
  creados/modificados, verificación, `git log --oneline --graph -15` y pruebas manuales para
  el usuario.
- **Respuestas** al usuario en español, concretas y sin relleno.
