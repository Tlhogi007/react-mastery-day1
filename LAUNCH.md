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

## Done for launch automation

- [x] Vercel CLI authenticated (`tlhogi007`)
- [x] Project linked; production deployed
- [x] Env vars `VITE_CONTENT_REPO_URL` + `CONTENT_REPO_URL` set
- [x] Content repo Action redeploys via `VERCEL_TOKEN` (verified green)
- [x] Watching content repo for PR notifications

Optional later: connect GitHub under Vercel → Settings → Git for push-to-deploy on the app repo.

Details: https://github.com/Tlhogi007/react-mastery-content/blob/main/AUTO_REDEPLOY.md

## After that

Merging a content PR → Action fires → Vercel rebuilds → article shows on Community.
