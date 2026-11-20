// ADMIN: add, edit, search, filter and delete patients; view details and appointment history.
import { useState } from 'react';
import { api } from '@/core/api';
import { adminApi } from '../api.js';
import { Eye, Pencil, Plus, RefreshCw, Trash2, Users } from 'lucide-react';

import { useData, useDebounce } from '@/core/hooks/hooks.js';
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
  Pagination,
  SearchBox,
  Select,
  Table,
  Td,
  Textarea,
} from '@/core/ui';
import PatientDetails from '@/core/components/PatientDetails.jsx';
import { ageFromDob, todayStr } from '@/core/utils/format.js';
import { BLOOD_GROUPS, PHONE_RE } from '@/core/utils/validation.js';

const SIZE = 10;
const blank = { full_name: '', gender: 'Male', date_of_birth: '', phone: '', blood_group: '', address: '' };

export default function AdminPatients() {
  const toast = useToast();
  const [searchText, setSearchText] = useState('');
  const [gender, setGender] = useState('');
  const [page, setPage] = useState(1);
  const search = useDebounce(searchText);
  const list = useData(() => api.patients({ search, gender, page, size: SIZE }), [search, gender, page]);
  const [form, setForm] = useState(null); // null = closed, object = add/edit
  const [view, setView] = useState(null);
  const [deleteFor, setDeleteFor] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    if (!PHONE_RE.test(form.phone.trim())) return toast.error('Phone must be 10 to 15 digits (numbers only).');
    if (form.date_of_birth > todayStr()) return toast.error('Date of birth cannot be in the future.');
    setBusy(true);
    try {
      await adminApi.savePatient(form);
      toast.success(form.patient_id ? 'Patient updated.' : 'Patient added.');
      setForm(null);
      list.reload();
    } catch (err) {
      toast.error(err);
    }
    setBusy(false);
  };
  const remove = async () => {
    setBusy(true);
    try {
      await adminApi.deletePatient(deleteFor.patient_id);
      toast.success('Patient deleted.');
      list.reload();
    } catch (err) {
      toast.error(err);
    }
    setBusy(false);
    setDeleteFor(null);
  };

  const rows = list.data?.rows ?? [];
  return (
    <>
      <PageHeader title="Patients" subtitle="Add, edit and search patient records.">
        <Button variant="secondary" onClick={list.reload}><RefreshCw className="h-4 w-4" /> Refresh</Button>
        <Button onClick={() => setForm({ ...blank })}><Plus className="h-4 w-4" /> Add patient</Button>
      </PageHeader>
      <Card>
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-100">
          <SearchBox value={searchText} onChange={(v) => { setSearchText(v); setPage(1); }} placeholder="Search name or phone" />
          <Select className="w-40" value={gender} onChange={(e) => { setGender(e.target.value); setPage(1); }} aria-label="Filter by gender">
            <option value="">All genders</option><option>Male</option><option>Female</option><option>Other</option>
          </Select>
        </div>
        {list.error && <div className="p-4"><ErrorBox error={list.error} onRetry={list.reload} /></div>}
        {list.loading && !list.data ? (
          <PageLoader />
        ) : (
          <>
            <Table columns={['Name', 'Gender', 'Age', 'Phone', 'Blood', 'Login', 'Actions']} empty={!rows.length && <EmptyState icon={Users} title="No patients found" />}>
              {rows.map((p) => (
                <tr key={p.patient_id} className="hover:bg-slate-50/60">
                  <Td className="font-medium text-slate-900">{p.full_name}</Td>
                  <Td>{p.gender}</Td>
                  <Td>{ageFromDob(p.date_of_birth)}</Td>
                  <Td>{p.phone}</Td>
                  <Td>{p.blood_group || '—'}</Td>
                  <Td>{p.user_id ? <Badge tone="green">Has login</Badge> : <Badge>Walk-in</Badge>}</Td>
                  <Td>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="secondary" onClick={() => setView(p)}><Eye className="h-3.5 w-3.5" /> View</Button>
                      <Button size="sm" variant="secondary" onClick={() => setForm({ ...p, blood_group: p.blood_group || '', address: p.address || '' })} aria-label="Edit patient"><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteFor(p)} aria-label="Delete patient"><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
            <Pagination page={page} size={SIZE} count={list.data?.count ?? 0} onPage={setPage} />
          </>
        )}
      </Card>

      <Modal open={Boolean(form)} title={form?.patient_id ? 'Edit patient' : 'Add patient'} onClose={() => setForm(null)}>
        {form && (
          <form onSubmit={save} className="space-y-4">
            <Field label="Full name" required><Input value={form.full_name} onChange={set('full_name')} required minLength={2} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Gender" required>
                <Select value={form.gender} onChange={set('gender')}><option>Male</option><option>Female</option><option>Other</option></Select>
              </Field>
              <Field label="Date of birth" required>
                <Input type="date" max={todayStr()} value={form.date_of_birth} onChange={set('date_of_birth')} required />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone" required hint="Digits only"><Input value={form.phone} onChange={set('phone')} inputMode="numeric" required /></Field>
              <Field label="Blood group">
                <Select value={form.blood_group} onChange={set('blood_group')}>
                  <option value="">Unknown</option>{BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Address"><Textarea rows={2} value={form.address} onChange={set('address')} /></Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
              <Button type="submit" loading={busy}>{form.patient_id ? 'Save changes' : 'Add patient'}</Button>
            </div>
          </form>
        )}
      </Modal>
      <PatientDetails patient={view} onClose={() => setView(null)} />
      <ConfirmDialog
        open={Boolean(deleteFor)} danger loading={busy} title="Delete this patient?"
        message={deleteFor && `${deleteFor.full_name} will be removed. Patients who already have appointments cannot be deleted (the database protects the history).`}
        confirmText="Delete" onCancel={() => setDeleteFor(null)} onConfirm={remove}
      />
    </>
  );
}
