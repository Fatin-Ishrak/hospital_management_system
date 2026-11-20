// SHARED: printable invoice window used by the admin and patient portals.
import { Printer } from 'lucide-react';
import { Button, InfoRow, Modal, PayBadge } from '@/core/ui';
import { fmtDate, fmtDateTime, fmtTime, money } from '@/core/utils/format.js';

// Printable invoice window shared by the admin and patient portals
export default function InvoiceView({ invoice, onClose }) {
  const a = invoice?.appointments;
  return (
    <Modal
      open={Boolean(invoice)} title={invoice ? `Invoice #${invoice.invoice_id}` : ''} onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Close</Button><Button onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button></>}
    >
      {invoice && (
        <div className="print-area bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xl font-bold text-teal-700">CareSphere Hospital</p>
              <p className="text-xs text-slate-500">Invoice #{invoice.invoice_id}</p>
            </div>
            <PayBadge status={invoice.payment_status} />
          </div>
          <InfoRow label="Patient">{a?.patients?.full_name}</InfoRow>
          <InfoRow label="Doctor">{a?.doctors?.full_name}</InfoRow>
          <InfoRow label="Department">{a?.doctors?.departments?.dept_name}</InfoRow>
          <InfoRow label="Visit">{fmtDate(a?.appt_date)} at {fmtTime(a?.appt_time)}</InfoRow>
          <InfoRow label="Reason">{a?.reason}</InfoRow>
          <InfoRow label="Issued">{fmtDateTime(invoice.issued_at)}</InfoRow>
          <InfoRow label="Paid on">{invoice.paid_at ? fmtDateTime(invoice.paid_at) : 'Not paid yet'}</InfoRow>
          <div className="flex justify-between items-center mt-4 pt-3 border-t-2 border-slate-200">
            <span className="font-semibold text-slate-700">Total amount</span>
            <span className="text-2xl font-bold text-slate-900">{money(invoice.amount)}</span>
          </div>
        </div>
      )}
    </Modal>
  );
}
