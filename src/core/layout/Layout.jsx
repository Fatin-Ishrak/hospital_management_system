// SHARED LAYOUT: sidebar + top bar for every portal; the menu items come from the module.
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Cross } from 'lucide-react';
import { useAuth } from '@/core/auth/AuthContext.jsx';
import { cn } from '@/core/utils/format.js';

const ROLE_LABEL = { admin: 'Administrator', doctor: 'Doctor', patient: 'Patient' };

// nav = list of menu items supplied by the module: { to, label, icon, end }
export default function Layout({ nav }) {
  const { role, profile, doctor, patient, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const name = doctor?.full_name || patient?.full_name || profile?.full_name || profile?.email;

  const logout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-slate-900 text-slate-300">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="h-9 w-9 rounded-lg bg-teal-600 flex items-center justify-center">
          <Cross className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-white leading-tight">CareSphere</p>
          <p className="text-xs text-slate-400">{ROLE_LABEL[role]} portal</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                isActive ? 'bg-teal-600 text-white' : 'hover:bg-slate-800 hover:text-white'
              )
            }
          >
            <Icon className="h-5 w-5" /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-800 p-4">
        <p className="text-sm font-medium text-white truncate">{name}</p>
        <p className="text-xs text-slate-400 truncate mb-3">{profile?.email}</p>
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-full flex">
      <aside className="hidden lg:block w-64 shrink-0 fixed inset-y-0 no-print">{sidebar}</aside>
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex no-print">
          <div className="w-64 h-full">{sidebar}</div>
          <div className="flex-1 bg-slate-900/50" onClick={() => setOpen(false)} />
        </div>
      )}
      <div className="flex-1 lg:ml-64 min-w-0">
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 bg-white border-b border-slate-200 px-4 py-3 no-print">
          <button onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <span className="font-bold text-slate-900">CareSphere</span>
          <span className="ml-auto text-xs text-slate-500">{ROLE_LABEL[role]}</span>
        </header>
        <main className="p-4 sm:p-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
