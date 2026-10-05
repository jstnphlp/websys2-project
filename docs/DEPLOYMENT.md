# Production deployment

This repository targets Vercel's container-image runtime with `Dockerfile.vercel`.
The Vercel account/team must have Container Images permission enabled. If that
runtime is unavailable, use the same image on a Docker host that supports PHP
containers; a static Vite deployment does not run the Laravel backend.

## Configure production

Use [.env.production.example](../.env.production.example) as the variable list for
Vercel Project Settings. Keep actual values in the hosting provider's secret
settings or an ignored `.env.production` file. The image excludes environment
files, local caches, local databases, Vite's hot-reload marker, and test evidence.

Set these values before launching:

- `APP_URL`: the exact HTTPS origin used by visitors, including the custom domain
  if one is configured. Signed confirmation and password-reset links use it.
- `APP_KEY`: generate a new key with `php artisan key:generate --show`. This only
  prints a key; it does not change the local key. Store it in the provider's
  secrets and keep it stable across releases and replicas.
- `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`: use the hosted
  Supabase connection settings. `127.0.0.1:54322` only works for local development.
  Use the transaction pooler (normally port 6543), `DB_SSLMODE=require`, and
  `DB_EMULATE_PREPARES=true` for Vercel. Select an app region near the database.
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_SCHEME`, `MAIL_USERNAME`, `MAIL_PASSWORD`,
  `MAIL_FROM_ADDRESS`: use your SMTP provider's actual settings and approved
  sender. Production registration and recovery require working email delivery.
- `TRUSTED_PROXIES=*`: appropriate when all container traffic passes through the
  Vercel proxy. For a directly accessible Docker host, configure the actual proxy
  IPs/CIDRs instead. Laravel trusts forwarded client IP, protocol, and port.

Keep `APP_ENV=production`, `APP_DEBUG=false`, `SESSION_SECURE_COOKIE=true`,
`SESSION_ENCRYPT=true`, `SESSION_DRIVER=database`, and `CACHE_LIMITER=database`.
The container writes logs to stderr and caches configuration, routes, and views
under `/tmp` when it starts, after production environment variables are supplied.
Sessions and login rate limits remain in PostgreSQL across instance restarts.

## Verify the release

The GitHub Actions workflow runs backend tests, formatting, Composer validation,
TypeScript, and the frontend build. A separate job builds the actual production
image, applies migrations to an isolated PostgreSQL database, and checks startup,
the login page, HTTPS redirects, and exclusion of development files.

Build the deployable image locally:

```bash
docker build -f Dockerfile.vercel -t community-garden:deployment .
```

## Apply migrations and launch

1. Push the prepared source to GitHub and import it into Vercel using its
   container-image runtime. Supply the production variables above. Vercel
   provides `PORT`, which the Caddy server reads automatically.
2. Apply Laravel migrations once from a trusted environment using the production
   database settings. For example, with an ignored production env file:

   ```bash
   docker run --rm --env-file .env.production community-garden:deployment \
     php artisan migrate --force --no-ansi
   ```

   Use a direct connection or session pooler for migrations when available. Do not
   run `migrate:fresh`, `db:reset`, or the development seeder on production.
3. Create the first admin through a trusted Laravel console using a real email
   address and a unique password. Development fixture accounts are not installed
   in production. Public registration creates member accounts.
4. Deploy after migration succeeds. To run the image on a conventional Docker
   host behind an HTTPS proxy:

   ```bash
   docker run -d --name community-garden --restart unless-stopped \
     -p 127.0.0.1:8080:80 --env-file .env.production community-garden:deployment
   ```

## Check the hosted application

Confirm `/up` and `/login` return HTTP 200 and static assets load from the deployed
origin. Test a real registration, inbox confirmation, login, role access, logout,
and password reset. Verify cookies are Secure and HttpOnly, redirects use HTTPS,
and invalid requests do not expose stack traces. `/up` checks application boot;
the login page additionally exercises the database session connection.

Production credentials, the public domain, hosted database connectivity, first
admin provisioning, and real SMTP delivery require the chosen hosting account.
Local image checks do not verify those external settings.
