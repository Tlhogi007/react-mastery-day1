# Auto-redeploy when content changes

When a PR is merged to `main` in this repo, GitHub Actions calls a **Vercel Deploy Hook** so the React Mastery app rebuilds and picks up the new markdown.

## One-time setup (you)

### 1. Create a Deploy Hook on Vercel

1. Open [Vercel Dashboard](https://vercel.com/dashboard) → project **react-mastery-day1**
2. **Settings** → **Git** → **Deploy Hooks**
3. Create a hook:
   - Name: `content-repo`
   - Branch: the branch your app deploys from (usually `main`)
4. Copy the hook URL

### 2. Add the secret on GitHub

1. Open https://github.com/Tlhogi007/react-mastery-content/settings/secrets/actions
2. **New repository secret**
   - Name: `VERCEL_DEPLOY_HOOK`
   - Value: the hook URL from Vercel

### 3. Ensure the app build syncs content

On the Vercel project, set (optional — the app also defaults to this URL):

- `CONTENT_REPO_URL` = `https://github.com/Tlhogi007/react-mastery-content.git`
- `VITE_CONTENT_REPO_URL` = `https://github.com/Tlhogi007/react-mastery-content`

`npm run build` already runs `sync:content` then `generate:content`.

## Test

- **Actions** → **Redeploy React Mastery app** → **Run workflow**, or
- Push any commit to `main`

You should see a new deployment on Vercel.
