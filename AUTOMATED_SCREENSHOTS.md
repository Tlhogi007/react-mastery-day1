# Automated Screenshot Capture

## Quick Start

**1. Make sure your dev server is running:**
```bash
npm run dev
```

**2. In a new terminal, run the screenshot script:**
```bash
node take-screenshots.js
```

The script will:
- Open a browser window (you'll see it)
- Navigate through your app
- Take screenshots automatically
- Save them to `screenshots/` folder

## What Gets Captured

### Landing Page:
1. Hero section with terminal animation
2. Concepts section (4 cards)
3. Before/After comparison
4. 30-day timeline
5. Final CTA

### App Interface:
6. Dashboard view
7. Day 1 content page
8. Code playground (if found)
9. Quiz interface (if found)

## Screenshots Location

```
screenshots/
├── landing/
│   ├── 01-hero.png
│   ├── 02-concepts.png
│   ├── 03-comparison.png
│   ├── 04-timeline.png
│   └── 05-cta.png
└── app/
    ├── 01-dashboard.png
    ├── 02-day1-content.png
    ├── 03-playground.png (if found)
    └── 04-quiz.png (if found)
```

## Troubleshooting

**"Cannot find module 'playwright'"**
```bash
npm install -D playwright
npx playwright install chromium
```

**"Connection refused"**
- Make sure `npm run dev` is running
- Check that app is on `http://localhost:5173`

**Screenshots look wrong**
- Wait for animations to complete (script has delays)
- Check if selectors match your components
- Adjust viewport size in script if needed

## Customize

Edit `take-screenshots.js` to:
- Change viewport size (line 9)
- Add more screenshots
- Adjust wait times
- Change selectors

## Manual Screenshots

If automated doesn't work, use:
```bash
./organize-screenshots.sh
```

And take them manually with `Cmd + Shift + 4`
