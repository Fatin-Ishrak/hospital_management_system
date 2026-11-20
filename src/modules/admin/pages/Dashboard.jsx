// ADMIN: dashboard with statistics, charts and recent activity from the database function get_dashboard_stats().

import { adminApi } from '../api.js';import {
  Users, Stethoscope, CalendarDays, CheckCircle2, Clock3, XCircle, Wallet, Hourglass, RefreshCw, Activity,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

import { useData } from '@/core/hooks/hooks.js';
import {
  Badge,
  Button,
  Card,
  ErrorBox,
  PageHeader,
  PageLoader,
  StatCard,
} from '@/core/ui';
import { fmtDateTime, money } from '@/core/utils/format.js';

const STATUS_COLORS = { Pending: '#f59e0b', Confirmed: '#3b82f6', Completed: '#10b981', Cancelled: '#ef4444' };
const ACTION_TONE = { INSERT: 'green', UPDATE: 'blue', DELETE: 'red', STATUS: 'purple', PAYMENT: 'green', RESCHEDULE: 'amber' };

export default function AdminDashboard() {
  const stats = useData(() => adminApi.dashboardStats(), []);
  const s = stats.data;

  if (stats.loading && !s) return <PageLoader />;
  if (stats.error && !s) return <ErrorBox error={stats.error} onRetry={stats.reload} />;

  const statusData = ['Pending', 'Confirmed', 'Completed', 'Cancelled']
    .map((k) => ({ name: k, value: s[k.toLowerCase()] }))
    .filter((d) => d.value > 0);
  const dayData = s.by_day.map((d) => ({ day: d.day.slice(5), count: d.count }));

  return (
    <>
      <PageHeader title="Admin dashboard" subtitle="Live numbers straight from the PostgreSQL database.">
        <Button variant="secondary" onClick={stats.reload}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </PageHeader>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Users} tone="teal" label="Total patients" value={s.total_patients} />
        <StatCard icon={Stethoscope} tone="blue" label="Total doctors" value={s.total_doctors} />
        <StatCard icon={CalendarDays} tone="purple" label="Total appointments" value={s.total_appointments} />
        <StatCard icon={CheckCircle2} tone="green" label="Completed" value={s.completed} />
        <StatCard icon={Clock3} tone="amber" label="Pending" value={s.pending} hint={`${s.confirmed} confirmed`} />
        <StatCard icon={XCircle} tone="red" label="Cancelled" value={s.cancelled} />
        <StatCard icon={Wallet} tone="green" label="Revenue collected" value={money(s.revenue_collected)} />
        <StatCard icon={Hourglass} tone="amber" label="Revenue pending" value={money(s.revenue_pending)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <Card className="p-5 lg:col-span-2">
          <h2 className="font-semibold text-slate-900 mb-1">Appointments per day</h2>
          <p className="text-xs text-slate-400 mb-4">Last 7 days and next 7 days</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Appointments" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Appointments by status</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {statusData.map((d) => <Cell key={d.name} fill={STATUS_COLORS[d.name]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-6">
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Appointments by department</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s.by_department} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="dept" width={110} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="appointments" name="Appointments" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Activity className="h-4 w-4 text-teal-600" /> Recent activity</h2>
          {s.recent_activity.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No activity yet. Book or change an appointment to see it here.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {s.recent_activity.map((a, i) => (
                <li key={i} className="py-2.5 flex items-start gap-3">
                  <Badge tone={ACTION_TONE[a.action] || 'slate'}>{a.action}</Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-800 truncate" title={a.details}>{a.details}</p>
                    <p className="text-xs text-slate-400">{a.actor_email} · {fmtDateTime(a.performed_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
