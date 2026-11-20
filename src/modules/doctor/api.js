// DOCTOR module database operations (owner: Member 2).
// A doctor can only change their own schedule and write prescriptions for their own appointments;
// the database enforces this with Row Level Security and triggers.
import { supabase } from '@/core/supabase/client.js';
import { api } from '@/core/api';
import { must } from '@/core/api/helpers.js';

export const doctorApi = {
  /* activation (used before login on the /activate page) */
  verifyActivationCode: async (code) => must(await supabase.rpc('verify_doctor_code', { p_code: code })),

  /* dashboard numbers: workload view + today's and upcoming appointments */
  overview: async (doctorId, today) => {
    const [work, todayRows, upcoming] = await Promise.all([
      supabase.from('v_doctor_workload').select('*').eq('doctor_id', doctorId).maybeSingle(),
      supabase.from('v_appointment_details').select('*').eq('doctor_id', doctorId).eq('appt_date', today).order('appt_time'),
      supabase.from('v_appointment_details').select('*').eq('doctor_id', doctorId).gt('appt_date', today)
        .in('status', ['Pending', 'Confirmed']).order('appt_date').order('appt_time').limit(6),
    ]);
    return { work: must(work), today: must(todayRows), upcoming: must(upcoming) };
  },

  /* schedule and profile (name, department and fee can only be changed by the administrator) */
  updateSelf: async (id, patch) =>
    must(await supabase.from('doctors').update(patch).eq('doctor_id', id).select().maybeSingle()),

  /* appointment status: the database function checks that the appointment belongs to this doctor */
  confirm: (id) => api.setStatus(id, 'Confirmed'),
  complete: (id) => api.setStatus(id, 'Completed'),
  cancel: (id) => api.setStatus(id, 'Cancelled'),

  /* prescriptions */
  prescribable: async () =>
    must(
      await supabase.from('v_appointment_details').select('*').in('status', ['Confirmed', 'Completed'])
        .order('appt_date', { ascending: false }).limit(100)
    ),
  savePrescription: async (p) => {
    const row = {
      medicine: p.medicine.trim(),
      dosage: p.dosage.trim(),
      duration_days: Number(p.duration_days),
      instructions: p.instructions?.trim() || null,
    };
    return must(
      p.prescription_id
        ? await supabase.from('prescriptions').update(row).eq('prescription_id', p.prescription_id)
        : await supabase.from('prescriptions').insert({ ...row, appointment_id: Number(p.appointment_id) })
    );
  },
  deletePrescription: async (id) => must(await supabase.from('prescriptions').delete().eq('prescription_id', id)),
};
