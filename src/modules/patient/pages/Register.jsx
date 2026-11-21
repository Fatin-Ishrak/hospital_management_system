// PATIENT REGISTRATION (public page /register). Creates a login account; a database trigger
// (handle_new_user) then creates the profile (role = patient) and the patient record.
// Nobody can register as admin or doctor from this page.
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/core/auth/AuthContext.jsx';
import { usePortal } from '@/core/auth/PortalContext.jsx';
import { Button, Field, Input, Select, Textarea } from '@/core/ui';
import { friendlyError } from '@/core/utils/errors.js';
import { BLOOD_GROUPS, PHONE_RE } from '@/core/utils/validation.js';
import { todayStr } from '@/core/utils/format.js';
import AuthShell from '@/core/layout/AuthShell.jsx';

export default function Register() {
  const { session, role, loading, signUp } = useAuth();
  const { publicLinks } = usePortal();
  const [f, setF] = useState({
    full_name: '', email: '', password: '', gender: 'Male', date_of_birth: '', phone: '', blood_group: '', address: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  if (session && !loading && role) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (f.password.length < 6) return setError('Password must be at least 6 characters.');
    if (f.full_name.trim().length < 2) return setError('Please enter your full name.');
    if (!PHONE_RE.test(f.phone.trim())) return setError('Phone must be 10 to 15 digits (numbers only).');
    if (!f.date_of_birth || f.date_of_birth > todayStr()) return setError('Please enter a valid date of birth.');
    setBusy(true);
    try {
      const res = await signUp(f.email.trim(), f.password, {
        full_name: f.full_name.trim(), gender: f.gender, date_of_birth: f.date_of_birth,
        phone: f.phone.trim(), blood_group: f.blood_group, address: f.address,
      });
      if (!res.session) setDone(true); // only when "Confirm email" is still ON in Supabase
    } catch (err) {
      setError(/already registered/i.test(err.message) ? 'This email is already registered. Please sign in.' : friendlyError(err));
    }
    setBusy(false);
  };

  if (done) {
    return (
      <AuthShell title="Check your email" subtitle="Your account was created.">
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex gap-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p>Open the confirmation email, then <Link className="font-semibold underline" to="/login">sign in</Link>.</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your patient account" subtitle="Register to book appointments and see your prescriptions and invoices.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" required><Input value={f.full_name} onChange={set('full_name')} required /></Field>
        <Field label="Email" required><Input type="email" value={f.email} onChange={set('email')} required /></Field>
        <Field label="Password" required hint="At least 6 characters">
          <Input type="password" autoComplete="new-password" value={f.password} onChange={set('password')} required />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Gender" required>
            <Select value={f.gender} onChange={set('gender')}><option>Male</option><option>Female</option><option>Other</option></Select>
          </Field>
          <Field label="Date of birth" required>
            <Input type="date" max={todayStr()} value={f.date_of_birth} onChange={set('date_of_birth')} required />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone" required hint="Digits only, e.g. 01712345678">
            <Input value={f.phone} onChange={set('phone')} inputMode="numeric" required />
          </Field>
          <Field label="Blood group">
            <Select value={f.blood_group} onChange={set('blood_group')}>
              <option value="">Unknown</option>
              {BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Address"><Textarea rows={2} value={f.address} onChange={set('address')} /></Field>
        {error && <p role="alert" className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button type="submit" loading={busy} className="w-full">Create patient account</Button>
      </form>
      <p className="mt-6 text-sm text-slate-500">
        Already have an account? <Link to="/login" className="font-medium text-teal-700 hover:underline">Sign in</Link>
        {publicLinks.filter((l) => l.path !== '/register').map((l) => (
          <span key={l.path} className="block mt-1">{l.text} <Link to={l.path} className="font-medium text-teal-700 hover:underline">{l.label}</Link></span>
        ))}
      </p>
    </AuthShell>
  );
}
