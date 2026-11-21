// Read-only data every portal needs: departments, doctors and free time slots.
import { supabase } from '@/core/supabase/client.js';
import { clean, must } from './helpers.js';

export const departments = async () => must(await supabase.from('departments').select('*').order('dept_name'));

export const doctors = async ({ search = '', deptId = '', activeOnly = false } = {}) => {
  let q = supabase.from('doctors').select('*, departments(dept_name)').order('full_name');
  if (deptId) q = q.eq('dept_id', deptId);
  if (activeOnly) q = q.eq('is_active', true);
  const s = clean(search);
  if (s) q = q.ilike('full_name', `%${s}%`);
  return must(await q);
};

// Calls the database function available_slots() (a recursive query that builds 30-minute slots)
export const slots = async (doctorId, date) =>
  must(await supabase.rpc('available_slots', { p_doctor_id: Number(doctorId), p_date: date }));
