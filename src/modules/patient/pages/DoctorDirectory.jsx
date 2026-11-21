// PATIENT: browse doctors by department, see fees and hours, and start a booking.
import { useState } from 'react';
import { api } from '@/core/api';
import { Link } from 'react-router-dom';
import { CalendarPlus, Clock, Stethoscope } from 'lucide-react';

import { useData, useDebounce } from '@/core/hooks/hooks.js';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorBox,
  PageHeader,
  PageLoader,
  SearchBox,
  Select,
} from '@/core/ui';
import { daysText, fmtTime, money } from '@/core/utils/format.js';

export default function DoctorDirectory() {
  const [searchText, setSearchText] = useState('');
  const [deptId, setDeptId] = useState('');
  const search = useDebounce(searchText);
  const depts = useData(() => api.departments(), []);
  const list = useData(() => api.doctors({ search, deptId }), [search, deptId]);
  return (
    <>
      <PageHeader title="Doctors & departments" subtitle="Find the right doctor and book a visit." />
      <div className="flex flex-wrap gap-3 mb-5">
        <SearchBox value={searchText} onChange={setSearchText} placeholder="Search doctor name" />
        <Select className="w-56" value={deptId} onChange={(e) => setDeptId(e.target.value)} aria-label="Department">
          <option value="">All departments</option>
          {(depts.data ?? []).map((d) => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
        </Select>
      </div>
      {list.error && <ErrorBox error={list.error} onRetry={list.reload} />}
      {list.loading && !list.data ? <PageLoader /> : !(list.data ?? []).length ? (
        <Card><EmptyState icon={Stethoscope} title="No doctors found" /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.data.map((d) => (
            <Card key={d.doctor_id} className="p-5 flex flex-col">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0"><Stethoscope className="h-6 w-6" /></div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-slate-900">{d.full_name}</h2>
                  <p className="text-sm text-slate-500">{d.departments?.dept_name}</p>
                </div>
              </div>
              <div className="mt-4 space-y-1.5 text-sm text-slate-600">
                <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-slate-400" />{fmtTime(d.work_start)} – {fmtTime(d.work_end)} · {daysText(d.work_days)}</p>
                <p>Consultation fee: <b className="text-slate-900">{money(d.consultation_fee)}</b></p>
              </div>
              <div className="mt-auto pt-4 flex items-center justify-between">
                {d.is_active ? <Badge tone="green">Available</Badge> : <Badge tone="red">Unavailable</Badge>}
                {d.is_active && (
                  <Link to={`/patient/book?doctor=${d.doctor_id}`}><Button size="sm"><CalendarPlus className="h-3.5 w-3.5" /> Book</Button></Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
