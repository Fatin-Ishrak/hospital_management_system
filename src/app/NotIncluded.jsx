// Page shown when a user logs in with a role whose portal module is not part of this build.
import { useAuth } from '@/core/auth/AuthContext.jsx';
import { Button } from '@/core/ui';

// Shown when someone logs in with a role whose portal is not part of this build
export default function NotIncluded({ role }) {
  const { signOut } = useAuth();
  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="max-w-md bg-white rounded-2xl border border-slate-200 shadow p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">The {role} portal is not included here</h1>
        <p className="text-slate-600 mt-3 text-sm">
          You are logged in as <b>{role}</b>, but this copy of the website was started without the {role} module
          (for example with <code>npm run dev:admin</code> or before that module was added to the repository).
          Start the full website with <code>npm run dev</code>, or log in with an account of a role that is included.
        </p>
        <Button className="mt-6" variant="secondary" onClick={signOut}>Log out</Button>
      </div>
    </div>
  );
}
