// LOGIN PAGE: email + password form that signs in with Supabase Auth.
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthContext.jsx';
import { Button, Field, Input } from '@/core/ui';
import { friendlyError } from '@/core/utils/errors.js';
import AuthShell from '@/core/layout/AuthShell.jsx';

// links = public pages offered by the modules that are present, e.g. patient registration
export default function Login({ links = [] }) {
  const { session, role, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (session && !loading && role) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(/invalid login/i.test(err.message) ? 'Wrong email or password.' : friendlyError(err));
    }
    setBusy(false);
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to open your Admin, Doctor or Patient dashboard.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" required>
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </Field>
        <Field label="Password" required>
          <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" required />
        </Field>
        {error && <p role="alert" className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Button type="submit" loading={busy} className="w-full">Sign in</Button>
      </form>
      {links.length > 0 && (
        <p className="mt-6 text-sm text-slate-500 space-y-1">
          {links.map((l) => (
            <span key={l.path} className="block">
              {l.text} <Link to={l.path} className="font-medium text-teal-700 hover:underline">{l.label}</Link>
            </span>
          ))}
        </p>
      )}
    </AuthShell>
  );
}
