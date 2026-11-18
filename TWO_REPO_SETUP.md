# Two-repo setup

## Repos

| Repo | URL |
|------|-----|
| Content (public) | https://github.com/Tlhogi007/react-mastery-content |
| App (local) | `~/react-mastery-day1` |

## Local layout

```
~/react-mastery-day1/          ← this app
~/react-mastery-content/       ← content repo (tracks GitHub)
```

## Commands

```bash
npm run prepare:content   # sync content repo + generate loader
npm run dev
```

`.content-repo` currently points at the local sibling for fast sync. For CI/Vercel, set:

```
CONTENT_REPO_URL=https://github.com/Tlhogi007/react-mastery-content.git
```

or put that URL in `.content-repo`.

## Contribute button

`.env`:

```
VITE_CONTENT_REPO_URL=https://github.com/Tlhogi007/react-mastery-content
```

## AI quiz keys (server only)

Never use `VITE_` for provider secrets. Set on Vercel (and local `.env`):

```
GROQ_API_KEY=...
TOGETHER_API_KEY=...
```

The browser calls `/api/ai-quiz`; keys stay on the server.

## Contributor flow

1. Someone PRs markdown into **react-mastery-content**
2. You merge
3. GitHub Action fires the Vercel Deploy Hook
4. App build runs `sync:content` → `generate:content`
5. Article appears on the Community page

One-time hook setup: [AUTO_REDEPLOY.md](https://github.com/Tlhogi007/react-mastery-content/blob/main/AUTO_REDEPLOY.md)
