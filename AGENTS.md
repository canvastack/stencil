# CanvaStencil — AGENTS.md

## Monorepo Layout & Build Order

- **pnpm workspace** — packages in `packages/`, `frontend/`, `plugins/pages-engine`
- Build order matters: `npm run build:packages` → `npm run build:plugin` → `npm run build:frontend` (or `build:all` in root)
- Frontend entry: `frontend/src/main.tsx` → `App.tsx`
- Backend entry: Laravel 10 public/index.php via `artisan serve`
- Shared packages: `@canvastencil/types` (tsup build), `@canvastencil/api-client`, `@canvastencil/ui-components`, `@canvastencil/plugin-runtime`
- Plugins live at both `plugins/` (symlinked) and `frontend/src/plugins/`, `backend/plugins/`

## Backend (Laravel 10)

- **Hexagonal Architecture**: `app/Application/` (use cases), `app/Domain/` (entities, repository interfaces), `app/Infrastructure/` (Eloquent, controllers, adapters)
- **Multi-tenant**: `tenant_id` column on tables (NOT schema switching — `switch_tenant_database` is false)
- **Auth**: Laravel Sanctum + spatie/laravel-permission RBAC
- **API route groups**: `routes/api.php` mounts `auth.php`, `platform.php` (platform.access middleware), `tenant.php` (tenant.context + tenant.scoped middleware), and inline routes for public, vendor, admin
- **Route model binding via UUID** — every public API uses UUIDs, never integer IDs
- **No mock data** — all tests use real API/database; seeders are the only data source
- **phpstan level 6** — only covers `app/Application/Vendor`, `app/Application/Quote`, `app/Domain/Vendor`, `app/Domain/Quote` and related files; other paths ignored
- **Code style**: Laravel Pint (run `./vendor/bin/pint`)
- **Composer autoload** maps `Plugins\PagesEngine\` to `../plugins/pages-engine/backend/src/`

## Frontend (React 18 + TypeScript + Vite)

- **Aliases**: `@/` → `./src/*`, `@/features/*`, `@/services/*`, `@/types/*`, `@plugins/` → `../plugins`
- **State**: React Query (TanStack), Zustand, Redux Toolkit
- **Styling**: Tailwind CSS 3.4 + shadcn-ui (Radix primitives)
- **Auth contexts** (3 types, must coexist safely):
  - `PlatformAuthContext` — `userType = 'platform'` → panel `/platform/*`
  - `TenantAuthContext` — `userType = 'tenant'` → panel `/admin/*`
  - Anonymous — no token, uses `anonymousApiClient`
  - Contexts must NOT clear each other's tokens
- **Zustand v4→v5 compat**: `@react-three/fiber` and `@react-three/drei` still use `import create from 'zustand'`. Vite config contains a transform plugin (`zustand-v5-compat`) that rewrites to named import. If adding new deps that import zustand this way, add them to the filter list in `vite.config.ts`.
- **Env vars**: `VITE_APP_DEPLOY_PLATFORM`, `VITE_APP_IS_GITHUB_PAGES`, `VITE_APP_BASE_URL`, `VITE_API_BASE_URL`, `VITE_SENTRY_DSN` (loaded in CI)
- **Build assets** copied to `frontend/dist`; product images excluded from PWA precache
- **Linting**: `npm run lint` (ESLint 9 flat config)
- **Type checking**: `npm run typecheck` (via `tsc -b` on tsconfig references)

## Testing

### Backend
- **Prerequisite**: PostgreSQL test DB `stencil_canvastack_test` must exist. Run `backend/tests/setup-test-database.bat` (Windows) or `.sh` (Linux)
- `php artisan test` — runs Unit, Integration, Feature suites
- `php artisan test --testsuite=Integration` — single suite
- `php artisan test --filter=OrderTest` — specific test
- **Baseline**: 1063 tests / 3872 assertions / ~410s. Must maintain 100% pass rate before commits.
- Config: `backend/phpunit.xml`, `.env.testing` (DB: postgres, cache: array, queue: sync, bcrypt: 4 rounds)

### Frontend
- Prefer `vitest.config.ts` over vite.config.ts test config (both exist but vitest.config.ts is standalone)
- `npm run test` (watch), `npm run test:run` (single run), `npm run test:coverage`
- `npm run e2e` — Playwright (5 browser projects), auto-starts `npm run dev`
- `npm run test:visual` — visual regression Playwright tests
- Frontend tests exclude `e2e/` dir from Vitest

### Load Testing
- `k6/` directory containing load tests
- Run: `k6 run k6/load-tests/product-catalog-load-test.js -e API_BASE_URL=... -e AUTH_TOKEN=... -e TENANT_ID=...`
- Test DB seeders in `backend/database/seeders/` (62 seeders available)

## CI/CD (GitHub Actions)

- `.github/workflows/deploy.yml` — pipeline: lint → typecheck → test:run → integration → E2E → build:prod → Docker build/push (ghcr.io) → deploy staging/production
- Branches: `main` (production), `staging` (staging)
- Docker context is `frontend/` only (both staging and prod use the same Dockerfile)
- Security scan via Trivy after build
- Lighthouse CI run on staging deploy

## Database

- PostgreSQL 15+, single DB with `tenant_id` scoping (not schema-per-tenant despite what the README diagram shows)
- All tables: `id BIGSERIAL` (internal PK) + `uuid UUID` (public identifier) + `tenant_id` (scoping)
- 153 migrations in `backend/database/migrations/` + `landlord/` and `tenant/` subdirectories
- Migrations run per-tenant via artisan
- Key config files: `config/multitenancy.php`, `config/database.php`, `config/permission.php`

## Key Constraints

1. **Zero mock data** — all features must use real DB/API; no mocks, no fallback to fake data
2. **UUID-only public IDs** — never expose integer IDs in API responses, URLs, or frontend state
3. **100% test pass rate** — baseline must be verified before and after changes
4. **Auth context isolation** — `PlatformAuthContext` and `TenantAuthContext` must never clear each other's tokens
5. **Build packages before frontend** — shared workspace packages must be built first
6. **Payment seeders** — use `php artisan db:seed --class=PaymentSimulationSeeder` for payment test data
