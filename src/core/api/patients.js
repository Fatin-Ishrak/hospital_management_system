// Read-only patient lists. Row Level Security decides which patients each role may see:
// admin = all, doctor = only own patients, patient = only themselves.
import { supabase } from '@/core/supabase/client.js';
import { clean, must, paged } from './helpers.js';

export const patients = async ({ search = '', gender = '', page = 1, size = 10 } = {}) => {
  let q = supabase.from('patients').select('*', { count: 'exact' }).order('full_name');
  const s = clean(search);
  if (s) q = q.or(`full_name.ilike.%${s}%,phone.ilike.%${s}%`);
  if (gender) q = q.eq('gender', gender);
  return paged(q, page, size);
};

export const allPatients = async () =>
  must(await supabase.from('patients').select('patient_id, full_name, phone').order('full_name'));
