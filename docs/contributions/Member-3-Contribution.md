# Member 3 Contribution: Patient Portal, Shared Data API and Utilities

**Owner of:** `src/modules/patient/`, `src/core/api/`, `src/core/utils/`, and the slot picker and reschedule window in `src/core/components/`
**Size:** 23 files, about 1060 lines of code.

## 1. What this part does (in simple words)

Member 3 built **everything a patient uses**, plus the **shared data layer** that all portals use to talk to the database.

### Patient portal
| Page | Features |
|---|---|
| Registration (`/register`) | Create a patient account (name, birth date, phone, blood group, address) with validation; the database creates the profile and patient record |
| Dashboard | Next appointment, upcoming list, completed visits, prescriptions count, unpaid bills |
| Book Appointment | Department → doctor → date → **free time slots** → priority → reason; double bookings are impossible |
| My Appointments | History with search and filters; **reschedule** and **cancel** upcoming visits; invoice status |
| Doctors | Directory by department with fee, working hours and a Book button |
| Prescriptions | Medicines prescribed to the patient (read only) |
| Invoices | Invoices, paid/unpaid totals, printable invoice |
| My Profile | Edit own details (role and account link cannot be changed) |

### Shared data layer and helpers
- **`src/core/api`**: the shared functions that read departments, doctors, patients, appointments, prescriptions, invoices and **free slots**, and call the booking, status and reschedule database functions.
- **`src/core/utils`**: date/time/money formatting (Bangladesh time zone), validation rules (phone, blood groups) and **one place for friendly error messages** (for example "this doctor is already booked at that time").
- **SlotPicker** and **RescheduleModal** components.

## 2. Important source files

| File | What it does | Lines |
|---|---|---|
| `src/core/api/appointments.js` | Appointment reads and the database functions that change appointments. | 49 |
| `src/core/api/helpers.js` | Small helpers shared by all API files. | 14 |
| `src/core/api/index.js` | The shared data API. Every module imports it the same way:  import { api } from '@/core/api'; | 9 |
| `src/core/api/invoices.js` | Read invoices (each role only receives its own rows from the database). | 26 |
| `src/core/api/lookups.js` | Read-only data every portal needs: departments, doctors and free time slots. | 19 |
| `src/core/api/patients.js` | Read-only patient lists. Row Level Security decides which patients each role may see: | 16 |
| `src/core/api/prescriptions.js` | Read prescriptions (each role only receives its own rows from the database). | 14 |
| `src/core/components/RescheduleModal.jsx` | SHARED: choose a new date and free slot for an appointment (admin and patient portals). | 64 |
| `src/core/components/SlotPicker.jsx` | SHARED: shows the free 30-minute slots returned by the database function available_slots(). | 47 |
| `src/core/utils/errors.js` | One place that turns database and network errors into sentences a user can understand. | 29 |
| `src/core/utils/format.js` | Date, time, money and small helper functions used by every module. | 53 |
| `src/core/utils/validation.js` | Validation rules shared by all forms. The database enforces the same rules (CHECK constraints). | 4 |
| `src/modules/patient/api.js` | PATIENT module database operations (owner: Member 3). | 30 |
| `src/modules/patient/components/PatientBookForm.jsx` | PATIENT booking form: department -> doctor -> date -> free slot -> reason. | 85 |
| `src/modules/patient/index.jsx` | PATIENT MODULE descriptor (owner: Member 3). The app shell reads this file to add the Patient portal. | 39 |
| `src/modules/patient/pages/BookAppointment.jsx` | PATIENT: book an appointment (uses the core slot picker and the database function book_appointment). | 24 |
| `src/modules/patient/pages/Dashboard.jsx` | PATIENT: dashboard with next appointment, counts, prescriptions and unpaid bills. | 81 |
| `src/modules/patient/pages/DoctorDirectory.jsx` | PATIENT: browse doctors by department, see fees and hours, and start a booking. | 68 |
| `src/modules/patient/pages/MyAppointments.jsx` | PATIENT: appointment history. Reschedule or cancel upcoming visits. | 101 |
| `src/modules/patient/pages/MyInvoices.jsx` | PATIENT: invoices and payment status (read only). Payments are recorded by the administrator. | 63 |
| `src/modules/patient/pages/MyPrescriptions.jsx` | PATIENT: prescriptions written for this patient (read only). | 50 |
| `src/modules/patient/pages/Profile.jsx` | PATIENT: view and edit own profile (the role and account link cannot be changed). | 76 |
| `src/modules/patient/pages/Register.jsx` | PATIENT REGISTRATION (public page /register). Creates a login account; a database trigger | 99 |

## 3. Database objects used

| Kind | Names | Where used |
|---|---|---|
| Tables | `patients` (own record), `appointments` (own), `prescriptions` (own), `invoices` (own), `doctors`, `departments` (read) | `src/modules/patient/api.js`, `src/core/api/*` |
| Views | `v_appointment_details` | My Appointments, Dashboard |
| Functions | `book_appointment()`, `available_slots()` (recursive query), `set_appointment_status()` (cancel), `reschedule_appointment()`, `fn_patient_age()` (inside the view) | Booking, History |
| Triggers (work automatically) | `trg_appt_validate` (no past dates, working hours, 30-minute slots, no double booking, no patient clash), `trg_patient_guard`, sign-up trigger `on_auth_user_created` (creates profile + patient), `trg_appt_invoice` | Booking, Registration, Invoices |
| Constraints and indexes | Partial unique indexes `uq_doctor_slot` and `uq_patient_slot`; CHECK constraints for phone and dates | Booking, Registration |
| Security (RLS) | `patients_select_own`, `patients_update_own`, `appts_select_patient`, `presc_select_patient`, `invoices_select_patient` | All patient pages |

## 3a. Technologies
React, React Router, Supabase client (`supabase-js`, including `.rpc()` calls), Tailwind CSS, Lucide icons.

## 4. How to run and test only your part

```
npm install
copy .env.example .env.local        (then put in your Supabase URL and publishable key)
npm run dev:patient
```
Open http://localhost:5173/ and click **Create an account**.

| Test | Expected |
|---|---|
| Register with phone `abc` | Message "Phone must be 10 to 15 digits" (and the database would refuse it too) |
| Register correctly | Patient dashboard; rows in `profiles` and `patients` |
| Book Appointment → doctor → tomorrow → slot → reason | Row in `appointments` (Pending); you land on My Appointments |
| Try to book the same doctor and time with a second patient | Refused: "already booked" |
| Cancel a Pending appointment | Status Cancelled; the slot is free again |
| Open `/admin` | Redirected to the patient portal |
| Prescriptions / Invoices | Only your own rows (empty until a doctor completes your visit) |

## 5. How to explain it to your teacher

1. **How are double bookings prevented?** Twice: a trigger checks before saving, and **partial unique indexes** (`doctor + date + time` where the status is not Cancelled) stop even simultaneous requests.
2. **How does the website know which slots are free?** The database function `available_slots()` builds all 30-minute slots with a **recursive query** and removes taken ones, past times and days the doctor does not work.
3. **Why can a patient not see someone else's data?** Row Level Security: every patient policy compares the row's patient with `my_patient_id()` of the logged-in user.
4. **Why is booking a database function?** One call is one **transaction**: validation, insert and audit log all succeed or all fail. The function also rejects booking for another patient.
5. **What is in the shared API?** Read functions and RPC wrappers that several roles use; each role's own writes live in its module.
6. **What does registration do?** Supabase creates the login; the `on_auth_user_created` trigger creates the profile (role patient) and the patient record from the form data.

## 6. Honesty note
Shared files outside this member's list belong to other members (see `OWNERSHIP.md`). The code was developed with AI assistance; the team reviewed and tested it.
