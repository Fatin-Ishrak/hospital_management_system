// PATIENT MODULE descriptor (owner: Member 3). The app shell reads this file to add the Patient portal.
import { LayoutDashboard, CalendarPlus, CalendarDays, Stethoscope, Pill, Receipt, UserCircle } from 'lucide-react';
import Dashboard from './pages/Dashboard.jsx';
import BookAppointment from './pages/BookAppointment.jsx';
import MyAppointments from './pages/MyAppointments.jsx';
import DoctorDirectory from './pages/DoctorDirectory.jsx';
import MyPrescriptions from './pages/MyPrescriptions.jsx';
import MyInvoices from './pages/MyInvoices.jsx';
import Profile from './pages/Profile.jsx';
import Register from './pages/Register.jsx';

export default {
  id: 'patient',
  role: 'patient',
  home: '/patient',
  requires: 'patient', // the account must be linked to a row in the patients table
  nav: [
    { to: '/patient', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/patient/book', label: 'Book Appointment', icon: CalendarPlus },
    { to: '/patient/appointments', label: 'My Appointments', icon: CalendarDays },
    { to: '/patient/doctors', label: 'Doctors', icon: Stethoscope },
    { to: '/patient/prescriptions', label: 'Prescriptions', icon: Pill },
    { to: '/patient/invoices', label: 'Invoices', icon: Receipt },
    { to: '/patient/profile', label: 'My Profile', icon: UserCircle },
  ],
  routes: [
    { index: true, element: <Dashboard /> },
    { path: 'book', element: <BookAppointment /> },
    { path: 'appointments', element: <MyAppointments /> },
    { path: 'doctors', element: <DoctorDirectory /> },
    { path: 'prescriptions', element: <MyPrescriptions /> },
    { path: 'invoices', element: <MyInvoices /> },
    { path: 'profile', element: <Profile /> },
  ],
  publicRoutes: [
    { path: '/register', element: <Register />, link: { text: 'New patient?', label: 'Create an account' } },
  ],
};
