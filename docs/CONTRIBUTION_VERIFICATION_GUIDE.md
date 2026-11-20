# Contribution Verification Guide

How to prove that **all three members** contributed, using the **one public repository link**.
Two places show it: the **commit history** and **Insights → Contributors**.

Nothing here is fake or generated. GitHub builds both views from the real commits that each member pushed from their own account.

---

## A. For the teacher: how to verify (no login or invitation needed)

Open the repository link (for example `https://github.com/OWNER/hospital-management-system`).

### A1. Commit history

1. Click **Commits** (above the file list, it shows a clock icon and a number).
2. Every commit shows the **author's profile picture and username**.
3. To see one student only, use this address (replace the words in capitals):
   `https://github.com/OWNER/REPOSITORY/commits/main?author=STUDENT_USERNAME`
4. Click a commit to see exactly which files it added or changed.

### A2. Insights → Contributors

1. Click the **Insights** tab (top of the repository page).
2. In the left menu click **Contributors**.
3. You should see **three contributors**, each with a commit count and a graph.
   (Also: the main repository page has a **Contributors** box on the right side.)

### A3. Whose work is which part? (folder history)

1. Open the folder, for example `src/modules/admin`.
2. Click **History** (top right of the file list). Only commits that touched this folder appear, with their authors.
3. Do the same for `src/modules/doctor` and `src/modules/patient`.
4. The file `OWNERSHIP.md` lists every file with its owner, and `docs/contributions/Member-1-Contribution.md` (and 2, 3) explain each member's part in simple words.

---

## B. For the students: make sure it works BEFORE the presentation

Each member ticks every box.

| # | Check | How |
|---|---|---|
| 1 | I accepted the repository invitation | github.com → bell icon, or the invitation email |
| 2 | GitHub Desktop is signed in with **my** account | **File → Options → Accounts** |
| 3 | My commit email is linked to my GitHub account | **File → Options → Git**; same email must appear in github.com → **Settings → Emails** (the `…@users.noreply.github.com` address counts) |
| 4 | I pushed my files to **main** | GitHub Desktop shows no "Push origin" arrow with a number |
| 5 | My commit shows **my picture and username** | Repository → **Commits** |
| 6 | My folder history shows my commits | e.g. `src/modules/doctor` → **History** |
| 7 | I appear in **Insights → Contributors** | Repository → **Insights → Contributors** |
| 8 | The website builds after everyone pushed | `npm run build` (see `LOCAL_RUN_GUIDE.md`) |

### If you do not appear in Contributors

| Symptom | Reason | Fix |
|---|---|---|
| Commit shows your **name but no profile picture** | The commit email is not linked to your GitHub account | Add and verify that email in GitHub → **Settings → Emails**. GitHub then links your old commits too |
| Your commits exist but **Contributors shows fewer people** | GitHub counts commits on the **default branch** (`main`) that are linked to an account | Make sure you pushed to `main` and that check 3 passes |
| Everything looks right but the graph is empty or old | GitHub calculates this page in the background | Wait a while and refresh. Do not create fake commits to "force" it |
| A member has no commits at all | They have not pushed yet, or pushed to a different repository | Check **Push origin** and the repository name in GitHub Desktop (top left) |
| Commits appear under the wrong person | Two students used the same computer or the same GitHub Desktop login | Each person must sign out and sign in with **their own** account (**File → Options → Accounts**) before committing |

---

## C. Honest-work rules (please read)

- Each member commits **their own** files from **their own** account. Never commit for someone else and never share a login.
- Do not rewrite or delete history to make numbers look better.
- This project was built with AI assistance, and the README says so. Every member should read, run and understand their own files well enough to explain them. Follow your course's rules about disclosing tool assistance.
- The `docs/contributions` files tell your teacher which files are yours. Use them in your presentation.
