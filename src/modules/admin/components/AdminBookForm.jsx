// Admin "New appointment" form: the admin chooses the patient, then doctor, date and a free slot.
// (The patient's own booking form lives in the patient module.) Both use the same core SlotPicker
// and the same database function book_appointment().
import { useState } from 'react';
import { CalendarPlus } from 'lucide-react';
import { api } from '@/core/api';
import { useData } from '@/core/hooks/hooks.js';
import { useToast } from '@/core/toast/ToastContext.jsx';
import { Button, Field, Input, Select, Textarea } from '@/core/ui';
import { SlotPicker } from '@/core/components/SlotPicker.jsx';
import { fmtTime, money, todayStr } from '@/core/utils/format.js';

export default function AdminBookForm({ onBooked }) {
  const toast = useToast();
  const patients = useData(() => api.allPatients(), []);
  const doctors = useData(() => api.doctors({ activeOnly: true }), []);
  const [f, setF] = useState({ patient: '', doctor: '', date: todayStr(), time: '', priority: 'Normal', reason: '' });
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v, ...(k === 'doctor' || k === 'date' ? { time: '' } : {}) }));
  const chosen = (doctors.data ?? []).find((d) => String(d.doctor_id) === f.doctor);

  const submit = async (e) => {
    e.preventDefault();
    if (!f.time) return toast.error('Please choose a time slot.');
    setBusy(true);
    try {
      const id = await api.book({
        patientId: f.patient, doctorId: f.doctor, date: f.date, time: f.time, reason: f.reason.trim(), priority: f.priority,
      });
      toast.success('Appointment booked successfully.');
      onBooked?.(id);
    } catch (err) {
      toast.error(err);
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Patient" required>
        <Select value={f.patient} onChange={(e) => set('patient', e.target.value)} required>
          <option value="">Select a patient…</option>
          {(patients.data ?? []).map((p) => <option key={p.patient_id} value={p.patient_id}>{p.full_name} ({p.phone})</option>)}
        </Select>
      </Field>
      <Field label="Doctor" required>
        <Select value={f.doctor} onChange={(e) => set('doctor', e.target.value)} required>
          <option value="">Select a doctor…</option>
          {(doctors.data ?? []).map((d) => <option key={d.doctor_id} value={d.doctor_id}>{d.full_name} — {d.departments?.dept_name}</option>)}
        </Select>
      </Field>
      {chosen && (
        <p className="rounded-xl bg-teal-50 border border-teal-100 px-4 py-3 text-sm text-teal-900">
          Fee <b>{money(chosen.consultation_fee)}</b> · Hours {fmtTime(chosen.work_start)} – {fmtTime(chosen.work_end)}
        </p>
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
        <Textarea value={f.reason} onChange={(e) => set('reason', e.target.value)} required minLength={3} />
      </Field>
      <Button type="submit" loading={busy}><CalendarPlus className="h-4 w-4" /> Book appointment</Button>
    </form>
  );
}
