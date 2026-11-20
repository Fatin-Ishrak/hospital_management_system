// DOCTOR: this doctor's own appointments. Confirm, complete, cancel and write prescriptions.
// The database only returns this doctor's appointments (Row Level Security).
import { useState } from 'react';
import { Check, CheckCheck, Pill, RefreshCw, X } from 'lucide-react';
import { api } from '@/core/api';
import { doctorApi } from '../api.js';
import { useData, useDebounce } from '@/core/hooks/hooks.js';
import { useToast } from '@/core/toast/ToastContext.jsx';
import {
  Button, Card, ConfirmDialog, EmptyState, ErrorBox, PageHeader, PageLoader, Pagination,
  PriorityBadge, SearchBox, Select, StatusBadge, Table, Td,
} from '@/core/ui';
import PrescriptionDialog from '../components/PrescriptionDialog.jsx';
import { fmtDate, fmtTime, todayStr } from '@/core/utils/format.js';

const SIZE = 10;

export default function DoctorAppointments() {
  const toast = useToast();
  const today = todayStr();
  const [f, setF] = useState({ search: '', status: '', when: 'all' });
  const [page, setPage] = useState(1);
  const search = useDebounce(f.search);
  const list = useData(
    () => api.appointments({ search, status: f.status, when: f.when, today, page, size: SIZE }),
    [search, f.status, f.when, page]
  );
  const [cancelFor, setCancelFor] = useState(null);
  const [prescFor, setPrescFor] = useState(null);
  const [busy, setBusy] = useState(false);
  const setFilter = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setPage(1); };

  const run = async (action, a, message) => {
    setBusy(true);
    try {
      await doctorApi[action](a.appointment_id);
      toast.success(message);
      list.reload();
    } catch (err) {
      toast.error(err);
    }
    setBusy(false);
    setCancelFor(null);
  };
  const rows = list.data?.rows ?? [];
  const open = (a) => a.status === 'Pending' || a.status === 'Confirmed';

  return (
    <>
      <PageHeader title="Appointments" subtitle="Your patients’ visits. Confirm, complete and prescribe.">
        <Button variant="secondary" onClick={list.reload}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </PageHeader>
      <Card>
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-100">
          <SearchBox value={f.search} onChange={(v) => { setF({ ...f, search: v }); setPage(1); }} placeholder="Search patient or reason" />
          <Select className="w-40" value={f.status} onChange={setFilter('status')} aria-label="Filter by status">
            <option value="">All statuses</option>
            <option>Pending</option><option>Confirmed</option><option>Completed</option><option>Cancelled</option>
          </Select>
          <Select className="w-40" value={f.when} onChange={setFilter('when')} aria-label="Filter by time">
            <option value="all">Any date</option><option value="today">Today</option>
            <option value="upcoming">Upcoming</option><option value="past">Past</option>
          </Select>
        </div>
        {list.error && <div className="p-4"><ErrorBox error={list.error} onRetry={list.reload} /></div>}
        {list.loading && !list.data ? (
          <PageLoader />
        ) : (
          <>
            <Table columns={['Date & time', 'Patient', 'Reason', 'Status', 'Actions']} empty={!rows.length && <EmptyState title="No appointments found" text="Try changing the filters." />}>
              {rows.map((a) => (
                <tr key={a.appointment_id} className="hover:bg-slate-50/60">
                  <Td className="whitespace-nowrap"><div className="font-medium text-slate-900">{fmtDate(a.appt_date)}</div><div className="text-xs text-slate-500">{fmtTime(a.appt_time)}</div></Td>
                  <Td>{a.patient_name}</Td>
                  <Td className="max-w-[16rem]"><div className="truncate" title={a.reason}>{a.reason}</div>{a.priority !== 'Normal' && <PriorityBadge priority={a.priority} />}</Td>
                  <Td><StatusBadge status={a.status} /></Td>
                  <Td>
                    <div className="flex flex-wrap gap-1.5">
                      {a.status === 'Pending' && <Button size="sm" variant="secondary" disabled={busy} onClick={() => run('confirm', a, 'Appointment marked Confirmed.')}><Check className="h-3.5 w-3.5" /> Confirm</Button>}
                      {a.status === 'Confirmed' && <Button size="sm" variant="success" disabled={busy} onClick={() => run('complete', a, 'Appointment marked Completed.')}><CheckCheck className="h-3.5 w-3.5" /> Complete</Button>}
                      {(a.status === 'Confirmed' || a.status === 'Completed') && <Button size="sm" variant="secondary" onClick={() => setPrescFor(a)}><Pill className="h-3.5 w-3.5" /> Prescribe</Button>}
                      {open(a) && <Button size="sm" variant="dangerOutline" onClick={() => setCancelFor(a)}><X className="h-3.5 w-3.5" /> Cancel</Button>}
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
            <Pagination page={page} size={SIZE} count={list.data?.count ?? 0} onPage={setPage} />
          </>
        )}
      </Card>
      <PrescriptionDialog open={Boolean(prescFor)} appointment={prescFor} onClose={() => setPrescFor(null)} onSaved={() => {}} />
      <ConfirmDialog
        open={Boolean(cancelFor)} danger loading={busy} title="Cancel this appointment?"
        message={cancelFor && `${fmtDate(cancelFor.appt_date)} at ${fmtTime(cancelFor.appt_time)} will be cancelled. This cannot be undone.`}
        confirmText="Yes, cancel it" onCancel={() => setCancelFor(null)} onConfirm={() => run('cancel', cancelFor, 'Appointment marked Cancelled.')}
      />
    </>
  );
}
