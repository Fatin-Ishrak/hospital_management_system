// Appointment reads and the database functions that change appointments.
// The database (RLS + triggers + functions) decides who may do what, so these are safe to share.
import { supabase } from '@/core/supabase/client.js';
import { clean, must, paged } from './helpers.js';

export const appointments = async ({
  search = '', status = '', doctorId = '', patientId = '', when = 'all', today, page = 1, size = 10,
} = {}) => {
  let q = supabase.from('v_appointment_details').select('*', { count: 'exact' });
  if (status) q = q.eq('status', status);
  if (doctorId) q = q.eq('doctor_id', doctorId);
  if (patientId) q = q.eq('patient_id', patientId);
  if (when === 'today') q = q.eq('appt_date', today);
  if (when === 'upcoming') q = q.gte('appt_date', today).in('status', ['Pending', 'Confirmed']);
  if (when === 'past') q = q.lt('appt_date', today);
  const s = clean(search);
  if (s) q = q.or(`patient_name.ilike.%${s}%,doctor_name.ilike.%${s}%,reason.ilike.%${s}%`);
  const asc = when === 'upcoming' || when === 'today';
  q = q.order('appt_date', { ascending: asc }).order('appt_time', { ascending: asc });
  return paged(q, page, size);
};

export const patientHistory = async (patientId) =>
  must(
    await supabase.from('v_appointment_details').select('*').eq('patient_id', patientId)
      .order('appt_date', { ascending: false }).order('appt_time', { ascending: false }).limit(50)
  );

export const doctorSchedule = async (doctorId, fromDate) =>
  must(
    await supabase.from('v_appointment_details').select('*').eq('doctor_id', doctorId)
      .gte('appt_date', fromDate).in('status', ['Pending', 'Confirmed'])
      .order('appt_date').order('appt_time').limit(100)
  );

export const book = async ({ patientId, doctorId, date, time, reason, priority }) =>
  must(
    await supabase.rpc('book_appointment', {
      p_patient_id: Number(patientId), p_doctor_id: Number(doctorId),
      p_date: date, p_time: time, p_reason: reason, p_priority: priority,
    })
  );

export const setStatus = async (id, status) =>
  must(await supabase.rpc('set_appointment_status', { p_appointment_id: id, p_status: status }));

export const reschedule = async (id, date, time) =>
  must(await supabase.rpc('reschedule_appointment', { p_appointment_id: id, p_date: date, p_time: time }));
