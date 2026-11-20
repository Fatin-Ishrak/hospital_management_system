# Deploy the Final Website with Vercel

Goal: put the **one integrated website** online at a free `https://….vercel.app` address, using the **same** GitHub repository and your **existing** Supabase project.

## Who does what (do not mix these up)

| Tool | Job | Free plan |
|---|---|---|
| **GitHub Desktop** | Moves code from your PC to GitHub (commit, push, pull). It does **not** host or deploy anything | Free |
| **GitHub** | Stores the code and shows the history | Free |
| **Vercel** | Builds the website from GitHub and hosts it | Free "Hobby" plan (personal, non-commercial use) |
| **Supabase** | The database and logins (already created) | Free plan |

Deploy the **final integrated project** (the whole repository). The three members' parts are not deployed separately.

> Vercel's pages and buttons change from time to time. If a screen looks different, look for the same words.

---

## 1. Before you deploy

1. All three members have pushed (GitHub Desktop → History shows all three authors).
2. On one computer: **Fetch origin → Pull origin**, then run `npm run build` (see `LOCAL_RUN_GUIDE.md`). It must end with `✓ built`.
3. You have your **Project URL** and **publishable key** ready (`LOCAL_RUN_GUIDE.md`, step 4.1).
4. Choose **one deployer**: the repository owner is best. The deployer needs a Vercel account.

## 2. Create the Vercel account (deployer, once)

1. Open **https://vercel.com/signup**.
2. Choose the **Hobby** plan (personal) and **Continue with GitHub**. Authorize Vercel.
3. **No credit card is needed for Hobby.** If a screen asks for a card or says "Pro", you picked the wrong plan. Go back and choose Hobby.

## 3. Import the repository

1. On the Vercel dashboard click **Add New… → Project**.
2. Under **Import Git Repository** find `hospital-management-system`.
   - Not listed? Click **Adjust GitHub App Permissions** (or "Install"), allow access to this repository, and return.
3. Click **Import**.

## 4. Configure the project

On the "Configure Project" screen:

| Setting | Value |
|---|---|
| Framework Preset | **Vite** (detected automatically) |
| Root Directory | `./` (leave as it is) |
| Build Command | leave the default (`npm run build`) |
| Output Directory | `dist` (default) |
| Node.js Version | 22.x or newer (default is fine; this project needs 22.12 or newer) |

Open **Environment Variables** and add **two** variables (Name → Value, click **Add** after each):

| Name (exactly) | Value |
|---|---|
| `VITE_SUPABASE_URL` | your Project URL, e.g. `https://abcdefghijkl.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | your `sb_publishable_…` key |

Use **only** the publishable key. Never add a secret key or the `service_role` key. The project's build refuses to compile if a secret key appears in the code.

Click **Deploy**.

## 5. Wait and open the site

1. The build log runs `npm install` and `npm run build`. It takes 1 to 3 minutes.
2. When it finishes you see **Congratulations!** and a preview picture. Click it, or **Visit**.
3. Your website address looks like `https://hospital-management-system-xxxx.vercel.app`. Copy it.

## 6. Connect and test the live site

1. Open the address. You should see the **login page** (not a white page).
2. Run the **live checklist** in `LOCAL_RUN_GUIDE.md` (section 7) on the live address.
3. Optional (tidy): in Supabase go to **Authentication → URL Configuration** and set **Site URL** to your Vercel address. This is not required for email-and-password login with "Confirm email" off, but it is the correct value for the future.
4. Refresh a deep page such as `/admin/patients`. It must still open (the file `vercel.json` handles this).

## 7. Updating the website later

Every time someone pushes to `main` with GitHub Desktop, Vercel builds and publishes a new version automatically (Vercel → **Deployments**). If you only change environment variables, click **Deployments → ⋯ → Redeploy**, because variables are read at build time.

## 8. Vercel plan restrictions and what to do

The Hobby plan is meant for **one person**. People have reported that for **private** repositories, Vercel can **block deployments caused by other people's commits** (messages such as "does not support collaboration"). Your repository is **public**, which should avoid this. I could not test it with your accounts, so check it early: after a second member pushes, look at Vercel → **Deployments**.

If a deployment is **blocked**:

| Option | What to do |
|---|---|
| **A. Owner makes the last commit** | The deployer (Vercel account owner) pulls everything, makes a small change in a file they own (for example add a line to `README.md`), commits and pushes. Vercel deploys that commit because the owner wrote it. (This should work but has not been tested.) |
| **B. Deploy-only copy** | The deployer creates a **second, personal** repository, uploads the final project into it with GitHub Desktop (the `HMS-Final-Integrated.zip` contents), and connects Vercel to that copy. Your teacher's link stays the shared repository. Update the copy when the team finishes. |
| **C. Another free host** | Other free hosts can build a Vite project from GitHub (for example Netlify or Cloudflare Pages). I have **not** verified their current free terms, so read them first. Use the same two environment variables and build command `npm run build`, publish directory `dist`. For single-page routing, they need a "redirect everything to /index.html" rule. |

If **nothing** works, the project still runs perfectly on any computer with `npm run dev` (see `LOCAL_RUN_GUIDE.md`) and you can demonstrate it that way.

## 9. Common problems

| Problem | Reason | Fix |
|---|---|---|
| Build fails with `Core check FAILED … MISSING` | Not every member's files are on `main` yet | Wait for the missing owner (named in the message) to push |
| Build fails with `CHANGED` | A shared file was edited | Undo that change and push again |
| White page "Supabase is not connected yet" | The two environment variables are missing or misspelled | Vercel → Settings → Environment Variables, fix, then **Redeploy** |
| Login fails only on the live site | Wrong URL/key (maybe a different project) | Compare with Supabase → Connect; redeploy |
| Page not found after refresh | `vercel.json` missing | It is part of the starter files; make sure it is on GitHub |
| "Node.js version" error | Old Node on Vercel | Vercel → Settings → General → Node.js Version → 22.x or newer |

## 10. What to give your teacher

1. The **GitHub repository link** (required): shows commits and Contributors.
2. The **live website link** (optional): shows the finished system.
3. A demo in the Supabase dashboard (Table Editor, SQL Editor, Database pages) while using the website.
