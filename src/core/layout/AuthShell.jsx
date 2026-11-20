// SHARED LAYOUT: two-column frame used by the login, registration and activation pages.
import { Cross, ShieldCheck, CalendarCheck, Pill } from 'lucide-react';

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-full grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-600 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-white/15 flex items-center justify-center">
            <Cross className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold">CareSphere</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold leading-tight">Hospital management,<br />simple and secure.</h2>
          <ul className="mt-8 space-y-4 text-teal-50">
            <li className="flex items-center gap-3"><CalendarCheck className="h-5 w-5" /> Book appointments without double booking</li>
            <li className="flex items-center gap-3"><Pill className="h-5 w-5" /> Prescriptions and invoices in one place</li>
            <li className="flex items-center gap-3"><ShieldCheck className="h-5 w-5" /> Separate, protected portals for admin, doctors and patients</li>
          </ul>
        </div>
        <p className="text-sm text-teal-100">DBMS course project · PostgreSQL on Supabase</p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-6 text-teal-700">
            <Cross className="h-6 w-6" /> <span className="text-xl font-bold">CareSphere</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-slate-500 mt-1 mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
