# Login con Google y Discord

Guía para crear las credenciales OAuth y probar el login social (fase A4-4).

## Cómo funciona

```
App ──POST /auth/oauth/:p/start──▶ Backend ──URL──▶ App abre el navegador (expo-web-browser)
Navegador ──▶ Google/Discord ──▶ GET /auth/oauth/:p/callback (backend)
Backend: canjea el código, resuelve la cuenta ──302──▶ deep link de la app ?code=<un solo uso>
App ──POST /auth/oauth/exchange { code, codeVerifier }──▶ Backend ──▶ { token, user }
```

- Las credenciales (`*_CLIENT_SECRET`) solo están en el backend.
- **PKCE**: la app envía el SHA-256 de un secreto al empezar y el secreto al canjear; si otra app
  captura el deep link, no puede obtener la sesión. El código de retorno dura 2 minutos y sirve
  una sola vez.
- **Lista permitida de retornos**: `alfamatagames://` (APK), `exp://.../--/oauth` (Expo Go, con
  `OAUTH_ALLOW_EXPO_GO=true`) y los prefijos web de `OAUTH_WEB_REDIRECTS`.
- **Cuentas**: identidad ya vinculada → su usuario. Si no, correo **verificado** igual al de una
  cuenta → se vincula a esa cuenta. Si no, se crea una cuenta nueva sin contraseña. Sin correo
  verificado no se crea nada.
- En Perfil → Gestionar cuenta → *Cuentas vinculadas* se vincula o desvincula cada proveedor.
  No se puede quitar el último método de acceso (contraseña o proveedor).

## URLs de callback (registrar las dos en cada proveedor)

| Entorno | Google | Discord |
| --- | --- | --- |
| Local | `http://localhost:3000/auth/oauth/google/callback` | `http://localhost:3000/auth/oauth/discord/callback` |
| Producción | `https://alfamatagames-api.chilecentral.cloudapp.azure.com/auth/oauth/google/callback` | `https://alfamatagames-api.chilecentral.cloudapp.azure.com/auth/oauth/discord/callback` |

## Google

1. Entra a https://console.cloud.google.com y crea un proyecto (por ejemplo `AlfaMataGames`).
2. **Google Auth Platform → Branding**: nombre de la app `AlfaMataGames`, tu correo de soporte y
   de contacto. En **Audience** deja el tipo *External* y el estado *Testing*, y agrega tu Gmail
   (y el de quien vaya a probar) en *Test users*. Los permisos `openid`, `email` y `profile` no
   necesitan verificación de Google.
3. **Clients → Create client** → tipo *Web application*, nombre `AlfaMataGames backend`.
   En *Authorized redirect URIs* agrega las dos URLs de Google de la tabla. *Authorized
   JavaScript origins* se deja vacío.
4. Copia el *Client ID* y el *Client secret* a `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` del
   `.env`.

## Discord

1. Entra a https://discord.com/developers/applications → **New Application** (`AlfaMataGames`).
2. **OAuth2**: copia el *Client ID*; en *Client Secret* pulsa **Reset Secret** y cópialo.
3. En **Redirects** agrega las dos URLs de Discord de la tabla y guarda.
4. Copia los valores a `DISCORD_CLIENT_ID` y `DISCORD_CLIENT_SECRET` del `.env`.

## Probar en local

1. Con las credenciales en `.env`: `docker compose up -d backend` (recrea el contenedor con las
   variables nuevas).
2. La app debe apuntar al backend local: `EXPO_PUBLIC_API_URL=http://<IP LAN>:3000` y
   `npx expo start -c`.
3. Abre la versión web en la PC (`w`, http://localhost:8081): en Login aparecen
   "Continuar con Google/Discord". El navegador abre una ventana emergente y al terminar se
   cierra sola (si el navegador bloquea las ventanas emergentes, permítelas para localhost).

**Limitación en local:** el callback local es `http://localhost:3000`, que solo existe en la PC.
Desde el celular (Expo Go) el login social se prueba contra **producción**, cuando la versión
se despliega en Azure (Google no acepta callbacks con IP privada ni sin HTTPS).

## Producción

En `~/alfamatagames/deploy/.env` de la VM (ver `deploy/.env.prod.example`): las cuatro
credenciales, `OAUTH_CALLBACK_BASE_URL` con la URL pública, `OAUTH_WEB_REDIRECTS` con
`<URL pública>/oauth` y `OAUTH_ALLOW_EXPO_GO=true` mientras se pruebe con Expo Go (pasar a
`false` cuando solo se use el APK).

## Errores frecuentes

- **`redirect_uri_mismatch` (Google) / "Invalid OAuth2 redirect_uri" (Discord)**: la URL de
  callback no está registrada exactamente igual (protocolo, puerto y ruta).
- **"Access blocked: app has not completed the Google verification process"**: tu correo no está
  en *Test users*.
- **"Tu correo en ese proveedor no está verificado"**: verifica el correo en Discord.
- **No aparecen los botones**: faltan las credenciales en el backend o no se recreó el contenedor.
