// ADMIN: audit log viewer (who did what and when). The rows are written by database triggers.
import { useState } from 'react';
import { adminApi } from '../api.js';
import { RefreshCw, ScrollText } from 'lucide-react';

import { useData } from '@/core/hooks/hooks.js';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorBox,
  PageHeader,
  PageLoader,
  Pagination,
  Select,
  Table,
  Td,
} from '@/core/ui';
import { fmtDateTime } from '@/core/utils/format.js';

const SIZE = 15;
const TONE = { INSERT: 'green', UPDATE: 'blue', DELETE: 'red', STATUS: 'purple', PAYMENT: 'green', RESCHEDULE: 'amber' };

export default function AuditLog() {
  const [table, setTable] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const list = useData(() => adminApi.auditLog({ table, action, page, size: SIZE }), [table, action, page]);
  const rows = list.data?.rows ?? [];
  return (
    <>
      <PageHeader title="Audit log" subtitle="Written automatically by database triggers. It shows who did what and when.">
        <Button variant="secondary" onClick={list.reload}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </PageHeader>
      <Card>
        <div className="flex flex-wrap gap-3 p-4 border-b border-slate-100">
          <Select className="w-48" value={table} onChange={(e) => { setTable(e.target.value); setPage(1); }} aria-label="Filter by table">
            <option value="">All tables</option>
            {['appointments', 'patients', 'doctors', 'departments', 'prescriptions', 'invoices'].map((t) => <option key={t}>{t}</option>)}
          </Select>
          <Select className="w-44" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} aria-label="Filter by action">
            <option value="">All actions</option>
            {['INSERT', 'UPDATE', 'DELETE', 'STATUS', 'RESCHEDULE', 'PAYMENT'].map((t) => <option key={t}>{t}</option>)}
          </Select>
        </div>
        {list.error && <div className="p-4"><ErrorBox error={list.error} onRetry={list.reload} /></div>}
        {list.loading && !list.data ? (
          <PageLoader />
        ) : (
          <>
            <Table columns={['When', 'Who', 'Table', 'Action', 'Details']} empty={!rows.length && <EmptyState icon={ScrollText} title="No activity recorded yet" text="Book, change or delete something and it will appear here." />}>
              {rows.map((r) => (
                <tr key={r.log_id} className="hover:bg-slate-50/60">
                  <Td className="whitespace-nowrap text-slate-500">{fmtDateTime(r.performed_at)}</Td>
                  <Td>{r.actor_email}</Td>
                  <Td className="font-mono text-xs">{r.table_name}{r.record_id ? ` #${r.record_id}` : ''}</Td>
                  <Td><Badge tone={TONE[r.action] || 'slate'}>{r.action}</Badge></Td>
                  <Td className="text-slate-700">{r.details}</Td>
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
