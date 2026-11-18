# React Mastery Content

Public content repository for the React Mastery learning platform.

**Repo:** https://github.com/Tlhogi007/react-mastery-content

Contributors add markdown here. The app syncs this repo and generates the Community page.

## Structure

```
community/          # Community contributions (PRs go here)
  your-username/
    your-article.md
week1/ … week4/     # Optional curriculum notes
```

## Contribute

1. Fork this repository
2. Add `community/your-github-username/your-article.md`
3. Follow the template in [CONTRIBUTING.md](./CONTRIBUTING.md)
4. Open a Pull Request

## Content format

```markdown
---
title: "Your Title"
author: "Your Name"
github: "your-github-username"
topic: "Fiber"
difficulty: "intermediate"
date: "2026-02-28"
tags: ["fiber", "performance"]
estimatedTime: "10 min read"
---

# Your Title

Your markdown content...
```

## License

Content is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## Platform

- Live app: https://react-mastery-day1.vercel.app
- App source: https://github.com/Tlhogi007/react-mastery-day1

Consumed by the React Mastery app via `npm run sync:content`.
