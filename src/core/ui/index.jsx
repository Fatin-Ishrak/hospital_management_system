// UI KIT: buttons, cards, badges, tables, dialogs, form fields, pagination used by every page.
import { useEffect } from 'react';
import {
  X, Loader2, ChevronLeft, ChevronRight, Search, Inbox, AlertTriangle, RefreshCw,
} from 'lucide-react';
import { cn } from '@/core/utils/format.js';
import { friendlyError } from '@/core/utils/errors.js';

export function Button({ variant = 'primary', size = 'md', loading, className, children, disabled, ...rest }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-teal-500/40 disabled:opacity-60';
  const sizes = { sm: 'px-2.5 py-1.5 text-xs', md: 'px-4 py-2 text-sm' };
  const variants = {
    primary: 'bg-teal-600 text-white hover:bg-teal-700',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    dangerOutline: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
    ghost: 'text-slate-600 hover:bg-slate-100',
  };
  return (
    <button className={cn(base, sizes[size], variants[variant], className)} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Card({ className, children }) {
  return <div className={cn('bg-white rounded-2xl border border-slate-200 shadow-sm', className)}>{children}</div>;
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

const tones = {
  teal: 'bg-teal-50 text-teal-700 ring-teal-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  purple: 'bg-violet-50 text-violet-700 ring-violet-200',
};

export function Badge({ tone = 'slate', children }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', tones[tone])}>
      {children}
    </span>
  );
}
export const StatusBadge = ({ status }) => (
  <Badge tone={{ Pending: 'amber', Confirmed: 'blue', Completed: 'green', Cancelled: 'red' }[status] || 'slate'}>{status}</Badge>
);
export const PriorityBadge = ({ priority }) => (
  <Badge tone={{ Normal: 'slate', Urgent: 'amber', Emergency: 'red' }[priority] || 'slate'}>{priority}</Badge>
);
export const PayBadge = ({ status }) =>
  status ? <Badge tone={status === 'Paid' ? 'green' : 'amber'}>{status}</Badge> : <span className="text-slate-400">—</span>;

export function StatCard({ icon: Icon, label, value, tone = 'teal', hint }) {
  const bg = { teal: 'bg-teal-50 text-teal-600', blue: 'bg-blue-50 text-blue-600', amber: 'bg-amber-50 text-amber-600',
    green: 'bg-emerald-50 text-emerald-600', red: 'bg-red-50 text-red-600', purple: 'bg-violet-50 text-violet-600' }[tone];
  return (
    <Card className="p-5 flex items-center gap-4">
      <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center shrink-0', bg)}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500 truncate">{label}</p>
        <p className="text-2xl font-bold text-slate-900 truncate">{value}</p>
        {hint && <p className="text-xs text-slate-400 truncate">{hint}</p>}
      </div>
    </Card>
  );
}

export function Spinner({ className }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-teal-600', className)} />;
}
export function PageLoader({ text = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
      <Spinner /> {text}
    </div>
  );
}
export function EmptyState({ title = 'Nothing here yet', text, icon: Icon = Inbox }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 text-slate-500">
      <Icon className="h-10 w-10 text-slate-300 mb-3" />
      <p className="font-medium text-slate-700">{title}</p>
      {text && <p className="text-sm mt-1 max-w-sm">{text}</p>}
    </div>
  );
}
export function ErrorBox({ error, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
      <div className="flex-1 text-sm text-red-700">{friendlyError(error)}</div>
      {onRetry && (
        <Button size="sm" variant="secondary" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </Button>
      )}
    </div>
  );
}

export const inputCls =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-100';
// fields are full width unless the caller gives an explicit width class such as w-40
const widthOf = (c) => (/(^|\s)w-/.test(c || '') ? c : cn('w-full', c));
export const Input = ({ className, ...p }) => <input className={cn(inputCls, widthOf(className))} {...p} />;
export const Select = ({ className, children, ...p }) => (
  <select className={cn(inputCls, widthOf(className))} {...p}>{children}</select>
);
export const Textarea = ({ className, ...p }) => <textarea rows={3} className={cn(inputCls, widthOf(className))} {...p} />;
export function Field({ label, hint, required, children, className }) {
  return (
    <label className={cn('block', className)}>
      <span className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-slate-400 mt-1">{hint}</span>}
    </label>
  );
}

export function SearchBox({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="relative">
      <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(inputCls, 'pl-9 w-64 max-w-full')}
      />
    </div>
  );
}

export function Modal({ open, title, onClose, children, footer, wide }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-label={title}
        className={cn('w-full bg-white rounded-2xl shadow-2xl my-auto', wide ? 'max-w-3xl' : 'max-w-lg')}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 no-print">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4 no-print">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmText = 'Confirm', danger, loading, onConfirm, onCancel }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>{confirmText}</Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{message}</p>
    </Modal>
  );
}

export function Table({ columns, children, empty }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-4 py-3 font-semibold whitespace-nowrap">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}
export const Td = ({ className, children, ...p }) => (
  <td className={cn('px-4 py-3 align-middle', className)} {...p}>{children}</td>
);

export function Pagination({ page, size, count, onPage }) {
  const pages = Math.max(1, Math.ceil(count / size));
  if (count <= size) return count ? <p className="px-4 py-3 text-xs text-slate-400">{count} record{count === 1 ? '' : 's'}</p> : null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-sm text-slate-500">
      <span>{count} records · page {page} of {pages}</span>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function InfoRow({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-slate-100 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800 text-right">{children || '—'}</span>
    </div>
  );
}
