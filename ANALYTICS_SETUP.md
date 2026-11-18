# Google Analytics Setup Guide

## Step 1: Create Google Analytics Account

1. Go to https://analytics.google.com
2. Click "Start measuring"
3. Create account name: "React Mastery"
4. Create property name: "React Mastery Platform"
5. Select timezone and currency
6. Choose "Web" platform
7. Enter your website URL
8. Get your **Measurement ID** (looks like `G-XXXXXXXXXX`)

## Step 2: Add to Your Project

Create `.env` file in project root:

```bash
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
```

Replace `G-XXXXXXXXXX` with your actual Measurement ID.

## Step 3: Initialize in App

Already done! The code is in `src/lib/googleAnalytics.ts`

It will automatically:
- Track page views
- Track exercise completions
- Track quiz scores
- Track community interactions
- Track search queries

## Step 4: Deploy

When you deploy to Vercel:

1. Go to Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add: `VITE_GA_TRACKING_ID` = `G-XXXXXXXXXX`
5. Redeploy

## What You'll See

### In Google Analytics Dashboard:

**Real-time:**
- Current visitors
- Active pages
- Geographic location

**Reports:**
- Total visitors (daily/weekly/monthly)
- Page views
- Average session duration
- Bounce rate
- Top pages
- Traffic sources (Twitter, Reddit, etc.)
- Device breakdown (mobile/desktop)

**Events:**
- Exercise started/completed
- Quiz scores
- Community views
- CTA clicks
- Search queries

## Privacy Considerations

Google Analytics uses cookies. Add to your landing page:

```
This site uses Google Analytics to understand how visitors use the platform.
No personal information is collected.
```

Or use privacy-friendly alternative (Plausible, Umami).

## Testing

In development:
```bash
npm run dev
```

Open browser console, you should see:
```
📊 Google Analytics initialized
```

Navigate around, check Network tab for `google-analytics.com` requests.

## Viewing Data

1. Go to https://analytics.google.com
2. Select "React Mastery" property
3. View real-time data
4. Check reports after 24 hours

## What to Track

**Key Metrics:**
- Daily active users
- Week 1 completion rate
- Average time per exercise
- Quiz scores
- Community engagement
- Traffic sources

**Use this data to:**
- See which exercises are popular
- Identify where users drop off
- Understand traffic sources
- Improve content based on usage

## Alternative: Vercel Analytics

If you don't want Google Analytics:

```bash
npm install @vercel/analytics
```

```typescript
// src/main.tsx
import { Analytics } from '@vercel/analytics/react'

<App />
<Analytics />
```

Simpler but less detailed.

## Cost

**Google Analytics:** FREE forever
**Vercel Analytics:** FREE (1k events/month), then $10/month

## Next Steps

1. Create GA account
2. Get tracking ID
3. Add to `.env`
4. Deploy
5. Watch users come in! 📊

---

## Sentry (errors) — free Developer plan

1. Sign up at https://sentry.io (Developer / free)
2. Create a **React** / browser project named `react-mastery-day1`
3. Copy the **DSN**
4. Add locally and on Vercel (Production + Preview):

```bash
VITE_SENTRY_DSN=https://xxxx@oXXXX.ingest.sentry.io/XXXX
```

5. Redeploy (Vite bakes `VITE_*` at build time)

Wired in `src/lib/sentry.ts` — ErrorBoundary + AI proxy 5xx report when DSN is set. No DSN = no-op.

### Source maps (production)

`@sentry/vite-plugin` uploads hidden source maps on `vite build` when `SENTRY_AUTH_TOKEN` is set (also `SENTRY_ORG`, `SENTRY_PROJECT`). Maps are deleted from `dist/` after upload. Local optional file: `.env.sentry-build-plugin` (gitignored).

### Tags on errors (for email alerts)

Events include tags like `app.view`, `app.day`, `app.exercise`, `app.week`, and for AI failures `ai.provider` / `http.status`. Setup-verification noise is filtered; resolve old test issues in the Sentry UI if they still alert.
