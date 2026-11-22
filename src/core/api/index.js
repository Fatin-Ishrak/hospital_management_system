// The shared data API. Every module imports it the same way:  import { api } from '@/core/api';
import * as lookups from './lookups.js';
import * as patients from './patients.js';
import * as appointments from './appointments.js';
import * as prescriptions from './prescriptions.js';
import * as invoices from './invoices.js';

export const api = { ...lookups, ...patients, ...appointments, ...prescriptions, ...invoices };
