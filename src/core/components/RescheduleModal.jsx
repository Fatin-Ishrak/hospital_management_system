// SHARED: choose a new date and free slot for an appointment (admin and patient portals).
import { useEffect, useState } from 'react';
import { api } from '@/core/api';
import { useToast } from '@/core/toast/ToastContext.jsx';
import { Button, Field, Input, Modal } from '@/core/ui';
import { SlotPicker } from '@/core/components/SlotPicker.jsx';
import { fmtDate, fmtTime, todayStr } from '@/core/utils/format.js';

export default function RescheduleModal({ appt, onClose, onDone }) {
  const toast = useToast();
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (appt) {
      setDate(appt.appt_date >= todayStr() ? appt.appt_date : todayStr());
      setTime('');
    }
  }, [appt]);

  const save = async () => {
    if (!time) return toast.error('Please choose a new time slot.');
    setBusy(true);
    try {
      await api.reschedule(appt.appointment_id, date, time);
      toast.success('Appointment rescheduled.');
      onDone?.();
      onClose();
    } catch (err) {
      toast.error(err);
    }
    setBusy(false);
  };

  return (
    <Modal
      open={Boolean(appt)}
      title="Reschedule appointment"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={busy} onClick={save}>Save new time</Button>
        </>
      }
    >
      {appt && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {appt.doctor_name} · currently {fmtDate(appt.appt_date)} at {fmtTime(appt.appt_time)}
          </p>
          <Field label="New date">
            <Input type="date" min={todayStr()} value={date} onChange={(e) => { setDate(e.target.value); setTime(''); }} />
          </Field>
          <Field label="Free slots">
            <SlotPicker doctorId={appt.doctor_id} date={date} value={time} onChange={setTime} />
          </Field>
        </div>
      )}
    </Modal>
  );
}
