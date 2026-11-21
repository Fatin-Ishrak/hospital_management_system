// PATIENT: view and edit own profile (the role and account link cannot be changed).
import { useState } from 'react';
import { patientApi } from '../api.js';
import { Save } from 'lucide-react';

import { useAuth } from '@/core/auth/AuthContext.jsx';
import { useToast } from '@/core/toast/ToastContext.jsx';
import {
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  Select,
  Textarea,
} from '@/core/ui';
import { todayStr } from '@/core/utils/format.js';
import { BLOOD_GROUPS, PHONE_RE } from '@/core/utils/validation.js';

export default function PatientProfile() {
  const { patient, profile, refresh } = useAuth();
  const toast = useToast();
  const [f, setF] = useState({
    full_name: patient.full_name, gender: patient.gender, date_of_birth: patient.date_of_birth,
    phone: patient.phone, blood_group: patient.blood_group || '', address: patient.address || '',
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    if (!PHONE_RE.test(f.phone.trim())) return toast.error('Phone must be 10 to 15 digits (numbers only).');
    if (f.date_of_birth > todayStr()) return toast.error('Date of birth cannot be in the future.');
    setBusy(true);
    try {
      const row = await patientApi.updateSelf(patient.patient_id, {
        full_name: f.full_name.trim(), gender: f.gender, date_of_birth: f.date_of_birth,
        phone: f.phone.trim(), blood_group: f.blood_group || null, address: f.address.trim() || null,
      });
      if (!row) throw new Error('Your profile could not be updated.');
      toast.success('Profile updated.');
      await refresh();
    } catch (err) {
      toast.error(err);
    }
    setBusy(false);
  };

  return (
    <>
      <PageHeader title="My profile" subtitle="You can edit your own details. Your role is managed by the administrator." />
      <Card className="p-6 max-w-2xl">
        <form onSubmit={save} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Email (login)"><Input value={profile.email} disabled /></Field>
            <Field label="Role"><Input value={profile.role} disabled /></Field>
            <Field label="Full name" required><Input value={f.full_name} onChange={set('full_name')} required minLength={2} /></Field>
            <Field label="Gender">
              <Select value={f.gender} onChange={set('gender')}><option>Male</option><option>Female</option><option>Other</option></Select>
            </Field>
            <Field label="Date of birth"><Input type="date" max={todayStr()} value={f.date_of_birth} onChange={set('date_of_birth')} required /></Field>
            <Field label="Blood group">
              <Select value={f.blood_group} onChange={set('blood_group')}>
                <option value="">Unknown</option>{BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}
              </Select>
            </Field>
            <Field label="Phone" required hint="Digits only"><Input value={f.phone} onChange={set('phone')} inputMode="numeric" required /></Field>
          </div>
          <Field label="Address"><Textarea rows={2} value={f.address} onChange={set('address')} /></Field>
          <Button type="submit" loading={busy}><Save className="h-4 w-4" /> Save profile</Button>
        </form>
      </Card>
    </>
  );
}
