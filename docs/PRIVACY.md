# Política de privacidad de AlfaMataGames

Última actualización: 26 de noviembre de 2026.

AlfaMataGames es una aplicación académica (curso Desarrollo de Aplicaciones Móviles, UTP) para
llevar una biblioteca personal de videojuegos. Esta política explica qué datos se recogen, para
qué se usan, con quién se comparten y cómo eliminarlos. Aplica a la app para Android (APK), a la
versión web y al backend en https://alfamatagames-api.chilecentral.cloudapp.azure.com.

**Resumen:** solo se guardan los datos necesarios para que la app funcione. No hay publicidad,
analítica ni rastreo, y ningún dato se vende ni se comparte con fines comerciales.

## 1. Datos que se recogen

| Dato | Cuándo | Para qué |
| --- | --- | --- |
| Nombre y correo electrónico | Al registrarte o al entrar con Google/Discord | Identificar tu cuenta e iniciar sesión. |
| Contraseña | Al registrarte con correo | Iniciar sesión. Se guarda solo su hash (bcrypt), nunca el texto. |
| Identidad de Google o Discord (id del proveedor y correo) | Al entrar o vincular con ese proveedor | Reconocer tu cuenta en el próximo inicio de sesión. No se guardan sus tokens. |
| Foto de perfil | Si eliges una (cámara o galería) | Mostrarla en tu Perfil y junto a tus reseñas. Se recorta a 256 px antes de subirla. |
| Ciudad y país | Si tocas "Usar mi ubicación" en Perfil | Mostrarlos en tu Perfil. **No se guardan coordenadas** (ver 3). |
| Biblioteca: favoritos, estado, puntuación y reseñas | Al usar la app | Tu biblioteca personal. Las **reseñas** y tu nombre y foto se muestran a otros usuarios en el detalle de cada juego. |
| Cuenta de Steam (SteamID, nombre público, juegos y minutos jugados) | Si conectas Steam | Importar y sincronizar tu biblioteca de Steam. |
| Token de notificaciones del dispositivo y recordatorios (juego, fecha, hora) | Si activas recordatorios en el APK | Enviarte los recordatorios. |

En el dispositivo se guardan además el token de sesión (almacenamiento seguro del sistema; en web,
`localStorage`), las búsquedas recientes, las preferencias (agitar para descubrir, recordatorio
diario) y una caché del catálogo y de las imágenes. No salen del dispositivo.

**No se recogen:** contactos, micrófono, ubicación en segundo plano, identificadores de
publicidad ni datos de pago.

## 2. Permisos del dispositivo

Cada permiso se pide solo al usar la función, con una explicación previa, y se puede negar sin
perder el resto de la app.

- **Cámara**: tomar la foto de perfil. La galería usa el selector del sistema y no pide permiso.
- **Ubicación (solo en primer plano, una vez)**: obtener tu ciudad.
- **Notificaciones**: mostrar los recordatorios.
- **Acelerómetro** (sin permiso): detectar que agitas el celular en el Catálogo; solo mientras
  esa pantalla está abierta. Los datos del sensor no se guardan ni se envían.

## 3. Servicios de terceros

| Servicio | Qué recibe | Para qué |
| --- | --- | --- |
| Microsoft Azure (Chile Central) | Todos los datos de la sección 1 | Alojamiento del backend y de la base de datos. |
| Google / Discord | Lo que les das al iniciar sesión con ellos | Autenticación (OAuth). La app solo recibe tu id, nombre y correo. |
| Steam (Valve) | Tu SteamID | Verificar tu cuenta (OpenID) y leer tus juegos (tu perfil debe ser público). |
| OpenStreetMap Nominatim | Tu posición redondeada a 2 decimales (≈ 1 km), sin datos de tu cuenta | Obtener ciudad y país. |
| Expo Push Service y Firebase Cloud Messaging (Google) | Token del dispositivo y texto del recordatorio (nombre del juego) | Entregar las notificaciones. |
| IGDB (Twitch) y DeepL | Ningún dato personal: solo búsquedas e ids de juegos | Catálogo y traducción de sinopsis. |

Cada servicio tiene su propia política de privacidad.

## 4. Seguridad

- Todo el tráfico con el backend va por **HTTPS**.
- Contraseñas con hash bcrypt; sesión con token JWT con vencimiento.
- Login social y Steam con códigos de un solo uso y PKCE; las claves de los servicios solo están en
  el servidor, nunca en la app.
- Límite de intentos en el inicio de sesión y el cambio de contraseña.
- Los registros del servidor guardan método, ruta, estado e id de usuario de cada petición, sin
  cuerpos, cabeceras, contraseñas ni tokens.

## 5. Conservación y eliminación

- Los datos se conservan mientras la cuenta exista.
- **Eliminar la cuenta** (Perfil → Gestionar cuenta → Eliminar cuenta) borra de inmediato y de
  forma definitiva tu usuario, biblioteca, reseñas, foto, ciudad, identidades vinculadas, cuenta de
  Steam, tokens de notificación y recordatorios. En el dispositivo se borran la sesión y tus datos
  locales.
- También puedes, en cualquier momento: quitar la foto o la ciudad, desvincular Google/Discord
  (si te queda otro método de acceso), desconectar Steam y cancelar recordatorios.
- Cerrar sesión desregistra el token de notificaciones del dispositivo.
- El servidor de este proyecto académico se apaga el **1 de enero de 2027**; después de esa fecha
  el servicio deja de estar disponible.

## 6. Menores de edad

La app no está dirigida a menores de 13 años y no recoge a sabiendas datos de ellos.

## 7. Cambios y contacto

Los cambios en esta política se publican en este archivo con una nueva fecha. Para consultas o
para pedir la eliminación de tus datos sin usar la app, abre un *issue* en
https://github.com/Arzule/AlfaMataGames o escribe al autor (Gerardo Carpio) al correo de contacto
indicado en la ficha de la tienda.
