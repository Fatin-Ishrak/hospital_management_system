-- =====================================================================
-- 05_seed.sql  -  FICTIONAL sample data for the demonstration.
-- Run this FIFTH, and BEFORE you create your demo login accounts,
-- because it clears the hospital tables first (it never deletes logins).
-- Dates are relative to today (Dhaka time), so charts always look fresh.
-- =====================================================================
TRUNCATE public.audit_log, public.invoices, public.prescriptions, public.appointments,
         public.doctor_invites, public.patients, public.doctors, public.departments
         RESTART IDENTITY CASCADE;

INSERT INTO public.departments (dept_name, description) VALUES
('Cardiology',       'Heart and blood vessel care'),
('Dermatology',      'Skin, hair and nail care'),
('Neurology',        'Brain and nervous system care'),
('Pediatrics',       'Medical care for children'),
('Orthopedics',      'Bones, joints and muscles'),
('General Medicine', 'Primary care and routine checkups');

-- Each doctor automatically receives an activation code (table doctor_invites)
INSERT INTO public.doctors (dept_id, full_name, phone, consultation_fee, work_start, work_end) VALUES
(1, 'Dr. Rahim Uddin',   '01711000001', 1000.00, '09:00', '17:00'),
(2, 'Dr. Nusrat Jahan',  '01711000002',  700.00, '10:00', '18:00'),
(3, 'Dr. Tanvir Hasan',  '01711000003', 1200.00, '10:00', '16:00'),
(4, 'Dr. Sadia Islam',   '01711000004',  600.00, '09:00', '15:00'),
(5, 'Dr. Kamal Hossain', '01711000005',  900.00, '13:00', '19:00'),
(6, 'Dr. Farhana Akter', '01711000006',  500.00, '09:00', '17:00');

INSERT INTO public.patients (full_name, gender, date_of_birth, phone, blood_group, address) VALUES
('Karim Ahmed',     'Male',   '1985-03-12', '01811000001', 'B+',  'Mirpur, Dhaka'),
('Sumaiya Rahman',  'Female', '1994-07-25', '01811000002', 'O+',  'Dhanmondi, Dhaka'),
('Rafiq Islam',     'Male',   '1972-11-02', '01811000003', 'A+',  'Uttara, Dhaka'),
('Nabila Khan',     'Female', '2018-05-18', '01811000004', 'AB+', 'Savar, Dhaka'),
('Imran Hossain',   'Male',   '1999-01-30', '01811000005', 'O-',  'Ashulia, Dhaka'),
('Tasnim Akter',    'Female', '2001-09-09', '01811000006', 'A-',  'Ashulia, Dhaka'),
('Jahid Hasan',     'Male',   '1990-12-21', '01811000007', 'B-',  'Mohakhali, Dhaka'),
('Mitu Sultana',    'Female', '1988-04-14', '01811000008', 'O+',  'Banani, Dhaka'),
('Shakil Mahmud',   'Male',   '1965-08-03', '01811000009', 'AB-', 'Gazipur'),
('Lamia Chowdhury', 'Female', '2015-02-27', '01811000010', 'B+',  'Tongi, Gazipur');

-- Past-dated sample appointments would be rejected by the validation
-- trigger, so it is switched off only while the sample rows go in.
ALTER TABLE public.appointments DISABLE TRIGGER USER;

INSERT INTO public.appointments (patient_id, doctor_id, appt_date, appt_time, reason, priority, status)
SELECT v.p, v.d, (now() AT TIME ZONE 'Asia/Dhaka')::date + v.off, v.t::time, v.reason,
       v.prio::public.appt_priority, v.st::public.appt_status
FROM (VALUES
 ( 1, 1, -20, '09:00', 'Chest pain check',      'Urgent',    'Completed'),
 ( 2, 2, -18, '10:30', 'Skin rash',             'Normal',    'Completed'),
 ( 3, 3, -15, '11:00', 'Recurring headache',    'Normal',    'Completed'),
 ( 4, 4, -14, '09:30', 'Child fever',           'Urgent',    'Completed'),
 ( 5, 5, -12, '14:00', 'Knee pain',             'Normal',    'Completed'),
 ( 6, 6, -10, '10:00', 'General checkup',       'Normal',    'Completed'),
 ( 1, 1,  -9, '09:30', 'Heart follow-up',       'Normal',    'Completed'),
 ( 7, 6,  -8, '11:30', 'Cold and cough',        'Normal',    'Completed'),
 ( 8, 2,  -7, '15:00', 'Acne treatment',        'Normal',    'Completed'),
 ( 9, 3,  -6, '12:00', 'Dizziness',             'Urgent',    'Completed'),
 (10, 4,  -5, '10:00', 'Vaccination',           'Normal',    'Completed'),
 ( 2, 6,  -4, '09:00', 'Fever',                 'Normal',    'Completed'),
 ( 3, 1,  -3, '15:00', 'Blood pressure review', 'Normal',    'Cancelled'),
 ( 5, 2,   2, '11:00', 'Skin allergy',          'Normal',    'Cancelled'),
 ( 1, 1,   1, '09:00', 'Routine heart check',   'Normal',    'Confirmed'),
 ( 4, 4,   1, '10:30', 'Child checkup',         'Normal',    'Pending'),
 ( 6, 3,   2, '10:00', 'Migraine',              'Urgent',    'Confirmed'),
 ( 7, 5,   2, '14:30', 'Back pain',             'Normal',    'Pending'),
 ( 8, 6,   3, '11:00', 'Fatigue and weakness',  'Normal',    'Pending'),
 ( 9, 1,   3, '09:30', 'Palpitations',          'Emergency', 'Pending'),
 (10, 2,   4, '12:00', 'Eczema',                'Normal',    'Confirmed'),
 ( 2, 5,   5, '15:00', 'Shoulder pain',         'Normal',    'Pending'),
 ( 3, 3,   6, '11:00', 'Neurology follow-up',   'Normal',    'Pending'),
 ( 5, 6,   1, '14:00', 'Stomach pain',          'Normal',    'Pending')
) AS v(p, d, off, t, reason, prio, st);

INSERT INTO public.prescriptions (appointment_id, medicine, dosage, duration_days, instructions) VALUES
(1,  'Aspirin 75mg',           '1 tablet after lunch',      30, 'Avoid heavy meals'),
(1,  'Atorvastatin 10mg',      '1 tablet at night',         30, NULL),
(2,  'Hydrocortisone cream',   'Apply twice daily',         10, 'Do not scratch'),
(3,  'Paracetamol 500mg',      '1 tablet when needed',       5, 'Maximum 3 tablets a day'),
(4,  'Paracetamol syrup',      '5 ml every 6 hours',         3, 'Give with water'),
(5,  'Ibuprofen 400mg',        '1 tablet after meals, twice',7, 'Rest the knee'),
(6,  'Vitamin D3',             '1 capsule weekly',          60, NULL),
(8,  'Cetirizine 10mg',        '1 tablet at night',          5, NULL),
(9,  'Benzoyl peroxide gel',   'Apply at night',            30, 'Use sunscreen'),
(10, 'Betahistine 16mg',       '1 tablet twice daily',      14, 'Rise slowly from bed'),
(12, 'Paracetamol 500mg',      '1 tablet every 8 hours',     3, NULL);

INSERT INTO public.invoices (appointment_id, amount, payment_status, issued_at, paid_at)
SELECT a.appointment_id, d.consultation_fee,
       CASE WHEN a.appointment_id IN (10, 11, 12) THEN 'Unpaid' ELSE 'Paid' END::public.payment_status,
       (a.appt_date + a.appt_time) AT TIME ZONE 'Asia/Dhaka',
       CASE WHEN a.appointment_id IN (10, 11, 12) THEN NULL
            ELSE (a.appt_date + a.appt_time) AT TIME ZONE 'Asia/Dhaka' END
FROM public.appointments a JOIN public.doctors d ON d.doctor_id = a.doctor_id
WHERE a.status = 'Completed';

ALTER TABLE public.appointments ENABLE TRIGGER USER;

-- Start the audit log empty, so it shows only real actions made later
TRUNCATE public.audit_log RESTART IDENTITY;
