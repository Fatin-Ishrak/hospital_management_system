# Test Report

**Read this first:** every test below was run by me in a **simulated environment**, not against your real Supabase project, not on your Windows PC, not on GitHub and not on Vercel. Section 5 lists what is **still untested** and what you must check yourself. Nothing in this report claims a live Supabase test.

## 1. What "simulated" means here

| Real thing | What I used instead |
|---|---|
| Your Supabase PostgreSQL database | A real **PostgreSQL 16** server loaded with your exact SQL scripts `sql/01` to `sql/05` |
| Supabase API (reads, inserts, function calls, Row Level Security) | **PostgREST 12.2.12**, the same open-source API layer Supabase uses, with real security rules and signed login tokens |
| Supabase Auth (login, sign-up, logout) | A small **stand-in server** that imitates the Auth responses and runs the real sign-up trigger in the database |
| A user's browser | **Chromium** (headless) driven by Playwright, and a **jsdom** test runner for component tests |
| Windows line endings | Every text file converted to CRLF, then checked and built |

## 2. Results

### 2.1 Database (scripts 01 to 05 on PostgreSQL 16)

All rules fired as designed (details in the Phase 2 delivery): booking rules (past date, outside hours, bad slot, double booking, patient clash, off-days, unavailable doctor), status workflow, automatic invoice, paid invoices final, prescription rules, constraints, delete protection, 26 Row Level Security policies per role, sign-up trigger, audit log with actor, reset and re-run.
`sql/07_schema_check.sql` returned **OK on all 9 lines** on the reference database.

### 2.2 Component and database integration tests (real app + real PostgreSQL + real RLS)

The real React app runs as the Admin, Doctor and Patient user against the database.

| Suite | Tests | Result |
|---|---|---|
| Full integrated app (all three modules) | 32 | **32 passed** |
| Admin-only mode (`VITE_ONLY_MODULE=admin`) | 3 | 3 passed |
| Doctor-only mode | 3 | 3 passed |
| Patient-only mode | 3 | 3 passed |

What the 32 cover: login/sign-up screens and validation; wrong doctor activation code; role guards (a patient opening `/admin` is sent away, and so on); menus differ per role; Admin dashboard numbers, patient add/search/delete (and refusal to delete a patient with history), doctor add with automatic activation code, departments and doctor assignment, appointments filter, prescriptions/invoices/users pages; full workflow **patient books → second patient refused (double booking) → doctor confirms, prescribes, completes → invoice created automatically → admin marks it paid → patient sees prescription and paid invoice**; patient profile edit; direct "attacks" (self-promotion to admin, reading audit log or activation codes, writing appointments directly, doctor changing own fee, doctor reading another doctor's data) are refused; audit log shows each person's email; old addresses `/signup` and `/signup?type=doctor` redirect; login page links come from the modules.

### 2.3 Real-browser tests (Chromium, built website, real login screen)

| Suite | Tests | Result |
|---|---|---|
| Full integrated website | 28 | **28 passed**, 0 page errors |
| Three single-module builds (4 checks each) | 12 | **12 passed**, 0 page errors |

Covers: wrong password message; admin login and all 9 admin pages; reload on a deep link keeps the session; logout and route protection; patient sign-up on the website and rows in the database; booking with free slots; relogin; duplicate email message; doctor activation (wrong code rejected, right code links the doctor and consumes the code); doctor dashboard/appointments/schedule; mobile layout and menu; each single-module build shows its own portal and a clear "not included" page for other roles; `/register` and `/activate` exist only when their module is present.

### 2.4 Architecture and safety checks (`npm run build` runs them first)

| Check | Proven by |
|---|---|
| Frozen core detects an **edited** shared file, a **missing** file (names its owner) and an **extra** file | Tested with deliberate mistakes: all caught |
| Works with **Windows line endings** (CRLF) | Converted every file to CRLF: passes |
| A module importing another module, core importing a module, an **import cycle**, a **secret key** in code | Tested with deliberate mistakes: all caught |
| `verify:supabase` | Healthy project: all PASS. Not configured, secret key pasted, unreachable URL, and **anonymous read access to patients (broken security)**: each correctly reported FAIL |

### 2.5 Packaging and one-repository workflow

| Test | Result |
|---|---|
| Starter + 3 member file sets are **disjoint**, **complete** and byte-identical to the final project | 104 files = 41 + 22 + 17 + 24, 0 overlaps, 0 missing, 0 differences |
| Replay into a fresh Git repository with four different identities (starter, Member 2, Member 3, Member 1; order does not matter) | 4 commits, 4 authors; result **identical** to the final project |
| Partial states (after step 1 only; after step 1 + two members) | Core check explains what is missing and who owns it; no crash |
| Clean-room `npm ci` + `npm run build` from the replayed repository | **Passed** |
| Same tests (2.2 and 2.3) run on the replayed repository | **All passed** (numbers above) |

## 3. Requested integration checks (your list)

| # | Check | Status |
|---|---|---|
| 1 | Imports and file paths | Passed (architecture check, no unresolved imports) |
| 2 | Routes | Passed (browser tests visit every portal page) |
| 3 | Shared Supabase configuration | Passed in simulation (one client, same variable names everywhere); **live: pending** |
| 4 | Authentication and sessions | Passed against the stand-in Auth server; **real Supabase Auth: pending** |
| 5 | Role-based dashboard redirection | Passed (simulated) |
| 6 | Admin access | Passed (simulated); **live: pending** |
| 7 | Doctor access | Passed (simulated); **live: pending** |
| 8 | Patient access | Passed (simulated); **live: pending** |
| 9 | Database reads and writes | Passed on real PostgreSQL; **live: pending** |
| 10 | RLS restrictions | Passed with the real 26 policies; **live: pending** |
| 11 | Appointment booking | Passed (simulated); **live: pending** |
| 12 | Prescription operations | Passed (simulated); **live: pending** |
| 13 | Invoice operations | Passed (simulated); **live: pending** |
| 14 | Production build | **Passed** |

## 4. Numbers

- Source files in `src/`: 61. Project files: 104. About 4,300 lines of JavaScript/JSX/CSS in total, of which about 3,900 are in the three members' files (see `OWNERSHIP.md`).
- Production bundle: one JavaScript file of about 0.6 MB (build prints a size warning; harmless for this project).

## 5. NOT tested: please do these yourself

| Not tested | Why | What you do |
|---|---|---|
| **Your real Supabase project** (live reads, writes, RLS) | I have no access to it | `npm run verify:supabase`, then the 14-point live checklist in `LOCAL_RUN_GUIDE.md` section 7. Tick every row |
| **Real Supabase Auth** behaviour (messages, email confirmation, rate limits) | Only imitated | Covered by the live checklist; keep "Confirm email" **off** for the demo |
| **Whether your database matches the scripts** | I cannot read it | Run `sql/07_schema_check.sql` in the SQL Editor; every line should say OK |
| **Running on Windows** (Node, Command Prompt, GitHub Desktop) | Tested on Linux; only line endings were simulated | Follow `LOCAL_RUN_GUIDE.md` and report any error message |
| **GitHub Desktop steps and GitHub's Contributors page** | Not run; the guide is written from knowledge of the program and menu names may differ slightly | Do `CONTRIBUTION_VERIFICATION_GUIDE.md` section B after the first pushes |
| **Vercel deployment**, including the free-plan collaboration restriction | Not deployed | `DEPLOYMENT_GUIDE.md`; test early with a second member's push |

## 6. Known limitations

- Single-module mode (`npm run dev:admin` and so on) hides the other modules at run time; their code is still part of the bundle.
- Pages refresh after each action and have a Refresh button; there is no live push-update.
- With "Confirm email" off, anybody can register with an email they do not own (acceptable for a class demo).
- The free Supabase project pauses after a week of inactivity: open the dashboard before your presentation.
