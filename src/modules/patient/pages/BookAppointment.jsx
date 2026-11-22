// PATIENT: book an appointment (uses the core slot picker and the database function book_appointment).
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/core/auth/AuthContext.jsx';
import { Card, PageHeader } from '@/core/ui';
import PatientBookForm from '../components/PatientBookForm.jsx';

export default function BookAppointment() {
  const { patient } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  return (
    <>
      <PageHeader title="Book an appointment" subtitle="Pick a doctor, a date and one of the free time slots. The database blocks double bookings." />
      <Card className="p-6 max-w-3xl">
        <PatientBookForm
          patientId={patient.patient_id}
          initialDoctorId={params.get('doctor')}
          onBooked={() => navigate('/patient/appointments')}
        />
      </Card>
    </>
  );
}
