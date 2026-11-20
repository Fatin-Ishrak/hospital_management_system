// SHARED MESSAGES: small success/error pop-ups (toast) with friendly database error texts.
import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import { friendlyError } from '@/core/utils/errors.js';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const push = useCallback((type, text) => {
    const id = Math.random().toString(36).slice(2);
    setItems((l) => [...l, { id, type, text }]);
    setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), type === 'error' ? 7000 : 3500);
  }, []);

  const api = useMemo(
    () => ({
      success: (text) => push('success', text),
      error: (err) => push('error', typeof err === 'string' ? err : friendlyError(err)),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[22rem] max-w-[calc(100vw-2rem)] no-print">
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg bg-white ${
              t.type === 'error' ? 'border-red-200' : 'border-emerald-200'
            }`}
          >
            {t.type === 'error' ? (
              <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            )}
            <p className="text-sm text-slate-700 flex-1">{t.text}</p>
            <button onClick={() => setItems((l) => l.filter((x) => x.id !== t.id))} aria-label="Dismiss">
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
