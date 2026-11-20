# Integration Guide: how three contributions become one website

## 1. The architecture in one picture

```
                         Browser
                            |
                    src/main.jsx
                            |
                   src/app  (shell: Member 1)
        reads every folder in src/modules automatically
          /                 |                  \
 modules/admin        modules/doctor       modules/patient
  (Member 1)            (Member 2)           (Member 3)
          \                 |                  /
            src/core  (shared system, same for everybody)
   auth+supabase (M1)   ui+layout+hooks+toast (M2)   api+utils+slot picker (M3)
                            |
                 YOUR existing Supabase project
      (tables, views, functions, triggers, RLS policies, Auth)
```

- **One database, one login system.** Every portal uses the same Supabase project and the same Supabase Auth.
- **Security lives in the database.** Row Level Security and database functions decide what each role may see or do, even if somebody calls the API directly.

## 2. The module "plug" (the contract)

Each module folder has an `index.jsx` that *describes* the module. The shell finds `src/modules/*/index.jsx` automatically and builds routes, menus and public pages from it.

```js
export default {
  id: 'doctor',            // same as the folder name
  role: 'doctor',          // database role
  home: '/doctor',         // first address of the portal
  requires: 'doctor',      // the linked database record that must exist (or null)
  nav: [ { to, label, icon, end? } ],              // sidebar menu
  routes: [ { index: true, element: <Dashboard /> }, { path: 'appointments', element: <… /> } ],
  publicRoutes: [ { path: '/activate', element: <Activate />, link: { text, label } } ],   // optional
};
```

Because modules are discovered, **combining them needs no code changes**: copy the folders and the website has all three portals.

## 3. Import rules (checked by `npm run build`)

| Rule | Meaning |
|---|---|
| 1 | A module imports only **itself** and `src/core` (written `@/core/...`). Never another module, never `src/app`. |
| 2 | `src/core` never imports a module or `src/app`. |
| 3 | No circular imports anywhere. |
| 4 | Every module has `index.jsx` with `id`, `role`, `home`, `nav`, `routes`. |
| 5 | No secret keys in the code; `.gitignore` lists `.env` and `.env.local`. |

Plus the **frozen core** check: `src/core` and `src/app` must match `core.manifest.json` (a fingerprint of each file, independent of Windows/Linux line endings).

## 4. How the work was split

| Piece | Where | Owner |
|---|---|---|
| Admin portal | `src/modules/admin` | Member 1 |
| Doctor portal + doctor activation page | `src/modules/doctor` | Member 2 |
| Patient portal + patient registration page | `src/modules/patient` | Member 3 |
| Shell, routing, login, sessions, protected routes, Supabase client | `src/app`, `src/core/auth`, `src/core/supabase` | Member 1 |
| UI kit, layout, hooks, toast messages, patient-details and invoice windows | `src/core/ui`, `layout`, `hooks`, `toast`, 2 files in `components` | Member 2 |
| Shared data API, slot picker, reschedule window, formatting/validation/error helpers | `src/core/api`, `utils`, 2 files in `components` | Member 3 |
| Config, scripts, SQL, guides | root, `scripts`, `sql`, `docs` | Repository owner |

Full list: `OWNERSHIP.md`.

**Where two roles need the same screen**, the shared piece is in the core: for example the free-slot picker, the printable invoice, and the patient-details window. **Each role keeps its own page** (for example *admin/Appointments*, *doctor/Appointments*, *patient/MyAppointments*) so each member has a clear, separate contribution.

## 5. How the contributions are combined

You do **not** run a separate "merge" step. Everything happens in the single repository:

1. **Round 1:** the repository owner commits `Step1-Repo-Starter.zip` (configuration, scripts, SQL, guides).
2. **Round 2:** each member commits their own file set (`Step2-MemberN-Files.zip`) from their own GitHub account. The sets never share a file, so nothing is overwritten.
3. **Round 3:** everybody pulls and runs `npm run build`. The checks confirm that all pieces are present and fit together.

The result is identical to `HMS-Final-Integrated.zip` (proved by an automated comparison, see `TEST_REPORT.md`).

### Changes after the first integration

- **Your own module:** edit freely in your folders, test with `npm run dev:<yourmodule>`, then commit and push.
- **Need a change in a shared (core) file?** Ask the file's owner (see `OWNERSHIP.md`). The owner changes it, and the **team lead** runs:
  ```
  npm run core:seal
  ```
  This updates `core.manifest.json`. Commit and push both files together. Everybody pulls.
- **New library?** Ask the team lead (`package.json` and `package-lock.json` belong to the lead).
- **New database change?** Not needed so far. If ever needed, write a *separate, non-destructive* SQL file in `sql/` (for example `sql/08_something.sql`) and run it manually in the Supabase SQL Editor. Never run `00_reset.sql` on the real project.

## 6. Supabase integration

- The website uses two environment variables, the same in every place (your PC, Vercel):
  `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- All database calls are in two layers:
  - **Shared reads and booking functions** in `src/core/api/` (appointments, prescriptions, invoices, patient lists, departments, doctors, free slots).
  - **Role-specific operations** in `src/modules/<role>/api.js`.
- **Database objects used** (all from the original `sql/01…05` scripts, no changes):

  | Kind | Names |
  |---|---|
  | Tables | `profiles`, `departments`, `doctors`, `doctor_invites`, `patients`, `appointments`, `prescriptions`, `invoices`, `audit_log` |
  | Views | `v_appointment_details`, `v_doctor_workload`, `v_department_summary` |
  | Functions called by the website | `book_appointment`, `set_appointment_status`, `reschedule_appointment`, `mark_invoice_paid`, `available_slots`, `get_dashboard_stats`, `verify_doctor_code` |
  | Triggers working behind the scenes | appointment validation/audit/invoice, doctor invite codes, profile/patient guards, sign-up trigger `on_auth_user_created` |
  | Security | 26 Row Level Security policies |

- **Your existing data is untouched:** no schema change was needed, so there is **no migration file**. I did not run `00_reset.sql` and the project never contains a secret key.
- `npm run verify:supabase` and `sql/07_schema_check.sql` check your live project without changing anything.

## 7. Old addresses still work

| Old | New |
|---|---|
| `/signup` | redirects to `/register` (patient registration) |
| `/signup?type=doctor` | redirects to `/activate` (doctor activation) |
| `/admin`, `/doctor`, `/patient` | unchanged |

## 8. If something does not fit

| Problem | Cause | Fix |
|---|---|---|
| `Core check … MISSING` | A file set is not pushed or pulled yet | Pull; wait for the named owner |
| `Core check … CHANGED` | A shared file was edited | Discard the change; ask the owner |
| `RULE 1` | A module imports another module | Move shared code to `src/core` via its owner |
| A portal is missing in the menu | That module folder is missing or `VITE_ONLY_MODULE` is set | Pull; use `npm run dev` for everything |
