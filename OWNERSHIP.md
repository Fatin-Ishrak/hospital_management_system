# Ownership: who owns which files

This file is generated from `OWNERSHIP.json` (run `npm run ownership:md` after changing it).
**Rule:** you commit only the files you own. Shared files (`src/core/**`, `src/app/**`) are frozen: they are checked by `npm run build`.
To list your files on your own computer: `npm run my-files -- member1` (or member2, member3, lead).

## Summary

| Owner | Responsibility | Files | Lines of code |
|---|---|---|---|
| Member 1 | Authentication, app shell and Admin portal | 22 | 1631 |
| Member 2 | Doctor portal, UI kit and layout | 17 | 1241 |
| Member 3 | Patient portal, shared data API and utilities | 24 | 1060 |
| Repository owner (team lead) | project scaffolding, scripts, SQL, guides | 41 | 396 |

Total: 104 files.

## Folder map

| Folder | Owner |
|---|---|
| `src/modules/admin/` | Member 1 |
| `src/modules/doctor/` | Member 2 |
| `src/modules/patient/` | Member 3 |
| `src/app/` (app shell, module registry) | Member 1 |
| `src/core/auth/`, `src/core/supabase/` | Member 1 |
| `src/core/ui/`, `src/core/layout/`, `src/core/hooks/`, `src/core/toast/` | Member 2 |
| `src/core/components/PatientDetails.jsx`, `src/core/components/InvoiceView.jsx` | Member 2 |
| `src/core/api/`, `src/core/utils/` | Member 3 |
| `src/core/components/SlotPicker.jsx`, `src/core/components/RescheduleModal.jsx` | Member 3 |
| `docs/contributions/Member-N-Contribution.md` | the matching member |
| everything else (configuration, `scripts/`, `sql/`, guides, README) | Repository owner |

Shared core files can only change through the file's owner and the team lead (see `docs/INTEGRATION_GUIDE.md`).

## Member 1: 22 files

| File | Lines |
|---|---|
| `docs/contributions/Member-1-Contribution.md` |  |
| `src/app/App.jsx` | 60 |
| `src/app/NotIncluded.jsx` | 22 |
| `src/app/moduleRegistry.js` | 31 |
| `src/core/auth/AuthContext.jsx` | 77 |
| `src/core/auth/PortalContext.jsx` | 7 |
| `src/core/auth/RequireRole.jsx` | 41 |
| `src/core/auth/authApi.js` | 15 |
| `src/core/auth/pages/Login.jsx` | 55 |
| `src/core/supabase/client.js` | 12 |
| `src/modules/admin/api.js` | 78 |
| `src/modules/admin/components/AdminBookForm.jsx` | 75 |
| `src/modules/admin/index.jsx` | 43 |
| `src/modules/admin/pages/Appointments.jsx` | 134 |
| `src/modules/admin/pages/AuditLog.jsx` | 70 |
| `src/modules/admin/pages/Dashboard.jsx` | 123 |
| `src/modules/admin/pages/Departments.jsx` | 171 |
| `src/modules/admin/pages/Doctors.jsx` | 213 |
| `src/modules/admin/pages/Invoices.jsx` | 88 |
| `src/modules/admin/pages/Patients.jsx` | 157 |
| `src/modules/admin/pages/Prescriptions.jsx` | 76 |
| `src/modules/admin/pages/UsersRoles.jsx` | 83 |

## Member 2: 17 files

| File | Lines |
|---|---|
| `docs/contributions/Member-2-Contribution.md` |  |
| `src/core/components/InvoiceView.jsx` | 39 |
| `src/core/components/PatientDetails.jsx` | 52 |
| `src/core/hooks/hooks.js` | 34 |
| `src/core/layout/AuthShell.jsx` | 37 |
| `src/core/layout/Layout.jsx` | 88 |
| `src/core/toast/ToastContext.jsx` | 53 |
| `src/core/ui/index.jsx` | 250 |
| `src/modules/doctor/api.js` | 53 |
| `src/modules/doctor/components/PrescriptionDialog.jsx` | 86 |
| `src/modules/doctor/index.jsx` | 33 |
| `src/modules/doctor/pages/Activate.jsx` | 74 |
| `src/modules/doctor/pages/Appointments.jsx` | 101 |
| `src/modules/doctor/pages/Dashboard.jsx` | 86 |
| `src/modules/doctor/pages/Patients.jsx` | 66 |
| `src/modules/doctor/pages/Prescriptions.jsx` | 86 |
| `src/modules/doctor/pages/Schedule.jsx` | 103 |

## Member 3: 24 files

| File | Lines |
|---|---|
| `docs/contributions/Member-3-Contribution.md` |  |
| `src/core/api/appointments.js` | 49 |
| `src/core/api/helpers.js` | 14 |
| `src/core/api/index.js` | 9 |
| `src/core/api/invoices.js` | 26 |
| `src/core/api/lookups.js` | 19 |
| `src/core/api/patients.js` | 16 |
| `src/core/api/prescriptions.js` | 14 |
| `src/core/components/RescheduleModal.jsx` | 64 |
| `src/core/components/SlotPicker.jsx` | 47 |
| `src/core/utils/errors.js` | 29 |
| `src/core/utils/format.js` | 53 |
| `src/core/utils/validation.js` | 4 |
| `src/modules/patient/api.js` | 30 |
| `src/modules/patient/components/PatientBookForm.jsx` | 85 |
| `src/modules/patient/index.jsx` | 39 |
| `src/modules/patient/pages/BookAppointment.jsx` | 24 |
| `src/modules/patient/pages/Dashboard.jsx` | 81 |
| `src/modules/patient/pages/DoctorDirectory.jsx` | 68 |
| `src/modules/patient/pages/MyAppointments.jsx` | 101 |
| `src/modules/patient/pages/MyInvoices.jsx` | 63 |
| `src/modules/patient/pages/MyPrescriptions.jsx` | 50 |
| `src/modules/patient/pages/Profile.jsx` | 76 |
| `src/modules/patient/pages/Register.jsx` | 99 |

## Repository owner (team lead): 41 files

| File | Lines |
|---|---|
| `.env.admin` |  |
| `.env.doctor` |  |
| `.env.example` |  |
| `.env.patient` |  |
| `.gitattributes` |  |
| `.github/CODEOWNERS.example` |  |
| `.gitignore` |  |
| `OWNERSHIP.json` |  |
| `OWNERSHIP.md` |  |
| `README.md` |  |
| `core.manifest.json` |  |
| `docs/CONTRIBUTION_VERIFICATION_GUIDE.md` |  |
| `docs/DATABASE_DESIGN.md` |  |
| `docs/DEPLOYMENT_GUIDE.md` |  |
| `docs/GIT_COLLABORATION_GUIDE.md` |  |
| `docs/INTEGRATION_GUIDE.md` |  |
| `docs/LOCAL_RUN_GUIDE.md` |  |
| `docs/TEST_REPORT.md` |  |
| `docs/er_diagram.mmd` |  |
| `index.html` |  |
| `package-lock.json` |  |
| `package.json` |  |
| `public/favicon.svg` |  |
| `scripts/check-architecture.mjs` | 89 |
| `scripts/check-core.mjs` | 42 |
| `scripts/gen-ownership-md.mjs` | 54 |
| `scripts/lib/project.mjs` | 44 |
| `scripts/my-files.mjs` | 20 |
| `scripts/verify-supabase.mjs` | 73 |
| `sql/00_reset.sql` |  |
| `sql/01_schema.sql` |  |
| `sql/02_functions_triggers.sql` |  |
| `sql/03_views.sql` |  |
| `sql/04_rls.sql` |  |
| `sql/05_seed.sql` |  |
| `sql/06_make_admin.sql` |  |
| `sql/07_schema_check.sql` |  |
| `src/index.css` | 21 |
| `src/main.jsx` | 42 |
| `vercel.json` |  |
| `vite.config.js` | 11 |

