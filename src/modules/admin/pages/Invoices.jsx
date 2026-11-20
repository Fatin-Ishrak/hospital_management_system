// ADMIN: invoices and payments. Invoices are created automatically by a database trigger when an
// appointment is completed. The admin records payments here (database function mark_invoice_paid).
import { useState } from 'react';
import { BadgeCheck, Eye, Hourglass, Receipt, RefreshCw, Wallet } from 'lucide-react';
import { api } from '@/core/api';
import { adminApi } from '../api.js';
import { useData } from '@/core/hooks/hooks.js';
import { useToast } from '@/core/toast/ToastContext.jsx';
import { Button, Card, EmptyState, ErrorBox, PageHeader, PageLoader, Pagination, PayBadge, Select, StatCard, Table, Td } from '@/core/ui';
import InvoiceView from '@/core/components/InvoiceView.jsx';
import { fmtDate, money } from '@/core/utils/format.js';

const SIZE = 10;

export default function AdminInvoices() {
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const list = useData(() => api.invoices({ status, page, size: SIZE }), [status, page]);
  const totals = useData(() => api.invoiceTotals(), []);
  const [view, setView] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const refresh = () => { list.reload(); totals.reload(); };
  const pay = async (inv) => {
    setBusyId(inv.invoice_id);
    try {
      await adminApi.markPaid(inv.invoice_id);
      toast.success(`Invoice #${inv.invoice_id} marked as paid.`);
      refresh();
    } catch (err) {
      toast.error(err);
    }
    setBusyId(null);
  };
  const t = totals.data;
  const rows = list.data?.rows ?? [];

  return (
    <>
      <PageHeader title="Invoices & payments" subtitle="Invoices are created automatically when an appointment is completed.">
        <Button variant="secondary" onClick={refresh}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </PageHeader>
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={Wallet} tone="green" label="Paid" value={money(t?.collected)} />
        <StatCard icon={Hourglass} tone="amber" label="Unpaid" value={money(t?.pending)} hint={t ? `${t.unpaidCount} invoice(s)` : ''} />
        <StatCard icon={Receipt} tone="blue" label="Total invoices" value={t?.count ?? '—'} />
      </div>
      <Card>
        <div className="p-4 border-b border-slate-100">
          <Select className="w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by payment status">
            <option value="">All invoices</option><option>Unpaid</option><option>Paid</option>
          </Select>
        </div>
        {list.error && <div className="p-4"><ErrorBox error={list.error} onRetry={list.reload} /></div>}
        {list.loading && !list.data ? (
          <PageLoader />
        ) : (
          <>
            <Table columns={['Invoice', 'Visit date', 'Patient', 'Doctor', 'Amount', 'Status', 'Actions']} empty={!rows.length && <EmptyState icon={Receipt} title="No invoices yet" />}>
              {rows.map((i) => (
                <tr key={i.invoice_id} className="hover:bg-slate-50/60">
                  <Td className="font-medium">#{i.invoice_id}</Td>
                  <Td className="whitespace-nowrap">{fmtDate(i.appointments?.appt_date)}</Td>
                  <Td>{i.appointments?.patients?.full_name}</Td>
                  <Td>{i.appointments?.doctors?.full_name}</Td>
                  <Td className="font-semibold">{money(i.amount)}</Td>
                  <Td><PayBadge status={i.payment_status} /></Td>
                  <Td>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="secondary" onClick={() => setView(i)}><Eye className="h-3.5 w-3.5" /> View</Button>
                      {i.payment_status === 'Unpaid' && (
                        <Button size="sm" variant="success" loading={busyId === i.invoice_id} onClick={() => pay(i)}><BadgeCheck className="h-3.5 w-3.5" /> Mark paid</Button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
            <Pagination page={page} size={SIZE} count={list.data?.count ?? 0} onPage={setPage} />
          </>
        )}
      </Card>
      <InvoiceView invoice={view} onClose={() => setView(null)} />
    </>
  );
}
