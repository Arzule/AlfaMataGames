# Despliegue en Azure

App web y backend de producción de AlfaMataGames: **https://alfamatagames-api.chilecentral.cloudapp.azure.com**
(`GET /health` → `{ "status": "ok", "db": "ok" }`).

## Arquitectura

Una máquina virtual Linux en el grupo `rg-alfamatagames` (región Chile Central) con Docker Compose
(`deploy/docker-compose.prod.yml`):

| Servicio | Imagen | Función |
| --- | --- | --- |
| `db` | `mysql:8.0` | Base de datos (volumen `db_data`, solo red interna de Docker). |
| `backend` | build de `backend/` | API Express (`NODE_ENV=production`); aplica las migraciones al arrancar. |
| `caddy` | `caddy:2` | HTTPS automático con Let's Encrypt y proxy a `backend:3000`. Único servicio con puertos públicos (80 y 443). |

### Por qué una VM y no Container Apps + MySQL Flexible Server

La suscripción **Azure for Students** impuso estas restricciones (noviembre de 2026):

- Solo 5 regiones permitidas por política: `canadacentral`, `chilecentral`, `brazilsouth`,
  `westus`, `northcentralus`.
- **MySQL Flexible Server**: sin SKUs disponibles en 4 regiones; en `chilecentral` la creación
  falla con `InternalServerError`. PostgreSQL Flexible tampoco está disponible.
- **Container Apps**: máximo **1 entorno** por suscripción (ya lo usa otro proyecto) y el modo
  *express* no admite TCP, así que no puede alojar MySQL.
- **VM B1s**: sin capacidad en las 5 regiones. Se usó **Standard_B2ats_v2** (2 vCPU, 1 GB),
  incluida en los servicios gratuitos de 750 h/mes, con disco P6 de 64 GB y 2 GB de swap.

## Recursos

| Recurso | Nombre |
| --- | --- |
| VM | `vm-alfamatagames` (Ubuntu 22.04, usuario `azureuser`, clave SSH de la PC del autor) |
| IP pública + DNS | `vm-amg-ip-chilecentral` → `alfamatagames-api.chilecentral.cloudapp.azure.com` |
| NSG | `nsg-amg-chilecentral`: 80/443 abiertos; 22 solo desde la IP del administrador |
| Identidad | Administrada por el sistema, rol *Virtual Machine Contributor* sobre la propia VM |

## Apagado programado

El temporizador `apagado-enero.timer` (systemd) ejecuta `/usr/local/bin/apagado-enero.sh` el
**1 de enero de 2027 a las 00:00 (hora de Perú)**: pide un token con la identidad administrada y
**desasigna** la VM por la API de Azure, de modo que deja de cobrar cómputo. Ver el estado:

```bash
systemctl list-timers apagado-enero.timer
```

Para volver a encenderla: `az vm start -g rg-alfamatagames -n vm-alfamatagames` (los datos de MySQL
se conservan en el disco). Para borrarlo todo: `az group delete -n rg-alfamatagames`.

## Desplegar una nueva versión

Desde la raíz del repositorio (Git Bash), con acceso SSH:

```bash
H=azureuser@alfamatagames-api.chilecentral.cloudapp.azure.com
tar --force-local --exclude=node_modules -czf /tmp/amg.tgz backend deploy/docker-compose.prod.yml deploy/Caddyfile
scp /tmp/amg.tgz $H:/tmp/ && ssh $H 'cd ~/alfamatagames && tar -xzf /tmp/amg.tgz && cd deploy && sudo docker compose -f docker-compose.prod.yml up -d --build'
```

Las migraciones nuevas se aplican solas al arrancar el backend.

## Variables de producción

En la VM, `~/alfamatagames/deploy/.env` (permisos 600; plantilla en `deploy/.env.prod.example`):
`DOMAIN`, `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `JWT_SECRET`
(mínimo 32 caracteres), `JWT_EXPIRES_IN`, `CORS_ORIGINS`, `IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET`,
`DEEPL_API_KEY`. Las contraseñas generadas están también en el `.env` local del autor (sección
"Azure (produccion)"); nunca se commitean.

## Base de datos

Se creó limpia: las migraciones `001`–`005` crean el esquema y solo se agregó el usuario de prueba
**Demo** (`demo@alfamatagames.com`). Para consultarla:

```bash
ssh $H 'sudo docker exec -it amg-db sh -c "mysql -uroot -p\"\$MYSQL_ROOT_PASSWORD\" alfamatagames"'
```

## App apuntando a producción

En el `.env` de la app: `EXPO_PUBLIC_API_URL=https://alfamatagames-api.chilecentral.cloudapp.azure.com`
y reiniciar con `npx expo start -c`. En EAS (A4-7) se define la misma variable en el perfil de build.

## Seguridad del backend en producción

- `helmet` (cabeceras de seguridad) y sin `X-Powered-By`.
- Límite de 20 intentos cada 15 min por IP en `/auth/login` y `/auth/register` (`AUTH_RATE_LIMIT`).
- `trust proxy` = 1 salto (Caddy), para que el límite use la IP real del cliente.
- CORS restringible con `CORS_ORIGINS`; la app nativa no envía `Origin`.
- El backend no arranca si faltan variables obligatorias (mensaje con los nombres, sin valores).
- `/health` devuelve 503 si la base de datos no responde.

## Versión web de la app

La misma URL sirve la app web (export de Expo) en `/`; Caddy envía `/auth`, `/games`, `/library`
y `/health` al backend y el resto a los archivos estáticos (`deploy/web`, con `index.html` de
respaldo). Al ser el mismo dominio no hace falta CORS. Para actualizarla (con
`EXPO_PUBLIC_API_URL` apuntando a esta URL en el `.env`):

```bash
npx expo export --platform web --output-dir /tmp/amg-web
tar --force-local -czf /tmp/amg-web.tgz -C /tmp/amg-web .
scp /tmp/amg-web.tgz $H:/tmp/ && ssh $H 'cd ~/alfamatagames/deploy && mkdir -p web && find web -mindepth 1 -delete && tar -xzf /tmp/amg-web.tgz -C web'
```

No requiere reiniciar Caddy si se vacía el contenido de `web` (como arriba). **No** borrar y recrear la
carpeta: Caddy seguiría montando la carpeta borrada y respondería 404 (se arregla con
`sudo docker compose -f docker-compose.prod.yml restart caddy`).
