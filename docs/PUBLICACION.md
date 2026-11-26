# Guía de publicación en Google Play y App Store

Proceso para publicar AlfaMataGames en las tiendas. **En este proyecto no se publica** (es
académico y el servidor se apaga el 1/1/2027); la guía documenta los pasos y qué falta en cada
tienda. Para generar el APK de prueba ver [APK.md](APK.md).

## 0. Lo que ya está listo en el repo

| Requisito | Dónde |
| --- | --- |
| Identificador único `com.alfamatagames.app` (Android e iOS) | `app.json` (`android.package`, `ios.bundleIdentifier`) |
| Nombre, icono, icono adaptativo/monocromo, splash, tema oscuro | `app.json`, `assets/` |
| Versión visible `1.0.0`; número de compilación llevado por EAS y autoincrementado en `production` | `app.json` (`version`), `eas.json` (`appVersionSource: remote`, `autoIncrement`) |
| Perfil `production` (AAB para Google Play) y `submit.production` | `eas.json` |
| Textos de uso de cámara, fotos y ubicación; `RECORD_AUDIO` bloqueado | plugins de `app.json` |
| Backend de producción con HTTPS | [DEPLOY.md](DEPLOY.md) |
| Política de privacidad | [PRIVACY.md](PRIVACY.md) (hay que publicarla en una URL pública, ver 1.3) |
| Credenciales FCM para push en Android | EAS (ver [APK.md](APK.md#push-remotas-fcm)) |

## 1. Preparación común

1. **Versión**: subir `version` en `app.json` en cada publicación (`1.0.0` → `1.0.1`…). El
   `versionCode`/`buildNumber` lo incrementa EAS.
2. **Variables de EAS** en el entorno `production`: `EXPO_PUBLIC_API_URL` (ya creada junto con
   `preview`, ver [APK.md](APK.md#1-requisitos-una-sola-vez)).
3. **Política de privacidad en una URL pública**: las tiendas piden un enlace, no un archivo. La
   forma más simple es el enlace de GitHub al archivo
   (`https://github.com/Arzule/AlfaMataGames/blob/main/docs/PRIVACY.md`, con el repo público) o
   GitHub Pages. Completar ahí el correo de contacto.
4. **Material gráfico**: icono de 512x512 (`assets/icon.png` reducido), capturas de pantalla del
   celular (mínimo 2; las de `docs/screenshots/`) y, para Google Play, un gráfico destacado de
   1024x500.
5. **Cuenta de prueba para la revisión**: ambas tiendas revisan la app y necesitan entrar. Dar
   `demo@alfamatagames.com` / su contraseña en las notas para el revisor.
6. Probar el build de producción contra el backend de Azure con la lista de [APK.md](APK.md#lista-de-pruebas-en-el-apk).

## 2. Google Play

### 2.1 Cuenta

- Crear una cuenta de desarrollador en https://play.google.com/console (pago único de 25 USD,
  verificación de identidad).
- Las **cuentas personales nuevas** deben hacer una **prueba cerrada con al menos 12 testers
  durante 14 días** antes de poder publicar en producción.

### 2.2 Compilar el AAB

```powershell
npx eas-cli@latest build --platform android --profile production
```

Genera un `.aab` firmado con el keystore que EAS ya guarda (el mismo del APK). Al subirlo, Google
Play activa **Play App Signing**: Google firma lo que se distribuye y el keystore de EAS queda como
clave de subida.

### 2.3 Crear la app en Play Console

1. *Crear app*: nombre "AlfaMataGames", idioma español, aplicación, gratuita.
2. **Contenido de la app** (Política → Contenido de la app):
   - **Política de privacidad**: la URL del paso 1.3.
   - **Acceso a la app**: "todas o algunas funciones están restringidas" → cuenta demo.
   - **Anuncios**: no contiene anuncios.
   - **Clasificación de contenido**: cuestionario IARC (categoría "Referencia/Utilidad"; tiene
     contenido generado por usuarios: reseñas).
   - **Público objetivo**: mayores de 13 años.
   - **Seguridad de los datos**: declarar lo de [PRIVACY.md](PRIVACY.md#1-datos-que-se-recogen):
     se recogen nombre, correo, fotos, ubicación aproximada, contenido del usuario (reseñas) e
     identificadores del dispositivo (token push); todos para la funcionalidad de la app y la
     gestión de la cuenta; cifrados en tránsito; el usuario puede pedir la eliminación; no se
     comparten con fines publicitarios.
   - **Eliminación de la cuenta**: Google exige también una **URL web** para pedir el borrado.
     Sirve la versión web (Perfil → Gestionar cuenta → Eliminar cuenta en
     https://alfamatagames-api.chilecentral.cloudapp.azure.com) o la sección 5 de la política.
   - **Permisos sensibles**: la ubicación es solo en primer plano; no requiere declaración extra.
3. **Ficha de Play Store**: descripción corta (80 caracteres) y completa, icono, gráfico
   destacado y capturas.

### 2.4 Subir y publicar

1. Pruebas → **Prueba cerrada** → crear versión → subir el `.aab` (o automatizar con
   `npx eas-cli@latest submit --platform android --profile production`, que necesita una cuenta de
   servicio de Google Play con permisos de publicación).
2. Agregar los testers (lista de correos), esperar los 14 días con 12 testers activos.
3. Solicitar acceso a **Producción**, crear la versión con el mismo `.aab` (o uno nuevo) y enviarla
   a revisión (de horas a varios días).

## 3. App Store (iOS)

### 3.1 Requisitos

- **Apple Developer Program** (99 USD al año) en https://developer.apple.com.
- No hace falta una Mac: EAS compila en la nube y gestiona certificados y perfiles.

### 3.2 Cambios pendientes en el proyecto para iOS

- **Push en iOS**: hace falta una clave APNs (EAS la crea con `npx eas-cli@latest credentials -p ios`).
  El backend no cambia: Expo Push envía a APNs igual que a FCM.
- **Iniciar sesión con Apple**: la guía 4.8 de Apple exige ofrecerlo si la app tiene login con
  Google o Discord. Opciones: agregar "Sign in with Apple" (`expo-apple-authentication` y un
  proveedor más en el backend) o, para iOS, ocultar el login social y dejar solo correo.
- **Textos de permisos**: ya están en `app.json` (cámara, fotos y ubicación); iOS los muestra en
  el diálogo del sistema.
- **Cifrado**: la app solo usa HTTPS estándar; declarar `ITSAppUsesNonExemptEncryption = false`
  (`ios.infoPlist` en `app.json`) para evitar la pregunta en cada envío.

### 3.3 Compilar y enviar

```powershell
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios --profile production
```

El primer `build` pide iniciar sesión con la cuenta de Apple y crea certificados y el perfil de
distribución. `submit` sube el `.ipa` a App Store Connect (crea la app si no existe).

### 3.4 App Store Connect

1. **TestFlight**: el build aparece tras procesarse; probar con testers internos.
2. **Ficha**: nombre, subtítulo, descripción, palabras clave, capturas (iPhone de 6,7" y 6,5";
   iPad si se mantiene `supportsTablet`), categoría "Entretenimiento" o "Referencia".
3. **Privacidad de la app** (etiquetas de privacidad): los mismos datos que en Google Play,
   "vinculados al usuario", "no usados para rastreo".
4. **URL de la política de privacidad** y **URL de soporte** (el repositorio).
5. **Información para la revisión**: cuenta demo y una nota sobre "agitar para descubrir".
6. **Eliminación de cuenta dentro de la app**: requisito de Apple; ya existe en Gestionar cuenta.
7. Enviar a revisión (normalmente 1-2 días).

## 4. Después de publicar

- Actualizaciones: subir `version`, compilar con el perfil `production` y enviar de nuevo.
- Cambios solo de JavaScript se podrían distribuir sin pasar por la tienda con EAS Update
  (`expo-updates`), que este proyecto no usa.
- Mantener el backend encendido y su HTTPS válido: si el servidor se apaga, la app publicada deja
  de funcionar (por eso, en este proyecto, no se publica).
