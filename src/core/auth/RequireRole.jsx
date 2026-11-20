// Protected route: lets a user in only when their role matches this portal.
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthContext.jsx';
import { Button, PageLoader } from '@/core/ui';

function Problem({ title, text }) {
  const { signOut } = useAuth();
  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="max-w-md bg-white rounded-2xl border border-slate-200 shadow p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="text-slate-600 mt-3 text-sm">{text}</p>
        <Button className="mt-6" variant="secondary" onClick={signOut}>Log out</Button>
      </div>
    </div>
  );
}

// role: the role this portal is for.  record: 'doctor' | 'patient' | null (the linked database record that must exist)
export default function RequireRole({ role: needed, record = null, children }) {
  const { session, role, profile, error, loading, doctor, patient } = useAuth();
  if (loading) return <PageLoader text="Loading your account…" />;
  if (!session) return <Navigate to="/login" replace />;
  if (error || !profile) {
    return (
      <Problem
        title="Account not ready"
        text="Your login has no profile in the database yet. Ask the administrator, or run the profile backfill at the end of sql/02_functions_triggers.sql."
      />
    );
  }
  if (role !== needed) return <Navigate to="/" replace />;
  if (record === 'doctor' && !doctor) {
    return <Problem title="Doctor record missing" text="Your account has the doctor role but is not linked to a doctor record. Ask the administrator for a new activation code." />;
  }
  if (record === 'patient' && !patient) {
    return <Problem title="Patient record missing" text="Your account is not linked to a patient record. Ask the administrator to add you as a patient." />;
  }
  return children;
}
