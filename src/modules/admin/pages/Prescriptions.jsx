// ADMIN: view all prescriptions and delete one if needed. (Doctors write them in the doctor portal.)
import { useState } from 'react';
import { Pill, RefreshCw, Trash2 } from 'lucide-react';
import { api } from '@/core/api';
import { adminApi } from '../api.js';
import { useData, useDebounce } from '@/core/hooks/hooks.js';
import { useToast } from '@/core/toast/ToastContext.jsx';
import { Button, Card, ConfirmDialog, EmptyState, ErrorBox, PageHeader, PageLoader, Pagination, SearchBox, Table, Td } from '@/core/ui';
import { fmtDate } from '@/core/utils/format.js';

const SIZE = 10;

export default function AdminPrescriptions() {
  const toast = useToast();
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const search = useDebounce(searchText);
  const list = useData(() => api.prescriptions({ search, page, size: SIZE }), [search, page]);
  const [deleteFor, setDeleteFor] = useState(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await adminApi.deletePrescription(deleteFor.prescription_id);
      toast.success('Prescription deleted.');
      list.reload();
    } catch (err) {
      toast.error(err);
    }
    setBusy(false);
    setDeleteFor(null);
  };
  const rows = list.data?.rows ?? [];

  return (
    <>
      <PageHeader title="Prescriptions" subtitle="Medicines prescribed after appointments.">
        <Button variant="secondary" onClick={list.reload}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </PageHeader>
      <Card>
        <div className="p-4 border-b border-slate-100">
          <SearchBox value={searchText} onChange={(v) => { setSearchText(v); setPage(1); }} placeholder="Search medicine" />
        </div>
        {list.error && <div className="p-4"><ErrorBox error={list.error} onRetry={list.reload} /></div>}
        {list.loading && !list.data ? (
          <PageLoader />
        ) : (
          <>
            <Table columns={['Date', 'Patient', 'Doctor', 'Medicine', 'Dosage', 'Days', 'Instructions', 'Actions']} empty={!rows.length && <EmptyState icon={Pill} title="No prescriptions" text="They appear here after a doctor prescribes medicine." />}>
              {rows.map((p) => (
                <tr key={p.prescription_id} className="hover:bg-slate-50/60">
                  <Td className="whitespace-nowrap">{fmtDate(p.appointments?.appt_date)}</Td>
                  <Td>{p.appointments?.patients?.full_name}</Td>
                  <Td>{p.appointments?.doctors?.full_name}</Td>
                  <Td className="font-medium text-slate-900">{p.medicine}</Td>
                  <Td>{p.dosage}</Td>
                  <Td>{p.duration_days}</Td>
                  <Td className="max-w-[14rem] truncate" title={p.instructions || ''}>{p.instructions || '—'}</Td>
                  <Td><Button size="sm" variant="ghost" onClick={() => setDeleteFor(p)} aria-label="Delete prescription"><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button></Td>
                </tr>
              ))}
            </Table>
            <Pagination page={page} size={SIZE} count={list.data?.count ?? 0} onPage={setPage} />
          </>
        )}
      </Card>
      <ConfirmDialog
        open={Boolean(deleteFor)} danger loading={busy} title="Delete this prescription?"
        message={deleteFor && `${deleteFor.medicine} will be removed.`} confirmText="Delete"
        onCancel={() => setDeleteFor(null)} onConfirm={remove}
      />
    </>
  );
}
