// Read prescriptions (each role only receives its own rows from the database).
import { supabase } from '@/core/supabase/client.js';
import { clean, paged } from './helpers.js';

export const prescriptions = async ({ search = '', page = 1, size = 10 } = {}) => {
  let q = supabase
    .from('prescriptions')
    .select('*, appointments(appt_date, status, patients(full_name), doctors(full_name))', { count: 'exact' })
    .order('created_at', { ascending: false });
  const s = clean(search);
  if (s) q = q.ilike('medicine', `%${s}%`);
  return paged(q, page, size);
};
