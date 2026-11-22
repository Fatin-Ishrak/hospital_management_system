// PATIENT module database operations (owner: Member 3).
// A patient only ever receives their own rows: Row Level Security filters everything else out.
import { supabase } from '@/core/supabase/client.js';
import { must } from '@/core/api/helpers.js';

export const patientApi = {
  /* dashboard numbers */
  overview: async (patientId, today) => {
    const [upcoming, completed, presc, unpaid] = await Promise.all([
      supabase.from('v_appointment_details').select('*').eq('patient_id', patientId).gte('appt_date', today)
        .in('status', ['Pending', 'Confirmed']).order('appt_date').order('appt_time').limit(5),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('patient_id', patientId).eq('status', 'Completed'),
      supabase.from('prescriptions').select('*', { count: 'exact', head: true }),
      supabase.from('invoices').select('invoice_id, amount, payment_status').eq('payment_status', 'Unpaid'),
    ]);
    const unpaidRows = must(unpaid);
    return {
      upcoming: must(upcoming),
      completed: completed.count ?? 0,
      prescriptions: presc.count ?? 0,
      unpaidCount: unpaidRows.length,
      unpaidTotal: unpaidRows.reduce((s, r) => s + Number(r.amount), 0),
    };
  },

  /* own profile (a patient cannot change their role or account link; the database refuses it) */
  updateSelf: async (id, patch) =>
    must(await supabase.from('patients').update(patch).eq('patient_id', id).select().maybeSingle()),
};
