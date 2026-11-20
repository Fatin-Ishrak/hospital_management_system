# Member 1 Contribution: Authentication, App Shell and Admin Portal

**Owner of:** `src/modules/admin/`, `src/app/`, `src/core/auth/`, `src/core/supabase/`
**Size:** 21 files, about 1631 lines of code.

## 1. What this part does (in simple words)

Member 1 built **how people get in** and **everything the hospital administrator does**.

### Authentication and shared access
- **Login and logout** with Supabase Authentication (email and password).
- **Session management:** the website remembers who is logged in, even after a page refresh.
- **Role-based access control:** after login the app reads the user's **role** from the database (`profiles` table) and sends them to the right portal (Admin, Doctor or Patient).
- **Protected routes:** a doctor or patient who types an admin address is sent back to their own portal.
- **App shell and module registry:** the small program that finds every module folder and builds the website's routes and menus from them. This is what lets three people's work join without rewriting code.
- **Supabase client:** one shared connection that uses only the *publishable* key.

### Admin portal (9 pages)
| Page | Features |
|---|---|
| Dashboard | 8 statistic cards (patients, doctors, appointments, completed, pending, cancelled, revenue collected, revenue pending), 3 charts, recent activity |
| Patients | Add, edit, search, filter by gender, view details and appointment history, delete (blocked if the patient has history) |
| Doctors | Add, edit, delete, working hours and days, availability, schedule view, **activation codes** (copy button) |
| Departments | Add, edit, delete, see doctor counts, assign doctors to a department |
| Appointments | Search and filter, **book for a patient**, confirm, complete, reschedule, cancel, delete |
| Prescriptions | View all, delete |
| Invoices | View, print, **mark as paid**, totals of paid and unpaid money |
| Audit Log | Filter by table and action; shows who did what and when |
| Users & Roles | List accounts and change roles (only an admin can; nobody can change their own role) |

## 2. Important source files

| File | What it does | Lines |
|---|---|---|
| `src/app/App.jsx` | APP SHELL  (owner: Member 1) | 60 |
| `src/app/NotIncluded.jsx` | Page shown when a user logs in with a role whose portal module is not part of this build. | 22 |
| `src/app/moduleRegistry.js` | MODULE REGISTRY  (owner: Member 1) | 31 |
| `src/core/auth/AuthContext.jsx` | LOGIN STATE: keeps the Supabase session, loads the profile/doctor/patient record, and offers signIn, signUp and signOut. | 77 |
| `src/core/auth/PortalContext.jsx` | The shell (src/app) tells the rest of the app which portals exist in this build, | 7 |
| `src/core/auth/RequireRole.jsx` | Protected route: lets a user in only when their role matches this portal. | 41 |
| `src/core/auth/authApi.js` | Database reads needed to know WHO is logged in and WHICH portal they belong to. | 15 |
| `src/core/auth/pages/Login.jsx` | LOGIN PAGE: email + password form that signs in with Supabase Auth. | 55 |
| `src/core/supabase/client.js` | Creates the connection to your Supabase project. | 12 |
| `src/modules/admin/api.js` | ADMIN module database operations (owner: Member 1). | 78 |
| `src/modules/admin/components/AdminBookForm.jsx` | Admin "New appointment" form: the admin chooses the patient, then doctor, date and a free slot. | 75 |
| `src/modules/admin/index.jsx` | ADMIN MODULE descriptor (owner: Member 1). The app shell reads this file to add the Admin portal. | 43 |
| `src/modules/admin/pages/Appointments.jsx` | ADMIN: all appointments. Search, filter, book, confirm, complete, reschedule, cancel and delete. | 134 |
| `src/modules/admin/pages/AuditLog.jsx` | ADMIN: audit log viewer (who did what and when). The rows are written by database triggers. | 70 |
| `src/modules/admin/pages/Dashboard.jsx` | ADMIN: dashboard with statistics, charts and recent activity from the database function get_dashboard_stats(). | 123 |
| `src/modules/admin/pages/Departments.jsx` | ADMIN: add, edit, delete departments and assign doctors to them. | 171 |
| `src/modules/admin/pages/Doctors.jsx` | ADMIN: add, edit, delete doctors, set hours/days/availability, view schedules and copy activation codes. | 213 |
| `src/modules/admin/pages/Invoices.jsx` | ADMIN: invoices and payments. Invoices are created automatically by a database trigger when an | 88 |
| `src/modules/admin/pages/Patients.jsx` | ADMIN: add, edit, search, filter and delete patients; view details and appointment history. | 157 |
| `src/modules/admin/pages/Prescriptions.jsx` | ADMIN: view all prescriptions and delete one if needed. (Doctors write them in the doctor portal.) | 76 |
| `src/modules/admin/pages/UsersRoles.jsx` | ADMIN: list accounts and change roles (the database blocks everybody else and blocks changing your own role). | 83 |

## 3. Database objects used

| Kind | Names | Where used |
|---|---|---|
| Tables | `profiles`, `departments`, `doctors`, `doctor_invites`, `patients`, `appointments`, `prescriptions`, `invoices`, `audit_log` | `src/modules/admin/api.js`, `src/core/auth/authApi.js` |
| Views | `v_department_summary`, `v_appointment_details` | Departments and Appointments pages |
| Functions | `get_dashboard_stats()`, `mark_invoice_paid()`, `book_appointment()`, `set_appointment_status()`, `reschedule_appointment()`, `available_slots()` | Dashboard, Invoices, Appointments |
| Triggers (work automatically) | `trg_doctor_invite` (creates activation codes), `trg_profile_guard` (blocks role changes), audit triggers (fill the audit log), `trg_appt_invoice` (auto invoice) | Doctors, Users & Roles, Audit Log, Invoices |
| Security | Admin policies `*_admin` on every table, `profiles_update_admin`, `audit_admin_select`, `invites_admin_select` | Everything in the admin portal |

## 3a. Technologies
React, React Router (routes and protected routes), Supabase Auth (`supabase-js`), Recharts (charts), Tailwind CSS, Lucide icons.

## 4. How to run and test only your part

```
npm install
copy .env.example .env.local        (then put in your Supabase URL and publishable key)
npm run dev:admin
```
Open http://localhost:5173/ and log in with your **existing admin account**.

| Test | Expected |
|---|---|
| Log in as admin | Admin dashboard with numbers and charts |
| Log out, open `/admin` | Redirected to login |
| Patients → Add patient | Row also appears in Supabase Table Editor → `patients` |
| Doctors → Add doctor | Activation code appears in the doctors table |
| Appointments → New appointment | Row appears in `appointments`; booking the same doctor/time again is refused |
| Appointments → Confirm → Complete | An invoice appears (Invoices page) |
| Invoices → Mark paid | `payment_status` = Paid |
| Audit Log | New lines with your email |
| Users & Roles | Your own role dropdown is disabled |

## 5. How to explain it to your teacher

1. **How does the website know which portal to show?** After login, `AuthContext` reads the `profiles` table. The `role` column (`admin`, `doctor` or `patient`) selects the portal.
2. **Can a patient make themselves admin?** No. The sign-up trigger always creates patients; only an existing admin can change a role (trigger `trg_profile_guard` + RLS), and nobody can change their own role. Admins are promoted with SQL.
3. **Why is the shell separate from the modules?** It discovers modules automatically, so the Admin, Doctor and Patient work join by copying folders, with no code changes.
4. **Where is security enforced?** In the database (Row Level Security policies). The website only hides buttons; the database refuses forbidden actions even if someone calls the API directly.
5. **What does the audit log show?** Rows written by triggers: table, action, details, the acting user's email and time.
6. **What is a doctor activation code?** A one-time code created by a trigger when the admin adds a doctor. The doctor enters it on `/activate`; the sign-up trigger links the new login to that doctor.

## 6. Honesty note
`src/core/` contains shared files that are the same in the whole repository. The files **this member owns** are listed in section 2 and in `OWNERSHIP.md`. The code was developed with AI assistance; the team reviewed and tested it.
