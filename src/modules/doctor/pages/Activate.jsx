// DOCTOR ACTIVATION (public page /activate). A doctor created by the admin has a one-time
// activation code. Entering it creates the login account and links it to the doctor record.
// Both the code check and the linking are done by the database (verify_doctor_code + sign-up trigger).
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthContext.jsx';
import { usePortal } from '@/core/auth/PortalContext.jsx';
import { Button, Field, Input } from '@/core/ui';
import { friendlyError } from '@/core/utils/errors.js';
import AuthShell from '@/core/layout/AuthShell.jsx';
import { doctorApi } from '../api.js';

export default function Activate() {
  const { session, role, loading, signUp } = useAuth();
  const { publicLinks } = usePortal();
  const [f, setF] = useState({ full_name: '', email: '', password: '', code: '' });
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
    setBusy(true);
    try {
      const doctorName = await doctorApi.verifyActivationCode(f.code);
      if (!doctorName) throw new Error('This activation code is not valid or was already used.');
      const res = await signUp(f.email.trim(), f.password, { full_name: f.full_name.trim(), doctor_code: f.code.trim().toUpperCase() });
      if (!res.session) setDone(true); // only when "Confirm email" is still ON in Supabase
    } catch (err) {
      setError(/already registered/i.test(err.message) ? 'This email is already registered. Please sign in.' : friendlyError(err));
    }
    setBusy(false);
  };

  if (done) {
    return (
      <AuthShell title="Check your email" subtitle="Your doctor account was created.">
        <p className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
          Open the confirmation email, then <Link className="font-semibold underline" to="/login">sign in</Link>.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Activate your doctor account" subtitle="Enter the activation code that the administrator gave you.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" required><Input value={f.full_name} onChange={set('full_name')} required /></Field>
        <Field label="Email" required><Input type="email" value={f.email} onChange={set('email')} required /></Field>
        <Field label="Password" required hint="At least 6 characters">
          <Input type="password" autoComplete="new-password" value={f.password} onChange={set('password')} required />
        </Field>
        <Field label="Activation code" required hint="Given to you by the administrator">
          <Input value={f.code} onChange={set('code')} placeholder="e.g. 3F9A1C0B7D" required />
        </Field>
        {error && <p role="alert" className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button type="submit" loading={busy} className="w-full">Activate doctor account</Button>
      </form>
      <p className="mt-6 text-sm text-slate-500">
        Already activated? <Link to="/login" className="font-medium text-teal-700 hover:underline">Sign in</Link>
        {publicLinks.filter((l) => l.path !== '/activate').map((l) => (
          <span key={l.path} className="block mt-1">{l.text} <Link to={l.path} className="font-medium text-teal-700 hover:underline">{l.label}</Link></span>
        ))}
      </p>
    </AuthShell>
  );
}
