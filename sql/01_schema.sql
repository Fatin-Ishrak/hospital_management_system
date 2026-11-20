-- =====================================================================
-- 01_schema.sql  -  HOSPITAL MANAGEMENT SYSTEM (PostgreSQL / Supabase)
-- Creates: data types, 9 tables, constraints, indexes.
-- Run this FIRST in the Supabase SQL Editor.
-- =====================================================================

-- ---------- 1. ENUM TYPES (a column can only hold these values) ------
CREATE TYPE public.user_role         AS ENUM ('admin', 'doctor', 'patient');
CREATE TYPE public.gender_type       AS ENUM ('Male', 'Female', 'Other');
CREATE TYPE public.blood_group_type  AS ENUM ('A+','A-','B+','B-','AB+','AB-','O+','O-');
CREATE TYPE public.appt_status       AS ENUM ('Pending', 'Confirmed', 'Completed', 'Cancelled');
CREATE TYPE public.appt_priority     AS ENUM ('Normal', 'Urgent', 'Emergency');
CREATE TYPE public.payment_status    AS ENUM ('Unpaid', 'Paid');

-- ---------- 2. TABLES -------------------------------------------------

-- 2.1 profiles: one row per login account (Supabase keeps the password
--     in its own auth.users table; we only store role and name here).
CREATE TABLE public.profiles (
    id          uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    email       text NOT NULL UNIQUE,
    full_name   text,
    role        public.user_role NOT NULL DEFAULT 'patient',
    created_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_profiles_email CHECK (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

-- 2.2 departments: lookup table
CREATE TABLE public.departments (
    dept_id      int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    dept_name    text NOT NULL UNIQUE,
    description  text,
    CONSTRAINT chk_dept_name CHECK (length(trim(dept_name)) >= 2)
);

-- 2.3 doctors: user_id stays NULL until the doctor activates a login
CREATE TABLE public.doctors (
    doctor_id        int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id          uuid UNIQUE REFERENCES public.profiles (id) ON DELETE SET NULL,
    dept_id          int NOT NULL REFERENCES public.departments (dept_id)
                         ON DELETE RESTRICT ON UPDATE CASCADE,
    full_name        text NOT NULL,
    phone            text NOT NULL,
    consultation_fee numeric(8,2) NOT NULL DEFAULT 500.00,
    work_start       time NOT NULL DEFAULT '09:00',
    work_end         time NOT NULL DEFAULT '17:00',
    work_days        smallint[] NOT NULL DEFAULT '{1,2,3,4,5,6,7}',   -- ISO: 1=Mon ... 7=Sun
    is_active        boolean NOT NULL DEFAULT true,                   -- availability switch
    created_at       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_doctor_name  CHECK (length(trim(full_name)) >= 2),
    CONSTRAINT chk_doctor_phone CHECK (phone ~ '^[0-9]{10,15}$'),
    CONSTRAINT chk_doctor_fee   CHECK (consultation_fee >= 0),
    CONSTRAINT chk_doctor_hours CHECK (work_end > work_start),
    CONSTRAINT chk_doctor_days  CHECK (cardinality(work_days) BETWEEN 1 AND 7
                                       AND work_days <@ ARRAY[1,2,3,4,5,6,7]::smallint[])
);

-- 2.4 doctor_invites: one-time activation code for each doctor who has no login yet
CREATE TABLE public.doctor_invites (
    doctor_id   int PRIMARY KEY REFERENCES public.doctors (doctor_id) ON DELETE CASCADE,
    code        text NOT NULL UNIQUE,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- 2.5 patients: user_id is NULL for walk-in patients added by the admin
CREATE TABLE public.patients (
    patient_id     int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id        uuid UNIQUE REFERENCES public.profiles (id) ON DELETE SET NULL,
    full_name      text NOT NULL,
    gender         public.gender_type NOT NULL,
    date_of_birth  date NOT NULL,
    phone          text NOT NULL,
    blood_group    public.blood_group_type,
    address        text,
    created_at     timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_patient_name  CHECK (length(trim(full_name)) >= 2),
    CONSTRAINT chk_patient_phone CHECK (phone ~ '^[0-9]{10,15}$'),
    CONSTRAINT chk_patient_dob   CHECK (date_of_birth > DATE '1900-01-01')
);

-- 2.6 appointments: junction table between patients and doctors
CREATE TABLE public.appointments (
    appointment_id  int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id      int NOT NULL REFERENCES public.patients (patient_id)
                        ON DELETE RESTRICT ON UPDATE CASCADE,
    doctor_id       int NOT NULL REFERENCES public.doctors (doctor_id)
                        ON DELETE RESTRICT ON UPDATE CASCADE,
    appt_date       date NOT NULL,
    appt_time       time NOT NULL,
    reason          text NOT NULL,
    priority        public.appt_priority NOT NULL DEFAULT 'Normal',
    status          public.appt_status   NOT NULL DEFAULT 'Pending',
    created_by      uuid REFERENCES auth.users (id) ON DELETE SET NULL,
    created_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_appt_reason CHECK (length(trim(reason)) >= 3)
);

-- 2.7 prescriptions: many medicines per appointment
CREATE TABLE public.prescriptions (
    prescription_id  int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    appointment_id   int NOT NULL REFERENCES public.appointments (appointment_id)
                         ON DELETE CASCADE ON UPDATE CASCADE,
    medicine         text NOT NULL,
    dosage           text NOT NULL,
    duration_days    int  NOT NULL,
    instructions     text,
    created_by       uuid REFERENCES auth.users (id) ON DELETE SET NULL,
    created_at       timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT chk_presc_days     CHECK (duration_days BETWEEN 1 AND 365),
    CONSTRAINT chk_presc_medicine CHECK (length(trim(medicine)) >= 2)
);

-- 2.8 invoices: one bill per appointment (RESTRICT: money records must not vanish)
CREATE TABLE public.invoices (
    invoice_id      int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    appointment_id  int NOT NULL UNIQUE REFERENCES public.appointments (appointment_id)
                        ON DELETE RESTRICT ON UPDATE CASCADE,
    amount          numeric(10,2) NOT NULL,
    payment_status  public.payment_status NOT NULL DEFAULT 'Unpaid',
    issued_at       timestamptz NOT NULL DEFAULT now(),
    paid_at         timestamptz,
    CONSTRAINT chk_invoice_amount CHECK (amount >= 0),
    CONSTRAINT chk_invoice_paid   CHECK (payment_status = 'Unpaid' OR paid_at IS NOT NULL)
);

-- 2.9 audit_log: written only by triggers. No foreign keys on purpose,
--     so history survives even when the original row is deleted.
CREATE TABLE public.audit_log (
    log_id        int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    table_name    text NOT NULL,
    record_id     int,
    action        text NOT NULL,
    details       text,
    actor_id      uuid,
    actor_email   text,
    performed_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------- 3. INDEXES -----------------------------------------------
-- PostgreSQL does NOT index foreign-key columns automatically, so we do it.
CREATE INDEX idx_doctors_dept        ON public.doctors (dept_id);
CREATE INDEX idx_appt_patient        ON public.appointments (patient_id);
CREATE INDEX idx_appt_doctor_date    ON public.appointments (doctor_id, appt_date);
CREATE INDEX idx_appt_date           ON public.appointments (appt_date);
CREATE INDEX idx_appt_status_date    ON public.appointments (status, appt_date);
CREATE INDEX idx_presc_appt          ON public.prescriptions (appointment_id);
CREATE INDEX idx_invoice_status      ON public.invoices (payment_status);
CREATE INDEX idx_patients_name       ON public.patients (lower(full_name) text_pattern_ops);
CREATE INDEX idx_doctors_name        ON public.doctors (lower(full_name) text_pattern_ops);
CREATE INDEX idx_audit_time          ON public.audit_log (performed_at DESC);

-- PARTIAL UNIQUE INDEXES: the database itself prevents double booking.
-- Cancelled appointments are ignored, so a cancelled slot can be booked again.
CREATE UNIQUE INDEX uq_doctor_slot  ON public.appointments (doctor_id,  appt_date, appt_time)
    WHERE status <> 'Cancelled';
CREATE UNIQUE INDEX uq_patient_slot ON public.appointments (patient_id, appt_date, appt_time)
    WHERE status <> 'Cancelled';
