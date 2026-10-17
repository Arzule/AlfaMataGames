# Plan de implementación — Avances 3 y 4

Roadmap por fases. Cada fase se trabaja en su propia rama desde `develop`
(`feature/<id-fase>-<nombre>`) y se integra con `merge --no-ff`. Reglas completas en
[../AGENTS.md](../AGENTS.md).

## Estado

- Entregados: Avance 1 y Avance 2.
- **Fase actual: A3-0** (Migraciones de BD). Ninguna fase del Avance 3 iniciada.

## Decisiones abiertas

- [ ] Confirmar la rúbrica real del Avance 3 cuando el usuario la tenga y ajustar las fases.
- [ ] A3-3: decidir si se incluye la ciudad por GPS (opcional).
- [ ] A4-2: decidir si se incluyen estadísticas en Perfil (opcional).
- [ ] A4-4: proveedor de nube para backend y MySQL (lo elige el usuario).

---

## AVANCE 3 — Unidad 3: cámara, sensores, permisos, notificaciones, rendimiento, errores y logging

### [ ] A3-0 Migraciones de BD

- **Objetivo:** poder cambiar el esquema sobre una BD existente sin borrar datos.
- **Tema del sílabo:** base para las fases de la Unidad 3 (persistencia en backend).
- **Tareas:**
  - [ ] Carpeta `database/migrations/` con archivos SQL numerados (`001-...sql`).
  - [ ] Runner en el backend: script `npm run migrate` y ejecución automática al arrancar.
  - [ ] Tabla `schema_migrations` que registra cada migración aplicada (una sola vez, en orden).
  - [ ] Migración base idempotente compatible con lo creado por `database/init/`.
  - [ ] Copiar las migraciones a la imagen del backend (Dockerfile / contexto de build).
- **Terminado cuando:** sobre la BD actual (con datos) el backend arranca, aplica solo lo
  pendiente, no pierde datos, y un segundo arranque no aplica nada.

### [ ] A3-1 Pendientes de unidades previas

- **Objetivo:** cerrar huecos de Unidades 1-2.
- **Tema del sílabo:** componentes y props (PropTypes); almacenamiento local (AsyncStorage).
- **Tareas:**
  - [ ] `prop-types` en todos los componentes de `src/components/`.
  - [ ] AsyncStorage: búsquedas recientes (máx. 5, visibles al enfocar la barra de búsqueda).
  - [ ] AsyncStorage: caché de la primera página del catálogo (se muestra mientras carga o sin red).
- **Terminado cuando:** no hay warnings de PropTypes, las recientes persisten al reabrir y el
  catálogo muestra datos en caché sin conexión.

### [ ] A3-2 Permisos y foto de perfil

- **Objetivo:** foto de perfil desde cámara o galería guardada en el backend.
- **Tema del sílabo:** permisos y cámara.
- **Tareas:**
  - [ ] Hook `usePermission` (concedido, denegado, bloqueado) con botón "Abrir ajustes".
  - [ ] Tomar foto o elegir de la galería, recortar y reducir a 256 px.
  - [ ] Migración: columna `avatar` en `users`.
  - [ ] Endpoint autenticado para subir/borrar el avatar; incluirlo en `/auth/me`.
  - [ ] Mostrar el avatar en Perfil y en el Header del catálogo.
- **Terminado cuando:** la foto persiste tras cerrar sesión y volver a entrar, y los tres
  estados de permiso se manejan en Android/iOS (en web, flujo de archivo).

### [ ] A3-3 Sensor: "Agitar para descubrir"

- **Objetivo:** descubrir un juego aleatorio agitando el celular.
- **Tema del sílabo:** sensores.
- **Tareas:**
  - [ ] Acelerómetro con umbral y antirrebote.
  - [ ] Mostrar un juego aleatorio de RAWG y vibrar.
  - [ ] Interruptor en Perfil (preferencia en AsyncStorage).
  - [ ] Opcional: ciudad en Perfil con GPS y geocodificación inversa.
- **Terminado cuando:** agitar abre un juego aleatorio una sola vez por gesto, se puede
  desactivar, y en web no rompe nada.

### [ ] A3-4 Notificaciones locales

- **Objetivo:** recordatorios para jugar.
- **Tema del sílabo:** notificaciones.
- **Tareas:**
  - [ ] Botón "Recordarme jugar esto" en el detalle (elegir cuándo).
  - [ ] Recordatorio diario configurable en Perfil.
  - [ ] Tocar la notificación abre el detalle del juego.
  - [ ] Preferencias en AsyncStorage; cancelar recordatorios al cerrar sesión.
- **Terminado cuando:** las notificaciones llegan en Expo Go, abren el juego correcto y no
  quedan programadas tras el logout.

### [ ] A3-5 Errores, logging y rendimiento

- **Objetivo:** app robusta y fluida.
- **Tema del sílabo:** manejo de errores, logging y rendimiento.
- **Tareas:**
  - [ ] ErrorBoundary global con pantalla de error y reintento.
  - [ ] Aviso de sin conexión con NetInfo.
  - [ ] Logger central en la app (detallado en desarrollo, mínimo en producción).
  - [ ] Logging de peticiones en el backend.
  - [ ] `React.memo` en GameCard, ajustes de FlatList y caché de imágenes.
- **Terminado cuando:** un error de render muestra la pantalla de reintento, el aviso de red
  aparece/desaparece y el backend registra cada petición.

### [ ] A3-6 Traducción de sinopsis

- **Objetivo:** sinopsis en español.
- **Tema del sílabo:** consumo de APIs externas y caché en backend.
- **Tareas:**
  - [ ] Endpoint del backend: obtiene la descripción de RAWG y la traduce con DeepL API Free.
  - [ ] Migración: tabla de caché de traducciones.
  - [ ] `DEEPL_API_KEY` en `.env.example` y en `docker-compose.yml` (servicio backend).
  - [ ] La app muestra la traducción, con respaldo al original y etiqueta si no hay traducción.
- **Terminado cuando:** la segunda consulta de un juego sale de la caché y sin clave de DeepL
  la app sigue mostrando el texto original.

### [ ] A3-7 Documentación del Avance 3

- **Objetivo:** entregar el Avance 3.
- **Tareas:**
  - [ ] Actualizar README (funcionalidades, endpoints, modelo de datos, migraciones).
  - [ ] Tabla de cumplimiento de la rúbrica del Avance 3.
- **Terminado cuando:** README refleja el código y la tabla enlaza a cada evidencia.

---

## AVANCE 4 / FINAL — Unidad 4: builds con Expo, APK, publicación

### [ ] A4-1 Proxy de RAWG y variables EXPO_PUBLIC_*

- **Objetivo:** sacar la clave de RAWG de la app y preparar las variables para EAS.
- **Tema del sílabo:** builds con Expo (variables de entorno).
- **Tareas:**
  - [ ] Endpoints del backend para catálogo, búsqueda y detalle (proxy de RAWG).
  - [ ] Quitar `RAWG_API_KEY` de la app; `RAWG_API_KEY` pasa al backend.
  - [ ] Migrar de `react-native-dotenv` (`@env`) a `EXPO_PUBLIC_*` y quitar el plugin de babel.
- **Terminado cuando:** el bundle exportado no contiene la clave de RAWG y la app funciona
  igual en Android y web.

### [ ] A4-2 Gestión de cuenta

- **Objetivo:** control de la cuenta por el usuario.
- **Tareas:**
  - [ ] Editar nombre.
  - [ ] Cambiar contraseña (pide la actual).
  - [ ] Eliminar cuenta con confirmación y borrado en cascada.
  - [ ] Opcional: estadísticas en Perfil.
- **Terminado cuando:** las tres acciones funcionan y al eliminar no quedan filas del usuario.

### [ ] A4-3 Backend listo para producción

- **Objetivo:** endurecer el backend.
- **Tareas:**
  - [ ] `helmet`.
  - [ ] Límite de peticiones en `/auth`.
  - [ ] CORS por entorno.
  - [ ] Validación de variables de entorno al arrancar.
  - [ ] `/health` que pruebe la BD.
- **Terminado cuando:** sin variables obligatorias el backend no arranca con un mensaje claro, y
  `/health` falla si la BD no responde.

### [ ] A4-4 Guía de despliegue (docs/DEPLOY.md)

- **Objetivo:** que el usuario despliegue backend y MySQL en la nube con HTTPS.
- **Tareas:**
  - [ ] Pasos de despliegue, variables, HTTPS y aplicación de migraciones.
  - [ ] El agente **no** despliega.
- **Terminado cuando:** la guía se puede seguir de principio a fin sin pasos implícitos.

### [ ] A4-5 EAS Build

- **Objetivo:** generar el APK.
- **Tema del sílabo:** builds con Expo y APK.
- **Tareas:**
  - [ ] `app.json` de producción: nombre, icono, splash, `android.package`, versiones,
    permisos y textos de uso.
  - [ ] `eas.json` con perfiles `development`, `preview` (APK) y `production`.
  - [ ] Guía para que el usuario genere el APK y configure las variables en EAS.
- **Terminado cuando:** el usuario genera e instala el APK de `preview` y la app se conecta al
  backend desplegado.

### [ ] A4-6 Entrega final

- **Objetivo:** cierre del proyecto.
- **Tema del sílabo:** publicación.
- **Tareas:**
  - [ ] README definitivo.
  - [ ] Política de privacidad (`docs/PRIVACY.md`).
  - [ ] Guía del proceso de publicación en Play Store y App Store.
  - [ ] `CHANGELOG.md`.
- **Terminado cuando:** documentación completa y coherente con el código entregado.
