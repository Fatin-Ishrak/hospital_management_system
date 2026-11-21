// PATIENT booking form: department -> doctor -> date -> free slot -> reason.
// The patient id is fixed (the logged-in patient). The database function book_appointment() rejects
// double bookings, past dates, off-hours and booking for another patient.
import { useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import { api } from '@/core/api';
import { useData } from '@/core/hooks/hooks.js';
import { useToast } from '@/core/toast/ToastContext.jsx';
import { Button, Field, Input, Select, Textarea } from '@/core/ui';
import { SlotPicker } from '@/core/components/SlotPicker.jsx';
import { daysText, fmtTime, money, todayStr } from '@/core/utils/format.js';

export default function PatientBookForm({ patientId, initialDoctorId, onBooked }) {
  const toast = useToast();
  const depts = useData(() => api.departments(), []);
  const doctors = useData(() => api.doctors({ activeOnly: true }), []);
  const [f, setF] = useState({
    dept: '', doctor: initialDoctorId ? String(initialDoctorId) : '', date: todayStr(), time: '', priority: 'Normal', reason: '',
  });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v, ...(k === 'doctor' || k === 'date' ? { time: '' } : {}) }));

  const doctorList = doctors.data ?? [];
  const chosen = doctorList.find((d) => String(d.doctor_id) === f.doctor);
  const deptValue = f.dept || (chosen ? String(chosen.dept_id) : '');
  const visibleDoctors = deptValue ? doctorList.filter((d) => String(d.dept_id) === deptValue) : doctorList;

  const submit = async (e) => {
    e.preventDefault();
    if (!f.doctor) return toast.error('Please choose a doctor.');
    if (!f.time) return toast.error('Please choose a time slot.');
    setBusy(true);
    try {
      const id = await api.book({
        patientId, doctorId: f.doctor, date: f.date, time: f.time, reason: f.reason.trim(), priority: f.priority,
      });
      toast.success('Appointment booked successfully.');
      setF((s) => ({ ...s, time: '', reason: '' }));
      onBooked?.(id);
    } catch (err) {
      toast.error(err);
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Department">
          <Select value={deptValue} onChange={(e) => setF((s) => ({ ...s, dept: e.target.value, doctor: '', time: '' }))}>
            <option value="">All departments</option>
            {(depts.data ?? []).map((d) => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
          </Select>
        </Field>
        <Field label="Doctor" required>
          <Select value={f.doctor} onChange={(e) => set('doctor', e.target.value)} required>
            <option value="">Select a doctor…</option>
            {visibleDoctors.map((d) => <option key={d.doctor_id} value={d.doctor_id}>{d.full_name} — {d.departments?.dept_name}</option>)}
          </Select>
        </Field>
      </div>
      {chosen && (
        <div className="rounded-xl bg-teal-50 border border-teal-100 px-4 py-3 text-sm text-teal-900">
          Consultation fee <b>{money(chosen.consultation_fee)}</b> · Hours {fmtTime(chosen.work_start)} – {fmtTime(chosen.work_end)} · {daysText(chosen.work_days)}
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Date" required><Input type="date" min={todayStr()} value={f.date} onChange={(e) => set('date', e.target.value)} required /></Field>
        <Field label="Priority">
          <Select value={f.priority} onChange={(e) => set('priority', e.target.value)}>
            <option>Normal</option><option>Urgent</option><option>Emergency</option>
          </Select>
        </Field>
      </div>
      <Field label="Available time slots" required>
        <SlotPicker doctorId={f.doctor} date={f.date} value={f.time} onChange={(t) => set('time', t)} />
      </Field>
      <Field label="Reason for visit" required>
        <Textarea value={f.reason} onChange={(e) => set('reason', e.target.value)} placeholder="Example: fever for two days" required minLength={3} />
      </Field>
      <Button type="submit" loading={busy}><CalendarPlus className="h-4 w-4" /> Book appointment</Button>
    </form>
  );
}
