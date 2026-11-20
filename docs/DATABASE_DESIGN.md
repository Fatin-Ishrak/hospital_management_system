# Database Design – Hospital Management System (PostgreSQL on Supabase)

Scripts: `sql/01_schema.sql` … `sql/05_seed.sql` · ER source: `docs/er_diagram.mmd`
(paste it into https://mermaid.live to view or export a PNG – free)

## 1. What changed from the MariaDB version

| MariaDB | PostgreSQL (this project) |
|---|---|
| `users` table with password hash | Supabase `auth.users` (passwords handled by Supabase) + `profiles` (role, name) |
| `AUTO_INCREMENT` | `GENERATED ALWAYS AS IDENTITY` |
| `ENUM(...)` column | `CREATE TYPE ... AS ENUM` |
| generated column + unique key | **partial unique index** `WHERE status <> 'Cancelled'` |
| stored procedures + `SIGNAL` | PL/pgSQL functions + `RAISE EXCEPTION`, called with `supabase.rpc()` |
| audit log without user | audit log stores **who** (`actor_id`, `actor_email`) |
| 8 tables | **9 tables** (new: `doctor_invites`) + new columns: priority, work_days, is_active |

## 2. Entities

| Table | Purpose |
|---|---|
| profiles | One row per login: role (admin / doctor / patient) and name |
| departments | Lookup table of departments |
| doctors | Doctor profile, department, fee, working hours, working days, availability switch |
| doctor_invites | One-time activation code for a doctor who has no login yet (admin-only) |
| patients | Patient profile; `user_id` is NULL for walk-in patients added by the admin |
| appointments | Patient + doctor + date + time + priority + status (junction table of the many-to-many link) |
| prescriptions | Medicines written for an appointment |
| invoices | One bill per appointment, created automatically when it is Completed |
| audit_log | Automatic history of important changes, with the acting user |

## 3. Relationships

| Relationship | Type | Foreign key | On delete |
|---|---|---|---|
| auth.users – profiles | 1 : 1 | profiles.id | CASCADE |
| profiles – doctors | 1 : 1 (optional) | doctors.user_id | SET NULL |
| profiles – patients | 1 : 1 (optional) | patients.user_id | SET NULL |
| departments – doctors | 1 : N | doctors.dept_id | RESTRICT |
| doctors – doctor_invites | 1 : 1 | doctor_invites.doctor_id | CASCADE |
| patients – appointments | 1 : N | appointments.patient_id | RESTRICT |
| doctors – appointments | 1 : N | appointments.doctor_id | RESTRICT |
| appointments – prescriptions | 1 : N | prescriptions.appointment_id | CASCADE |
| appointments – invoices | 1 : 1 | invoices.appointment_id | RESTRICT |

`audit_log` has no foreign key on purpose, so history survives deletions.

## 4. Functional dependencies

| Table | Functional dependencies |
|---|---|
| profiles | id → email, full_name, role, created_at; email → id |
| departments | dept_id → dept_name, description; dept_name → dept_id |
| doctors | doctor_id → user_id, dept_id, full_name, phone, consultation_fee, work_start, work_end, work_days, is_active; user_id → doctor_id |
| doctor_invites | doctor_id → code, created_at; code → doctor_id |
| patients | patient_id → user_id, full_name, gender, date_of_birth, phone, blood_group, address; user_id → patient_id |
| appointments | appointment_id → patient_id, doctor_id, appt_date, appt_time, reason, priority, status; (doctor_id, appt_date, appt_time) → appointment_id *(when not cancelled)*; (patient_id, appt_date, appt_time) → appointment_id *(when not cancelled)* |
| prescriptions | prescription_id → appointment_id, medicine, dosage, duration_days, instructions |
| invoices | invoice_id → appointment_id, amount, payment_status, issued_at, paid_at; appointment_id → invoice_id |
| audit_log | log_id → table_name, record_id, action, details, actor_id, actor_email, performed_at |

In every table, the left side of each dependency is a key. So every table is in **BCNF**, which is stronger than 3NF.

## 5. Normalization (from the original project)

Original table: `patients(pid, email, name, gender, slot, disease, time, date, dept, number)`.

**Problems**
- Update anomaly: changing a phone number means editing every booking row.
- Insert anomaly: a patient cannot exist without a booking.
- Delete anomaly: deleting the only booking deletes the patient's details.
- Redundancy and typos: the department is free text (`'ortho11predict'`).

**1NF** – atomic values and a primary key in every table. The one array column, `work_days`, is a deliberate design choice (a set of weekday numbers with a CHECK constraint); it could also be a separate table.

**2NF** – no attribute depends on only part of a key. Doctor facts (fee, hours) moved to `doctors`; patient facts moved to `patients`.

**3NF** – no transitive dependency. The old chain `pid → email → name, gender, number` became the separate table `patients`. The chain `doctor → dept_id → dept_name` became `departments`. Login data (`profiles`) is separate from clinical profiles.

**Why each table is necessary**
- `profiles`: roles and security.
- `departments`: no repeated or misspelled names.
- `doctors` and `patients`: separate real-world entities.
- `appointments`: resolves the many-to-many relationship.
- `prescriptions`: many medicines per visit.
- `invoices`: one bill per visit.
- `doctor_invites`: secure doctor activation.
- `audit_log`: accountability.

## 6. Business rules enforced inside the database

1. No appointment in the past (Asia/Dhaka time).
2. Inside the doctor's working hours and working days, on 30-minute slots.
3. The doctor must be active (availability switch).
4. A doctor cannot have two active appointments at the same time (**trigger + unique index**).
5. A patient cannot be in two places at the same time (**trigger + unique index**).
6. Status flow: Pending → Confirmed → Completed, and Pending/Confirmed → Cancelled. Completed and Cancelled are final.
7. Completing an appointment creates its invoice automatically.
8. Paid invoices are final; the payment time is stamped automatically.
9. Prescriptions only for Confirmed or Completed appointments, and only by the treating doctor.
10. Nobody can change their own role; only an admin can change roles.
11. Doctors cannot change their own fee, name or department.
12. Money and history records cannot be deleted by accident (RESTRICT).
13. Every important change is written to `audit_log` with the acting user.

## 7. Where each DBMS concept lives

| Concept | Where |
|---|---|
| Primary keys, foreign keys, referential integrity | `01_schema.sql` (all tables) |
| UNIQUE, NOT NULL, CHECK, DEFAULT | `01_schema.sql` |
| ENUM types, array column | `01_schema.sql` |
| Indexes (B-tree, expression, partial unique) | `01_schema.sql` section 3 |
| Views (JOIN, GROUP BY, aggregates, FILTER) | `03_views.sql` |
| Functions | `02`: `fn_patient_age`, `fn_doctor_revenue`, helpers |
| Stored routines called by the website | `02`: `book_appointment`, `set_appointment_status`, `reschedule_appointment`, `mark_invoice_paid`, `get_dashboard_stats` |
| Recursive CTE | `02`: `available_slots` |
| Transactions | every function call is atomic; demo queries use `BEGIN … ROLLBACK` |
| Triggers (BEFORE) | `trg_appt_validate`, `trg_patient_guard`, `trg_doctor_guard`, `trg_profile_guard`, `trg_prescription_guard`, `trg_invoice_guard` |
| Triggers (AFTER) | `trg_appt_audit`, `trg_appt_invoice`, `trg_audit_*`, `trg_invoice_audit`, `trg_doctor_invite`, `on_auth_user_created` |
| Subqueries | trigger checks (`EXISTS`), RLS policies, dashboard function |
| Row Level Security | `04_rls.sql` (26 policies) |
