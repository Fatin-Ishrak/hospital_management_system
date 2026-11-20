// SHARED: patient details + appointment history window (admin and doctor portals).
import { api } from '@/core/api';
import { useData } from '@/core/hooks/hooks.js';
import { InfoRow, Modal, PageLoader, StatusBadge, Table, Td, EmptyState } from '@/core/ui';
import { ageFromDob, fmtDate, fmtTime } from '@/core/utils/format.js';

// Patient details + appointment history (history is filtered by the database security rules)
export default function PatientDetails({ patient, onClose }) {
  const history = useData(() => (patient ? api.patientHistory(patient.patient_id) : Promise.resolve([])), [patient?.patient_id]);
  return (
    <Modal open={Boolean(patient)} title="Patient details" onClose={onClose} wide>
      {patient && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-x-8">
            <div>
              <InfoRow label="Name">{patient.full_name}</InfoRow>
              <InfoRow label="Gender">{patient.gender}</InfoRow>
              <InfoRow label="Age">{ageFromDob(patient.date_of_birth)} years ({fmtDate(patient.date_of_birth)})</InfoRow>
            </div>
            <div>
              <InfoRow label="Phone">{patient.phone}</InfoRow>
              <InfoRow label="Blood group">{patient.blood_group}</InfoRow>
              <InfoRow label="Address">{patient.address}</InfoRow>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Appointment history</h3>
            {history.loading && !history.data ? (
              <PageLoader />
            ) : (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <Table columns={['Date', 'Time', 'Doctor', 'Reason', 'Status']}>
                  {(history.data ?? []).map((a) => (
                    <tr key={a.appointment_id}>
                      <Td>{fmtDate(a.appt_date)}</Td>
                      <Td>{fmtTime(a.appt_time)}</Td>
                      <Td>{a.doctor_name}</Td>
                      <Td>{a.reason}</Td>
                      <Td><StatusBadge status={a.status} /></Td>
                    </tr>
                  ))}
                </Table>
                {!(history.data ?? []).length && <EmptyState title="No appointments yet" />}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
