# Automated Content Loading

## Two repositories

| Repo | Role |
|------|------|
| App | Syncs content, generates `contentLoader.ts`, ships the site |
| `react-mastery-content` | Markdown PRs from the community |

## Auto-redeploy

Merges to `main` on the content repo trigger a GitHub Action that hits a **Vercel Deploy Hook**, so the live app rebuilds with new articles.

Setup steps (one-time): see https://github.com/Tlhogi007/react-mastery-content/blob/main/AUTO_REDEPLOY.md

## How it works

1. Someone adds `community/name/article.md` in the **content** repo and opens a PR
2. You merge on GitHub
3. App build runs:
   - `npm run sync:content` — copies/clones into local `content/`
   - `npm run generate:content` — writes `src/lib/contentLoader.ts`
4. Community page reads that generated module

## Commands

```bash
npm run sync:content       # pull content repo → content/
npm run generate:content   # markdown → contentLoader.ts
npm run prepare:content    # both
npm run build              # prepare:content + typecheck + vite build
```

## Configure content source

**Option A — local sibling (default for this machine)**

`.content-repo`:

```
../react-mastery-content
```

**Option B — GitHub URL (CI / Vercel)**

```
https://github.com/Tlhogi007/react-mastery-content.git
```

Or set `CONTENT_REPO_URL` in the environment.

See `.content-repo.example` and [TWO_REPO_SETUP.md](./TWO_REPO_SETUP.md).

## Markdown format

```markdown
---
title: "Article Title"
author: "Author Name"
github: "github-username"
topic: "Effects"
difficulty: "intermediate"
date: "2026-02-28"
tags: ["tag1", "tag2"]
estimatedTime: "10 min read"
---

# Article Content Here
```

## Troubleshooting

```bash
ls content/community/
node scripts/sync-content.cjs
node scripts/generate-content-loader.cjs
```

If sync cannot find a source, it keeps the existing `content/` folder.
