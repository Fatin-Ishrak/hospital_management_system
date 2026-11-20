-- =====================================================================
-- 03_views.sql  -  Saved queries that behave like read-only tables.
-- security_invoker = true means each user sees only the rows that their
-- own security policies allow (a patient's view only shows that patient).
-- Run this THIRD.
-- =====================================================================

-- 3.1 Everything about an appointment (multi-table JOIN)
CREATE VIEW public.v_appointment_details WITH (security_invoker = true) AS
SELECT a.appointment_id, a.appt_date, a.appt_time, a.reason, a.priority, a.status, a.created_at,
       p.patient_id, p.full_name AS patient_name, p.gender, p.phone AS patient_phone,
       public.fn_patient_age(p.date_of_birth) AS patient_age,
       d.doctor_id,  d.full_name AS doctor_name,
       dep.dept_id,  dep.dept_name,
       d.consultation_fee,
       i.invoice_id, i.payment_status
FROM public.appointments a
JOIN public.patients     p   ON p.patient_id = a.patient_id
JOIN public.doctors      d   ON d.doctor_id  = a.doctor_id
JOIN public.departments  dep ON dep.dept_id  = d.dept_id
LEFT JOIN public.invoices i  ON i.appointment_id = a.appointment_id;

-- 3.2 Workload and income of each doctor (GROUP BY + aggregates)
CREATE VIEW public.v_doctor_workload WITH (security_invoker = true) AS
SELECT d.doctor_id, d.full_name AS doctor_name, dep.dept_name,
       COUNT(a.appointment_id)                                         AS total_appointments,
       COUNT(a.appointment_id) FILTER (WHERE a.status = 'Pending')     AS pending_count,
       COUNT(a.appointment_id) FILTER (WHERE a.status = 'Confirmed')   AS confirmed_count,
       COUNT(a.appointment_id) FILTER (WHERE a.status = 'Completed')   AS completed_count,
       COUNT(a.appointment_id) FILTER (WHERE a.status = 'Cancelled')   AS cancelled_count,
       COALESCE(SUM(i.amount) FILTER (WHERE i.payment_status = 'Paid'), 0) AS revenue_collected
FROM public.doctors d
JOIN public.departments dep        ON dep.dept_id = d.dept_id
LEFT JOIN public.appointments a    ON a.doctor_id = d.doctor_id
LEFT JOIN public.invoices i        ON i.appointment_id = a.appointment_id
GROUP BY d.doctor_id, d.full_name, dep.dept_name;

-- 3.3 Department summary
CREATE VIEW public.v_department_summary WITH (security_invoker = true) AS
SELECT dep.dept_id, dep.dept_name,
       COUNT(DISTINCT d.doctor_id)        AS doctor_count,
       COUNT(a.appointment_id)            AS appointment_count,
       COALESCE(SUM(i.amount), 0)         AS billed_amount
FROM public.departments dep
LEFT JOIN public.doctors d        ON d.dept_id = dep.dept_id
LEFT JOIN public.appointments a   ON a.doctor_id = d.doctor_id
LEFT JOIN public.invoices i       ON i.appointment_id = a.appointment_id
GROUP BY dep.dept_id, dep.dept_name;

-- 3.4 Revenue per month (paid invoices only)
CREATE VIEW public.v_revenue_by_month WITH (security_invoker = true) AS
SELECT date_trunc('month', issued_at AT TIME ZONE 'Asia/Dhaka')::date AS month,
       COUNT(*)                                                       AS invoices_paid,
       SUM(amount)                                                    AS revenue
FROM public.invoices
WHERE payment_status = 'Paid'
GROUP BY 1
ORDER BY 1;
