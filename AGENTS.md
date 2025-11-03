# Repository Guidelines

## Project Structure & Module Organization
SiNaik runs on Vite + React + TypeScript (`src/main.tsx` → `src/App.tsx`; routes in `src/app/routes.ts`). Key folders:
- `src/pages` – feature screens
- `src/components` – reusable UI
- `src/lib` / `src/utils` – domain helpers, formatters
- `src/integrations` – Supabase, Gemini, API clients
- `src/hooks` – custom hooks
- `src/tests` – Vitest specs. Assets live in `public/`, Supabase code in `supabase/`, builds in `dist/`.

## Build, Test, and Development Commands
- `npm run dev`: Vite dev server with hot reload.
- `npm run build`: optimized production bundle.
- `npm run build:dev`: development-tuned staging build.
- `npm run preview`: serve the latest build locally.
- `npm run lint`: ESLint check (append `--fix` for autofixes).
- `npm run test`: headless Vitest run.
- `npm run test:ui`: interactive Vitest workspace.

## Coding Style & Naming Conventions
Use explicit types on exports and wrap async flows in `try/catch`. Indent with two spaces and group Tailwind classes for clean diffs. Components/hooks stay `PascalCase`, helpers `camelCase`, constants `UPPER_SNAKE_CASE`. Import via the `@` alias. Run `npm run lint -- --fix` before commits; shared schemas live in `src/types`.

## Testing Guidelines
Vitest with React Testing Library is the default. Name specs `*.test.tsx` and colocate fixtures with the feature or in `src/tests` when reused. Follow `TESTING_STRATEGY.md`: 70% global coverage and 100% on financial math, UMKM classification, AI normalization, and import/export flows. Use `npm run test` in CI; `npm run test:ui` assists when debugging Supabase mocks.

## Commit & Pull Request Guidelines
Follow Conventional Commit prefixes (`feat`, `fix`, `chore`, `refactor`) seen in history. Keep subjects short and imperative (e.g., `feat: extend dashboard cashflow cards`). PRs must outline intent, note functional or schema changes, mention test coverage, and attach screenshots for UI updates. Verify lint and tests pass and link related roadmap items before requesting review.

## Security & Configuration Tips
Local builds need `VITE_PUBLIC_SUPABASE_URL` and `VITE_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. Supabase functions rely on `GEMINI_API_KEY` and `GEMINI_MODEL`; configure them via `supabase secrets set` and keep secrets out of git. After updating Supabase code, re-run migrations in `supabase/migrations` and rotate keys via the Supabase dashboard if exposure is suspected.

## Roadmap & Phase Alignment
Review `ROADMAP.md` to confirm priorities and KPIs, then rely on `PHASE1_IMPLEMENTATION.md` for file-level steps, schema updates, and tests. Phase 1 centers on transaction templates, bulk operations, PDF export, and advanced filters—link each commit to those goals and update TODOs or docs when scope shifts.
