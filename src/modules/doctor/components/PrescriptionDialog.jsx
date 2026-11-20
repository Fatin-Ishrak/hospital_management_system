// DOCTOR: dialog to create or edit a prescription line (medicine, dosage, days, instructions).
import { useEffect, useState } from 'react';
import { doctorApi } from '../api.js';

import { useData } from '@/core/hooks/hooks.js';
import { useToast } from '@/core/toast/ToastContext.jsx';
import { Button, Field, Input, Modal, Select, Textarea } from '@/core/ui';
import { fmtDate, fmtTime } from '@/core/utils/format.js';

const blank = { medicine: '', dosage: '', duration_days: 5, instructions: '' };

// Create or edit one prescription line. 'appointment' fixes the appointment; otherwise a list is shown.
export default function PrescriptionDialog({ open, appointment, editing, onClose, onSaved }) {
  const toast = useToast();
  const choices = useData(() => (open && !appointment && !editing ? doctorApi.prescribable() : Promise.resolve([])), [open, appointment?.appointment_id, editing?.prescription_id]);
  const [f, setF] = useState({ ...blank, appointment_id: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) setF({ ...blank, ...editing, instructions: editing.instructions || '' });
    else setF({ ...blank, appointment_id: appointment ? String(appointment.appointment_id) : '' });
  }, [open, editing, appointment]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (another) => {
    if (!editing && !f.appointment_id) return toast.error('Please choose an appointment.');
    if (!f.medicine.trim() || !f.dosage.trim()) return toast.error('Medicine and dosage are required.');
    setBusy(true);
    try {
      await doctorApi.savePrescription(f);
      toast.success(editing ? 'Prescription updated.' : 'Prescription saved.');
      onSaved?.();
      if (another) setF({ ...blank, appointment_id: f.appointment_id });
      else onClose();
    } catch (err) {
      toast.error(err);
    }
    setBusy(false);
  };

  return (
    <Modal
      open={open}
      title={editing ? 'Edit prescription' : 'New prescription'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          {!editing && <Button variant="secondary" loading={busy} onClick={() => save(true)}>Save & add another</Button>}
          <Button loading={busy} onClick={() => save(false)}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        {!editing && !appointment && (
          <Field label="Appointment" required hint="Only Confirmed or Completed appointments can have prescriptions.">
            <Select value={f.appointment_id} onChange={set('appointment_id')}>
              <option value="">Select an appointment…</option>
              {(choices.data ?? []).map((a) => (
                <option key={a.appointment_id} value={a.appointment_id}>
                  {a.patient_name} — {fmtDate(a.appt_date)} {fmtTime(a.appt_time)} ({a.status})
                </option>
              ))}
            </Select>
          </Field>
        )}
        {appointment && (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {appointment.patient_name} · {fmtDate(appointment.appt_date)} {fmtTime(appointment.appt_time)}
          </p>
        )}
        <Field label="Medicine" required><Input value={f.medicine} onChange={set('medicine')} placeholder="e.g. Paracetamol 500mg" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Dosage" required><Input value={f.dosage} onChange={set('dosage')} placeholder="1 tablet, 3 times a day" /></Field>
          <Field label="Duration (days)" required>
            <Input type="number" min={1} max={365} value={f.duration_days} onChange={set('duration_days')} />
          </Field>
        </div>
        <Field label="Instructions"><Textarea rows={2} value={f.instructions} onChange={set('instructions')} placeholder="After meals, drink plenty of water…" /></Field>
      </div>
    </Modal>
  );
}
