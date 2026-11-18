# Contributing to React Mastery

This project uses **two repositories**:

| Repo | Purpose |
|------|---------|
| **App** (this repo) | React platform, UI, build scripts |
| **Content** ([react-mastery-content](https://github.com/Tlhogi007/react-mastery-content)) | Community markdown articles |

## Contribute an article (most common)

Go to the **content** repo — you do not need this app codebase.

1. Fork `react-mastery-content`
2. Add `community/your-github-username/your-article.md`
3. Open a pull request there

Full template and guidelines: see that repo’s [CONTRIBUTING.md](../react-mastery-content/CONTRIBUTING.md) (or on GitHub after you publish it).

## Contribute to the app

Bug fixes, features, and UI changes belong in **this** repository.

1. Fork this repo
2. Create a branch
3. Open a PR with a clear description

### Commit messages (required)

This repo uses **semantic-release**. Non-conventional commits are rejected by a local hook and CI — prose like `Ship security hardening` will **not** bump the version.

```bash
feat: add timed quiz mode          # minor
fix(ui): correct favicon contrast  # patch
feat!: drop React 17 support       # major
chore: tweak eslint                # no bump (still allowed)
```

```bash
npm run check:commit -- .git/COMMIT_EDITMSG   # validate one message
npm run check:commits                         # validate unpushed commits
```

## How content reaches the site

```bash
npm run sync:content      # pull from content repo into content/
npm run generate:content  # build src/lib/contentLoader.ts
```

`npm run build` runs both automatically.

Configure the content source with `.content-repo` (see `.content-repo.example`) or `CONTENT_REPO_URL`.

## Questions?

Open an issue on the relevant repo (content vs app).
