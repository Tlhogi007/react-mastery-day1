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
- [x] GitHub connected under Vercel → Settings → Git (`Tlhogi007/react-mastery-day1`, production branch `main`) — Done
- [x] Sentry client + source maps (`VITE_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` / org / project on Vercel)

Details: https://github.com/Tlhogi007/react-mastery-content/blob/main/AUTO_REDEPLOY.md

## AI quiz cost strategy

- Local questions by default; AI is opt-in in the quiz UI
- Hosted waterfall: Groq → Gemini → Together (server keys only)
- Clerk sign-in required for hosted AI when `CLERK_SECRET_KEY` is set
- Verified email (or Google/GitHub OAuth) required for free hosted AI
- Per-user free tier (`AI_QUIZ_FREE_PER_USER_DAY`, default 5) then BYO nudge
- Per-user free tier requires Upstash (fail closed if Redis missing/down)
- JWT `authorizedParties` via `APP_ORIGIN` / `CLERK_AUTHORIZED_PARTIES` (+ current `VERCEL_URL`)
- Request body validated before quota counters increment
- Per-IP caps + Upstash global daily budget
- Vercel Bot Protection (challenge) on the project firewall
- Learners can paste BYO keys in Settings (browser-only; skips hosted quota)
- No RBAC roles yet — add `plan: free|pro` later if monetizing

## After that

Merging a content PR → Action fires → Vercel rebuilds → article shows on Community.
