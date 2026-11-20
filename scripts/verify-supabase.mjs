// READ-ONLY connection check for YOUR Supabase project. It uses only the publishable key
// (the same key the website uses) and changes nothing.   Run:  npm run verify:supabase
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, color } from './lib/project.mjs';

function loadEnv() {
  const env = { ...process.env };
  for (const name of ['.env', '.env.local']) {
    const p = path.join(ROOT, name);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !line.trim().startsWith('#')) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return env;
}
const env = loadEnv();
const url = (env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
let fails = 0;
const ok = (m) => console.log(color.green('  PASS ') + m);
const warn = (m) => console.log(color.yellow('  WARN ') + m);
const fail = (m) => { fails += 1; console.log(color.red('  FAIL ') + m); };

console.log(color.bold('\nSupabase connection check (read-only)\n'));
if (!url || !key || url.includes('YOUR-PROJECT-REF') || key.includes('xxxx')) {
  fail('Create the file .env.local from .env.example and put your Project URL and publishable key in it.');
  process.exit(1);
}
if (!/^https?:\/\//.test(url)) fail('VITE_SUPABASE_URL must start with https://');
if (/^sb_secret_/.test(key)) { fail('That is a SECRET key. Never use it in the website. Use the publishable key.'); process.exit(1); }
try {
  const payload = JSON.parse(Buffer.from(key.split('.')[1] || '', 'base64url').toString() || '{}');
  if (payload.role === 'service_role') { fail('That is the service_role key. Never use it in the website.'); process.exit(1); }
} catch { /* not a JWT: new-style keys are fine */ }
ok('The key is not a secret key.');

const headers = { apikey: key, Authorization: `Bearer ${key}` };
const call = async (p, opt = {}) => {
  try { return await fetch(url + p, { headers: { ...headers, 'Content-Type': 'application/json' }, ...opt }); }
  catch (e) { return { networkError: e.message }; }
};

let r = await call('/auth/v1/settings');
if (r.networkError) { fail(`Cannot reach ${url}  (${r.networkError}). Check the URL and your internet connection.`); process.exit(1); }
if (r.status === 401 || r.status === 403) fail('Supabase rejected the key. Copy the publishable key again.');
else if (!r.ok) fail(`Auth service answered HTTP ${r.status}.`);
else {
  ok('Project URL and key are accepted by Supabase Auth.');
  const s = await r.json();
  if (s.mailer_autoconfirm === false) warn('"Confirm email" is ON: new sign-ups must confirm by email first (turn it off in Authentication settings for the demo).');
  else if (s.mailer_autoconfirm === true) ok('"Confirm email" is OFF: sign-ups can log in immediately.');
  if (s.disable_signup === true) warn('New user sign-ups are disabled in Supabase. Patients could not register.');
}

r = await call('/rest/v1/rpc/verify_doctor_code', { method: 'POST', body: JSON.stringify({ p_code: '__connection_check__' }) });
if (r.status === 200) ok('Database function verify_doctor_code() exists (doctor activation will work).');
else fail(`verify_doctor_code() answered HTTP ${r.status}. Did you run sql/02_functions_triggers.sql and sql/04_rls.sql in this project?`);

for (const table of ['patients', 'appointments', 'invoices', 'audit_log']) {
  r = await call(`/rest/v1/${table}?select=*&limit=1`);
  const body = r.ok ? await r.json() : null;
  if (!r.ok && (r.status === 401 || r.status === 403)) ok(`Anonymous visitors are blocked from reading "${table}".`);
  else if (r.ok && Array.isArray(body) && body.length === 0) ok(`Anonymous visitors get no rows from "${table}" (Row Level Security works).`);
  else if (r.ok) fail(`Anonymous visitors can READ "${table}"! Row Level Security is not set up correctly. Run sql/04_rls.sql.`);
  else if (r.status === 404) fail(`Table "${table}" not found. Run sql/01_schema.sql first.`);
  else warn(`"${table}" answered HTTP ${r.status}.`);
}
console.log(fails ? color.red(`\n${fails} problem(s) found.\n`) : color.green('\nAll checks passed. (This does not test logins; do the live test list in LOCAL_RUN_GUIDE.md.)\n'));
process.exit(fails ? 1 : 0);
