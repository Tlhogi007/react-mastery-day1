# Public launch checklist

## Live

- **App:** https://react-mastery-day1.vercel.app  
- **Content (contributions):** https://github.com/Tlhogi007/react-mastery-content  
- **App source:** https://github.com/Tlhogi007/react-mastery-day1  
- **Changelog:** [`CHANGELOG.md`](./CHANGELOG.md) (semantic-release from conventional commits)

## Done in this project

- [x] Separate public content repo  
- [x] Sync + generate on every `npm run build`  
- [x] Community page Contribute links  
- [x] GitHub Action to redeploy app when content merges to `main`  
- [x] App repo on GitHub  
- [x] `vercel.json` + `.env.example`  
- [x] Intro splash (every landing visit; skipped after sign-in / sign-out → landing)  
- [x] Support page (curriculum + community email + contribute link)  
- [x] Lab shell split (`LabShell`, `useLabNavigation`, quiz hooks)  
- [x] Settings theme toggle applies `.light-theme` / `.dark-theme` (shared `setAppTheme`)  
- [x] Playwright cloud-sync e2e (progress + theme/focus/quiz resume/helpful/analytics restore)
- [x] Playwright launch smoke (`npm run test:e2e:smoke`; optional `BASE_URL=` for prod/preview)
- [x] Unit tests + **90% coverage gate** on `api/_lib`, `src/services`, `src/hooks` (`npm test` / Vitest)
  - Excludes static question banks, HTTP provider shells, LLM prompt assembly, large quiz hooks (those stay on e2e)
  - Components are not in the unit coverage include — covered by Playwright smoke/cloud/quiz specs
- [x] CI: `.github/workflows/test.yml` runs `npm test` (coverage) + `npm run test:e2e` on push/PR to `main`
  - Secrets required for e2e: `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (optional `E2E_CLERK_USER_EMAIL` / `E2E_CLERK_USER_PASSWORD`)

Details: https://github.com/Tlhogi007/react-mastery-content/blob/main/AUTO_REDEPLOY.md

## Done for launch automation

- [x] Vercel CLI authenticated (`tlhogi007`)
- [x] Project linked; production deployed
- [x] Env vars `VITE_CONTENT_REPO_URL` + `CONTENT_REPO_URL` set
- [x] Content repo Action redeploys via `VERCEL_TOKEN` (verified green)
- [x] Watching content repo for PR notifications
- [x] GitHub connected under Vercel → Settings → Git (`Tlhogi007/react-mastery-day1`, production branch `main`)
- [x] Sentry client + source maps (`VITE_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` / org / project on Vercel)
- [x] GA when `VITE_GA_TRACKING_ID` is set

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
- Vercel Bot Protection (challenge) on the project firewall; custom bypass for:
  - `POST /api/clerk-webhook`
  - `/__clerk` + `/api/clerk-fapi` (Clerk JS / FAPI proxy when live keys + `CLERK_FAPI_PROXY_ENABLED=1`)
- Learners can paste BYO keys in Settings (**browser-only; never uploaded / never cloud-synced**)
- Signed-in cloud sync (`/api/user-data`) across devices:
  - progress, live day bar, question history
  - notes, annotations, reflections, flashcards, snippets
  - last lab location (exercise / view / tools / tab)
  - theme, tour complete, focus mode
  - mid-quiz resume (30 min TTL)
  - community helpful votes (your marks)
  - local learning-analytics event log
- Quiz UI shows remaining free AI generations (`N/5 free AI left`)
- Greeting uses Clerk first name / username when signed in
- GA `userId` set after signed-in sync (when Analytics configured)
- Clerk webhook `/api/clerk-webhook` purges Upstash cloud + AI quota keys on `user.deleted` / `user.merged`
- Admin AI panel: list Redis free-tier usage + ban via `privateMetadata.aiBanned` (`ADMIN_USER_IDS` or `role: admin`)
- `aiBanned` blocks hosted AI only — cloud sync uses `requireCloudUser` (unaffected by ban)
- Community signed attributions: GitHub avatar/byline + contribute frontmatter from signed-in GitHub
- No paid plans yet — add `plan: free|pro` later if monetizing

## Before calling it public

- [ ] Switch production Clerk to `pk_live_` (still `pk_test_` as of last check)
- [ ] Set `CLERK_FAPI_PROXY_ENABLED=1` when using live keys on vercel.app
- [ ] Confirm Clerk redirect URLs + authorized parties for production origin(s)
- [ ] Run launch smoke against local or prod (`npm run test:e2e:smoke` / `BASE_URL=… npm run test:e2e:smoke`)
- [ ] Clear/resolve stale Sentry issues so launch alerts are real

## After that

Merging a content PR → Action fires → Vercel rebuilds → article shows on Community.
