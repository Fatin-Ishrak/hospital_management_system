// DOCTOR: edit own working hours, working days and availability; see upcoming bookings.
import { useState } from 'react';
import { api } from '@/core/api';
import { doctorApi } from '../api.js';
import { Save } from 'lucide-react';

import { useData } from '@/core/hooks/hooks.js';
import { useAuth } from '@/core/auth/AuthContext.jsx';
import { useToast } from '@/core/toast/ToastContext.jsx';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  PageLoader,
  Table,
  Td,
} from '@/core/ui';
import { DAYS, cn, fmtDate, fmtTime, hhmm, money, todayStr } from '@/core/utils/format.js';
import { PHONE_RE } from '@/core/utils/validation.js';

export default function DoctorSchedule() {
  const { doctor, refresh } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({
    phone: doctor.phone, work_start: hhmm(doctor.work_start), work_end: hhmm(doctor.work_end),
    work_days: doctor.work_days, is_active: doctor.is_active,
  });
  const [busy, setBusy] = useState(false);
  const upcoming = useData(() => api.doctorSchedule(doctor.doctor_id, todayStr()), [doctor.doctor_id]);

  const toggle = (n) => setF({ ...f, work_days: f.work_days.includes(n) ? f.work_days.filter((d) => d !== n) : [...f.work_days, n].sort() });

  const save = async (e) => {
    e.preventDefault();
    if (!PHONE_RE.test(f.phone.trim())) return toast.error('Phone must be 10 to 15 digits (numbers only).');
    if (!f.work_days.length) return toast.error('Select at least one working day.');
    if (f.work_end <= f.work_start) return toast.error('Working end time must be after the start time.');
    setBusy(true);
    try {
      await doctorApi.updateSelf(doctor.doctor_id, { ...f, phone: f.phone.trim() });
      toast.success('Your schedule was updated.');
      await refresh();
      upcoming.reload();
    } catch (err) {
      toast.error(err);
    }
    setBusy(false);
  };

  return (
    <>
      <PageHeader title="My schedule & availability" subtitle="Set when patients can book you. Name, department and fee are managed by the administrator." />
      <div className="grid lg:grid-cols-5 gap-4">
        <Card className="p-6 lg:col-span-2">
          <form onSubmit={save} className="space-y-4">
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">{doctor.full_name}</p>
              <p>{doctor.departments?.dept_name} · fee {money(doctor.consultation_fee)}</p>
            </div>
            <Field label="Phone" required><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} inputMode="numeric" required /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="From"><Input type="time" value={f.work_start} onChange={(e) => setF({ ...f, work_start: e.target.value })} required /></Field>
              <Field label="Until"><Input type="time" value={f.work_end} onChange={(e) => setF({ ...f, work_end: e.target.value })} required /></Field>
            </div>
            <Field label="Working days">
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d) => (
                  <button key={d.n} type="button" onClick={() => toggle(d.n)} aria-pressed={f.work_days.includes(d.n)}
                    className={cn('rounded-lg border px-3 py-1.5 text-sm font-medium', f.work_days.includes(d.n) ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 bg-white text-slate-600')}>
                    {d.label}
                  </button>
                ))}
              </div>
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} className="h-4 w-4 accent-teal-600" />
              I am available for new appointments
            </label>
            <Button type="submit" loading={busy}><Save className="h-4 w-4" /> Save schedule</Button>
          </form>
        </Card>
        <Card className="lg:col-span-3 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100"><h2 className="font-semibold text-slate-900">Upcoming bookings</h2></div>
          {upcoming.loading && !upcoming.data ? <PageLoader /> : (
            <Table columns={['Date', 'Time', 'Patient', 'Status']} empty={!(upcoming.data ?? []).length && <EmptyState title="No upcoming bookings" />}>
              {(upcoming.data ?? []).map((a) => (
                <tr key={a.appointment_id}>
                  <Td>{fmtDate(a.appt_date)}</Td><Td>{fmtTime(a.appt_time)}</Td><Td>{a.patient_name}</Td>
                  <Td><Badge tone={a.status === 'Confirmed' ? 'blue' : 'amber'}>{a.status}</Badge></Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
