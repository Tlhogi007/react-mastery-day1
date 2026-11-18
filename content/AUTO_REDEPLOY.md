# Auto-redeploy when content changes

When `main` is updated, GitHub Actions POSTs a **Vercel Deploy Hook** so the app rebuilds with fresh community content. No account-wide `VERCEL_TOKEN` is used.

## Setup (one-time)

1. Vercel → **react-mastery-day1** → Settings → Git → **Deploy Hooks**
2. Create a hook (e.g. name `content-sync`, branch `main`)
3. Copy the hook URL
4. Add it as a repo secret on the content repo:

```bash
gh secret set VERCEL_DEPLOY_HOOK_URL -R Tlhogi007/react-mastery-content
```

5. Remove the old broad token if present:

```bash
gh secret delete VERCEL_TOKEN -R Tlhogi007/react-mastery-content || true
```

Also revoke that token at https://vercel.com/account/tokens if it was only used for this.

## Status

- Secret: `VERCEL_DEPLOY_HOOK_URL` (project-scoped hook URL)
- Workflow: `.github/workflows/redeploy-app.yml`
- Live app: https://react-mastery-day1.vercel.app

## Manual test

Actions → **Redeploy React Mastery app** → **Run workflow**
