# CareSphere: Hospital Management System

DBMS course project: one website with three role-based portals (**Admin**, **Doctor**, **Patient**) on a real **PostgreSQL** database hosted on **Supabase**.

> Developed with AI assistance (Claude). The team members reviewed, ran and tested the code and can explain their own parts. See `docs/contributions/` for each member's contribution.

## Team

| Member | GitHub | Responsibility |
|---|---|---|
| Member 1 | _(add username)_ | Authentication, app shell, **Admin portal** |
| Member 2 | _(add username)_ | **Doctor portal**, UI kit, layout |
| Member 3 | _(add username)_ | **Patient portal**, shared data API, utilities |

Exact file ownership: [`OWNERSHIP.md`](OWNERSHIP.md). Contribution summaries: [`docs/contributions/`](docs/contributions/).

## Features

| Portal | Main features |
|---|---|
| **Admin** | Dashboard with statistics and charts · patients, doctors (with activation codes), departments · appointments · prescriptions · invoices and payments · audit log · users and roles |
| **Doctor** | Dashboard · appointments (confirm, complete, cancel) · prescriptions · my patients · schedule and availability · activation with a one-time code |
| **Patient** | Registration · dashboard · doctor directory · appointment booking with free time slots · appointment history, reschedule, cancel · prescriptions · invoices · profile |

## Database concepts demonstrated (PostgreSQL)

9 normalized tables (3NF/BCNF) · primary and foreign keys · CHECK, UNIQUE and partial unique indexes · views (joins, GROUP BY, aggregates) · functions and a recursive query · transactions · triggers (validation, audit trail, automatic invoices) · **Row Level Security** policies per role · sign-up trigger linking Supabase Auth to profiles. See `docs/DATABASE_DESIGN.md` and `sql/`.

## Technology

React 19 · Vite · Tailwind CSS 4 · React Router · Recharts · Lucide icons · Supabase (PostgreSQL, Auth, RLS) · Vercel (hosting) · GitHub

## Architecture

```
src/
  main.jsx            start of the app
  app/                shell: finds modules, builds routes          (Member 1)
  core/               shared system, frozen and checked by the build
    auth/ supabase/   login, sessions, protected routes, client    (Member 1)
    ui/ layout/ hooks/ toast/                                       (Member 2)
    api/ utils/ components/                                         (Member 3, 2 files Member 2)
  modules/
    admin/            Admin portal                                  (Member 1)
    doctor/           Doctor portal                                 (Member 2)
    patient/          Patient portal                                (Member 3)
sql/                  database scripts (already run in Supabase)
scripts/              checks: core, architecture, secrets, Supabase connection
docs/                 guides, design, contributions
```

Each module is a folder with an `index.jsx` that describes it; the shell discovers it automatically (see `docs/INTEGRATION_GUIDE.md`).

## Quick start (Windows)

1. Install **Node.js 22.12 or newer** (https://nodejs.org, LTS).
2. Open the project folder in Command Prompt (GitHub Desktop → Repository → Open in Command Prompt).
3. ```
   npm install
   copy .env.example .env.local
   notepad .env.local        (paste your Supabase Project URL and PUBLISHABLE key)
   npm run verify:supabase
   npm run dev
   ```
4. Open http://localhost:5173/

More: [`docs/LOCAL_RUN_GUIDE.md`](docs/LOCAL_RUN_GUIDE.md)

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Run all portals |
| `npm run dev:admin` / `dev:doctor` / `dev:patient` | Run one portal only (for working on your part) |
| `npm run build` | Checks + production build |
| `npm run check` | Only the shared-core and architecture checks |
| `npm run verify:supabase` | Read-only check of your Supabase project |
| `npm run my-files -- member1` | List the files of one member |

## Security

- Only the Supabase **publishable** key is used in the website. Secret and `service_role` keys never appear in this repository (the build fails if they do).
- `.env.local` is ignored by Git and never uploaded.
- Access rules are enforced **in the database** with Row Level Security, not only in the website. Nobody can register as admin or change their own role.

## Guides

| Guide | For |
|---|---|
| [`docs/GIT_COLLABORATION_GUIDE.md`](docs/GIT_COLLABORATION_GUIDE.md) | GitHub Desktop workflow for the three members |
| [`docs/CONTRIBUTION_VERIFICATION_GUIDE.md`](docs/CONTRIBUTION_VERIFICATION_GUIDE.md) | How the teacher verifies commits and Contributors |
| [`docs/INTEGRATION_GUIDE.md`](docs/INTEGRATION_GUIDE.md) | How the parts fit together |
| [`docs/LOCAL_RUN_GUIDE.md`](docs/LOCAL_RUN_GUIDE.md) | Run it on your PC and live test checklist |
| [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md) | Deploy on Vercel |
| [`docs/TEST_REPORT.md`](docs/TEST_REPORT.md) | What was tested, simulated vs live |
