-- =====================================================================
-- 02_functions_triggers.sql
-- Helper functions, business functions (called from the website with
-- supabase.rpc), triggers, and the sign-up trigger.
-- Run this SECOND. Business hours use the Asia/Dhaka time zone.
-- =====================================================================

-- ---------------------------------------------------------------------
-- A. HELPER FUNCTIONS  (used by security policies and other functions)
--    SECURITY DEFINER = runs with the owner's rights, so these can read
--    the profiles table even when the caller cannot.
-- ---------------------------------------------------------------------
CREATE FUNCTION public.auth_role() RETURNS public.user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT COALESCE((SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()), false);
$$;

CREATE FUNCTION public.my_doctor_id() RETURNS int
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT doctor_id FROM public.doctors WHERE user_id = auth.uid();
$$;

CREATE FUNCTION public.my_patient_id() RETURNS int
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT patient_id FROM public.patients WHERE user_id = auth.uid();
$$;

-- Writes one line in audit_log, recording WHO did it (auth.uid()).
-- When you run SQL in the Supabase SQL Editor there is no website user,
-- so the actor shows as 'system / SQL Editor'.
CREATE FUNCTION public.audit(p_table text, p_id int, p_action text, p_details text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_email text;
BEGIN
    SELECT email INTO v_email FROM public.profiles WHERE id = auth.uid();
    INSERT INTO public.audit_log (table_name, record_id, action, details, actor_id, actor_email)
    VALUES (p_table, p_id, p_action, p_details, auth.uid(), COALESCE(v_email, 'system / SQL Editor'));
END $$;

-- ---------------------------------------------------------------------
-- B. SIMPLE FUNCTIONS
-- ---------------------------------------------------------------------
CREATE FUNCTION public.fn_patient_age(p_dob date) RETURNS int
LANGUAGE sql STABLE AS $$
    SELECT date_part('year', age((now() AT TIME ZONE 'Asia/Dhaka')::date, p_dob))::int;
$$;

CREATE FUNCTION public.fn_doctor_revenue(p_doctor_id int) RETURNS numeric
LANGUAGE sql STABLE AS $$
    SELECT COALESCE(SUM(i.amount), 0)
    FROM public.invoices i
    JOIN public.appointments a ON a.appointment_id = i.appointment_id
    WHERE a.doctor_id = p_doctor_id AND i.payment_status = 'Paid';
$$;

-- ---------------------------------------------------------------------
-- C. TRIGGER FUNCTIONS
-- ---------------------------------------------------------------------

-- C1. Appointment business rules (runs BEFORE every insert / update)
CREATE FUNCTION public.trg_appt_validate() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    d             public.doctors%ROWTYPE;
    now_local     timestamp := (now() AT TIME ZONE 'Asia/Dhaka');
    slot_changed  boolean;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF NEW.patient_id <> OLD.patient_id THEN
            RAISE EXCEPTION 'The patient of an appointment cannot be changed.';
        END IF;
        IF OLD.status IN ('Completed', 'Cancelled') AND NEW.status <> OLD.status THEN
            RAISE EXCEPTION 'A % appointment cannot change status again.', OLD.status;
        END IF;
        IF NEW.status <> OLD.status AND NOT (
               (OLD.status = 'Pending'   AND NEW.status IN ('Confirmed', 'Cancelled')) OR
               (OLD.status = 'Confirmed' AND NEW.status IN ('Completed', 'Cancelled'))) THEN
            RAISE EXCEPTION 'Invalid status change: % -> %. Allowed: Pending -> Confirmed/Cancelled, Confirmed -> Completed/Cancelled.',
                OLD.status, NEW.status;
        END IF;
        slot_changed := (NEW.doctor_id, NEW.appt_date, NEW.appt_time)
                        IS DISTINCT FROM (OLD.doctor_id, OLD.appt_date, OLD.appt_time);
        IF slot_changed AND OLD.status IN ('Completed', 'Cancelled') THEN
            RAISE EXCEPTION 'A % appointment cannot be rescheduled.', OLD.status;
        END IF;
    ELSE
        slot_changed := true;
    END IF;

    IF slot_changed AND NEW.status <> 'Cancelled' THEN
        IF (NEW.appt_date + NEW.appt_time) < now_local THEN
            RAISE EXCEPTION 'Appointment cannot be in the past.';
        END IF;

        SELECT * INTO d FROM public.doctors WHERE doctor_id = NEW.doctor_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Doctor not found.';
        END IF;
        IF NOT d.is_active THEN
            RAISE EXCEPTION 'This doctor is currently not available.';
        END IF;
        IF NOT (extract(isodow FROM NEW.appt_date)::smallint = ANY (d.work_days)) THEN
            RAISE EXCEPTION 'The doctor does not work on this day.';
        END IF;
        IF NEW.appt_time < d.work_start OR NEW.appt_time >= d.work_end THEN
            RAISE EXCEPTION 'Doctor is not working at this time (hours: % - %).',
                to_char(d.work_start, 'HH24:MI'), to_char(d.work_end, 'HH24:MI');
        END IF;
        IF extract(minute FROM NEW.appt_time) NOT IN (0, 30) OR extract(second FROM NEW.appt_time) <> 0 THEN
            RAISE EXCEPTION 'Appointments are in 30-minute slots (for example 10:00 or 10:30).';
        END IF;

        IF EXISTS (SELECT 1 FROM public.appointments a
                   WHERE a.doctor_id = NEW.doctor_id AND a.appt_date = NEW.appt_date
                     AND a.appt_time = NEW.appt_time AND a.status <> 'Cancelled'
                     AND a.appointment_id <> NEW.appointment_id) THEN
            RAISE EXCEPTION 'This doctor is already booked at that time.';
        END IF;
        IF EXISTS (SELECT 1 FROM public.appointments a
                   WHERE a.patient_id = NEW.patient_id AND a.appt_date = NEW.appt_date
                     AND a.appt_time = NEW.appt_time AND a.status <> 'Cancelled'
                     AND a.appointment_id <> NEW.appointment_id) THEN
            RAISE EXCEPTION 'The patient already has an appointment at that time.';
        END IF;
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER trg_appt_validate
BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.trg_appt_validate();

-- C2. Audit trail for appointments
CREATE FUNCTION public.trg_appt_audit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.audit('appointments', NEW.appointment_id, 'INSERT',
            format('Booked: patient #%s with doctor #%s on %s %s (%s)',
                   NEW.patient_id, NEW.doctor_id, NEW.appt_date, to_char(NEW.appt_time, 'HH24:MI'), NEW.priority));
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status <> OLD.status THEN
            PERFORM public.audit('appointments', NEW.appointment_id, 'STATUS',
                format('Status %s -> %s', OLD.status, NEW.status));
        ELSIF (NEW.appt_date, NEW.appt_time, NEW.doctor_id) IS DISTINCT FROM (OLD.appt_date, OLD.appt_time, OLD.doctor_id) THEN
            PERFORM public.audit('appointments', NEW.appointment_id, 'RESCHEDULE',
                format('Moved to %s %s', NEW.appt_date, to_char(NEW.appt_time, 'HH24:MI')));
        ELSE
            PERFORM public.audit('appointments', NEW.appointment_id, 'UPDATE', 'Appointment details updated');
        END IF;
    ELSE
        PERFORM public.audit('appointments', OLD.appointment_id, 'DELETE',
            format('Deleted appointment of patient #%s on %s', OLD.patient_id, OLD.appt_date));
    END IF;
    RETURN NULL;
END $$;

CREATE TRIGGER trg_appt_audit
AFTER INSERT OR UPDATE OR DELETE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.trg_appt_audit();

-- C3. Automatic billing: a Completed appointment gets its invoice
CREATE FUNCTION public.trg_appt_invoice() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF OLD.status <> 'Completed' AND NEW.status = 'Completed' THEN
        INSERT INTO public.invoices (appointment_id, amount)
        SELECT NEW.appointment_id, consultation_fee FROM public.doctors WHERE doctor_id = NEW.doctor_id
        ON CONFLICT (appointment_id) DO NOTHING;
    END IF;
    RETURN NULL;
END $$;

CREATE TRIGGER trg_appt_invoice
AFTER UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.trg_appt_invoice();

-- C4. Generic audit trigger for simple tables.
--     TG_ARGV[0] = primary key column, TG_ARGV[1] = column used as a label.
CREATE FUNCTION public.trg_audit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    r jsonb;
BEGIN
    IF TG_OP = 'DELETE' THEN r := to_jsonb(OLD); ELSE r := to_jsonb(NEW); END IF;
    PERFORM public.audit(TG_TABLE_NAME, (r ->> TG_ARGV[0])::int, TG_OP,
        CASE TG_OP WHEN 'INSERT' THEN 'Created: ' WHEN 'UPDATE' THEN 'Updated: ' ELSE 'Deleted: ' END
        || COALESCE(r ->> TG_ARGV[1], ''));
    RETURN NULL;
END $$;

CREATE TRIGGER trg_audit_patients      AFTER INSERT OR UPDATE OR DELETE ON public.patients
    FOR EACH ROW EXECUTE FUNCTION public.trg_audit('patient_id', 'full_name');
CREATE TRIGGER trg_audit_doctors       AFTER INSERT OR UPDATE OR DELETE ON public.doctors
    FOR EACH ROW EXECUTE FUNCTION public.trg_audit('doctor_id', 'full_name');
CREATE TRIGGER trg_audit_departments   AFTER INSERT OR UPDATE OR DELETE ON public.departments
    FOR EACH ROW EXECUTE FUNCTION public.trg_audit('dept_id', 'dept_name');
CREATE TRIGGER trg_audit_prescriptions AFTER INSERT OR UPDATE OR DELETE ON public.prescriptions
    FOR EACH ROW EXECUTE FUNCTION public.trg_audit('prescription_id', 'medicine');

-- C5. Patients: date of birth cannot be in the future; users cannot re-link accounts
CREATE FUNCTION public.trg_patient_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
    IF NEW.date_of_birth > (now() AT TIME ZONE 'Asia/Dhaka')::date THEN
        RAISE EXCEPTION 'Date of birth cannot be in the future.';
    END IF;
    IF TG_OP = 'UPDATE' AND auth.uid() IS NOT NULL AND NOT public.is_admin()
       AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN
        RAISE EXCEPTION 'You cannot change the account link of a patient record.';
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER trg_patient_guard BEFORE INSERT OR UPDATE ON public.patients
    FOR EACH ROW EXECUTE FUNCTION public.trg_patient_guard();

-- C6. Doctors: a doctor may edit only schedule/phone, never fee, department or name
CREATE FUNCTION public.trg_doctor_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
        IF (NEW.user_id, NEW.dept_id, NEW.full_name, NEW.consultation_fee)
           IS DISTINCT FROM (OLD.user_id, OLD.dept_id, OLD.full_name, OLD.consultation_fee) THEN
            RAISE EXCEPTION 'Only an administrator can change name, department, fee or account link.';
        END IF;
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER trg_doctor_guard BEFORE UPDATE ON public.doctors
    FOR EACH ROW EXECUTE FUNCTION public.trg_doctor_guard();

-- C7. Every new doctor without a login gets an activation code
CREATE FUNCTION public.trg_doctor_invite() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NEW.user_id IS NULL THEN
        INSERT INTO public.doctor_invites (doctor_id, code)
        VALUES (NEW.doctor_id, upper(substr(md5(random()::text || clock_timestamp()::text || NEW.doctor_id), 1, 10)));
    END IF;
    RETURN NULL;
END $$;

CREATE TRIGGER trg_doctor_invite AFTER INSERT ON public.doctors
    FOR EACH ROW EXECUTE FUNCTION public.trg_doctor_invite();

-- C8. Profiles: nobody can promote themselves; only an admin can change roles
CREATE FUNCTION public.trg_profile_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
    IF auth.uid() IS NOT NULL THEN
        IF NEW.id <> OLD.id OR NEW.email <> OLD.email THEN
            RAISE EXCEPTION 'Account id and email cannot be changed here.';
        END IF;
        IF NEW.role <> OLD.role THEN
            IF NOT public.is_admin() THEN
                RAISE EXCEPTION 'Only an administrator can change roles.';
            END IF;
            IF auth.uid() = OLD.id THEN
                RAISE EXCEPTION 'You cannot change your own role.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER trg_profile_guard BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.trg_profile_guard();

-- C9. Prescriptions only for Confirmed or Completed appointments
CREATE FUNCTION public.trg_prescription_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_status public.appt_status;
BEGIN
    SELECT status INTO v_status FROM public.appointments WHERE appointment_id = NEW.appointment_id;
    IF v_status IS NULL OR v_status NOT IN ('Confirmed', 'Completed') THEN
        RAISE EXCEPTION 'A prescription can only be written for a Confirmed or Completed appointment.';
    END IF;
    IF TG_OP = 'INSERT' THEN
        NEW.created_by := auth.uid();
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER trg_prescription_guard BEFORE INSERT OR UPDATE ON public.prescriptions
    FOR EACH ROW EXECUTE FUNCTION public.trg_prescription_guard();

-- C10. Invoices: stamp paid_at automatically, Paid is final, amount locked once paid
CREATE FUNCTION public.trg_invoice_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
    IF NEW.appointment_id <> OLD.appointment_id THEN
        RAISE EXCEPTION 'An invoice cannot be moved to another appointment.';
    END IF;
    IF OLD.payment_status = 'Paid' AND (NEW.payment_status <> 'Paid' OR NEW.amount <> OLD.amount) THEN
        RAISE EXCEPTION 'A paid invoice cannot be changed.';
    END IF;
    IF OLD.payment_status = 'Unpaid' AND NEW.payment_status = 'Paid' THEN
        NEW.paid_at := now();
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER trg_invoice_guard BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.trg_invoice_guard();

CREATE FUNCTION public.trg_invoice_audit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.audit('invoices', NEW.invoice_id, 'INSERT',
            format('Invoice generated for appointment #%s, amount %s', NEW.appointment_id, NEW.amount));
    ELSIF OLD.payment_status = 'Unpaid' AND NEW.payment_status = 'Paid' THEN
        PERFORM public.audit('invoices', NEW.invoice_id, 'PAYMENT',
            format('Invoice #%s paid, amount %s', NEW.invoice_id, NEW.amount));
    END IF;
    RETURN NULL;
END $$;

CREATE TRIGGER trg_invoice_audit AFTER INSERT OR UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.trg_invoice_audit();

-- ---------------------------------------------------------------------
-- D. SIGN-UP TRIGGER: runs when Supabase creates a new login account
--    * with a doctor activation code  -> role 'doctor', linked to that doctor
--    * with patient details           -> role 'patient' + a patients row
--    * no details (created in the Supabase dashboard) -> role 'patient', no patients row
--    Nobody can register as admin; admins are promoted with SQL.
-- ---------------------------------------------------------------------
CREATE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    meta      jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
    v_code    text  := upper(NULLIF(trim(meta ->> 'doctor_code'), ''));
    v_name    text  := COALESCE(NULLIF(trim(meta ->> 'full_name'), ''), split_part(NEW.email, '@', 1));
    v_doctor  int;
BEGIN
    IF v_code IS NOT NULL THEN
        SELECT doctor_id INTO v_doctor FROM public.doctor_invites WHERE code = v_code;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Invalid or already used doctor activation code.';
        END IF;
        INSERT INTO public.profiles (id, email, full_name, role) VALUES (NEW.id, NEW.email, v_name, 'doctor');
        UPDATE public.doctors SET user_id = NEW.id WHERE doctor_id = v_doctor;
        DELETE FROM public.doctor_invites WHERE doctor_id = v_doctor;
    ELSE
        INSERT INTO public.profiles (id, email, full_name, role) VALUES (NEW.id, NEW.email, v_name, 'patient');
        IF meta ? 'gender' AND meta ? 'date_of_birth' AND meta ? 'phone' THEN
            INSERT INTO public.patients (user_id, full_name, gender, date_of_birth, phone, blood_group, address)
            VALUES (NEW.id, v_name,
                    (meta ->> 'gender')::public.gender_type,
                    (meta ->> 'date_of_birth')::date,
                    meta ->> 'phone',
                    NULLIF(meta ->> 'blood_group', '')::public.blood_group_type,
                    NULLIF(trim(meta ->> 'address'), ''));
        END IF;
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Lets the sign-up page check a code BEFORE creating the account.
-- Returns the doctor's name, or NULL if the code is wrong.
CREATE FUNCTION public.verify_doctor_code(p_code text) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT d.full_name
    FROM public.doctor_invites i JOIN public.doctors d ON d.doctor_id = i.doctor_id
    WHERE i.code = upper(trim(p_code));
$$;

-- ---------------------------------------------------------------------
-- E. BUSINESS FUNCTIONS (each call = ONE TRANSACTION: all or nothing)
-- ---------------------------------------------------------------------

-- E1. Book an appointment
CREATE FUNCTION public.book_appointment(
    p_patient_id int, p_doctor_id int, p_date date, p_time time,
    p_reason text, p_priority public.appt_priority DEFAULT 'Normal')
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_role public.user_role := public.auth_role();
    v_id   int;
BEGIN
    IF v_role IS NULL THEN
        RAISE EXCEPTION 'Please sign in first.';
    END IF;
    IF v_role = 'doctor' THEN
        RAISE EXCEPTION 'Doctors cannot book appointments.';
    END IF;
    IF v_role = 'patient' AND p_patient_id IS DISTINCT FROM public.my_patient_id() THEN
        RAISE EXCEPTION 'You can only book appointments for yourself.';
    END IF;
    INSERT INTO public.appointments (patient_id, doctor_id, appt_date, appt_time, reason, priority, created_by)
    VALUES (p_patient_id, p_doctor_id, p_date, p_time, p_reason, p_priority, auth.uid())
    RETURNING appointment_id INTO v_id;
    RETURN v_id;
END $$;

-- E2. Change an appointment status (rules differ per role)
CREATE FUNCTION public.set_appointment_status(p_appointment_id int, p_status public.appt_status)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_role public.user_role := public.auth_role();
    a      public.appointments%ROWTYPE;
BEGIN
    SELECT * INTO a FROM public.appointments WHERE appointment_id = p_appointment_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Appointment not found.';
    END IF;
    IF v_role = 'admin' THEN
        NULL;
    ELSIF v_role = 'doctor' THEN
        IF a.doctor_id IS DISTINCT FROM public.my_doctor_id() THEN
            RAISE EXCEPTION 'This is not your appointment.';
        END IF;
    ELSIF v_role = 'patient' THEN
        IF a.patient_id IS DISTINCT FROM public.my_patient_id() THEN
            RAISE EXCEPTION 'This is not your appointment.';
        END IF;
        IF p_status <> 'Cancelled' THEN
            RAISE EXCEPTION 'Patients can only cancel their appointments.';
        END IF;
    ELSE
        RAISE EXCEPTION 'Please sign in first.';
    END IF;
    UPDATE public.appointments SET status = p_status WHERE appointment_id = p_appointment_id;
END $$;

-- E3. Reschedule an appointment (admin, or the patient who owns it)
CREATE FUNCTION public.reschedule_appointment(p_appointment_id int, p_date date, p_time time)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_role public.user_role := public.auth_role();
    a      public.appointments%ROWTYPE;
BEGIN
    SELECT * INTO a FROM public.appointments WHERE appointment_id = p_appointment_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Appointment not found.';
    END IF;
    IF v_role = 'patient' THEN
        IF a.patient_id IS DISTINCT FROM public.my_patient_id() THEN
            RAISE EXCEPTION 'This is not your appointment.';
        END IF;
    ELSIF v_role IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION 'Only the patient or an administrator can reschedule.';
    END IF;
    UPDATE public.appointments SET appt_date = p_date, appt_time = p_time WHERE appointment_id = p_appointment_id;
END $$;

-- E4. Mark an invoice as paid (admin only)
CREATE FUNCTION public.mark_invoice_paid(p_invoice_id int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only an administrator can record payments.';
    END IF;
    UPDATE public.invoices SET payment_status = 'Paid' WHERE invoice_id = p_invoice_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice not found.';
    END IF;
END $$;

-- E5. Free 30-minute slots of a doctor on a date.
--     Uses a RECURSIVE CTE to generate the slots. SECURITY DEFINER lets
--     a patient see which slots are taken WITHOUT seeing other patients' data.
CREATE FUNCTION public.available_slots(p_doctor_id int, p_date date)
RETURNS TABLE (slot time) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    WITH RECURSIVE d AS (
        SELECT work_start, work_end, work_days, is_active
        FROM public.doctors WHERE doctor_id = p_doctor_id
    ),
    slots (t) AS (
        SELECT work_start FROM d
        UNION ALL
        SELECT (s.t + interval '30 minutes')::time
        FROM slots s, d
        WHERE (s.t + interval '30 minutes')::time < d.work_end
          AND (s.t + interval '30 minutes')::time > s.t
    )
    SELECT s.t AS slot
    FROM slots s, d
    WHERE d.is_active
      AND extract(isodow FROM p_date)::smallint = ANY (d.work_days)
      AND (p_date + s.t) > (now() AT TIME ZONE 'Asia/Dhaka')
      AND NOT EXISTS (SELECT 1 FROM public.appointments a
                      WHERE a.doctor_id = p_doctor_id AND a.appt_date = p_date
                        AND a.appt_time = s.t AND a.status <> 'Cancelled')
    ORDER BY s.t;
$$;

-- E6. One call returns every number the admin dashboard needs
CREATE FUNCTION public.get_dashboard_stats() RETURNS jsonb
LANGUAGE plpgsql STABLE SET search_path = public AS $$
DECLARE
    today date := (now() AT TIME ZONE 'Asia/Dhaka')::date;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Administrators only.';
    END IF;
    RETURN jsonb_build_object(
        'total_patients',     (SELECT count(*) FROM public.patients),
        'total_doctors',      (SELECT count(*) FROM public.doctors),
        'total_appointments', (SELECT count(*) FROM public.appointments),
        'pending',            (SELECT count(*) FROM public.appointments WHERE status = 'Pending'),
        'confirmed',          (SELECT count(*) FROM public.appointments WHERE status = 'Confirmed'),
        'completed',          (SELECT count(*) FROM public.appointments WHERE status = 'Completed'),
        'cancelled',          (SELECT count(*) FROM public.appointments WHERE status = 'Cancelled'),
        'revenue_collected',  (SELECT COALESCE(SUM(amount), 0) FROM public.invoices WHERE payment_status = 'Paid'),
        'revenue_pending',    (SELECT COALESCE(SUM(amount), 0) FROM public.invoices WHERE payment_status = 'Unpaid'),
        'by_day', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                        'day', to_char(g.d, 'YYYY-MM-DD'),
                        'count', (SELECT count(*) FROM public.appointments a WHERE a.appt_date = g.d::date))
                        ORDER BY g.d), '[]'::jsonb)
                   FROM generate_series(today - 6, today + 7, interval '1 day') AS g(d)),
        'by_department', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                        'dept', dept_name, 'appointments', appointment_count) ORDER BY dept_name), '[]'::jsonb)
                   FROM public.v_department_summary),
        'recent_activity', (SELECT COALESCE(jsonb_agg(to_jsonb(r)), '[]'::jsonb)
                   FROM (SELECT table_name, action, details, actor_email, performed_at
                         FROM public.audit_log ORDER BY performed_at DESC, log_id DESC LIMIT 8) r)
    );
END $$;

-- ---------------------------------------------------------------------
-- F. BACKFILL: give a profile to any login account that already exists
--    (for example if you created accounts before running this script).
--    They become 'patient'; promote your admin afterwards (06_make_admin.sql).
-- ---------------------------------------------------------------------
INSERT INTO public.profiles (id, email, full_name, role)
SELECT u.id, u.email, split_part(u.email, '@', 1), 'patient'
FROM auth.users u
WHERE u.email IS NOT NULL
ON CONFLICT (id) DO NOTHING;
