# Member 2 Contribution: Doctor Portal, UI Kit and Layout

**Owner of:** `src/modules/doctor/`, `src/core/ui/`, `src/core/layout/`, `src/core/hooks/`, `src/core/toast/`, and two shared windows in `src/core/components/`
**Size:** 16 files, about 1241 lines of code.

## 1. What this part does (in simple words)

Member 2 built **everything a doctor uses** plus the **visual building blocks** that every portal shares.

### Doctor portal
| Page | Features |
|---|---|
| Dashboard | Today's appointments, upcoming appointments, pending/completed counts, fees collected, "you are unavailable" warning |
| Appointments | Search and filter; **Confirm**, **Complete**, **Cancel**; **Prescribe** directly from a row |
| My Patients | Only patients who have an appointment with this doctor; details and history |
| Prescriptions | Create, edit, delete prescription lines (medicine, dosage, days, instructions); "Save & add another" |
| My Schedule | Edit working hours, working days, phone and **availability**; see upcoming bookings |
| Activation page (`/activate`) | A doctor creates their login with the one-time **activation code** from the admin |

### Shared building blocks
- **UI kit** (`src/core/ui`): buttons, cards, badges, tables, dialogs, form fields, search box, pagination, stat cards, loaders and error boxes.
- **Layout** (`src/core/layout`): sidebar + top bar for all portals, the two-column frame for login pages, mobile menu.
- **Hooks and messages** (`src/core/hooks`, `src/core/toast`): load-data helper, search debounce, success/error pop-ups.
- Two shared windows: **PatientDetails** (patient info + history) and **InvoiceView** (printable invoice).

## 2. Important source files

| File | What it does | Lines |
|---|---|---|
| `src/core/components/InvoiceView.jsx` | SHARED: printable invoice window used by the admin and patient portals. | 39 |
| `src/core/components/PatientDetails.jsx` | SHARED: patient details + appointment history window (admin and doctor portals). | 52 |
| `src/core/hooks/hooks.js` | SHARED HOOKS: useData (load data + reload) and useDebounce (wait while typing in search boxes). | 34 |
| `src/core/layout/AuthShell.jsx` | SHARED LAYOUT: two-column frame used by the login, registration and activation pages. | 37 |
| `src/core/layout/Layout.jsx` | SHARED LAYOUT: sidebar + top bar for every portal; the menu items come from the module. | 88 |
| `src/core/toast/ToastContext.jsx` | SHARED MESSAGES: small success/error pop-ups (toast) with friendly database error texts. | 53 |
| `src/core/ui/index.jsx` | UI KIT: buttons, cards, badges, tables, dialogs, form fields, pagination used by every page. | 250 |
| `src/modules/doctor/api.js` | DOCTOR module database operations (owner: Member 2). | 53 |
| `src/modules/doctor/components/PrescriptionDialog.jsx` | DOCTOR: dialog to create or edit a prescription line (medicine, dosage, days, instructions). | 86 |
| `src/modules/doctor/index.jsx` | DOCTOR MODULE descriptor (owner: Member 2). The app shell reads this file to add the Doctor portal. | 33 |
| `src/modules/doctor/pages/Activate.jsx` | DOCTOR ACTIVATION (public page /activate). A doctor created by the admin has a one-time | 74 |
| `src/modules/doctor/pages/Appointments.jsx` | DOCTOR: this doctor's own appointments. Confirm, complete, cancel and write prescriptions. | 101 |
| `src/modules/doctor/pages/Dashboard.jsx` | DOCTOR: dashboard with today's and upcoming appointments and personal statistics. | 86 |
| `src/modules/doctor/pages/Patients.jsx` | DOCTOR: patients who have an appointment with this doctor (the database only returns those). | 66 |
| `src/modules/doctor/pages/Prescriptions.jsx` | DOCTOR: prescriptions this doctor wrote. Create, edit and delete. | 86 |
| `src/modules/doctor/pages/Schedule.jsx` | DOCTOR: edit own working hours, working days and availability; see upcoming bookings. | 103 |

## 3. Database objects used

| Kind | Names | Where used |
|---|---|---|
| Tables | `doctors` (own row), `appointments` (own, read), `patients` (own patients, read), `prescriptions` (create/edit/delete own), `doctor_invites` (checked at activation) | `src/modules/doctor/api.js` |
| Views | `v_doctor_workload`, `v_appointment_details` | Dashboard, Appointments |
| Functions | `set_appointment_status()` (confirm / complete / cancel), `verify_doctor_code()` | Appointments, Activation |
| Triggers (work automatically) | `trg_prescription_guard` (only Confirmed/Completed visits), `trg_doctor_guard` (a doctor cannot change own fee/department), `trg_appt_invoice` (invoice on Completed), sign-up trigger `on_auth_user_created` (links the code) | Prescriptions, Schedule, Activation |
| Security (RLS) | `doctors_update_own`, `appts_select_doctor`, `patients_select_doctor`, `presc_select_doctor`, `presc_insert_doctor`, `presc_update_doctor`, `presc_delete_doctor`, `invoices_select_doctor` | All doctor pages |

## 3a. Technologies
React (components, hooks), Tailwind CSS (design), Lucide icons, React Router, Supabase client.

## 4. How to run and test only your part

```
npm install
copy .env.example .env.local        (then put in your Supabase URL and publishable key)
npm run dev:doctor
```
Open http://localhost:5173/ . You need an **activation code**: it is in Supabase Table Editor → `doctor_invites` (or on the admin's Doctors page).

| Test | Expected |
|---|---|
| `/activate` with a wrong code | "not valid or was already used" |
| `/activate` with a real code | Doctor dashboard of that doctor; code row disappears |
| Appointments → Confirm a pending visit | Status becomes Confirmed |
| Prescribe on a *Pending* visit | Not possible (button only on Confirmed/Completed; the database also refuses) |
| Prescribe on a Confirmed visit | Row appears in `prescriptions` |
| Complete the visit | Invoice created automatically (check the `invoices` table) |
| My Schedule → untick "available" and save | `doctors.is_active` = false; patients cannot book you |
| My Patients | Only your own patients appear |

## 5. How to explain it to your teacher

1. **How does a doctor only see their own appointments?** Row Level Security policy `appts_select_doctor`: rows are returned only where `doctor_id` equals the logged-in doctor's id (`my_doctor_id()`).
2. **Why can a doctor not prescribe for a pending visit?** The trigger `trg_prescription_guard` checks the appointment status inside the database.
3. **What happens when a doctor completes a visit?** `set_appointment_status()` updates the appointment; the trigger `trg_appt_invoice` creates the invoice with the doctor's fee; audit triggers log it.
4. **Why can a doctor not change their own fee?** The trigger `trg_doctor_guard` rejects changes to fee, department and name from non-admins.
5. **What is the UI kit for?** One set of components gives all portals the same look and avoids duplicate code.
6. **How does activation work?** `verify_doctor_code()` checks the code; the sign-up trigger links the new account to the doctor and deletes the code.

## 6. Honesty note
Shared files outside this member's list belong to other members (see `OWNERSHIP.md`). The code was developed with AI assistance; the team reviewed and tested it.
