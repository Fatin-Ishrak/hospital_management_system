// PATIENT: appointment history. Reschedule or cancel upcoming visits.
// The database only returns this patient's own appointments (Row Level Security).
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, CalendarPlus, RefreshCw, X } from 'lucide-react';
import { api } from '@/core/api';
import { useData, useDebounce } from '@/core/hooks/hooks.js';
import { useToast } from '@/core/toast/ToastContext.jsx';
import {
  Button, Card, ConfirmDialog, EmptyState, ErrorBox, PageHeader, PageLoader, Pagination,
  PayBadge, PriorityBadge, SearchBox, Select, StatusBadge, Table, Td,
} from '@/core/ui';
import RescheduleModal from '@/core/components/RescheduleModal.jsx';
import { fmtDate, fmtTime, todayStr } from '@/core/utils/format.js';

const SIZE = 10;

export default function MyAppointments() {
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
  const [resched, setResched] = useState(null);
  const [busy, setBusy] = useState(false);
  const setFilter = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setPage(1); };

  const cancel = async () => {
    setBusy(true);
    try {
      await api.setStatus(cancelFor.appointment_id, 'Cancelled');
      toast.success('Appointment cancelled.');
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
      <PageHeader title="My appointments" subtitle="Search, filter and manage your appointments.">
        <Button variant="secondary" onClick={list.reload}><RefreshCw className="h-4 w-4" /> Refresh</Button>
        <Link to="/patient/book"><Button><CalendarPlus className="h-4 w-4" /> Book appointment</Button></Link>
      </PageHeader>
      <Card>
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-100">
          <SearchBox value={f.search} onChange={(v) => { setF({ ...f, search: v }); setPage(1); }} placeholder="Search doctor or reason" />
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
            <Table columns={['Date & time', 'Doctor', 'Reason', 'Status', 'Invoice', 'Actions']} empty={!rows.length && <EmptyState title="No appointments found" text="Try changing the filters." />}>
              {rows.map((a) => (
                <tr key={a.appointment_id} className="hover:bg-slate-50/60">
                  <Td className="whitespace-nowrap"><div className="font-medium text-slate-900">{fmtDate(a.appt_date)}</div><div className="text-xs text-slate-500">{fmtTime(a.appt_time)}</div></Td>
                  <Td><div>{a.doctor_name}</div><div className="text-xs text-slate-500">{a.dept_name}</div></Td>
                  <Td className="max-w-[16rem]"><div className="truncate" title={a.reason}>{a.reason}</div>{a.priority !== 'Normal' && <PriorityBadge priority={a.priority} />}</Td>
                  <Td><StatusBadge status={a.status} /></Td>
                  <Td><PayBadge status={a.payment_status} /></Td>
                  <Td>
                    <div className="flex flex-wrap gap-1.5">
                      {open(a) && <Button size="sm" variant="secondary" onClick={() => setResched(a)}><CalendarClock className="h-3.5 w-3.5" /> Reschedule</Button>}
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
      <RescheduleModal appt={resched} onClose={() => setResched(null)} onDone={list.reload} />
      <ConfirmDialog
        open={Boolean(cancelFor)} danger loading={busy} title="Cancel this appointment?"
        message={cancelFor && `${fmtDate(cancelFor.appt_date)} at ${fmtTime(cancelFor.appt_time)} will be cancelled. This cannot be undone.`}
        confirmText="Yes, cancel it" onCancel={() => setCancelFor(null)} onConfirm={cancel}
      />
    </>
  );
}
