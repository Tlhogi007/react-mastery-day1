# Public launch checklist

## Live

- **App:** https://react-mastery-day1.vercel.app  
- **Content (contributions):** https://github.com/Tlhogi007/react-mastery-content  
- **App source:** https://github.com/Tlhogi007/react-mastery-day1  

## Done in this project

- [x] Separate public content repo  
- [x] Sync + generate on every `npm run build`  
- [x] Community page Contribute links  
- [x] GitHub Action to redeploy app when content merges to `main`  
- [x] App repo on GitHub  
- [x] `vercel.json` + `.env.example`  

## One-time (you — needs Vercel dashboard login)

### 1. Deploy Hook → GitHub secret

1. Vercel → **react-mastery-day1** → Settings → Git → **Deploy Hooks**  
2. Create hook named `content-repo` (branch `main`)  
3. Copy URL → GitHub content repo → Settings → Secrets → Actions  
4. Secret name: `VERCEL_DEPLOY_HOOK`  
5. Re-run: https://github.com/Tlhogi007/react-mastery-content/actions  

Details: https://github.com/Tlhogi007/react-mastery-content/blob/main/AUTO_REDEPLOY.md  

### 2. Vercel env vars

Set for Production (and Preview if you want):

| Name | Value |
|------|--------|
| `VITE_CONTENT_REPO_URL` | `https://github.com/Tlhogi007/react-mastery-content` |
| `CONTENT_REPO_URL` | `https://github.com/Tlhogi007/react-mastery-content.git` |
| `VITE_GA_TRACKING_ID` | your GA id (optional) |
| AI keys | only if you use those features |

Then **Redeploy** once so env vars apply.

### 3. Notifications

On the content repo: **Watch** → **Custom** → Pull requests (or All Activity).

## After that

Merging a content PR → Action fires → Vercel rebuilds → article shows on Community.
