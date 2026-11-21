// Read invoices (each role only receives its own rows from the database).
import { supabase } from '@/core/supabase/client.js';
import { must, paged } from './helpers.js';

export const invoices = async ({ status = '', page = 1, size = 10 } = {}) => {
  let q = supabase
    .from('invoices')
    .select(
      '*, appointments(appt_date, appt_time, reason, patients(full_name, phone), doctors(full_name, departments(dept_name)))',
      { count: 'exact' }
    )
    .order('invoice_id', { ascending: false });
  if (status) q = q.eq('payment_status', status);
  return paged(q, page, size);
};

export const invoiceTotals = async () => {
  const rows = must(await supabase.from('invoices').select('amount, payment_status'));
  const t = { collected: 0, pending: 0, count: rows.length, unpaidCount: 0 };
  rows.forEach((r) => {
    if (r.payment_status === 'Paid') t.collected += Number(r.amount);
    else { t.pending += Number(r.amount); t.unpaidCount += 1; }
  });
  return t;
};
