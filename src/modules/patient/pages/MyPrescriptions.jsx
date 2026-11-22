// PATIENT: prescriptions written for this patient (read only).
import { useState } from 'react';
import { Pill, RefreshCw } from 'lucide-react';
import { api } from '@/core/api';
import { useData, useDebounce } from '@/core/hooks/hooks.js';
import { Button, Card, EmptyState, ErrorBox, PageHeader, PageLoader, Pagination, SearchBox, Table, Td } from '@/core/ui';
import { fmtDate } from '@/core/utils/format.js';

const SIZE = 10;

export default function MyPrescriptions() {
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const search = useDebounce(searchText);
  const list = useData(() => api.prescriptions({ search, page, size: SIZE }), [search, page]);
  const rows = list.data?.rows ?? [];
  return (
    <>
      <PageHeader title="My prescriptions" subtitle="Medicines prescribed after your appointments.">
        <Button variant="secondary" onClick={list.reload}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </PageHeader>
      <Card>
        <div className="p-4 border-b border-slate-100">
          <SearchBox value={searchText} onChange={(v) => { setSearchText(v); setPage(1); }} placeholder="Search medicine" />
        </div>
        {list.error && <div className="p-4"><ErrorBox error={list.error} onRetry={list.reload} /></div>}
        {list.loading && !list.data ? (
          <PageLoader />
        ) : (
          <>
            <Table columns={['Date', 'Doctor', 'Medicine', 'Dosage', 'Days', 'Instructions']} empty={!rows.length && <EmptyState icon={Pill} title="No prescriptions" text="They appear here after a doctor prescribes medicine." />}>
              {rows.map((p) => (
                <tr key={p.prescription_id} className="hover:bg-slate-50/60">
                  <Td className="whitespace-nowrap">{fmtDate(p.appointments?.appt_date)}</Td>
                  <Td>{p.appointments?.doctors?.full_name}</Td>
                  <Td className="font-medium text-slate-900">{p.medicine}</Td>
                  <Td>{p.dosage}</Td>
                  <Td>{p.duration_days}</Td>
                  <Td className="max-w-[14rem] truncate" title={p.instructions || ''}>{p.instructions || '—'}</Td>
                </tr>
              ))}
            </Table>
            <Pagination page={page} size={SIZE} count={list.data?.count ?? 0} onPage={setPage} />
          </>
        )}
      </Card>
    </>
  );
}
