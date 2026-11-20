// DOCTOR MODULE descriptor (owner: Member 2). The app shell reads this file to add the Doctor portal.
import { LayoutDashboard, CalendarDays, Users, Pill, Clock } from 'lucide-react';
import Dashboard from './pages/Dashboard.jsx';
import Appointments from './pages/Appointments.jsx';
import Patients from './pages/Patients.jsx';
import Prescriptions from './pages/Prescriptions.jsx';
import Schedule from './pages/Schedule.jsx';
import Activate from './pages/Activate.jsx';

export default {
  id: 'doctor',
  role: 'doctor',
  home: '/doctor',
  requires: 'doctor', // the account must be linked to a row in the doctors table
  nav: [
    { to: '/doctor', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/doctor/appointments', label: 'Appointments', icon: CalendarDays },
    { to: '/doctor/patients', label: 'My Patients', icon: Users },
    { to: '/doctor/prescriptions', label: 'Prescriptions', icon: Pill },
    { to: '/doctor/schedule', label: 'My Schedule', icon: Clock },
  ],
  routes: [
    { index: true, element: <Dashboard /> },
    { path: 'appointments', element: <Appointments /> },
    { path: 'patients', element: <Patients /> },
    { path: 'prescriptions', element: <Prescriptions /> },
    { path: 'schedule', element: <Schedule /> },
  ],
  publicRoutes: [
    { path: '/activate', element: <Activate />, link: { text: 'Doctor with an activation code?', label: 'Activate your account' } },
  ],
};
