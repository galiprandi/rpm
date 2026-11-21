# Deploy — Docker + Cloudflare Tunnel + Infisical

Stack autocontenido para correr RPM en cualquier host con Docker, sin puertos
abiertos ni IP pública. Los secretos viven en Infisical; el repo contiene toda
la configuración necesaria.

```
Internet → Cloudflare Tunnel → cloudflared → app (Next.js standalone) → Neon
```

## Arquitectura

| Pieza | Qué hace | Dónde vive |
|---|---|---|
| `Dockerfile` | Build multi-stage, imagen standalone de Next.js | repo |
| `docker-entrypoint.sh` | Login Universal Auth → `infisical sm run` → `node server.js` | repo |
| `docker-compose.yml` | Servicios `app` + `cloudflared`, restart `unless-stopped` | repo |
| `cloudflared/config.yml` | Ingress del tunnel (hostname → `http://app:3000`) | repo |
| `cloudflared/credentials.json` | Credencial del tunnel — **se regenera desde Infisical, nunca se commitea** | host |
| `.env` | 4 vars de bootstrap de Infisical | host (lo genera `setup.sh`) |
| Secretos de la app | DB, auth, Google, Sentry, Groq, imágenes, `TUNNEL_CREDENTIALS_JSON` | Infisical |
| DB | PostgreSQL | Neon (externo, no cambia) |

## Setup en un equipo nuevo

Prerequisitos: Docker + Compose, acceso saliente a internet, y la
**Machine Identity** de Infisical (Universal Auth) del proyecto `rpm`.

```bash
git clone <repo> && cd rpm
./deploy/setup.sh
```

`setup.sh` interactivamente:
1. Pide `INFISICAL_CLIENT_ID`, `INFISICAL_CLIENT_SECRET`, `INFISICAL_PROJECT_ID`
   y ambiente (`dev` por defecto).
2. Descarga `TUNNEL_CREDENTIALS_JSON` desde Infisical → `cloudflared/credentials.json`.
3. Escribe `.env` con solo las 4 vars de bootstrap.
4. `docker compose up -d --build`.

La app queda disponible en el hostname del tunnel (`https://rpm.alitrio.com`).

## Deploy de cambios (update)

```bash
./deploy/update.sh
```

Hace `git pull` de `main` y, si cambió el HEAD, rebuild + restart de `app`.
Para auto-deploy cada 2 minutos:

```cron
*/2 * * * * /home/<user>/rpm/deploy/update.sh >> /var/log/rpm-deploy.log 2>&1
```

## Cambiar de dominio / tunnel nuevo

1. `cloudflared tunnel login` → autorizar la zone en el browser.
2. `cloudflared tunnel create <nombre>` → genera `<id>.json` en `~/.cloudflared/`.
3. `cloudflared tunnel route dns <nombre> <hostname>`.
4. Editar `cloudflared/config.yml` con el nuevo tunnel id y hostname.
5. Subir el contenido de `<id>.json` a Infisical como `TUNNEL_CREDENTIALS_JSON`.
6. `./deploy/setup.sh` de nuevo (o solo regenerar `credentials.json`).

## Google OAuth

El OAuth client (`Google Cloud Console → project rpm-accesorios-auth →
Credentials`) debe listar en **Authorized JavaScript origins** y
**Authorized redirect URIs** el dominio nuevo:

```
https://<dominio>
https://<dominio>/api/auth/callback/google
```

`BETTER_AUTH_URL` y `NEXT_PUBLIC_URL` en Infisical deben apuntar al mismo dominio.

## Migraciones de DB

El container **no** corre migraciones. Aplicar manualmente:

```bash
# desde un checkout del repo con acceso a Neon
DATABASE_URL=<neon-url> pnpm db:migrate
```

## Troubleshooting

- `docker logs rpm-app-1` — debe decir `Injecting N Infisical secrets`.
- `open /etc/cloudflared/...: permission denied` → SELinux: el mount ya usa `:z`;
  si persiste, `chcon -Rt container_file_t cloudflared/`.
- Login de Google con `redirect_uri_mismatch` → falta la URI en el OAuth client.
- El container no levanta tras reboot → `docker compose up -d` o verificar
  `restart: unless-stopped` está en ambos servicios.
