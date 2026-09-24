**Expense Tracker**

A minimal personal expense tracker built with Next.js (App Router), React 19, RxDB (Dexie storage) and Tailwind CSS. This repo is a local-first web app that stores transactions, categories, budgets and recurring rules in the browser and syncs with remote services where configured.

**Quick Links**
- **Repo:** N/A (local)
- **Next config:** [next.config.ts](next.config.ts)
- **DB init:** [src/lib/db/index.ts](src/lib/db/index.ts)

**Prerequisites**
- **Node.js:** 18+ recommended
- **npm** or **pnpm/yarn**

**Install**

Run in the project root:

```bash
npm install
```

**Environment**
- Copy and edit environment variables as needed into a local `.env` file. The project reads `.env` in development.
- Ensure `.env` is in `.gitignore` (the repo already excludes it in recommended setups).

**Run (development)**

```bash
npm run dev
```

This starts Next.js (Turbopack) on `http://localhost:3000` by default.

**Build & Start (production)**

```bash
npm run build
npm start
```

**Project Structure (important files)**
- **App:** `src/app` — Next.js App Router pages and layouts
- **Components:** `src/components` — UI and dashboard components
- **DB & Sync:** `src/lib/db` — RxDB collection schemas, initialization and sync logic

**RxDB dev-mode note**
- In development the app enables `RxDBDevModePlugin` for strict runtime schema validation. If you see an RxError DVM1 ("storage must use one of the schema validators"), the storage must be wrapped with a validator. See the DB init at [src/lib/db/index.ts](src/lib/db/index.ts) — the Dexie storage is wrapped with `wrappedValidateAjvStorage` in non-production builds to avoid DVM1.

**Next.js/Turbopack notes**
- If you get the message about a `webpack` config and Turbopack, an empty `turbopack: {}` option is set in [next.config.ts](next.config.ts) to silence the error. Also remove deprecated `eslint` top-level options if present.

**Common scripts**
- `npm run dev` — run dev server
- `npm run build` — build for production
- `npm start` — run built server
- `npm run lint` — run eslint

**Testing / Tools**
- The repo contains a helper `scripts/test-offline-sync.ts` for offline sync testing. Use `npm run test:offline` if needed.

**Git / Contribution**
- Before first push: add a `.gitignore` (recommended entry: `.env`, `.next/`, `node_modules/`) and run the steps in CONTRIBUTING or use the commands listed in this project.

**Resources & Links**
- RxDB docs: https://rxdb.info/
- Next.js docs: https://nextjs.org/docs


