// ADMIN: add, edit, delete departments and assign doctors to them.
import { useState } from 'react';
import { api } from '@/core/api';
import { adminApi } from '../api.js';
import { Building2, Pencil, Plus, RefreshCw, Stethoscope, Trash2, UserPlus } from 'lucide-react';

import { useData } from '@/core/hooks/hooks.js';
import { useToast } from '@/core/toast/ToastContext.jsx';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorBox,
  Field,
  Input,
  Modal,
  PageHeader,
  PageLoader,
  Select,
  Textarea,
} from '@/core/ui';
import { fmtTime, money } from '@/core/utils/format.js';

export default function Departments() {
  const toast = useToast();
  const summary = useData(() => adminApi.departmentSummary(), []);
  const doctors = useData(() => api.doctors(), []);
  const [form, setForm] = useState(null);
  const [deleteFor, setDeleteFor] = useState(null);
  const [detail, setDetail] = useState(null); // dept being viewed
  const [assignId, setAssignId] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = () => { summary.reload(); doctors.reload(); };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await adminApi.saveDepartment(form);
      toast.success(form.dept_id ? 'Department updated.' : 'Department added.');
      setForm(null);
      refresh();
    } catch (err) {
      toast.error(err);
    }
    setBusy(false);
  };
  const remove = async () => {
    setBusy(true);
    try {
      await adminApi.deleteDepartment(deleteFor.dept_id);
      toast.success('Department deleted.');
      refresh();
    } catch (err) {
      toast.error(err);
    }
    setBusy(false);
    setDeleteFor(null);
  };
  const assign = async () => {
    const d = doctors.data.find((x) => String(x.doctor_id) === assignId);
    if (!d) return toast.error('Choose a doctor first.');
    setBusy(true);
    try {
      await adminApi.saveDoctor({ ...d, dept_id: detail.dept_id });
      toast.success(`${d.full_name} moved to ${detail.dept_name}.`);
      setAssignId('');
      refresh();
    } catch (err) {
      toast.error(err);
    }
    setBusy(false);
  };

  const inDept = (id) => (doctors.data ?? []).filter((d) => d.dept_id === id);
  const outside = detail ? (doctors.data ?? []).filter((d) => d.dept_id !== detail.dept_id) : [];
  const descOf = (id) => (summary.data ?? []).find((d) => d.dept_id === id);

  if (summary.loading && !summary.data) return <PageLoader />;
  return (
    <>
      <PageHeader title="Departments" subtitle="Organise doctors into departments.">
        <Button variant="secondary" onClick={refresh}><RefreshCw className="h-4 w-4" /> Refresh</Button>
        <Button onClick={() => setForm({ dept_name: '', description: '' })}><Plus className="h-4 w-4" /> Add department</Button>
      </PageHeader>
      {summary.error && <ErrorBox error={summary.error} onRetry={summary.reload} />}
      {!summary.data?.length ? (
        <Card><EmptyState icon={Building2} title="No departments yet" /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {summary.data.map((d) => (
            <Card key={d.dept_id} className="p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center"><Building2 className="h-5 w-5" /></div>
                  <h2 className="font-semibold text-slate-900">{d.dept_name}</h2>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" aria-label={`Edit ${d.dept_name}`} onClick={async () => {
                    const all = await api.departments();
                    setForm(all.find((x) => x.dept_id === d.dept_id));
                  }}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" aria-label={`Delete ${d.dept_name}`} onClick={() => setDeleteFor(d)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge tone="blue">{d.doctor_count} doctor{d.doctor_count === 1 ? '' : 's'}</Badge>
                <Badge tone="purple">{d.appointment_count} appointments</Badge>
                <Badge tone="green">{money(d.billed_amount)} billed</Badge>
              </div>
              <div className="mt-auto pt-4">
                <Button size="sm" variant="secondary" onClick={() => { setDetail(d); setAssignId(''); }}>
                  <Stethoscope className="h-3.5 w-3.5" /> Doctors & assignment
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={Boolean(form)} title={form?.dept_id ? 'Edit department' : 'Add department'} onClose={() => setForm(null)}>
        {form && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Department name" required><Input value={form.dept_name} onChange={(e) => setForm({ ...form, dept_name: e.target.value })} required minLength={2} /></Field>
            <Field label="Description"><Textarea rows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
              <Button type="submit" loading={busy}>{form.dept_id ? 'Save changes' : 'Add department'}</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={Boolean(detail)} title={detail ? `${detail.dept_name}: doctors` : ''} onClose={() => setDetail(null)}>
        {detail && (
          <div className="space-y-5">
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {inDept(detail.dept_id).map((d) => (
                <li key={d.doctor_id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="font-medium text-slate-800">{d.full_name}</span>
                  <span className="text-slate-500">{fmtTime(d.work_start)} – {fmtTime(d.work_end)}</span>
                </li>
              ))}
              {!inDept(detail.dept_id).length && <li className="px-4 py-6 text-center text-sm text-slate-400">No doctors in this department yet.</li>}
            </ul>
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Assign a doctor to {detail.dept_name}</p>
              <div className="flex gap-2">
                <Select value={assignId} onChange={(e) => setAssignId(e.target.value)} aria-label="Doctor to assign">
                  <option value="">Choose a doctor…</option>
                  {outside.map((d) => <option key={d.doctor_id} value={d.doctor_id}>{d.full_name} ({d.departments?.dept_name})</option>)}
                </Select>
                <Button loading={busy} onClick={assign}><UserPlus className="h-4 w-4" /> Assign</Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteFor)} danger loading={busy} title="Delete this department?"
        message={deleteFor && `${deleteFor.dept_name} will be removed. A department that still has doctors cannot be deleted.`}
        confirmText="Delete" onCancel={() => setDeleteFor(null)} onConfirm={remove}
      />
    </>
  );
}
