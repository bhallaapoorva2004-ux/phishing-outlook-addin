# Phishing URL Checker — Outlook Add-in

Unlike a Chrome extension, Outlook cannot load these files from your local
disk — every file referenced in `manifest.xml` must be served over **HTTPS**.
GitHub Pages gives you that for free in a few minutes.

## 1. Host these files on GitHub Pages

1. Create a new public GitHub repo, e.g. `phishing-outlook-addin`.
2. Upload everything in this folder (`manifest.xml`, `taskpane.html`,
   `taskpane.css`, `taskpane.js`, `commands.html`, `commands.js`, `icons/`)
   to the repo root.
3. Go to the repo's **Settings → Pages** → under "Build and deployment",
   set Source to **"Deploy from a branch"**, branch `main`, folder `/ (root)`.
   Save.
4. GitHub gives you a URL like:
   `https://YOUR_GITHUB_USERNAME.github.io/phishing-outlook-addin/`
5. Open `manifest.xml` in the repo and **replace every
   `YOUR_GITHUB_USERNAME` and `YOUR_REPO_NAME`** with your real values, then
   commit the change.
6. Visit `https://YOUR_GITHUB_USERNAME.github.io/phishing-outlook-addin/taskpane.html`
   directly in a browser to confirm it loads (you'll see the UI, though
   the "Scan" button only works inside Outlook).

## 2. Sideload it into Outlook

**Outlook on the web:**
1. Open Outlook on the web → Settings (gear) → **Mail → Customize actions**
   → or go directly to **Get Add-ins** → **My add-ins**.
2. Under "Custom add-ins", click **Add a custom add-in → Add from file**.
3. Select your local copy of `manifest.xml`.
4. The "Phishing Checker" group with a "Check Links" button will appear
   when you open an email.

**Outlook desktop (Windows/Mac):**
1. Open an email → **Home tab → Get Add-ins** (or **My Add-ins**).
2. Click **Add a custom add-in → Add from file** → select `manifest.xml`.

## 3. Use it

1. Open any email.
2. Click **Check Links** in the ribbon — this opens the task pane.
3. Paste your Streamlit app URL once and click **Save** (it's remembered).
4. Click **Scan links in this email** — every link in the email is pulled
   out and given an instant local heuristic verdict.
5. Click **Run full AI scan** next to any link to open your Streamlit app
   with that link pre-filled for the real model verdict.

## Notes

- `Permissions` in the manifest is set to `ReadItem` — the add-in can only
  read the currently open email, nothing else in the mailbox.
- If you update any file after sideloading, Outlook on the web usually
  picks up the change on next open; desktop Outlook may need
  Insert → My add-ins → refresh, or a restart.
