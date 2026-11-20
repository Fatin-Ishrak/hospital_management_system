// DOCTOR: patients who have an appointment with this doctor (the database only returns those).
import { useState } from 'react';
import { api } from '@/core/api';
import { Eye, RefreshCw, Users } from 'lucide-react';

import { useData, useDebounce } from '@/core/hooks/hooks.js';
import {
  Button,
  Card,
  EmptyState,
  ErrorBox,
  PageHeader,
  PageLoader,
  Pagination,
  SearchBox,
  Table,
  Td,
} from '@/core/ui';
import PatientDetails from '@/core/components/PatientDetails.jsx';
import { ageFromDob } from '@/core/utils/format.js';

const SIZE = 10;

// The database only returns patients who have an appointment with this doctor (RLS policy patients_select_doctor)
export default function DoctorPatients() {
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const search = useDebounce(searchText);
  const list = useData(() => api.patients({ search, page, size: SIZE }), [search, page]);
  const [view, setView] = useState(null);
  const rows = list.data?.rows ?? [];
  return (
    <>
      <PageHeader title="My patients" subtitle="Patients who have booked an appointment with you.">
        <Button variant="secondary" onClick={list.reload}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </PageHeader>
      <Card>
        <div className="p-4 border-b border-slate-100">
          <SearchBox value={searchText} onChange={(v) => { setSearchText(v); setPage(1); }} placeholder="Search name or phone" />
        </div>
        {list.error && <div className="p-4"><ErrorBox error={list.error} onRetry={list.reload} /></div>}
        {list.loading && !list.data ? (
          <PageLoader />
        ) : (
          <>
            <Table columns={['Name', 'Gender', 'Age', 'Phone', 'Blood group', 'Actions']} empty={!rows.length && <EmptyState icon={Users} title="No patients yet" />}>
              {rows.map((p) => (
                <tr key={p.patient_id} className="hover:bg-slate-50/60">
                  <Td className="font-medium text-slate-900">{p.full_name}</Td>
                  <Td>{p.gender}</Td>
                  <Td>{ageFromDob(p.date_of_birth)}</Td>
                  <Td>{p.phone}</Td>
                  <Td>{p.blood_group || '—'}</Td>
                  <Td><Button size="sm" variant="secondary" onClick={() => setView(p)}><Eye className="h-3.5 w-3.5" /> Details</Button></Td>
                </tr>
              ))}
            </Table>
            <Pagination page={page} size={SIZE} count={list.data?.count ?? 0} onPage={setPage} />
          </>
        )}
      </Card>
      <PatientDetails patient={view} onClose={() => setView(null)} />
    </>
  );
}
