// DOCTOR: prescriptions this doctor wrote. Create, edit and delete.
// A prescription is only allowed for a Confirmed or Completed appointment (database trigger).
import { useState } from 'react';
import { Pencil, Pill, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { api } from '@/core/api';
import { doctorApi } from '../api.js';
import { useData, useDebounce } from '@/core/hooks/hooks.js';
import { useToast } from '@/core/toast/ToastContext.jsx';
import { Button, Card, ConfirmDialog, EmptyState, ErrorBox, PageHeader, PageLoader, Pagination, SearchBox, Table, Td } from '@/core/ui';
import PrescriptionDialog from '../components/PrescriptionDialog.jsx';
import { fmtDate } from '@/core/utils/format.js';

const SIZE = 10;

export default function DoctorPrescriptions() {
  const toast = useToast();
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const search = useDebounce(searchText);
  const list = useData(() => api.prescriptions({ search, page, size: SIZE }), [search, page]);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleteFor, setDeleteFor] = useState(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await doctorApi.deletePrescription(deleteFor.prescription_id);
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
      <PageHeader title="Prescriptions" subtitle="Prescriptions you wrote. Only for Confirmed or Completed appointments.">
        <Button variant="secondary" onClick={list.reload}><RefreshCw className="h-4 w-4" /> Refresh</Button>
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New prescription</Button>
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
            <Table columns={['Date', 'Patient', 'Medicine', 'Dosage', 'Days', 'Instructions', 'Actions']} empty={!rows.length && <EmptyState icon={Pill} title="No prescriptions" text="They appear here after you prescribe medicine." />}>
              {rows.map((p) => (
                <tr key={p.prescription_id} className="hover:bg-slate-50/60">
                  <Td className="whitespace-nowrap">{fmtDate(p.appointments?.appt_date)}</Td>
                  <Td>{p.appointments?.patients?.full_name}</Td>
                  <Td className="font-medium text-slate-900">{p.medicine}</Td>
                  <Td>{p.dosage}</Td>
                  <Td>{p.duration_days}</Td>
                  <Td className="max-w-[14rem] truncate" title={p.instructions || ''}>{p.instructions || '—'}</Td>
                  <Td>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="secondary" onClick={() => setEditing(p)} aria-label="Edit prescription"><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteFor(p)} aria-label="Delete prescription"><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
            <Pagination page={page} size={SIZE} count={list.data?.count ?? 0} onPage={setPage} />
          </>
        )}
      </Card>
      <PrescriptionDialog open={creating || Boolean(editing)} editing={editing} onClose={() => { setCreating(false); setEditing(null); }} onSaved={list.reload} />
      <ConfirmDialog
        open={Boolean(deleteFor)} danger loading={busy} title="Delete this prescription?"
        message={deleteFor && `${deleteFor.medicine} will be removed.`} confirmText="Delete"
        onCancel={() => setDeleteFor(null)} onConfirm={remove}
      />
    </>
  );
}
