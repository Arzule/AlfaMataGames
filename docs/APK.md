# APK con EAS Build

Cómo generar, instalar y distribuir el APK de AlfaMataGames (fase A4-7).

## Configuración ya incluida en el repo

- `app.json`: `android.package` / `ios.bundleIdentifier` = `com.alfamatagames.app` (no se puede
  cambiar después de publicar), `scheme` `alfamatagames` (retorno del login social y de Steam),
  tema oscuro, icono adaptativo, pantalla de inicio con el logo (`expo-splash-screen`), permisos
  con sus textos (cámara, fotos, notificaciones) y `RECORD_AUDIO` bloqueado. `extra.eas.projectId`
  y `owner` los agregó `eas init`.
- `eas.json`: perfiles `development` (cliente de desarrollo), `preview` (**APK** para instalar
  directo) y `production` (AAB para Google Play). La versión de compilación la lleva EAS
  (`appVersionSource: remote`) y `production` la incrementa sola.
- La app solo lee `EXPO_PUBLIC_API_URL`; el `.env` local **no** se sube a EAS (está en
  `.gitignore`), por eso la URL se define como variable de EAS.

## 1. Requisitos (una sola vez)

1. Cuenta en https://expo.dev y sesión en la terminal: `npx eas-cli@latest login`.
2. Proyecto vinculado: `npx eas-cli@latest init` (ya hecho).
3. Variable de la URL del backend para los perfiles que usan Azure:

   ```powershell
   npx eas-cli@latest env:set --name EXPO_PUBLIC_API_URL --value https://alfamatagames-api.chilecentral.cloudapp.azure.com --environment preview --environment production --visibility plaintext
   ```

   Comprobar: `npx eas-cli@latest env:list --environment preview`.

## 2. Antes de compilar: backend en producción

El APK usa el backend de Azure. Debe estar desplegada la versión aprobada (merge a `main`, ver
[DEPLOY.md](DEPLOY.md)) con, en el `.env` de la VM: credenciales de Google/Discord,
`STEAM_API_KEY`, `OAUTH_CALLBACK_BASE_URL` y `OAUTH_WEB_REDIRECTS` (ver
[OAUTH.md](OAUTH.md#producción)). Las URLs de callback de producción deben estar registradas en
Google y Discord. Con el APK el retorno es `alfamatagames://oauth`, que el backend siempre acepta.

## 3. Generar el APK

```powershell
npx eas-cli@latest build --platform android --profile preview
```

- La primera vez pregunta si generar el **keystore** de Android: responder **Yes** (EAS lo guarda;
  no perderlo, firma todas las versiones).
- Compila en la nube (plan gratuito, puede haber cola). Al terminar muestra un enlace y un QR.

## 4. Instalar y probar (de más ligera a más pesada)

1. **Celular Android** (recomendada; las push funcionan de verdad): abrir el enlace o el QR del
   build en el celular, descargar el `.apk` y aceptar "instalar apps de origen desconocido".
2. **Emulador sin Android Studio**: herramientas de línea de comandos del SDK (`sdkmanager`,
   `avdmanager`, `emulator`) con una imagen **Google Play** (necesaria para push). Requiere la
   virtualización activada en la BIOS. Instalar con `adb install AlfaMataGames.apk`.
3. **Android Studio** completo: Device Manager → crear un dispositivo con imagen Google Play →
   arrastrar el `.apk` al emulador.

### Lista de pruebas en el APK

- Registro, login con correo y cierre de sesión.
- Login con Google y con Discord; vincular y desvincular en Gestionar cuenta.
- Perfil → Steam: conectar, importar, volver a sincronizar.
- Catálogo, búsqueda, detalle, biblioteca, favoritos, reseñas.
- Foto de perfil con cámara y galería (permisos con explicación previa).
- Agitar para descubrir, recordatorios locales y diario.
- Modo avión: aviso sin conexión y catálogo desde caché.

## 5. Distribuir (GitHub Releases)

1. Descargar el `.apk` desde la página del build en expo.dev.
2. En GitHub: Releases → *Draft a new release* → tag `v1.0.0` (desde `main`) → adjuntar
   `AlfaMataGames-v1.0.0.apk` → notas con los cambios → *Publish*.

## Otros perfiles

- `development`: requiere `npx expo install expo-dev-client` antes de compilar; sirve para
  depurar módulos nativos que Expo Go no tiene.
- `production`: `npx eas-cli@latest build --platform android --profile production` genera un AAB
  para Google Play (no se publica en este proyecto; ver la guía de publicación de A4-8).

## Errores frecuentes

- **"Respuesta inesperada del servidor" en el APK**: falta `EXPO_PUBLIC_API_URL` en el entorno
  `preview` de EAS (paso 1.3); hay que volver a compilar después de crearla.
- **El login social no vuelve a la app**: el backend de producción no tiene las variables de
  OAuth o las URLs de callback no están registradas.
- **"App no instalada"**: había otra versión firmada con otro keystore; desinstalarla primero.

## Push remotas (FCM)

1. Proyecto de Firebase con la app Android `com.alfamatagames.app`; su `google-services.json`
   está en la raíz y en `app.json` (`android.googleServicesFile`).
2. Clave de cuenta de servicio (Firebase → Configuración → Cuentas de servicio → Generar clave)
   subida con `npx eas-cli@latest credentials -p android` → Google Service Account → FCM V1.
   Después se puede borrar el JSON local (está en `.gitignore`).
3. Cualquier cambio en estas credenciales requiere un APK nuevo.
