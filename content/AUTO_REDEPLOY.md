# Auto-redeploy when content changes

When `main` is updated, GitHub Actions runs `vercel redeploy` on the production app so new articles are built in.

## Status

- Secret `VERCEL_TOKEN` is configured on this repo
- Workflow: `.github/workflows/redeploy-app.yml`
- Live app: https://react-mastery-day1.vercel.app

## Manual test

Actions → **Redeploy React Mastery app** → **Run workflow**

## Rotate the token

1. Create a new token at https://vercel.com/account/tokens  
2. `gh secret set VERCEL_TOKEN -R Tlhogi007/react-mastery-content`

## Optional: Git + Deploy Hooks

If you connect the app repo under Vercel → Project → Settings → Git, you can switch to Deploy Hooks instead of `vercel redeploy`.
