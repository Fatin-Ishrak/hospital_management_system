// One place that turns database and network errors into sentences a user can understand.
// Turns database/network errors into sentences a user can understand
export function friendlyError(err) {
  if (!err) return 'Something went wrong.';
  const code = err.code;
  const msg = err.message || String(err);
  if (code === '23503') return 'This record is still used by other records (for example appointments or invoices), so it cannot be deleted.';
  if (code === '23505') {
    if (msg.includes('uq_doctor_slot')) return 'This doctor is already booked at that time.';
    if (msg.includes('uq_patient_slot')) return 'The patient already has an appointment at that time.';
    if (msg.includes('dept_name')) return 'A department with this name already exists.';
    return 'This value already exists. Please use a different one.';
  }
  if (code === '23514') {
    if (msg.includes('phone')) return 'Phone number must be 10 to 15 digits (numbers only).';
    if (msg.includes('fee')) return 'The fee cannot be negative.';
    if (msg.includes('hours')) return 'Working end time must be after the start time.';
    if (msg.includes('days')) return 'Select at least one working day.';
    if (msg.includes('presc_days')) return 'Duration must be between 1 and 365 days.';
    if (msg.includes('reason')) return 'Please describe the reason in at least 3 characters.';
    return 'One of the values is not allowed. Please check the form.';
  }
  if (code === '23502') return 'A required field is missing.';
  if (code === '42501') return 'You do not have permission to do this.';
  if (code === '22P02' || code === '22007' || code === '22008') return 'One of the values has an invalid format.';
  if (/failed to fetch|networkerror/i.test(msg)) return 'Cannot reach the server. Check your internet connection.';
  return msg;
}
