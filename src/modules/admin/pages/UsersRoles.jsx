// ADMIN: list accounts and change roles (the database blocks everybody else and blocks changing your own role).
import { useState } from 'react';
import { adminApi } from '../api.js';
import { AlertTriangle, RefreshCw } from 'lucide-react';

import { useData } from '@/core/hooks/hooks.js';
import { useAuth } from '@/core/auth/AuthContext.jsx';
import { useToast } from '@/core/toast/ToastContext.jsx';
import {
  Badge,
  Button,
  Card,
  ErrorBox,
  PageHeader,
  PageLoader,
  Select,
  Table,
  Td,
} from '@/core/ui';
import { fmtDateTime } from '@/core/utils/format.js';

export default function UsersRoles() {
  const { user } = useAuth();
  const toast = useToast();
  const list = useData(() => adminApi.profiles(), []);
  const [draft, setDraft] = useState({});
  const [busyId, setBusyId] = useState(null);

  const save = async (p) => {
    setBusyId(p.id);
    try {
      await adminApi.setRole(p.id, draft[p.id]);
      toast.success(`Role of ${p.email} changed to ${draft[p.id]}.`);
      setDraft((d) => { const n = { ...d }; delete n[p.id]; return n; });
      list.reload();
    } catch (err) {
      toast.error(err);
    }
    setBusyId(null);
  };

  return (
    <>
      <PageHeader title="Users & roles" subtitle="Only an administrator can change roles. Nobody can change their own role.">
        <Button variant="secondary" onClick={list.reload}><RefreshCw className="h-4 w-4" /> Refresh</Button>
      </PageHeader>
      <div className="mb-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <p>Doctors should join with an activation code (Doctors page). Changing someone to <b>doctor</b> here does not create a doctor record, so that person could not open the doctor portal.</p>
      </div>
      <Card>
        {list.error && <div className="p-4"><ErrorBox error={list.error} onRetry={list.reload} /></div>}
        {list.loading && !list.data ? (
          <PageLoader />
        ) : (
          <Table columns={['Name', 'Email', 'Joined', 'Role', 'Change role']}>
            {(list.data ?? []).map((p) => {
              const me = p.id === user?.id;
              const value = draft[p.id] ?? p.role;
              return (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <Td className="font-medium text-slate-900">{p.full_name || '—'} {me && <Badge tone="teal">You</Badge>}</Td>
                  <Td>{p.email}</Td>
                  <Td className="whitespace-nowrap text-slate-500">{fmtDateTime(p.created_at)}</Td>
                  <Td><Badge tone={{ admin: 'purple', doctor: 'blue', patient: 'green' }[p.role]}>{p.role}</Badge></Td>
                  <Td>
                    <div className="flex gap-2 items-center">
                      <Select className="w-36" value={value} disabled={me} onChange={(e) => setDraft({ ...draft, [p.id]: e.target.value })} aria-label={`Role of ${p.email}`}>
                        <option value="admin">admin</option><option value="doctor">doctor</option><option value="patient">patient</option>
                      </Select>
                      <Button size="sm" disabled={me || value === p.role} loading={busyId === p.id} onClick={() => save(p)}>Save</Button>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </>
  );
}
