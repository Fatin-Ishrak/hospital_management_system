// Database reads needed to know WHO is logged in and WHICH portal they belong to.
import { supabase } from '@/core/supabase/client.js';

const must = ({ data, error }) => {
  if (error) throw error;
  return data;
};

export const authApi = {
  profile: async (uid) => must(await supabase.from('profiles').select('*').eq('id', uid).maybeSingle()),
  myDoctor: async (uid) =>
    must(await supabase.from('doctors').select('*, departments(dept_name)').eq('user_id', uid).maybeSingle()),
  myPatient: async (uid) => must(await supabase.from('patients').select('*').eq('user_id', uid).maybeSingle()),
};
