// ADMIN module database operations (owner: Member 1).
// Only an administrator can run these successfully: Row Level Security and the database
// functions refuse everybody else, even if the API is called directly.
import { supabase } from '@/core/supabase/client.js';
import { must, paged } from '@/core/api/helpers.js';

export const adminApi = {
  /* dashboard + audit */
  dashboardStats: async () => must(await supabase.rpc('get_dashboard_stats')),
  auditLog: async ({ table = '', action = '', page = 1, size = 15 } = {}) => {
    let q = supabase.from('audit_log').select('*', { count: 'exact' })
      .order('performed_at', { ascending: false }).order('log_id', { ascending: false });
    if (table) q = q.eq('table_name', table);
    if (action) q = q.eq('action', action);
    return paged(q, page, size);
  },

  /* users and roles */
  profiles: async () => must(await supabase.from('profiles').select('*').order('created_at', { ascending: false })),
  setRole: async (id, role) => must(await supabase.from('profiles').update({ role }).eq('id', id)),

  /* departments */
  departmentSummary: async () => must(await supabase.from('v_department_summary').select('*').order('dept_name')),
  saveDepartment: async (d) => {
    const row = { dept_name: d.dept_name.trim(), description: d.description?.trim() || null };
    return must(
      d.dept_id
        ? await supabase.from('departments').update(row).eq('dept_id', d.dept_id)
        : await supabase.from('departments').insert(row)
    );
  },
  deleteDepartment: async (id) => must(await supabase.from('departments').delete().eq('dept_id', id)),

  /* doctors + activation codes */
  doctorInvites: async () => must(await supabase.from('doctor_invites').select('doctor_id, code')),
  saveDoctor: async (d) => {
    const row = {
      dept_id: Number(d.dept_id),
      full_name: d.full_name.trim(),
      phone: d.phone.trim(),
      consultation_fee: Number(d.consultation_fee),
      work_start: d.work_start,
      work_end: d.work_end,
      work_days: d.work_days,
      is_active: d.is_active,
    };
    return must(
      d.doctor_id
        ? await supabase.from('doctors').update(row).eq('doctor_id', d.doctor_id)
        : await supabase.from('doctors').insert(row)
    );
  },
  deleteDoctor: async (id) => must(await supabase.from('doctors').delete().eq('doctor_id', id)),

  /* patients */
  savePatient: async (p) => {
    const row = {
      full_name: p.full_name.trim(),
      gender: p.gender,
      date_of_birth: p.date_of_birth,
      phone: p.phone.trim(),
      blood_group: p.blood_group || null,
      address: p.address?.trim() || null,
    };
    return must(
      p.patient_id
        ? await supabase.from('patients').update(row).eq('patient_id', p.patient_id)
        : await supabase.from('patients').insert(row)
    );
  },
  deletePatient: async (id) => must(await supabase.from('patients').delete().eq('patient_id', id)),

  /* appointments, prescriptions, invoices */
  deleteAppointment: async (id) => must(await supabase.from('appointments').delete().eq('appointment_id', id)),
  deletePrescription: async (id) => must(await supabase.from('prescriptions').delete().eq('prescription_id', id)),
  markPaid: async (id) => must(await supabase.rpc('mark_invoice_paid', { p_invoice_id: id })),
};
