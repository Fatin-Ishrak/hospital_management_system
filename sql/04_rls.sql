-- =====================================================================
-- 04_rls.sql  -  SECURITY: Row Level Security + explicit permissions
-- RLS = the database decides, row by row, who may see or change what.
-- Even if someone copies the website's key and calls the API directly,
-- these rules still apply. Run this FOURTH.
-- =====================================================================

-- ---------- 1. Switch RLS on (no policy = no access) ------------------
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log      ENABLE ROW LEVEL SECURITY;

-- ---------- 2. Table permissions (least privilege) --------------------
-- 'anon' = visitors who are not logged in: no table access at all.
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, UPDATE                  ON public.profiles       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE  ON public.departments    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE  ON public.doctors        TO authenticated;
GRANT SELECT                          ON public.doctor_invites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE  ON public.patients       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE  ON public.appointments   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE  ON public.prescriptions  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE  ON public.invoices       TO authenticated;
GRANT SELECT                          ON public.audit_log      TO authenticated;
GRANT SELECT ON public.v_appointment_details, public.v_doctor_workload,
                public.v_department_summary,  public.v_revenue_by_month TO authenticated;

-- ---------- 3. Function permissions -----------------------------------
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION
    public.auth_role(), public.is_admin(), public.my_doctor_id(), public.my_patient_id(),
    public.fn_patient_age(date), public.fn_doctor_revenue(int),
    public.book_appointment(int, int, date, time, text, public.appt_priority),
    public.set_appointment_status(int, public.appt_status),
    public.reschedule_appointment(int, date, time),
    public.mark_invoice_paid(int),
    public.available_slots(int, date),
    public.get_dashboard_stats()
TO authenticated;
-- The sign-up page must be able to check a doctor code before login:
GRANT EXECUTE ON FUNCTION public.verify_doctor_code(text) TO anon, authenticated;

-- ---------- 4. POLICIES -----------------------------------------------
-- profiles: see/update only your own row (admin: all). Role changes are
-- additionally guarded by the trigger trg_profile_guard.
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
    USING (id = auth.uid() OR public.is_admin());
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated
    USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY profiles_update_admin ON public.profiles FOR UPDATE TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- departments: everyone logged in can read; only admin changes
CREATE POLICY departments_select ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY departments_admin  ON public.departments FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- doctors: everyone logged in can read (patients need it to book);
-- admin manages all; a doctor edits only their own schedule row
CREATE POLICY doctors_select ON public.doctors FOR SELECT TO authenticated USING (true);
CREATE POLICY doctors_admin  ON public.doctors FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY doctors_update_own ON public.doctors FOR UPDATE TO authenticated
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- doctor activation codes: admin only
CREATE POLICY invites_admin_select ON public.doctor_invites FOR SELECT TO authenticated
    USING (public.is_admin());

-- patients: admin all; patient own record; doctor only their own patients
CREATE POLICY patients_admin ON public.patients FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY patients_select_own ON public.patients FOR SELECT TO authenticated
    USING (user_id = auth.uid());
CREATE POLICY patients_update_own ON public.patients FOR UPDATE TO authenticated
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY patients_select_doctor ON public.patients FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.appointments a
                   WHERE a.patient_id = patients.patient_id
                     AND a.doctor_id = public.my_doctor_id()));

-- appointments: read your own; ALL writes go through the functions
-- book_appointment / set_appointment_status / reschedule_appointment
CREATE POLICY appts_admin ON public.appointments FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY appts_select_patient ON public.appointments FOR SELECT TO authenticated
    USING (patient_id = public.my_patient_id());
CREATE POLICY appts_select_doctor ON public.appointments FOR SELECT TO authenticated
    USING (doctor_id = public.my_doctor_id());

-- prescriptions: doctor writes for own appointments; patient reads own
CREATE POLICY presc_admin ON public.prescriptions FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY presc_select_doctor ON public.prescriptions FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.appointments a
                   WHERE a.appointment_id = prescriptions.appointment_id
                     AND a.doctor_id = public.my_doctor_id()));
CREATE POLICY presc_select_patient ON public.prescriptions FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.appointments a
                   WHERE a.appointment_id = prescriptions.appointment_id
                     AND a.patient_id = public.my_patient_id()));
CREATE POLICY presc_insert_doctor ON public.prescriptions FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.appointments a
                        WHERE a.appointment_id = prescriptions.appointment_id
                          AND a.doctor_id = public.my_doctor_id()));
CREATE POLICY presc_update_doctor ON public.prescriptions FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.appointments a
                   WHERE a.appointment_id = prescriptions.appointment_id
                     AND a.doctor_id = public.my_doctor_id()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.appointments a
                        WHERE a.appointment_id = prescriptions.appointment_id
                          AND a.doctor_id = public.my_doctor_id()));
CREATE POLICY presc_delete_doctor ON public.prescriptions FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.appointments a
                   WHERE a.appointment_id = prescriptions.appointment_id
                     AND a.doctor_id = public.my_doctor_id()));

-- invoices: admin all; doctor and patient can read only their own
CREATE POLICY invoices_admin ON public.invoices FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY invoices_select_doctor ON public.invoices FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.appointments a
                   WHERE a.appointment_id = invoices.appointment_id
                     AND a.doctor_id = public.my_doctor_id()));
CREATE POLICY invoices_select_patient ON public.invoices FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.appointments a
                   WHERE a.appointment_id = invoices.appointment_id
                     AND a.patient_id = public.my_patient_id()));

-- audit_log: only admin can read; nobody can write directly (triggers only)
CREATE POLICY audit_admin_select ON public.audit_log FOR SELECT TO authenticated
    USING (public.is_admin());
