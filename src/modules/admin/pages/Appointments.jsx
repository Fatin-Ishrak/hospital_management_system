// ADMIN: all appointments. Search, filter, book, confirm, complete, reschedule, cancel and delete.
import { useState } from 'react';
import { CalendarClock, CalendarPlus, Check, CheckCheck, RefreshCw, Trash2, X } from 'lucide-react';
import { api } from '@/core/api';
import { adminApi } from '../api.js';
import { useData, useDebounce } from '@/core/hooks/hooks.js';
import { useToast } from '@/core/toast/ToastContext.jsx';
import {
  Button, Card, ConfirmDialog, EmptyState, ErrorBox, Modal, PageHeader, PageLoader, Pagination,
  PayBadge, PriorityBadge, SearchBox, Select, StatusBadge, Table, Td,
} from '@/core/ui';
import RescheduleModal from '@/core/components/RescheduleModal.jsx';
import AdminBookForm from '../components/AdminBookForm.jsx';
import { fmtDate, fmtTime, todayStr } from '@/core/utils/format.js';

const SIZE = 10;

export default function AdminAppointments() {
  const toast = useToast();
  const today = todayStr();
  const [f, setF] = useState({ search: '', status: '', when: 'all', doctorId: '' });
  const [page, setPage] = useState(1);
  const search = useDebounce(f.search);
  const list = useData(
    () => api.appointments({ search, status: f.status, when: f.when, doctorId: f.doctorId, today, page, size: SIZE }),
    [search, f.status, f.when, f.doctorId, page]
  );
  const doctors = useData(() => api.doctors(), []);
  const [cancelFor, setCancelFor] = useState(null);
  const [resched, setResched] = useState(null);
  const [deleteFor, setDeleteFor] = useState(null);
  const [showBook, setShowBook] = useState(false);
  const [busy, setBusy] = useState(false);
  const setFilter = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setPage(1); };

  const change = async (a, status) => {
    setBusy(true);
    try {
      await api.setStatus(a.appointment_id, status);
      toast.success(`Appointment marked ${status}.`);
      list.reload();
    } catch (err) {
      toast.error(err);
    }
    setBusy(false);
    setCancelFor(null);
  };
  const remove = async () => {
    setBusy(true);
    try {
      await adminApi.deleteAppointment(deleteFor.appointment_id);
      toast.success('Appointment deleted.');
      list.reload();
    } catch (err) {
      toast.error(err);
    }
    setBusy(false);
    setDeleteFor(null);
  };

  const rows = list.data?.rows ?? [];
  const open = (a) => a.status === 'Pending' || a.status === 'Confirmed';

  return (
    <>
      <PageHeader title="Appointments" subtitle="Search, filter and manage appointments.">
        <Button variant="secondary" onClick={list.reload}><RefreshCw className="h-4 w-4" /> Refresh</Button>
        <Button onClick={() => setShowBook(true)}><CalendarPlus className="h-4 w-4" /> New appointment</Button>
      </PageHeader>
      <Card>
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-100">
          <SearchBox value={f.search} onChange={(v) => { setF({ ...f, search: v }); setPage(1); }} placeholder="Search patient, doctor or reason" />
          <Select className="w-40" value={f.status} onChange={setFilter('status')} aria-label="Filter by status">
            <option value="">All statuses</option>
            <option>Pending</option><option>Confirmed</option><option>Completed</option><option>Cancelled</option>
          </Select>
          <Select className="w-40" value={f.when} onChange={setFilter('when')} aria-label="Filter by time">
            <option value="all">Any date</option><option value="today">Today</option>
            <option value="upcoming">Upcoming</option><option value="past">Past</option>
          </Select>
          <Select className="w-52" value={f.doctorId} onChange={setFilter('doctorId')} aria-label="Filter by doctor">
            <option value="">All doctors</option>
            {(doctors.data ?? []).map((d) => <option key={d.doctor_id} value={d.doctor_id}>{d.full_name}</option>)}
          </Select>
        </div>
        {list.error && <div className="p-4"><ErrorBox error={list.error} onRetry={list.reload} /></div>}
        {list.loading && !list.data ? (
          <PageLoader />
        ) : (
          <>
            <Table columns={['#', 'Date & time', 'Patient', 'Doctor', 'Reason', 'Status', 'Invoice', 'Actions']} empty={!rows.length && <EmptyState title="No appointments found" text="Try changing the filters." />}>
              {rows.map((a) => (
                <tr key={a.appointment_id} className="hover:bg-slate-50/60">
                  <Td className="text-slate-400">#{a.appointment_id}</Td>
                  <Td className="whitespace-nowrap"><div className="font-medium text-slate-900">{fmtDate(a.appt_date)}</div><div className="text-xs text-slate-500">{fmtTime(a.appt_time)}</div></Td>
                  <Td>{a.patient_name}</Td>
                  <Td><div>{a.doctor_name}</div><div className="text-xs text-slate-500">{a.dept_name}</div></Td>
                  <Td className="max-w-[16rem]"><div className="truncate" title={a.reason}>{a.reason}</div>{a.priority !== 'Normal' && <PriorityBadge priority={a.priority} />}</Td>
                  <Td><StatusBadge status={a.status} /></Td>
                  <Td><PayBadge status={a.payment_status} /></Td>
                  <Td>
                    <div className="flex flex-wrap gap-1.5">
                      {a.status === 'Pending' && <Button size="sm" variant="secondary" disabled={busy} onClick={() => change(a, 'Confirmed')}><Check className="h-3.5 w-3.5" /> Confirm</Button>}
                      {a.status === 'Confirmed' && <Button size="sm" variant="success" disabled={busy} onClick={() => change(a, 'Completed')}><CheckCheck className="h-3.5 w-3.5" /> Complete</Button>}
                      {open(a) && <Button size="sm" variant="secondary" onClick={() => setResched(a)}><CalendarClock className="h-3.5 w-3.5" /> Reschedule</Button>}
                      {open(a) && <Button size="sm" variant="dangerOutline" onClick={() => setCancelFor(a)}><X className="h-3.5 w-3.5" /> Cancel</Button>}
                      <Button size="sm" variant="ghost" onClick={() => setDeleteFor(a)} aria-label="Delete appointment"><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
            <Pagination page={page} size={SIZE} count={list.data?.count ?? 0} onPage={setPage} />
          </>
        )}
      </Card>
      <Modal open={showBook} title="New appointment" onClose={() => setShowBook(false)} wide>
        <AdminBookForm onBooked={() => { setShowBook(false); list.reload(); }} />
      </Modal>
      <RescheduleModal appt={resched} onClose={() => setResched(null)} onDone={list.reload} />
      <ConfirmDialog
        open={Boolean(cancelFor)} danger loading={busy} title="Cancel this appointment?"
        message={cancelFor && `${fmtDate(cancelFor.appt_date)} at ${fmtTime(cancelFor.appt_time)} will be cancelled. This cannot be undone.`}
        confirmText="Yes, cancel it" onCancel={() => setCancelFor(null)} onConfirm={() => change(cancelFor, 'Cancelled')}
      />
      <ConfirmDialog
        open={Boolean(deleteFor)} danger loading={busy} title="Delete this appointment?"
        message="The record will be removed from the database. Appointments that already have an invoice cannot be deleted."
        confirmText="Delete" onCancel={() => setDeleteFor(null)} onConfirm={remove}
      />
    </>
  );
}
