// PATIENT: dashboard with next appointment, counts, prescriptions and unpaid bills.

import { patientApi } from '../api.js';import { Link } from 'react-router-dom';
import { CalendarCheck, CalendarPlus, CheckCircle2, Hourglass, Pill, RefreshCw } from 'lucide-react';

import { useData } from '@/core/hooks/hooks.js';
import { useAuth } from '@/core/auth/AuthContext.jsx';
import {
  Button,
  Card,
  EmptyState,
  ErrorBox,
  PageHeader,
  PageLoader,
  StatCard,
  StatusBadge,
} from '@/core/ui';
import { fmtDate, fmtTime, money, todayStr } from '@/core/utils/format.js';

export default function PatientDashboard() {
  const { patient } = useAuth();
  const data = useData(() => patientApi.overview(patient.patient_id, todayStr()), [patient.patient_id]);
  const d = data.data;
  if (data.loading && !d) return <PageLoader />;
  if (data.error && !d) return <ErrorBox error={data.error} onRetry={data.reload} />;
  const next = d.upcoming[0];

  return (
    <>
      <PageHeader title={`Hello, ${patient.full_name}`} subtitle="Your health records and appointments in one place.">
        <Button variant="secondary" onClick={data.reload}><RefreshCw className="h-4 w-4" /> Refresh</Button>
        <Link to="/patient/book"><Button><CalendarPlus className="h-4 w-4" /> Book appointment</Button></Link>
      </PageHeader>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={CalendarCheck} tone="teal" label="Upcoming" value={d.upcoming.length} />
        <StatCard icon={CheckCircle2} tone="green" label="Completed visits" value={d.completed} />
        <StatCard icon={Pill} tone="blue" label="Prescriptions" value={d.prescriptions} />
        <StatCard icon={Hourglass} tone="amber" label="Unpaid bills" value={money(d.unpaidTotal)} hint={`${d.unpaidCount} invoice(s)`} />
      </div>
      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <Card className="p-6 bg-gradient-to-br from-teal-600 to-cyan-600 text-white border-0">
          <p className="text-sm text-teal-100">Next appointment</p>
          {next ? (
            <>
              <p className="text-2xl font-bold mt-2">{fmtDate(next.appt_date)}</p>
              <p className="text-lg">{fmtTime(next.appt_time)}</p>
              <p className="mt-3 text-teal-50">{next.doctor_name}</p>
              <p className="text-sm text-teal-100">{next.dept_name}</p>
            </>
          ) : (
            <p className="mt-3 text-teal-50">You have nothing booked. Choose a doctor and a time that suits you.</p>
          )}
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h2 className="font-semibold text-slate-900 mb-2">Upcoming appointments</h2>
          {d.upcoming.length === 0 ? (
            <EmptyState title="No upcoming appointments" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {d.upcoming.map((a) => (
                <li key={a.appointment_id} className="flex items-center gap-4 py-3">
                  <div className="w-28 shrink-0 text-sm">
                    <div className="font-medium text-slate-900">{fmtDate(a.appt_date)}</div>
                    <div className="text-xs text-slate-500">{fmtTime(a.appt_time)}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 truncate">{a.doctor_name}</p>
                    <p className="text-sm text-slate-500 truncate">{a.reason}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
          <div className="pt-3"><Link to="/patient/appointments" className="text-sm font-medium text-teal-700 hover:underline">See all appointments →</Link></div>
        </Card>
      </div>
    </>
  );
}
