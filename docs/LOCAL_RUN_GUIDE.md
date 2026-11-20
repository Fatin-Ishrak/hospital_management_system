# Run the Hospital Management System on Your Own Computer

Works on Windows 10/11. You do **not** need VS Code. You will use **GitHub Desktop** (already installed for Git) and the **Command Prompt**.

> The website talks to your **existing Supabase project** (the one you already created). Nothing here creates, resets or changes it.

---

## 1. Install Node.js (once)

1. Open **https://nodejs.org** and download the **LTS** version for Windows (the big green button).
2. Run the installer and keep the default options (click Next until Finish).
3. Close and re-open any Command Prompt window.
4. Check: open **Command Prompt** (press the Windows key, type `cmd`, press Enter) and type:

```
node -v
npm -v
```

You should see two version numbers (for example `v22.x.x` or `v24.x.x`, and `10.x.x` or higher).
Node **22.12 or newer** is required (the current "LTS" download satisfies this).

## 2. Get the latest project (GitHub Desktop)

1. Open **GitHub Desktop**. Make sure the shared repository is selected (top-left "Current repository").
2. Click **Fetch origin**, and **Pull origin** if it appears.
3. Click **Repository → Open in Command Prompt**. A black window opens **already inside the project folder**.
   (Shortcut: `Ctrl + backtick`. Or **Repository → Show in Explorer** to see the folder.)

All commands below are typed into that window.

## 3. Install the project's libraries (once, and after `package.json` changes)

```
npm install
```

- What it does: downloads the free libraries the website needs (React, Tailwind, Supabase client…) into a folder called `node_modules`.
- It takes 1 to 3 minutes. Warnings in yellow are normal; red errors are not.
- `node_modules` is **never** uploaded to GitHub.

## 4. Connect to YOUR existing Supabase project

### 4.1 Find the two values

Open your project in the **Supabase dashboard** (https://supabase.com/dashboard).

- **Project URL:** click the **Connect** button at the top, or go to **Project Settings → Data API**. It looks like `https://abcdefghijkl.supabase.co`.
- **Publishable key:** go to **Project Settings → API Keys**. Copy the key that starts with `sb_publishable_`.

> Screens and names change over time. If you cannot find them, search "API keys" in the Supabase dashboard.
>
> **Only the publishable key is allowed.** Never copy the "secret" key or a key called `service_role`, and never send any key to anyone in a chat. The project's checks refuse secret keys.

### 4.2 Create your private settings file

In the Command Prompt window:

```
copy .env.example .env.local
notepad .env.local
```

Notepad opens. Replace the two placeholder values with yours, so the file looks like this (with your own values):

```
VITE_SUPABASE_URL=https://abcdefghijkl.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxx
```

Save (**Ctrl+S**) and close Notepad.

- `.env.local` stays on **your** computer. Git ignores it, so it is never uploaded. In GitHub Desktop you should **not** see it in the Changes list. If you do, stop and ask your team lead.
- The two names (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) must be exactly as shown.

### 4.3 Check the connection (read-only)

```
npm run verify:supabase
```

It talks to Supabase with the publishable key only, changes nothing, and prints PASS / WARN / FAIL lines. All PASS means:

- the URL and key are accepted,
- the doctor-activation function exists in your database,
- visitors who are not logged in cannot read patient, appointment, invoice or audit data (your security rules work).

A WARN about **Confirm email** means new sign-ups would have to confirm by email. Turn "Confirm email" off in Supabase **Authentication → Sign In / Providers → Email** for the demo.

### 4.4 (Optional) Compare your database with the original design

In the Supabase **SQL Editor**, open a new query, paste the contents of `sql/07_schema_check.sql`, and click **Run**. It only reads. Every line should say `OK`. (If you added your own extra database functions the "functions (public)" line may differ. The lines that matter most are "functions the website calls" = 7 and "RLS policies" = 26.)

## 5. Start the website

```
npm run dev
```

The window shows something like:

```
  VITE ready ...
  ➜  Local:   http://localhost:5173/
```

Open **http://localhost:5173/** in your browser. Leave the Command Prompt window open while you use the site. Press **Ctrl+C** in the window to stop it.

### Run only one portal (useful while developing your own part)

| Command | Shows |
|---|---|
| `npm run dev` | All portals (the real, integrated website) |
| `npm run dev:admin` | Only the Admin portal |
| `npm run dev:doctor` | Only the Doctor portal (and doctor activation page) |
| `npm run dev:patient` | Only the Patient portal (and patient registration page) |

If you log in with a role that is not included, you see a friendly "portal is not included" page.

## 6. Test each role separately

Use a normal browser window for one role at a time and **Log out** (bottom-left button) before switching.

### 6.1 Admin (your existing admin account)

1. Open http://localhost:5173/ → you land on the login page.
2. Log in with **your own admin email and password**.
3. You should arrive at **Admin dashboard** with the sample numbers (patients, doctors, appointments, revenue) and charts.
4. Click through: Patients, Doctors, Departments, Appointments, Prescriptions, Invoices, Audit Log, Users & Roles.
5. On **Doctors** you see an **activation code** for every doctor who has no login yet. Click a code to copy it.

### 6.2 Doctor

1. Log out. On the login page click **Activate your account** (or open `/activate`).
2. Enter your name, an email, a password and **one activation code from the Admin → Doctors page**.
3. You arrive at the **Doctor dashboard** of that doctor (for example *Dr. Rahim Uddin*). That doctor's sample appointments are already there.
4. Open Appointments → **Confirm** a pending one → **Prescribe** → **Complete**.
5. The code is now used. On the Admin → Doctors page this doctor shows **Account active**.

### 6.3 Patient

1. Log out. On the login page click **Create an account** (or open `/register`).
2. Fill the form (phone: digits only, e.g. `01712345678`) and create the account.
3. You arrive at the **Patient dashboard**.
4. **Book Appointment** → choose a doctor → choose tomorrow → click a free slot → write a reason → **Book appointment**.
5. Log in as the admin or doctor and confirm/complete that appointment. Back as the patient you see the prescription and the invoice.

### 6.4 Check that roles are separated

While logged in as a patient, change the address to `http://localhost:5173/admin`. You are sent back to the patient portal. The same is true for every other role.

## 7. Live test checklist against YOUR Supabase project

Please run these and tick them. (My own tests used a **simulated** copy of your database, not your real project. Only you can run this list live. Details are in `TEST_REPORT.md`.)

| # | Live check | Expected result | ✔ |
|---|---|---|---|
| 1 | `npm run verify:supabase` | All PASS | |
| 2 | Admin login | Admin dashboard with your sample data | |
| 3 | Admin → Patients → Add patient | New row also visible in Supabase **Table Editor → patients** | |
| 4 | Admin → Doctors → Add doctor | New row in `doctors`, activation code in `doctor_invites` | |
| 5 | Doctor activation with a code | Doctor dashboard opens; code row disappears from `doctor_invites` | |
| 6 | Patient registration | Rows appear in `profiles` and `patients` | |
| 7 | Patient books an appointment | Row in `appointments` with status `Pending` | |
| 8 | Second booking of the same doctor/time | Refused with "already booked" | |
| 9 | Doctor confirms, prescribes, completes | `prescriptions` row; status `Completed`; row in `invoices` (Unpaid) | |
| 10 | Admin → Invoices → Mark paid | `invoices.payment_status` = `Paid`, `paid_at` filled | |
| 11 | Admin → Audit Log | Entries with each person's email | |
| 12 | Patient opens `/admin` | Redirected to patient portal | |
| 13 | Patient sees only own appointments/prescriptions/invoices | Nobody else's data visible | |
| 14 | `npm run build` | "Architecture check passed" and "built in …" | |

## 8. Create the production build

```
npm run build
```

This runs three things in order: the shared-core check, the architecture/secret check, and the real build. At the end you see `✓ built in …` and a folder `dist` (ignored by Git). To look at the built site locally:

```
npm run preview
```

## 9. Troubleshooting

| Message | Reason | Fix |
|---|---|---|
| `'npm' is not recognized` | Node.js not installed or window opened before install | Install Node.js, close all Command Prompt windows, open a new one |
| `Core check FAILED … MISSING src/...` | A member has not pushed yet, or you have not pulled | **Fetch origin → Pull origin** in GitHub Desktop, or wait for that member |
| `Core check FAILED … CHANGED src/...` | A shared file was edited | Undo the change: in GitHub Desktop right-click the file in **Changes** → **Discard changes** |
| `Architecture check FAILED … RULE 1` | A module imports another module | Move shared code into `src/core` through the owner, or remove the import |
| White page and "Supabase is not connected yet" | `.env.local` missing or has wrong names | Redo step 4.2. Restart `npm run dev` after editing |
| "Invalid login credentials" | Wrong email/password, or the account does not exist in this Supabase project | Check the email/password; create the account |
| "Account not ready" | The login exists but has no profile row | Run the backfill at the end of `sql/02_functions_triggers.sql` in the SQL Editor (it only adds missing profiles) |
| Everything is empty / permission errors | The SQL scripts were not run in this project | Compare with `sql/07_schema_check.sql` |
| Port already in use | Another `npm run dev` window is open | Close it (Ctrl+C) |
