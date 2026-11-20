-- =====================================================================
-- 00_reset.sql  -  OPTIONAL. Removes everything created by scripts 01-05
-- so you can start again. It does NOT touch Supabase's own tables and
-- it does NOT delete your login accounts (Authentication > Users).
-- Only run this if you want a completely fresh database.
-- =====================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP VIEW IF EXISTS public.v_appointment_details, public.v_doctor_workload,
                    public.v_department_summary, public.v_revenue_by_month;

DROP TABLE IF EXISTS public.audit_log, public.invoices, public.prescriptions,
                     public.appointments, public.doctor_invites, public.patients,
                     public.doctors, public.departments, public.profiles CASCADE;

DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.verify_doctor_code(text);
DROP FUNCTION IF EXISTS public.book_appointment(int, int, date, time, text, public.appt_priority);
DROP FUNCTION IF EXISTS public.set_appointment_status(int, public.appt_status);
DROP FUNCTION IF EXISTS public.reschedule_appointment(int, date, time);
DROP FUNCTION IF EXISTS public.mark_invoice_paid(int);
DROP FUNCTION IF EXISTS public.available_slots(int, date);
DROP FUNCTION IF EXISTS public.get_dashboard_stats();
DROP FUNCTION IF EXISTS public.fn_patient_age(date);
DROP FUNCTION IF EXISTS public.fn_doctor_revenue(int);
DROP FUNCTION IF EXISTS public.audit(text, int, text, text);
DROP FUNCTION IF EXISTS public.auth_role();
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.my_doctor_id();
DROP FUNCTION IF EXISTS public.my_patient_id();
DROP FUNCTION IF EXISTS public.trg_appt_validate();
DROP FUNCTION IF EXISTS public.trg_appt_audit();
DROP FUNCTION IF EXISTS public.trg_appt_invoice();
DROP FUNCTION IF EXISTS public.trg_audit();
DROP FUNCTION IF EXISTS public.trg_patient_guard();
DROP FUNCTION IF EXISTS public.trg_doctor_guard();
DROP FUNCTION IF EXISTS public.trg_doctor_invite();
DROP FUNCTION IF EXISTS public.trg_profile_guard();
DROP FUNCTION IF EXISTS public.trg_prescription_guard();
DROP FUNCTION IF EXISTS public.trg_invoice_guard();
DROP FUNCTION IF EXISTS public.trg_invoice_audit();

DROP TYPE IF EXISTS public.user_role, public.gender_type, public.blood_group_type,
                    public.appt_status, public.appt_priority, public.payment_status;
