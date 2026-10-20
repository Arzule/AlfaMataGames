# Plan de implementación — Avances 3 y 4

Roadmap por fases. Cada fase se trabaja en su propia rama desde `develop`
(`feature/<id-fase>-<nombre>`) y se integra con `merge --no-ff`. Reglas completas en
[../AGENTS.md](../AGENTS.md). Criterios de evaluación y cobertura por fase en
[RUBRICAS.md](RUBRICAS.md).

## Estado

- Entregados: Avance 1 y Avance 2.
- Avance 3: A3-0 a A3-4 terminadas.
- **Fase actual: A3-5** (Errores, logging y rendimiento).

## Decisiones tomadas

- **Despliegue**: backend y MySQL en Railway, con HTTPS; lo hace el usuario siguiendo
  `docs/DEPLOY.md`. A4-4 a A4-6 requieren la URL pública.
- **Esquema**: siempre por migraciones (`backend/migrations` + tabla `schema_migrations`),
  compatibles con la BD local existente y con una BD nueva en Railway.
- **Conexión a BD**: variables sueltas (como hoy) o URL única (`DATABASE_URL` / `MYSQL_URL`),
  con SSL opcional (`DB_SSL`).
- **Claves externas solo en el backend**: RAWG (desde A3-6/A4-1), DeepL, Steam, OAuth.
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

- **Objetivo:** cambiar el esquema sin borrar datos, en local y en Railway.
- **Tema del sílabo:** base de persistencia para las fases de la Unidad 3.
- **Tareas:**
  - [x] `backend/migrations/` con archivos SQL numerados (`001-...sql`). Dentro de `backend/`
    para que la imagen funcione igual en Docker local y en Railway (root directory `backend`).
  - [x] Runner en el backend: `npm run migrate` y ejecución automática al arrancar; registra lo
    aplicado en `schema_migrations`; idempotente.
  - [x] Migración base compatible con lo creado por `database/init/` (BD existente) y válida
    sobre una BD vacía (Railway).
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

### [ ] A3-5 Errores, logging y rendimiento

- **Objetivo:** app robusta y fluida.
- **Tema del sílabo:** manejo de errores, logging y rendimiento.
- **Tareas:**
  - [ ] ErrorBoundary global con pantalla de error y reintento.
  - [ ] Aviso de sin conexión (NetInfo).
  - [ ] Logger central en la app: detallado en desarrollo, mínimo en producción, sin datos sensibles.
  - [ ] Logging de peticiones en el backend.
  - [ ] `React.memo` en GameCard, ajustes de FlatList y revisión de re-renders.
- **Terminado cuando:** un error de render muestra la pantalla de reintento, el aviso de red
  aparece y desaparece, y el backend registra cada petición sin tokens ni contraseñas.

### [ ] A3-6 Sinopsis traducidas

- **Objetivo:** sinopsis en español.
- **Tema del sílabo:** consumo de APIs externas y caché en el backend.
- **Tareas:**
  - [ ] Endpoint del backend: obtiene la descripción de RAWG y la traduce con DeepL API Free.
  - [ ] Migración: tabla de caché de traducciones.
  - [ ] `DEEPL_API_KEY` y `RAWG_API_KEY` en el backend (`docker-compose.yml`, `.env.example`).
  - [ ] La app muestra la traducción, con respaldo al original y etiqueta si no hay traducción.
- **Terminado cuando:** la segunda consulta de un juego sale de la caché y, sin clave de DeepL,
  la app muestra el texto original con la etiqueta.

### [ ] A3-7 Documentación del Avance 3

- **Objetivo:** entregar el Avance 3.
- **Tareas:**
  - [ ] README actualizado (funcionalidades, endpoints, modelo de datos, migraciones, variables).
  - [ ] Tabla de cumplimiento de la Unidad 3 (criterios del APF3 en `RUBRICAS.md`).
  - [ ] Pulido de UI/UX: revisar las pantallas nuevas contra el diseño de Figma y el tema
    (`src/theme/`).
  - [ ] Estados de carga, vacío y error en todas las pantallas.
  - [ ] Revisión en pantallas pequeñas y anchas (incluida la web).
- **Terminado cuando:** el README refleja el código, la tabla enlaza a cada evidencia y ninguna
  pantalla queda sin estados de carga/vacío/error ni se rompe en tamaños extremos.

---

## AVANCE 4 / FINAL — Unidad 4: builds con Expo, APK, publicación (más extras)

### [ ] A4-1 Proxy de RAWG y variables EXPO_PUBLIC_*

- **Objetivo:** sacar la clave de RAWG de la app y preparar las variables para EAS.
- **Tema del sílabo:** builds con Expo (variables de entorno).
- **Tareas:**
  - [ ] Endpoints del backend para catálogo, búsqueda y detalle (proxy de RAWG).
  - [ ] Quitar `RAWG_API_KEY` de la app.
  - [ ] Migrar de `react-native-dotenv` (`@env`) a `EXPO_PUBLIC_*` y quitar el plugin de babel.
- **Terminado cuando:** el bundle exportado no contiene la clave de RAWG y la app funciona igual
  en Android y web.

### [ ] A4-2 Backend de producción y guía de despliegue

- **Objetivo:** backend listo para Railway.
- **Tema del sílabo:** preparación para producción.
- **Tareas:**
  - [ ] `helmet`, límite de peticiones en `/auth`, CORS por entorno, `trust proxy`.
  - [ ] Validación de variables al arrancar; `/health` que pruebe la BD.
  - [ ] Imagen Docker de producción.
  - [ ] `docs/DEPLOY.md`: desplegar backend y MySQL en Railway con HTTPS, configurar variables
    y aplicar migraciones.
- **Terminado cuando:** sin variables obligatorias el backend no arranca (mensaje claro),
  `/health` falla si la BD no responde y la guía se sigue sin pasos implícitos.
- **>>> HITO DEL USUARIO:** despliegue en Railway. A4-4 a A4-6 requieren la URL pública HTTPS.

### [ ] A4-3 Gestión de cuenta y estadísticas

- **Objetivo:** control de la cuenta por el usuario.
- **Tareas:**
  - [ ] Editar nombre.
  - [ ] Cambiar contraseña (solo cuentas con contraseña; pide la actual).
  - [ ] Eliminar cuenta con confirmación y borrado en cascada.
  - [ ] Estadísticas en Perfil: juegos por estado, favoritos y puntuación media.
- **Terminado cuando:** las acciones funcionan, al eliminar no quedan filas del usuario y las
  estadísticas coinciden con la biblioteca.

### [ ] A4-4 Login con Google y Discord

- **Objetivo:** iniciar sesión con proveedores externos.
- **Tareas:**
  - [ ] Flujo OAuth en el backend; la app abre `expo-web-browser` (`openAuthSessionAsync`) y
    vuelve por deep link validado contra una lista permitida (Expo Go y APK).
  - [ ] Migración: tabla de identidades vinculadas; `password_hash` opcional.
  - [ ] Correo verificado coincidente → misma cuenta (vincular); si no → cuenta nueva.
  - [ ] Ver y desvincular cuentas en Perfil sin quitar el último método de acceso.
  - [ ] Guía para que el usuario cree las credenciales de Google Cloud y Discord.
- **Terminado cuando:** ambos proveedores funcionan en Expo Go y en el APK, la vinculación por
  correo es correcta y no se puede quedar sin método de acceso.

### [ ] A4-5 Conectar Steam

- **Objetivo:** importar la biblioteca de Steam.
- **Tareas:**
  - [ ] Verificación con Steam OpenID por el backend (mismo patrón de navegador y deep link).
  - [ ] Importar con `GetOwnedGames` (clave de Steam solo en el backend); avisar si los detalles
    de juego del perfil no son públicos.
  - [ ] Correspondencia Steam → RAWG por búsqueda de nombre con tabla de caché (migración).
  - [ ] Reglas por tiempo jugado (ver "Decisiones tomadas") y fuente de estado/favorito
    (steam o usuario, migración).
  - [ ] Re-sincronizar: agrega juegos nuevos y actualiza solo lo que sigue con fuente steam.
  - [ ] Procesar por lotes con progreso visible; informar juegos no encontrados.
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
  el backend en Railway.

### [ ] A4-7b Accesibilidad y pulido final de UI

- **Objetivo:** interfaz profesional y accesible para la entrega final.
- **Tema del sílabo:** UI/UX e innovación (accesibilidad).
- **Tareas:**
  - [ ] `accessibilityLabel` y `accessibilityRole` en botones con icono.
  - [ ] Zonas táctiles de al menos 44x44.
  - [ ] Contraste suficiente entre texto y fondo.
  - [ ] Soporte del tamaño de letra del sistema sin romper el diseño.
  - [ ] Revisión final de coherencia visual.
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
