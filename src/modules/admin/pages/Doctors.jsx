// ADMIN: add, edit, delete doctors, set hours/days/availability, view schedules and copy activation codes.
import { useState } from 'react';
import { api } from '@/core/api';
import { adminApi } from '../api.js';
import { CalendarRange, Copy, KeyRound, Pencil, Plus, RefreshCw, Stethoscope, Trash2 } from 'lucide-react';

import { useData, useDebounce } from '@/core/hooks/hooks.js';
import { useToast } from '@/core/toast/ToastContext.jsx';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorBox,
  Field,
  Input,
  Modal,
  PageHeader,
  PageLoader,
  SearchBox,
  Select,
  Table,
  Td,
} from '@/core/ui';
import { DAYS, cn, daysText, fmtDate, fmtTime, hhmm, money, todayStr } from '@/core/utils/format.js';
import { PHONE_RE } from '@/core/utils/validation.js';

const blank = {
  full_name: '', phone: '', dept_id: '', consultation_fee: 500, work_start: '09:00', work_end: '17:00',
  work_days: [1, 2, 3, 4, 5, 6, 7], is_active: true,
};

export default function AdminDoctors() {
  const toast = useToast();
  const [searchText, setSearchText] = useState('');
  const [deptId, setDeptId] = useState('');
  const search = useDebounce(searchText);
  const list = useData(() => api.doctors({ search, deptId }), [search, deptId]);
  const depts = useData(() => api.departments(), []);
  const invites = useData(() => adminApi.doctorInvites(), []);
  const [form, setForm] = useState(null);
  const [deleteFor, setDeleteFor] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [busy, setBusy] = useState(false);

  const codeOf = (id) => invites.data?.find((i) => i.doctor_id === id)?.code;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggleDay = (n) =>
    setForm({ ...form, work_days: form.work_days.includes(n) ? form.work_days.filter((d) => d !== n) : [...form.work_days, n].sort() });
  const refresh = () => { list.reload(); invites.reload(); };

  const save = async (e) => {
    e.preventDefault();
    if (!PHONE_RE.test(form.phone.trim())) return toast.error('Phone must be 10 to 15 digits (numbers only).');
    if (!form.work_days.length) return toast.error('Select at least one working day.');
    if (form.work_end <= form.work_start) return toast.error('Working end time must be after the start time.');
    setBusy(true);
    try {
      await adminApi.saveDoctor(form);
      toast.success(form.doctor_id ? 'Doctor updated.' : 'Doctor added. An activation code was created automatically.');
      setForm(null);
      refresh();
    } catch (err) {
      toast.error(err);
    }
    setBusy(false);
  };
  const remove = async () => {
    setBusy(true);
    try {
      await adminApi.deleteDoctor(deleteFor.doctor_id);
      toast.success('Doctor deleted.');
      refresh();
    } catch (err) {
      toast.error(err);
    }
    setBusy(false);
    setDeleteFor(null);
  };
  const openSchedule = async (d) => {
    setSchedule({ doctor: d, rows: null });
    try {
      setSchedule({ doctor: d, rows: await api.doctorSchedule(d.doctor_id, todayStr()) });
    } catch (err) {
      toast.error(err);
      setSchedule(null);
    }
  };
  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); toast.success('Code copied.'); } catch { toast.error('Could not copy. Select the code and copy it manually.'); }
  };

  const rows = list.data ?? [];
  return (
    <>
      <PageHeader title="Doctors" subtitle="Manage doctors, departments, working hours and availability.">
        <Button variant="secondary" onClick={refresh}><RefreshCw className="h-4 w-4" /> Refresh</Button>
        <Button onClick={() => setForm({ ...blank, dept_id: depts.data?.[0]?.dept_id ?? '' })}><Plus className="h-4 w-4" /> Add doctor</Button>
      </PageHeader>
      <Card>
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-100">
          <SearchBox value={searchText} onChange={setSearchText} placeholder="Search doctor name" />
          <Select className="w-52" value={deptId} onChange={(e) => setDeptId(e.target.value)} aria-label="Filter by department">
            <option value="">All departments</option>
            {(depts.data ?? []).map((d) => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
          </Select>
        </div>
        {list.error && <div className="p-4"><ErrorBox error={list.error} onRetry={list.reload} /></div>}
        {list.loading && !list.data ? (
          <PageLoader />
        ) : (
          <Table columns={['Doctor', 'Department', 'Fee', 'Hours & days', 'Status', 'Account', 'Actions']} empty={!rows.length && <EmptyState icon={Stethoscope} title="No doctors found" />}>
            {rows.map((d) => (
              <tr key={d.doctor_id} className="hover:bg-slate-50/60">
                <Td><div className="font-medium text-slate-900">{d.full_name}</div><div className="text-xs text-slate-500">{d.phone}</div></Td>
                <Td>{d.departments?.dept_name}</Td>
                <Td>{money(d.consultation_fee)}</Td>
                <Td className="whitespace-nowrap">{fmtTime(d.work_start)} – {fmtTime(d.work_end)}<div className="text-xs text-slate-500">{daysText(d.work_days)}</div></Td>
                <Td>{d.is_active ? <Badge tone="green">Available</Badge> : <Badge tone="red">Unavailable</Badge>}</Td>
                <Td>
                  {d.user_id ? (
                    <Badge tone="blue">Account active</Badge>
                  ) : codeOf(d.doctor_id) ? (
                    <button onClick={() => copy(codeOf(d.doctor_id))} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1 text-xs font-mono text-amber-800 ring-1 ring-amber-200" title="Click to copy the activation code">
                      <KeyRound className="h-3 w-3" /> {codeOf(d.doctor_id)} <Copy className="h-3 w-3" />
                    </button>
                  ) : '—'}
                </Td>
                <Td>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="secondary" onClick={() => openSchedule(d)}><CalendarRange className="h-3.5 w-3.5" /> Schedule</Button>
                    <Button size="sm" variant="secondary" onClick={() => setForm({ ...d, work_start: hhmm(d.work_start), work_end: hhmm(d.work_end) })} aria-label="Edit doctor"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteFor(d)} aria-label="Delete doctor"><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal open={Boolean(form)} title={form?.doctor_id ? 'Edit doctor' : 'Add doctor'} onClose={() => setForm(null)} wide>
        {form && (
          <form onSubmit={save} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full name" required><Input value={form.full_name} onChange={set('full_name')} required minLength={2} /></Field>
              <Field label="Phone" required hint="Digits only"><Input value={form.phone} onChange={set('phone')} inputMode="numeric" required /></Field>
              <Field label="Department" required>
                <Select value={form.dept_id} onChange={set('dept_id')} required>
                  <option value="">Select…</option>
                  {(depts.data ?? []).map((d) => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
                </Select>
              </Field>
              <Field label="Consultation fee (৳)" required>
                <Input type="number" min={0} step="0.01" value={form.consultation_fee} onChange={set('consultation_fee')} required />
              </Field>
              <Field label="Working from" required><Input type="time" value={form.work_start} onChange={set('work_start')} required /></Field>
              <Field label="Working until" required><Input type="time" value={form.work_end} onChange={set('work_end')} required /></Field>
            </div>
            <Field label="Working days">
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d) => (
                  <button key={d.n} type="button" onClick={() => toggleDay(d.n)} aria-pressed={form.work_days.includes(d.n)}
                    className={cn('rounded-lg border px-3 py-1.5 text-sm font-medium', form.work_days.includes(d.n) ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 bg-white text-slate-600')}>
                    {d.label}
                  </button>
                ))}
              </div>
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4 accent-teal-600" />
              Available for new appointments
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
              <Button type="submit" loading={busy}>{form.doctor_id ? 'Save changes' : 'Add doctor'}</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={Boolean(schedule)} title={schedule ? `Schedule: ${schedule.doctor.full_name}` : ''} onClose={() => setSchedule(null)} wide>
        {schedule && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Works {fmtTime(schedule.doctor.work_start)} – {fmtTime(schedule.doctor.work_end)} · {daysText(schedule.doctor.work_days)} · 30-minute slots
            </p>
            {!schedule.rows ? <PageLoader /> : (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <Table columns={['Date', 'Time', 'Patient', 'Reason', 'Status']} empty={!schedule.rows.length && <EmptyState title="No upcoming appointments" />}>
                  {schedule.rows.map((a) => (
                    <tr key={a.appointment_id}>
                      <Td>{fmtDate(a.appt_date)}</Td><Td>{fmtTime(a.appt_time)}</Td><Td>{a.patient_name}</Td><Td>{a.reason}</Td>
                      <Td><Badge tone={a.status === 'Confirmed' ? 'blue' : 'amber'}>{a.status}</Badge></Td>
                    </tr>
                  ))}
                </Table>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteFor)} danger loading={busy} title="Delete this doctor?"
        message={deleteFor && `${deleteFor.full_name} will be removed. Doctors who already have appointments cannot be deleted. Mark them unavailable instead.`}
        confirmText="Delete" onCancel={() => setDeleteFor(null)} onConfirm={remove}
      />
    </>
  );
}
