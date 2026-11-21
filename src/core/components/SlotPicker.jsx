// SHARED: shows the free 30-minute slots returned by the database function available_slots().
import { useEffect, useState } from 'react';
import { api } from '@/core/api';
import { Spinner } from '@/core/ui';
import { cn, fmtTime, hhmm } from '@/core/utils/format.js';

// Slot picker: shows the free 30-minute slots returned by the database function available_slots()
export function SlotPicker({ doctorId, date, value, onChange }) {
  const [state, setState] = useState({ list: [], loading: false, error: null });
  useEffect(() => {
    if (!doctorId || !date) {
      setState({ list: [], loading: false, error: null });
      return undefined;
    }
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    api.slots(doctorId, date)
      .then((rows) => alive && setState({ list: rows.map((r) => r.slot), loading: false, error: null }))
      .catch((error) => alive && setState({ list: [], loading: false, error }));
    return () => { alive = false; };
  }, [doctorId, date]);

  if (!doctorId) return <p className="text-sm text-slate-400">Choose a doctor first.</p>;
  if (state.loading) return <div className="flex items-center gap-2 text-sm text-slate-500"><Spinner /> Loading free slots…</div>;
  if (state.error) return <p className="text-sm text-red-600">Could not load slots.</p>;
  if (!state.list.length) {
    return <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">No free slots on this date. Try another day.</p>;
  }
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" role="group" aria-label="Free time slots">
      {state.list.map((s) => (
        <button
          type="button"
          key={s}
          onClick={() => onChange(hhmm(s))}
          className={cn(
            'rounded-lg border px-2 py-2 text-sm font-medium transition',
            value === hhmm(s) ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-teal-400'
          )}
        >
          {fmtTime(s)}
        </button>
      ))}
    </div>
  );
}
