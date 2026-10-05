# Community Garden Management System

A production-oriented foundation for a Web Systems 2 course project. The application is a single Laravel codebase: Laravel owns authentication, sessions, authorization, validation, routes, and database access; React is delivered through Inertia rather than a separate API.

## Architecture

```text
Browser → React + TypeScript + shadcn/ui → Inertia.js → Laravel/PHP
        → Eloquent ORM → Supabase PostgreSQL
```

Supabase is used as hosted PostgreSQL. Supabase Auth, Edge Functions, and direct browser database access are intentionally not used. Supabase Storage is reserved for a later backend-only upload integration.

## Requirements

- PHP 8.4 with `pdo_pgsql`, `mbstring`, `openssl`, and `intl`
- Composer 2
- Node.js 24 and npm 11
- Supabase CLI 2.105 or newer
- Docker Desktop, OrbStack, or another Docker-compatible runtime
- A Supabase project for shared/local PostgreSQL, or SQLite for automated tests only
- Git; a GitHub repository is recommended for team development and Vercel deployment

Version hints are committed in `.php-version` and `.nvmrc`.

## Installation

```bash
git clone <your-github-repository-url>
cd WebSys2-Project
composer install
npm ci
cp .env.local.example .env
php artisan key:generate
```

Start local Supabase and initialize the database:

```bash
composer db:start
composer db:reset
```

The default seeder only installs development data when `APP_ENV` is `local` or `testing`.

## Supabase PostgreSQL setup

### Local Supabase

The committed `supabase/config.toml` runs a project-scoped local stack with:

- PostgreSQL at `127.0.0.1:54322`
- Supabase Studio at `http://127.0.0.1:54323`
- API/Storage gateway at `http://127.0.0.1:54321`
- A private `community-garden-uploads` bucket reserved for the future Laravel upload workflow

Supabase Auth, Realtime, Edge Functions, Inbucket, analytics, vector services, and the local pooler are disabled because this application does not use them. The local pooler can be enabled later for explicit pooler compatibility testing, but direct PostgreSQL is faster and sufficient for daily local development.

```bash
composer db:start     # start this project's containers
composer db:status    # print local service URLs
composer db:reset     # run Laravel migrate:fresh --seed
composer db:stop      # stop this project's containers, preserving data
```

Laravel migrations and seeders remain authoritative; Supabase CLI migrations and `seed.sql` are disabled. The local CLI uses development-only default credentials and services may bind beyond loopback depending on the container runtime, so do not run this stack on an untrusted network.

### Hosted Supabase

1. Create a Supabase project and open its **Connect** panel.
2. For local migrations, use the direct connection or session pooler when IPv6/network support permits it.
3. For Vercel runtime traffic, use the transaction pooler values (commonly port `6543`) to avoid exhausting PostgreSQL connections during scaling.
4. Set `DB_CONNECTION=pgsql`, copy the displayed host/database/user/password, and keep `DB_SSLMODE=require`.
5. Run `php artisan migrate --seed` from a trusted development or CI environment. The container does not migrate on startup.

Laravel migrations are the schema source of truth. They enable PostgreSQL row-level security on all application tables without adding Data API policies. This blocks Supabase `anon`/`authenticated` API roles while the owner connection used by Laravel remains the backend access path. Do not create Supabase Auth users.

Foreign-key columns are explicitly indexed because PostgreSQL does not create those indexes automatically. `DB_EMULATE_PREPARES=true` is configured for transaction-pooler compatibility.

## Environment variables

Copy `.env.example`; never commit `.env` or live credentials.

| Variable | Purpose |
| --- | --- |
| `APP_URL` | Local or deployed application URL |
| `APP_KEY` | Laravel encryption key; generate with `php artisan key:generate` |
| `DB_HOST`, `DB_PORT`, `DB_DATABASE` | Supabase PostgreSQL/pooler endpoint |
| `DB_USERNAME`, `DB_PASSWORD` | Server-only PostgreSQL credentials |
| `DB_SSLMODE` | Keep `require` for Supabase |
| `DB_EMULATE_PREPARES` | Keep `true` with transaction pooling |
| `SESSION_DRIVER` | Must remain `database` outside tests |
| `SESSION_CONNECTION`, `SESSION_TABLE` | Session database connection and `sessions` table |
| `SESSION_SECURE_COOKIE` | Set `true` in HTTPS production |
| `CACHE_LIMITER` | Keep `database` so authentication rate limits persist across requests |
| `MAIL_MAILER` | `log` previews emails locally; use `smtp` for inbox delivery |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_SCHEME` | SMTP provider endpoint and transport scheme |
| `MAIL_USERNAME`, `MAIL_PASSWORD` | Server-only SMTP credentials |
| `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME` | Sender approved by the email provider |
| `SUPABASE_URL` | Reserved for future server-side Storage calls |
| `SUPABASE_STORAGE_BUCKET` | Future upload bucket name |
| `SUPABASE_SERVICE_ROLE_KEY` | Future backend-only Storage credential; never expose with `VITE_` |

Production should use `APP_ENV=production`, `APP_DEBUG=false`, `LOG_CHANNEL=stderr`, and `SESSION_SECURE_COOKIE=true`.

## Local development

Ensure local Supabase is running, then start Laravel and Vite together:

```bash
composer db:start
composer run dev
```

Keep `composer run dev` running while developing. It starts Laravel, Vite hot reload, the queue listener, and the application log stream. Running only `php artisan serve` falls back to the last production bundle in `public/build`, so frontend source changes will not update automatically.

Open `http://localhost:8000`. After changing migrations during early development, reset the local database with:

```bash
composer db:reset
```

### Development accounts

These accounts are obvious local fixtures and must not be seeded into production:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@garden.test` | `Garden123!` |
| Staff | `staff@garden.test` | `Garden123!` |
| Member | `member@garden.test` | `Garden123!` |

Populate an existing local database without resetting it:

```bash
php artisan db:seed
```

Development data includes 15 plots, 10 accounts, requests in every status, active and past assignments, eight crops, planting records, community announcements, and events in the current week for both calendar and list views. Event dates are relative to the first seed run. Rerunning the seeder adds missing sample records while preserving existing accounts and edits. Sign in as `member@garden.test` to see the sample personal assignment, planting records, and request history.

Public registration always creates a `member` account and requires email confirmation before workspace access. Local fixture accounts are marked verified by the development seeder. Admins can change member/staff roles in the Members page; creating an admin requires a trusted backend workflow.

## Email confirmation and password recovery

Registration sends a signed confirmation link that expires after one hour. Unconfirmed accounts can resend confirmation, correct their email in Settings, and log out; workspace pages and APIs require confirmation. Changing an email requires the current password and confirms the new address again.

The login page provides **Forgot password?** and **Remember me**. Reset links expire after one hour, are stored as hashes, and work once. Recovery requests return the same message for existing, unknown, and suspended accounts. Password reset revokes all existing sessions and remembered logins; changing a password in Settings preserves the current session and revokes other sessions. Administrative role/access changes also revoke the affected user's sessions.

Apply migrations to an existing database without resetting records:

```bash
php artisan migrate
php artisan db:seed # local demonstration fixtures only
```

Existing real accounts start unverified and must confirm their email. Only known local fixture accounts are automatically verified by the development seeder.

`MAIL_MAILER=log` writes rendered confirmation/reset emails to the configured Laravel log; it does not deliver to inboxes. To deliver mail, configure your provider in `.env`:

```dotenv
APP_URL=https://your-application.example
MAIL_MAILER=smtp
MAIL_SCHEME=smtp
MAIL_HOST=your-provider-host
MAIL_PORT=587
MAIL_USERNAME=your-provider-username
MAIL_PASSWORD=your-provider-password
MAIL_FROM_ADDRESS=your-approved-sender@example.com
MAIL_FROM_NAME="Community Garden"
```

Use your provider's actual scheme and port (`smtps` commonly uses 465). `APP_URL` must match the address opened in the browser, including scheme and port; email links deliberately use this configured origin. After changing environment variables, run `php artisan config:clear` and restart the app. For production, rebuild the configuration cache as part of deployment. Confirm an email and reset a password through a real inbox before presenting inbox delivery. Local `.test` fixture addresses cannot receive public email.

## Routes and authorization

- `/dashboard` — any authenticated user
- `/member/dashboard` — exact `member` role
- `/staff/dashboard` — exact `staff` role
- `/admin/dashboard` — exact `admin` role

Login redirects confirmed users to their current role dashboard and unconfirmed users to `/verify-email`. Laravel's web middleware supplies encrypted cookies, database sessions, and CSRF protection. `EnsureUserHasRole` enforces role boundaries.

### Role navigation

The application shell is shared, but workspace navigation and server-side page access are limited by role:

| Page | Member | Staff | Admin |
| --- | :---: | :---: | :---: |
| Dashboard | Yes | Yes | Yes |
| Garden plots | Browse | Manage | No |
| Crops | No | Manage | No |
| Plot requests | Own | Review | No |
| Assignments and plantings | Own | Manage assignments | No |
| Garden calendar | View | Manage | No |
| Community updates | Yes | Yes | Yes |
| Reports | No | No | Yes |
| Members | No | No | Yes |
| Help center and settings | Yes | Yes | Yes |

Members see personal labels and content for their plot requests and assignments. Hiding a navigation item does not grant or revoke access by itself; Laravel enforces the same matrix for direct URL requests.

## Database foundation

Authentication uses:

- `users` and `sessions`
- `password_reset_tokens`
- `cache` and `cache_locks` for persistent rate limits

Garden operations have separate tables for plots, requests, assignments, crops, planting records, calendar events, community updates, and notifications. Eloquent models include enum/status casts and relationships. Laravel owns access to these tables through its PostgreSQL connection.

## Frontend

Pages live in `resources/js/pages`, shared application components in `resources/js/components`, and shadcn components in `resources/js/components/ui`.

Only these shadcn/ui primitives are included: Button, Input, Label, Card, Badge, Select, Dialog, Dropdown Menu, Table, and Alert. The application shell includes a responsive sidebar, mobile dialog navigation, top header, role-aware navigation, user menu, and logout.

## Quality checks

```bash
vendor/bin/pint --test
php artisan test --compact
npm run typecheck
npm run build
composer validate --strict
```

Tests use in-memory SQLite for speed and cover registration, email verification, password recovery, session revocation, login/logout, role boundaries, operational workflows, migrations, and repeatable seed data. The same checks run in `.github/workflows/ci.yml` on pushes and pull requests. See [the submission readiness report](docs/SUBMISSION_READINESS.md) for browser checks, PostgreSQL verification, and remaining deployment setup.

## Production build

```bash
npm ci
npm run build
composer install --no-dev --classmap-authoritative
```

`Dockerfile.vercel` performs both asset and Composer builds in isolated stages and runs the result on PHP 8.4 with FrankenPHP. Logs go to stderr. Laravel's runtime-write directory is under `/tmp`; durable sessions live in PostgreSQL and future uploads must use Supabase Storage.

Use [.env.production.example](.env.production.example) for production variables and follow [the deployment guide](docs/DEPLOYMENT.md) for migrations, proxy configuration, and release checks. The image excludes local environment files, databases, cached configuration, and Vite's `public/hot` marker. Configuration, routes, and views are cached at startup using the supplied runtime environment.

Build the image locally when Docker is running:

```bash
docker build -f Dockerfile.vercel -t community-garden .
docker run --rm -p 127.0.0.1:8080:80 --env-file .env.production community-garden
```

## Vercel deployment

The root `vercel.json` uses Vercel's services configuration to deploy the application as one container service, built with the root `Dockerfile.vercel`. Container Images permission must be enabled for the Vercel account/team.

| Service | Root | Public routing |
| --- | --- | --- |
| `app` | `.` | All paths, through the final `/(.*)` rewrite |

The directories `submission/PHASE4/PROJECT` and `submission/PROJECT` are course submission snapshots of the same application, not separate runtime services. They are excluded from the container build by `.dockerignore` and are not deployed independently. Laravel serves the Inertia/React frontend and the backend together, so no service bindings are needed. Browser API requests use paths such as `/api/garden-plots`, which reach `app` through the same catch-all rewrite. No path prefix changes are needed for this routing.

If a service later calls another, add a binding on the calling service with `type: "service"`, the target's `service` name, `format: "url"`, and an `env` variable name. Read that injected URL in the calling service at request time; do not set it manually or use it in builds or middleware. To make another service public, add a specific rewrite before the catch-all and update that application's routes, asset paths, and browser URLs to agree with its public prefix.

2. Add the variables from `.env.production.example` in Vercel Project Settings, including `TRUSTED_PROXIES=*` for HTTPS forwarding. Generate a production `APP_KEY` with `php artisan key:generate --show`; never reuse or commit the local key.
3. Keep the Vercel function region close to the selected Supabase project region.
4. Run production migrations separately with `php artisan migrate --force` using the production database settings.
5. Deploy. Vercel supplies `PORT`; the included Caddy configuration listens on it (default `80`).

For local services testing, run `vercel dev` from the repository root with the Vercel CLI and a compatible container runtime installed. It runs all services together and injects any declared binding variables.

Container instances may scale to zero and must not be treated as persistent machines. Queue workers, schedulers, and file upload flows are outside this initial scaffold and need platform-appropriate designs before those features are added.

## Decisions to review

- Laravel 13 is used because it is the current scaffold compatible with the required PHP 8.4 baseline.
- Role middleware uses exact-role access: admins do not implicitly enter staff/member route groups.
- Status values are constrained to explicit PHP/database enums. Review these vocabularies before business features depend on them.
- `garden_plots.size` is a `decimal(8,2)` with no encoded unit yet; the team should choose and document a unit before plot CRUD.
- Deleting a user cascades their requests/assignments. Deleting a plot preserves requests by nulling the optional plot reference and removes assignments tied to that plot.
- Cache is process-local (`array`) and queues run synchronously for this stateless first deployment. Replace these only when a feature actually needs shared cache or background work.
- Supabase Storage variables are placeholders only; no Storage SDK or upload code is installed.
