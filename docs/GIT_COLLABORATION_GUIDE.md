# Git & GitHub Desktop Collaboration Guide

For three beginner students who share **ONE public GitHub repository**.
Every step uses **GitHub Desktop** (a free program with buttons). You do not need to type Git commands.

> Button and menu names can differ slightly between GitHub Desktop versions. If something looks different, look for the same words nearby, or ask your team.

---

## 0. The idea in 60 seconds

- There is **one repository** on GitHub. Its link is the one you give your teacher.
- Each of you has a **copy on your own computer** (this is called a *clone*).
- You change files on your computer, **commit** (save a labelled snapshot) and **push** (upload) them.
- Before you start working you **pull** (download) what the others uploaded.
- Because every member owns **different folders** (see `OWNERSHIP.md`), you almost never touch the same file, so there are almost no conflicts.
- Your commits carry **your own name and your own GitHub account**. That is what the teacher sees in the history and in Insights → Contributors.

### The five golden rules

1. **Pull before you start working** (every time).
2. **Only change your own files.** Check `OWNERSHIP.md`.
3. **Never edit** anything inside `src/core/` or `src/app/` that is not yours. The build checks this and will fail if shared files are changed.
4. **Never put passwords or keys in files** that go to GitHub. Your private settings live only in `.env.local`, which Git ignores.
5. **Commit small and often**, with a clear message.

### Who is who

| Role | What they do |
|---|---|
| **Repository owner (team lead)** | Creates the repository, invites the others, makes the first commit. Recommended: Member 1. |
| **Member 1** | Authentication, app shell, Admin portal |
| **Member 2** | Doctor portal, UI kit, layout |
| **Member 3** | Patient portal, shared data API, utilities |

### Your ZIP files

| File | Who uses it | What it contains |
|---|---|---|
| `Step1-Repo-Starter.zip` | Repository owner | 41 files: configuration, scripts, SQL, guides, README |
| `Step2-Member1-Files.zip` | Member 1 | 22 files: Admin portal + auth + app shell |
| `Step2-Member2-Files.zip` | Member 2 | 17 files: Doctor portal + UI kit + layout |
| `Step2-Member3-Files.zip` | Member 3 | 24 files: Patient portal + data API + utilities |
| `HMS-Final-Integrated.zip` | Anyone (for reference/testing) | The complete project. **Do not upload this one.** |

The four Step ZIPs fit together exactly like puzzle pieces. They never contain the same file twice.

---

## Part 1: Everyone does this once

### 1.1 Create a GitHub account (skip if you have one)

1. Open **https://github.com** and click **Sign up**.
2. Enter your email, a password and a username. Use a username you are happy to show your teacher.
3. Verify your email address (GitHub sends you a message).
4. Free plan only. **Nothing here needs a credit card.**

### 1.2 Find your private "no-reply" commit email (recommended)

Because the repository is **public**, anybody can see the email stored in your commits. GitHub gives every account a private address for this.

1. On github.com click your profile picture → **Settings** → **Emails**.
2. Tick **Keep my email addresses private**.
3. Copy the address shown like `12345678+yourusername@users.noreply.github.com`. You will use it in step 1.4.

### 1.3 Install GitHub Desktop

1. Open **https://desktop.github.com** and click **Download for Windows**.
2. Run the downloaded installer. It installs by itself and opens the program.

### 1.4 Sign in and set your Git identity

1. On the welcome screen click **Sign in to GitHub.com**. Your browser opens. Click **Authorize** and return to GitHub Desktop.
2. On the "Configure Git" screen (or later via **File → Options → Git**), set:
   - **Name:** your real name (the teacher will see this).
   - **Email:** choose the `...@users.noreply.github.com` address from the list (or the email that is **verified on your GitHub account**).
3. Click **Save / Finish**.

> **Why this matters:** GitHub only links a commit to your account if the commit email belongs to your GitHub account. If it does not, your commits will show a name but **no profile picture and no entry in Contributors**. If that ever happens, see Part 7.

**Check:** **File → Options → Accounts** shows your GitHub username, and **File → Options → Git** shows your name and email.

---

## Part 2: The repository owner creates the one repository

*(Only one person does Part 2.)*

### 2.1 Create the repository on GitHub

1. Go to **https://github.com/new**.
2. **Repository name:** `hospital-management-system` (or any name the team agrees on).
3. **Description:** `DBMS course project: Hospital Management System (React + Supabase)`.
4. Choose **Public**. (Your teacher can then open it without an invitation.)
5. **Do not** tick "Add a README file", "Add .gitignore" or "Choose a license". We bring our own files.
6. Click **Create repository**.
7. **Copy the repository address** from the browser (for example `https://github.com/yourname/hospital-management-system`). **This is the single link for your teacher.**

### 2.2 Invite the other two members as collaborators

1. In the repository on GitHub click **Settings** (top tab).
2. In the left menu click **Collaborators**. (GitHub may ask you to confirm your password.)
3. Click **Add people**.
4. Type the other member's **GitHub username**, pick them from the list, and click **Add … to this repository**.
5. Repeat for the third member.
6. Tell them to look at their email or the GitHub bell icon. The invitation stays *pending* until they accept it.

### 2.3 Clone the repository to your computer

1. Open **GitHub Desktop**.
2. Click **File → Clone repository…**.
3. Open the **GitHub.com** tab and select `hospital-management-system`. (Or use the **URL** tab and paste the repository address.)
4. **Local path:** choose a short folder such as `C:\HMS\hospital-management-system`.
   *Avoid folders inside OneDrive or "Documents" if your PC syncs them. Syncing thousands of project files can cause trouble.*
5. Click **Clone**. GitHub Desktop will say the repository is empty. That is expected.

### 2.4 First commit: the starter files

1. Extract `Step1-Repo-Starter.zip` (right-click → **Extract All…**).
2. Open the extracted folder, select **everything inside it** (**Ctrl+A**) and copy (**Ctrl+C**).
3. In GitHub Desktop click **Repository → Show in Explorer** (opens your clone folder). Paste (**Ctrl+V**) into it.
4. Go back to GitHub Desktop. The **Changes** tab on the left now lists the new files (about 41).
5. In the box **Summary (required)** at the bottom left, type: `Add project starter: config, scripts, SQL and guides`
6. Click the blue button **Commit … files to main**.
7. Click **Push origin** at the top (or **Publish branch** if that is the label shown).
8. Open the repository page on GitHub and refresh. You should see the files.

The project cannot run yet. The members still have to add their parts.

---

## Part 3: Members 2 and 3 (and Member 1 if not the owner) accept and clone

1. Open the invitation email → **View invitation** → **Accept invitation**.
   (No email? Open `https://github.com/OWNER/REPOSITORY/invitations`, replacing OWNER and REPOSITORY, or click the bell icon on github.com.)
2. In **GitHub Desktop** click **File → Clone repository…** → **GitHub.com** tab → choose the shared repository (it is listed under the owner's name) → choose a local path such as `C:\HMS\hospital-management-system` → **Clone**.
3. Open the **History** tab. You should see the owner's first commit.

---

## Part 4: Round 2. Each member adds their own files

**This is the most important part. Follow it carefully.**

### 4.1 Before you copy anything

1. In GitHub Desktop click **Fetch origin**. If it changes to **Pull origin**, click it.
2. Make sure the **Changes** tab is empty (no changed files).

### 4.2 Copy your ZIP's contents into your clone

1. Extract **only your own** ZIP (`Step2-Member1-Files.zip`, `Step2-Member2-Files.zip` or `Step2-Member3-Files.zip`).
2. Open the extracted folder. You will see folders such as `src` and `docs`.
3. Select everything inside, then copy it.
4. In GitHub Desktop click **Repository → Show in Explorer** and paste into the clone folder.
5. Windows may say a folder named `src` or `docs` already exists. Click **Yes / Merge**. This only *adds* your files next to the existing ones.
6. **Stop if** Windows asks whether to *replace* a file. That means two ZIPs contain the same file or you picked the wrong ZIP. Click **Cancel** and ask your team lead. Never replace another member's files.

### 4.3 Check exactly what will be committed

1. In GitHub Desktop open the **Changes** tab.
2. The count must be exactly your number:

   | Member | Files you should see |
   |---|---|
   | Member 1 | 22 |
   | Member 2 | 17 |
   | Member 3 | 24 |

3. Click a few files. Their paths must start with your own folders (see `OWNERSHIP.md`). Examples:
   - Member 1: `src/modules/admin/…`, `src/app/…`, `src/core/auth/…`, `src/core/supabase/…`
   - Member 2: `src/modules/doctor/…`, `src/core/ui/…`, `src/core/layout/…`
   - Member 3: `src/modules/patient/…`, `src/core/api/…`, `src/core/utils/…`
4. If you see files that are **not yours**, remove their tick-box (the checkbox next to the file) so they are not committed, or start again from 4.1.

### 4.4 Commit

1. Write a clear **Summary**, for example:
   - Member 1: `Add admin portal, authentication and app shell`
   - Member 2: `Add doctor portal, UI kit and layout`
   - Member 3: `Add patient portal, data API and utilities`
2. Optional: add a longer **Description** (what you added).
3. Click **Commit … files to main**.

*Tip: smaller commits look better in history. You may commit in several rounds, for example "Add admin dashboard", then "Add admin patient management". Tick only some files each time.*

### 4.5 Push

1. Click **Push origin** in the top bar.
2. If GitHub Desktop shows **Pull origin** instead, someone pushed before you. Click **Pull origin** first, then **Push origin**.
3. Open the repository on github.com and refresh. Your files and commit are there.

### 4.6 When all three have pushed

Each member: click **Fetch origin → Pull origin**, then follow `LOCAL_RUN_GUIDE.md` to run `npm install` and `npm run build`. The build should now succeed. If it says files are **MISSING**, someone has not pushed yet. The message names the owner.

---

## Part 5: Your daily routine (after Round 2)

1. **Fetch origin**, then **Pull origin** if offered.
2. Work on **your** files only (your folders).
3. Test: `npm run dev` (see `LOCAL_RUN_GUIDE.md`).
4. In GitHub Desktop **Changes** tab: look at the list. Is every file yours? Click files to see what changed (green = added, red = removed).
5. Write a Summary, click **Commit … to main**.
6. Click **Push origin**.

Before a big push, run `npm run build`. If it fails, fix it **before** pushing, so the website on Vercel does not break.

---

## Part 6: Avoiding and fixing problems

### How to avoid conflicts

- Stay in your own folders. Do not "tidy" or reformat someone else's file.
- Pull first, push soon after. Do not sit on a week of uncommitted changes.
- Need a change in a shared file (`src/core/…`)? Ask the owner of that file (see `OWNERSHIP.md`) or the team lead. They change it and everybody pulls.
- `package.json` and `package-lock.json` belong to the team lead. If you need a new library, ask the lead.

### Common messages

| What you see | What it means | What to do |
|---|---|---|
| **Pull origin** instead of **Push origin** | Someone else pushed first | Click **Pull origin**, then **Push origin** |
| "Can't pull because you have uncommitted changes" | Your changes touch the same files as new ones | Commit your changes first (Summary → Commit), then pull |
| "Resolve conflicts before merging" | You and someone else changed the **same lines of the same file** | See below |
| Push rejected / "non-fast-forward" | Same as the first row | Pull, then push |
| "Authentication failed" | GitHub Desktop lost your login | **File → Options → Accounts → Sign out**, then sign in again |
| You committed to the wrong files | Not pushed yet | **History** tab → right-click your last commit → **Undo commit** (before pushing). Your files come back to the Changes tab |
| A file you did not expect appears in **Changes** | A tool or Windows created it | Do not commit it. Untick it or ask the lead |

### Resolving a merge conflict in GitHub Desktop

A conflict is rare in this project, because the owners work in different folders. If it happens:

1. GitHub Desktop shows **Resolve conflicts** and lists the files with conflicts.
2. **Safest beginner option:** click **Abort merge** (or **Cancel**). Nothing is lost; you are back to how you were before pulling.
3. Tell your team **which file** was listed. Usually it means somebody edited a file that is not theirs.
4. Decide with the team whose version is right. The owner of the file (see `OWNERSHIP.md`) decides.
5. If you really must resolve it yourself, GitHub Desktop opens the file in an editor. Inside the file, Git marks the two versions between `<<<<<<<`, `=======` and `>>>>>>>`. Keep the correct text, delete the three marker lines, save the file, return to GitHub Desktop and click **Continue merge** / **Commit merge**. GitHub Desktop needs an external text editor for this. A free one (for example Notepad++ or VS Code) can be chosen under **File → Options → Integrations**. You only need one if a conflict happens.

---

## Part 7: Check that your commits count

After your first push, **each member** checks:

1. On github.com open the repository → click **Commits** (the clock/commits link above the file list).
2. Find **your** commit. You should see **your profile picture and username** next to it.
3. If you see only a name and a grey circle, GitHub does not know your commit email. Fix:
   - github.com → **Settings → Emails** → add (and verify) the email that GitHub Desktop used, **or**
   - in GitHub Desktop **File → Options → Git** switch to your `…@users.noreply.github.com` address. (Old commits keep their old email. Adding the old email to your GitHub account fixes old commits too.)

The full checklist for the teacher (commit history **and** Insights → Contributors) is in `CONTRIBUTION_VERIFICATION_GUIDE.md`.

---

## Appendix: what is *not* needed

- **No Command Prompt for Git.** Everything above is done with GitHub Desktop buttons.
- **Command Prompt is used only to run the website** (`npm install`, `npm run dev`, `npm run build`). See `LOCAL_RUN_GUIDE.md`. GitHub Desktop can open it for you: **Repository → Open in Command Prompt**.
- **GitHub Desktop does not host or deploy the website.** It only moves code to GitHub. Hosting is done by Vercel (see `DEPLOYMENT_GUIDE.md`).
