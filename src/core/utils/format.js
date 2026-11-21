// Date, time, money and small helper functions used by every module.
export const cn = (...parts) => parts.filter(Boolean).join(' ');
export const TZ = 'Asia/Dhaka';

// Today's date in Bangladesh as YYYY-MM-DD (the database also uses Dhaka time)
export const todayStr = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());

export const addDays = (s, n) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

export const fmtDate = (s) => {
  if (!s) return '—';
  const [y, m, d] = String(s).slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
  });
};

export const fmtTime = (t) => {
  if (!t) return '—';
  const [h, m] = String(t).split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

export const fmtDateTime = (ts) =>
  ts
    ? new Date(ts).toLocaleString('en-GB', {
        timeZone: TZ, day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
      })
    : '—';

export const money = (n) => '৳' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
export const hhmm = (t) => (t ? String(t).slice(0, 5) : '');

export const ageFromDob = (dob) => {
  if (!dob) return '';
  const today = todayStr().split('-').map(Number);
  const [y, m, d] = dob.split('-').map(Number);
  let age = today[0] - y;
  if (today[1] < m || (today[1] === m && today[2] < d)) age -= 1;
  return age;
};

export const DAYS = [
  { n: 1, label: 'Mon' }, { n: 2, label: 'Tue' }, { n: 3, label: 'Wed' }, { n: 4, label: 'Thu' },
  { n: 5, label: 'Fri' }, { n: 6, label: 'Sat' }, { n: 7, label: 'Sun' },
];
export const daysText = (arr) =>
  !arr || arr.length === 7 ? 'Every day' : DAYS.filter((d) => arr.includes(d.n)).map((d) => d.label).join(', ');
