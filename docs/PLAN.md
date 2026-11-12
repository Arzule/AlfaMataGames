# Plan de implementación — Avances 3 y 4

Roadmap por fases. Cada fase se trabaja en su propia rama desde `develop`
(`feature/<id-fase>-<nombre>`) y se integra con `merge --no-ff`. Reglas completas en
[../AGENTS.md](../AGENTS.md). Criterios de evaluación y cobertura por fase en
[RUBRICAS.md](RUBRICAS.md).

## Estado

- Entregados: Avance 1 y Avance 2.
- Avance 3: A3-0 a A3-7 terminadas (pendiente: entrega por el usuario).
- Avance 4: A4-1, A4-1b, A4-2, A4-3, A4-4 y A4-5 terminadas. Backend en producción:
  https://alfamatagames-api.chilecentral.cloudapp.azure.com (ver `docs/DEPLOY.md`).
- **Fase actual: A4-6** (Push remotas). Pendiente de A4-4 y A4-5: probar login social y Steam en
  el celular cuando se despliegue en Azure (Expo Go) y en el APK (A4-7).

## Decisiones tomadas

- **Despliegue**: Azure (suscripción Azure for Students del usuario), con HTTPS. Backend en
  Azure Container Apps (imagen en GHCR, como el otro proyecto del usuario) y MySQL en Azure
  Database for MySQL Flexible Server con el plan más básico (Burstable B1ms, SSL obligatorio).
  Proyecto académico que quedará poco usado: costo mínimo (escala a 0 réplicas fuera de la
  demo). El agente crea y configura los recursos con Azure CLI en su propio grupo de recursos
  (`rg-alfamatagames`), sin tocar otros grupos; `docs/DEPLOY.md` documenta los pasos.
  A4-4 a A4-6 requieren la URL pública.
- **Esquema**: siempre por migraciones (`backend/migrations` + tabla `schema_migrations`),
  compatibles con la BD local existente y con una BD nueva en Azure.
- **Conexión a BD**: variables sueltas (como hoy) o URL única (`DATABASE_URL` / `MYSQL_URL`),
  con SSL opcional (`DB_SSL`).
- **Catálogo con IGDB** (desde A4-1b): RAWG dejó de responder (522) y se cambió a IGDB
  (Twitch, gratuito, ~4 peticiones/s). El backend normaliza los juegos; la biblioteca local
  empezó de cero (migración `005`) porque los ids de RAWG no coinciden con los de IGDB.
- **BD de Azure limpia**: se crea vacía; las migraciones crean el esquema al arrancar el backend
  y solo se agrega el usuario de prueba (sin datos de biblioteca).
- **Claves externas solo en el backend**: IGDB (desde A4-1b), DeepL, Steam, OAuth.
  La app usa `EXPO_PUBLIC_*` (desde A4-1) para que EAS inyecte las variables.
- **Caché**: primera página del catálogo en `Paths.cache` (expo-file-system) con
  vencimiento de **7 días** y limpieza al iniciar; imágenes con caché de disco (expo-image);
  botón "Borrar caché" en Perfil.
- **Permisos**: cámara y notificaciones con un hook común (`usePermission`). La galería no
  requiere permiso en SDK 57 (selector del sistema).
  **No se pide ubicación** (ninguna función la usa).
- **Avatar**: cuadrado de 256 px en JPEG comprimido, guardado en la BD (columna `avatar`);
  iniciales si no hay foto.
- **Sensor**: el acelerómetro solo está activo con el Catálogo enfocado y la app en primer plano.
- **Notificaciones**: locales en A3-4 (funcionan en Expo Go); push remotas en A4-6, que se
  prueban con el APK (Expo Go en Android no las soporta). Las locales quedan como respaldo.
- **Login social (Google y Discord)**: OAuth mediado por el backend con el navegador del sistema
  y deep link validado contra lista permitida. Si el correo verificado del proveedor coincide
  con una cuenta existente, se vincula a ella; si no, se crea una cuenta nueva. No se permite
  quitar el último método de acceso. `password_hash` pasa a ser opcional.
- **Steam**: Steam OpenID por el backend; biblioteca con `GetOwnedGames`. Reglas por tiempo
  jugado: < 120 min → Pendiente; ≥ 120 min → Jugando; > 3000 min (50 h) → además favorito.
  Se guarda la fuente (steam/usuario) de estado y favorito: la re-sincronización solo cambia
  lo que sigue con fuente steam y nunca vuelve a marcar un favorito que el usuario quitó.
- **Pruebas del APK**: preferentemente en el celular Android del usuario; distribución del APK
  por GitHub Releases. No se publica en tiendas (solo guía).
- **Prioridad si falta tiempo**: A4-7 y A4-8 primero (los exige el sílabo); A4-5 y A4-6 son los
  primeros recortables.

## Decisiones abiertas

- Ninguna por ahora. Las rúbricas del APF3 y del Proyecto Final ya están en
  [RUBRICAS.md](RUBRICAS.md).

---

## AVANCE 3 — Unidad 3: cámara, sensores, permisos, notificaciones, rendimiento, errores y logging

### [x] A3-0 Migraciones de BD

- **Objetivo:** cambiar el esquema sin borrar datos, en local y en la nube.
- **Tema del sílabo:** base de persistencia para las fases de la Unidad 3.
- **Tareas:**
  - [x] `backend/migrations/` con archivos SQL numerados (`001-...sql`). Dentro de `backend/`
    para que la imagen funcione igual en Docker local y en la nube (contexto de build `backend`).
  - [x] Runner en el backend: `npm run migrate` y ejecución automática al arrancar; registra lo
    aplicado en `schema_migrations`; idempotente.
  - [x] Migración base compatible con lo creado por `database/init/` (BD existente) y válida
    sobre una BD vacía (nube).
  - [x] Incluir las migraciones en la imagen del backend.
  - [x] `config/db.js`: variables sueltas o `DATABASE_URL` / `MYSQL_URL`, y `DB_SSL` opcional.
  - [x] Documentar en README y `.env.example`.
- **Terminado cuando:** sobre la BD local con datos se aplica solo lo pendiente sin perder
  nada, un segundo arranque no aplica nada, y una BD vacía queda con el esquema completo.

### [x] A3-1 Pendientes de unidades previas

- **Objetivo:** cerrar huecos de Unidades 1-2 y preparar el uso sin red.
- **Tema del sílabo:** componentes y props; almacenamiento local; rendimiento.
- **Tareas:**
  - [x] `prop-types` en todos los componentes de `src/components/`.
  - [x] Búsquedas recientes con AsyncStorage: máx. 5, visibles al enfocar la barra, con opción
    de borrar (una lista por usuario).
  - [x] Caché de la primera página del catálogo en `Paths.cache` (expo-file-system) con
    vencimiento de 7 días y limpieza de vencidas al iniciar; se muestra mientras carga o sin red.
    En web, AsyncStorage (expo-file-system no soporta web).
  - [x] Imágenes con caché de disco (expo-image).
  - [x] Botón "Borrar caché" en Perfil (catálogo e imágenes).
  - [x] Documentar: en Android, "Borrar caché" (Información de la app) elimina esta caché sin
    cerrar sesión; "Borrar almacenamiento" elimina todo.
- **Terminado cuando:** sin warnings de PropTypes, las recientes persisten al reabrir, el
  catálogo se ve sin red, y "Borrar caché" vacía catálogo e imágenes sin cerrar sesión.

### [x] A3-2 Permisos y foto de perfil

- **Objetivo:** foto de perfil desde cámara o galería guardada en el backend.
- **Tema del sílabo:** permisos y cámara.
- **Tareas:**
  - [x] Hook `usePermission` reutilizable (cámara ahora; notificaciones en A3-4): concedido /
    denegado / bloqueado, explicación previa y botón "Abrir ajustes" (`Linking.openSettings`).
    Sin permiso de ubicación. La galería no necesita permiso (selector del sistema).
  - [x] Tomar foto o elegir de la galería, recortar en cuadrado, reducir a 256 px (JPEG comprimido).
  - [x] Migración: columna `avatar` en `users`.
  - [x] Endpoint autenticado para subir (validando tamaño y tipo) y eliminar el avatar;
    incluirlo en la respuesta del usuario.
  - [x] Mostrar el avatar en Perfil y en el Header del catálogo; iniciales si no hay foto.
  - [x] Textos de uso de permisos en `app.json`.
- **Terminado cuando:** la foto persiste tras cerrar y abrir sesión, se puede eliminar, y los
  tres estados de permiso se manejan en Android/iOS (en web, selector de archivo). Errores
  visibles al usuario, sin cierres inesperados: permiso negado o bloqueado (con "Abrir
  ajustes"), cámara o galería canceladas, imagen inválida o fallo al subir.

### [x] A3-3 Sensor "Agitar para descubrir"

- **Objetivo:** descubrir un juego aleatorio agitando el celular.
- **Tema del sílabo:** sensores.
- **Tareas:**
  - [x] Acelerómetro (expo-sensors) con umbral y antirrebote.
  - [x] Suscripción solo con el Catálogo enfocado y la app en primer plano (`useFocusEffect` +
    `AppState`); desuscribir al salir.
  - [x] Al detectarlo: vibrar (expo-haptics), elegir un juego aleatorio de RAWG (RAWG no tiene
    endpoint aleatorio: página aleatoria + elemento aleatorio) y abrir su detalle.
  - [x] Interruptor en Perfil (preferencia en AsyncStorage).
  - [x] Extra: botón "Juego al azar" en el encabezado del Catálogo (alternativa en web).
  - [x] Pedido del usuario: reseñas de los demás usuarios en el detalle (orden cronológico, la
    más reciente primero, con "Ver más"); migración 003 con `review_updated_at`.
  - [x] Pedido del usuario: el campo de reseña queda visible sobre el teclado.
- **Terminado cuando:** un gesto abre un solo detalle, no hay lecturas fuera del Catálogo, se
  puede desactivar y en web la opción no rompe nada (oculta si no hay sensor). Errores
  visibles al usuario, sin cierres inesperados: sensor no disponible (por ejemplo en web) o
  fallo al obtener el juego aleatorio.

### [x] A3-4 Notificaciones locales

- **Objetivo:** recordatorios para jugar.
- **Tema del sílabo:** notificaciones.
- **Tareas:**
  - [x] "Recordarme jugar esto" en el detalle: en 1 hora, mañana, en una semana, o fecha y hora.
  - [x] Recordatorio diario configurable en Perfil.
  - [x] Tocar la notificación abre el detalle del juego.
  - [x] Lista de recordatorios activos con opción de cancelar (campana del Catálogo).
  - [x] Preferencias en AsyncStorage; cancelar todo al cerrar sesión.
- **Terminado cuando:** llegan en Expo Go, abren el juego correcto, se pueden cancelar y no
  queda ninguna programada tras el logout. Errores visibles al usuario, sin cierres
  inesperados: permiso de notificaciones negado o bloqueado (con "Abrir ajustes"), fecha
  pasada o fallo al programar una notificación, y plataforma sin soporte (web).

### [x] A3-5 Errores, logging y rendimiento

- **Objetivo:** app robusta y fluida.
- **Tema del sílabo:** manejo de errores, logging y rendimiento.
- **Tareas:**
  - [x] ErrorBoundary global con pantalla de error y reintento.
  - [x] Aviso de sin conexión (NetInfo).
  - [x] Logger central en la app: detallado en desarrollo, mínimo en producción, sin datos sensibles.
  - [x] Logging de peticiones en el backend.
  - [x] `React.memo` en GameCard, ajustes de FlatList y revisión de re-renders.
- **Terminado cuando:** un error de render muestra la pantalla de reintento, el aviso de red
  aparece y desaparece, y el backend registra cada petición sin tokens ni contraseñas.

### [x] A3-6 Sinopsis traducidas

- **Objetivo:** sinopsis en español.
- **Tema del sílabo:** consumo de APIs externas y caché en el backend.
- **Tareas:**
  - [x] Endpoint del backend: obtiene la descripción de RAWG y la traduce con DeepL API Free.
  - [x] Migración: tabla de caché de traducciones.
  - [x] `DEEPL_API_KEY` y `RAWG_API_KEY` en el backend (`docker-compose.yml`, `.env.example`).
  - [x] La app muestra la traducción, con respaldo al original y etiqueta si no hay traducción.
- **Terminado cuando:** la segunda consulta de un juego sale de la caché y, sin clave de DeepL,
  la app muestra el texto original con la etiqueta.

### [x] A3-7 Documentación del Avance 3

- **Objetivo:** entregar el Avance 3.
- **Tareas:**
  - [x] README actualizado (funcionalidades, endpoints, modelo de datos, migraciones, variables).
  - [x] Tabla de cumplimiento de la Unidad 3 (criterios del APF3 en `RUBRICAS.md`).
  - [x] Pulido de UI/UX: revisar las pantallas nuevas contra el diseño de Figma y el tema
    (`src/theme/`).
  - [x] Estados de carga, vacío y error en todas las pantallas.
  - [x] Revisión en pantallas pequeñas y anchas (incluida la web).
- **Terminado cuando:** el README refleja el código, la tabla enlaza a cada evidencia y ninguna
  pantalla queda sin estados de carga/vacío/error ni se rompe en tamaños extremos.

---

## AVANCE 4 / FINAL — Unidad 4: builds con Expo, APK, publicación (más extras)

### [x] A4-1 Proxy de RAWG y variables EXPO_PUBLIC_*

- **Objetivo:** sacar la clave de RAWG de la app y preparar las variables para EAS.
- **Tema del sílabo:** builds con Expo (variables de entorno).
- **Tareas:**
  - [x] Endpoints del backend para catálogo, búsqueda, detalle y juego al azar (proxy de RAWG).
  - [x] Quitar `RAWG_API_KEY` de la app.
  - [x] Migrar de `react-native-dotenv` (`@env`) a `EXPO_PUBLIC_*` y quitar el plugin de babel.
- **Terminado cuando:** el bundle exportado no contiene la clave de RAWG y la app funciona igual
  en Android y web.

### [x] A4-1b Catálogo con IGDB

- **Objetivo:** reemplazar RAWG (caído) por IGDB sin cambiar el comportamiento de la app.
- **Tareas:**
  - [x] `igdb.service.js`: token de Twitch en memoria (renovación antes de vencer y reintento
    ante 401), catálogo de los más votados, búsqueda, juego al azar, detalle y sinopsis.
  - [x] El backend devuelve juegos normalizados (`image`, `heroImage`, `rating` 0-5,
    `developer`, `platforms`, `description`); la app los usa sin conocer IGDB.
  - [x] `IGDB_CLIENT_ID`/`IGDB_CLIENT_SECRET` en `docker-compose.yml` y `.env.example`;
    se quita `RAWG_API_KEY`.
  - [x] Migración `005`: biblioteca y caché de sinopsis desde cero (ids de RAWG).
  - [x] Caché del catálogo de la app con nombre nuevo (ignora la de ids de RAWG).
- **Terminado cuando:** catálogo, búsqueda, azar, detalle y sinopsis responden con IGDB y el
  bundle no contiene credenciales.

### [x] A4-2 Backend de producción y guía de despliegue

- **Objetivo:** backend listo para producción y desplegado en Azure.
- **Tema del sílabo:** preparación para producción.
- **Tareas:**
  - [x] `helmet`, límite de peticiones en `/auth`, CORS por entorno, `trust proxy`.
  - [x] Validación de variables al arrancar; `/health` que pruebe la BD.
  - [x] Imagen Docker de producción.
  - [x] `docs/DEPLOY.md`: Azure for Students no permitió MySQL Flexible ni un segundo entorno de
    Container Apps; se usó una VM B2ats_v2 (gratuita 750 h/mes) con Docker Compose: MySQL,
    backend y Caddy (HTTPS con Let's Encrypt). Apagado programado el 1 de enero de 2027.
  - [x] BD de Azure limpia: esquema por migraciones y solo el usuario de prueba Demo.
  - [x] Crear los recursos y desplegar con Azure CLI (lo hace el agente) y probar `/health`
    y el login contra la URL pública.
- **Terminado cuando:** sin variables obligatorias el backend no arranca (mensaje claro),
  `/health` falla si la BD no responde y la guía se sigue sin pasos implícitos.
- **>>> HITO:** backend desplegado en Azure con URL pública HTTPS (A4-4 a A4-6 la requieren).
  El usuario solo interviene si hace falta un inicio de sesión o una aprobación de costos.

### [x] A4-3 Gestión de cuenta y estadísticas

- **Objetivo:** control de la cuenta por el usuario.
- **Tareas:**
  - [x] Editar nombre.
  - [x] Cambiar contraseña (solo cuentas con contraseña; pide la actual).
  - [x] Eliminar cuenta con confirmación y borrado en cascada.
  - [x] Estadísticas en Perfil: juegos por estado, favoritos y puntuación media.
- **Notas:** pantalla `Account` (desde Perfil → "Gestionar cuenta"). Cambiar contraseña y
  eliminar cuenta piden la contraseña actual y usan el mismo límite de intentos que el login; la
  contraseña incorrecta responde 400 (no 401, para no cerrar la sesión). El usuario público trae
  `hasPassword` (preparado para las cuentas sociales de A4-4). Las estadísticas se calculan en la
  app desde `LibraryContext` (sin endpoint), así siempre coinciden con la biblioteca.
- **Terminado cuando:** las acciones funcionan, al eliminar no quedan filas del usuario y las
  estadísticas coinciden con la biblioteca.

### [x] A4-4 Login con Google y Discord

- **Objetivo:** iniciar sesión con proveedores externos.
- **Tareas:**
  - [x] Flujo OAuth en el backend; la app abre `expo-web-browser` (`openAuthSessionAsync`) y
    vuelve por deep link validado contra una lista permitida (Expo Go y APK).
  - [x] Migración: tabla de identidades vinculadas; `password_hash` opcional.
  - [x] Correo verificado coincidente → misma cuenta (vincular); si no → cuenta nueva.
  - [x] Ver y desvincular cuentas en Perfil sin quitar el último método de acceso.
  - [x] Guía para que el usuario cree las credenciales de Google Cloud y Discord (`docs/OAUTH.md`).
  - [x] Prueba real con las credenciales del usuario en web local (Google y Discord OK).
  - [ ] Prueba en el celular: al desplegar en Azure (Expo Go) y con el APK (A4-7).
- **Notas:** PKCE entre app y backend (el deep link solo lleva un código de un solo uso de 2 min).
  Probado con proveedor simulado (30 casos). Desde el celular solo se puede probar contra
  producción: el callback local es `localhost`.
- **Terminado cuando:** ambos proveedores funcionan en Expo Go y en el APK, la vinculación por
  correo es correcta y no se puede quedar sin método de acceso.

### [x] A4-5 Conectar Steam

- **Objetivo:** importar la biblioteca de Steam.
- **Tareas:**
  - [x] Verificación con Steam OpenID por el backend (mismo patrón de navegador y deep link).
  - [x] Importar con `GetOwnedGames` (clave de Steam solo en el backend); avisar si los detalles
    de juego del perfil no son públicos.
  - [x] Correspondencia Steam → IGDB con `external_games` (appid de Steam) y, si falta, por
    nombre, con tabla de caché (migración).
  - [x] Reglas por tiempo jugado (ver "Decisiones tomadas") y fuente de estado/favorito
    (steam o usuario, migración).
  - [x] Re-sincronizar: agrega juegos nuevos y actualiza solo lo que sigue con fuente steam.
  - [x] Procesar por lotes con progreso visible; informar juegos no encontrados.
  - [x] Prueba real con la cuenta de Steam del usuario en web local (conectar e importar OK).
  - [ ] Prueba en el celular: al desplegar en Azure (Expo Go) y con el APK (A4-7).
- **Notas:** Steam no es método de acceso (tabla `steam_accounts`). Vinculación con PKCE como el
  login social. Lotes de 100 juegos (`/steam/sync` + `/steam/sync/next`, ~3 consultas a IGDB por
  lote). Correspondencia por nombre exacto (sin ™/®) cuando falta `external_games`. Un juego que
  el usuario borra no se vuelve a agregar (`user_steam_games`). Probado con Steam simulado e IGDB
  real (36 casos). En web el login social y Steam van en la misma pestaña (sin ventana emergente:
  Google corta `window.opener`).
- **Terminado cuando:** una importación completa respeta las reglas, una re-sincronización no
  pisa cambios manuales y ninguna petición excede el tiempo de espera del hosting.

### [ ] A4-6 Push remotas para recordatorios

- **Objetivo:** recordatorios enviados desde el servidor.
- **Tareas:**
  - [ ] Registrar el token de Expo Push del dispositivo.
  - [ ] Recordatorios guardados en el servidor (migración).
  - [ ] Envío con Expo Push Service por un endpoint protegido que invoca un cron externo.
  - [ ] Recordatorios locales como respaldo en Expo Go.
  - [ ] Guía para configurar las credenciales FCM en EAS.
- **Terminado cuando:** en el APK llega una push programada desde el servidor y en Expo Go
  siguen funcionando las locales.

### [ ] A4-7 EAS Build y pruebas del APK

- **Objetivo:** generar y probar el APK.
- **Tema del sílabo:** builds con Expo y APK.
- **Tareas:**
  - [ ] `app.json` de producción: nombre, icono, splash, `android.package`, `scheme` para deep
    links, versiones, permisos y textos de uso.
  - [ ] `eas.json` con perfiles `development`, `preview` (APK) y `production`; variables en EAS.
  - [ ] `docs/APK.md`: generar el APK y probarlo, de más ligera a más pesada:
    1) celular Android del usuario (recomendada; las push funcionan de verdad);
    2) emulador solo con herramientas de línea de comandos del SDK (`sdkmanager`, `avdmanager`,
    `emulator`) e imagen "Google Play" (necesaria para push);
    3) Android Studio completo.
    Incluir requisitos (virtualización activada) e instalación con `adb`.
  - [ ] Distribución del APK (GitHub Releases).
- **Terminado cuando:** el usuario genera e instala el APK de `preview` y la app funciona contra
  el backend en Azure.

### [ ] A4-7b Accesibilidad y pulido final de UI

- **Objetivo:** interfaz profesional y accesible para la entrega final.
- **Tema del sílabo:** UI/UX e innovación (accesibilidad).
- **Tareas:**
  - [ ] `accessibilityLabel` y `accessibilityRole` en botones con icono.
  - [ ] Zonas táctiles de al menos 44x44.
  - [ ] Contraste suficiente entre texto y fondo.
  - [ ] Soporte del tamaño de letra del sistema sin romper el diseño.
  - [ ] Revisión final de coherencia visual.
  - [ ] **Fix (solo web):** el banner (`heroImage`) del detalle del juego se ve muy angosto en
    pantallas anchas. Propuesta: en web con ancho grande, mostrarlo como banner lateral (imagen a
    un lado y la información al otro) para aprovechar el monitor; en móvil queda igual.
- **Terminado cuando:** todos los botones con icono se anuncian con lector de pantalla, ninguna
  zona táctil es menor de 44x44, y con letra grande del sistema no se corta ni solapa texto.

### [ ] A4-8 Entrega final

- **Objetivo:** cierre del proyecto.
- **Tema del sílabo:** publicación.
- **Tareas:**
  - [ ] README definitivo.
  - [ ] Política de privacidad (`docs/PRIVACY.md`).
  - [ ] Guía del proceso de publicación en Google Play y App Store (sin publicar).
  - [ ] `CHANGELOG.md`.
- **Terminado cuando:** documentación completa y coherente con el código entregado.
