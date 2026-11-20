// ADMIN MODULE descriptor (owner: Member 1). The app shell reads this file to add the Admin portal.
import {
  LayoutDashboard, Users, Stethoscope, Building2, CalendarDays, Pill, Receipt, ScrollText, ShieldCheck,
} from 'lucide-react';
import Dashboard from './pages/Dashboard.jsx';
import Patients from './pages/Patients.jsx';
import Doctors from './pages/Doctors.jsx';
import Departments from './pages/Departments.jsx';
import Appointments from './pages/Appointments.jsx';
import Prescriptions from './pages/Prescriptions.jsx';
import Invoices from './pages/Invoices.jsx';
import AuditLog from './pages/AuditLog.jsx';
import UsersRoles from './pages/UsersRoles.jsx';

export default {
  id: 'admin',
  role: 'admin',
  home: '/admin',
  requires: null,
  nav: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/patients', label: 'Patients', icon: Users },
    { to: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
    { to: '/admin/departments', label: 'Departments', icon: Building2 },
    { to: '/admin/appointments', label: 'Appointments', icon: CalendarDays },
    { to: '/admin/prescriptions', label: 'Prescriptions', icon: Pill },
    { to: '/admin/invoices', label: 'Invoices', icon: Receipt },
    { to: '/admin/audit', label: 'Audit Log', icon: ScrollText },
    { to: '/admin/users', label: 'Users & Roles', icon: ShieldCheck },
  ],
  routes: [
    { index: true, element: <Dashboard /> },
    { path: 'patients', element: <Patients /> },
    { path: 'doctors', element: <Doctors /> },
    { path: 'departments', element: <Departments /> },
    { path: 'appointments', element: <Appointments /> },
    { path: 'prescriptions', element: <Prescriptions /> },
    { path: 'invoices', element: <Invoices /> },
    { path: 'audit', element: <AuditLog /> },
    { path: 'users', element: <UsersRoles /> },
  ],
};
