// DOCTOR: dashboard with today's and upcoming appointments and personal statistics.

import { doctorApi } from '../api.js';import { Link } from 'react-router-dom';
import { CalendarCheck, CalendarClock, CheckCircle2, Clock3, Wallet, AlertTriangle, RefreshCw } from 'lucide-react';

import { useData } from '@/core/hooks/hooks.js';
import { useAuth } from '@/core/auth/AuthContext.jsx';
import {
  Button,
  Card,
  EmptyState,
  ErrorBox,
  PageHeader,
  PageLoader,
  PriorityBadge,
  StatCard,
  StatusBadge,
} from '@/core/ui';
import { fmtDate, fmtTime, money, todayStr } from '@/core/utils/format.js';

function ApptList({ rows, empty, showDate }) {
  if (!rows.length) return <EmptyState title={empty} />;
  return (
    <ul className="divide-y divide-slate-100">
      {rows.map((a) => (
        <li key={a.appointment_id} className="flex items-center gap-4 py-3">
          <div className="w-24 shrink-0 text-sm">
            {showDate && <div className="font-medium text-slate-900">{fmtDate(a.appt_date)}</div>}
            <div className={showDate ? 'text-xs text-slate-500' : 'font-semibold text-slate-900'}>{fmtTime(a.appt_time)}</div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-900 truncate">{a.patient_name}</p>
            <p className="text-sm text-slate-500 truncate">{a.reason}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <StatusBadge status={a.status} />
            {a.priority !== 'Normal' && <PriorityBadge priority={a.priority} />}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function DoctorDashboard() {
  const { doctor } = useAuth();
  const today = todayStr();
  const data = useData(() => doctorApi.overview(doctor.doctor_id, today), [doctor.doctor_id]);
  const d = data.data;

  if (data.loading && !d) return <PageLoader />;
  if (data.error && !d) return <ErrorBox error={data.error} onRetry={data.reload} />;
  const w = d.work || {};

  return (
    <>
      <PageHeader title={`Welcome, ${doctor.full_name}`} subtitle={`${doctor.departments?.dept_name} · ${fmtDate(today)}`}>
        <Button variant="secondary" onClick={data.reload}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </PageHeader>
      {!doctor.is_active && (
        <div className="mb-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>You are marked <b>unavailable</b>, so patients cannot book you. Change this on the <Link to="/doctor/schedule" className="underline font-medium">My Schedule</Link> page.</p>
        </div>
      )}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={CalendarCheck} tone="teal" label="Today" value={d.today.length} hint="appointments" />
        <StatCard icon={Clock3} tone="amber" label="Pending" value={w.pending_count ?? 0} hint={`${w.confirmed_count ?? 0} confirmed`} />
        <StatCard icon={CheckCircle2} tone="green" label="Completed visits" value={w.completed_count ?? 0} />
        <StatCard icon={Wallet} tone="blue" label="Fees collected" value={money(w.revenue_collected)} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4 mt-6">
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-2 flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-teal-600" /> Today’s appointments</h2>
          <ApptList rows={d.today} empty="No appointments today" />
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-2 flex items-center gap-2"><CalendarClock className="h-4 w-4 text-teal-600" /> Coming up</h2>
          <ApptList rows={d.upcoming} empty="Nothing scheduled" showDate />
          <div className="pt-3"><Link to="/doctor/appointments" className="text-sm font-medium text-teal-700 hover:underline">Manage all appointments →</Link></div>
        </Card>
      </div>
    </>
  );
}
