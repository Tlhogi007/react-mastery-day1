# Screenshot Guide for React Mastery

## Quick Start

1. **Make sure your app is running:**
   ```bash
   npm run dev
   ```

2. **Take screenshots** (see checklist below)

3. **Run the organizer:**
   ```bash
   ./organize-screenshots.sh
   ```

## Screenshot Checklist

### Landing Page (5 shots)

**1. Hero Section**
- URL: `http://localhost:5173`
- Capture: Terminal animation + title + CTA button
- Size: Full width, top section

**2. Concept Cards**
- Scroll to: "Not another React course" section
- Capture: All 4 cards with icons
- Try to capture hover state on one card

**3. Before/After Comparison**
- Scroll to: Split view section
- Capture: Both sides with divider

**4. Timeline**
- Scroll to: "30-Day Structured Roadmap"
- Capture: The full timeline list

**5. Final CTA**
- Scroll to: Bottom CTA box
- Capture: "Ready to go deep?" section

### App Interface (6 shots)

**6. Dashboard/Home**
- Click: "Start Week 1" button
- Capture: Main dashboard view with sidebar

**7. Day 1 Content**
- Navigate to: Day 1 - Rendering Pipeline
- Capture: Content with diagrams

**8. Code Playground**
- Scroll to: Any code playground section
- Capture: Interactive code editor

**9. Quiz Interface**
- Find: Any quiz component
- Capture: Quiz question with options

**10. Progress Dashboard**
- Look for: Progress tracking component
- Capture: Progress indicators

**11. Analytics Panel**
- If available: Analytics view
- Capture: Stats and metrics

## Screenshot Settings

**Before taking screenshots:**
```bash
# Hide bookmarks bar in browser
Cmd + Shift + B

# Use incognito/private window for clean look
Cmd + Shift + N (Chrome)
Cmd + Shift + P (Firefox)
```

**Keyboard shortcuts:**
- `Cmd + Shift + 4` - Select area (recommended)
- `Cmd + Shift + 3` - Full screen
- `Cmd + Shift + 4 + Space` - Capture window

**Optimal settings:**
- Browser width: 1440px or 1920px
- Zoom: 100%
- Theme: Dark (matches your design)

## For Animations

**Terminal animation GIF:**
```bash
# 1. Record screen
Cmd + Shift + 5
# Select area around terminal
# Record for 10-15 seconds

# 2. Convert to GIF
# Upload to: https://ezgif.com/video-to-gif
# Or use: https://gifski.app/
```

## After Taking Screenshots

Run the organizer:
```bash
cd /Users/tlhogi/react-mastery-day1
./organize-screenshots.sh
```

This will:
- Find recent screenshots on Desktop
- Move them to `screenshots/landing/`
- Show you the checklist

## File Naming Convention

Rename your screenshots to:
```
landing-hero.png
landing-concepts.png
landing-comparison.png
landing-timeline.png
landing-cta.png

app-dashboard.png
app-day1.png
app-playground.png
app-quiz.png
app-progress.png
app-analytics.png
```

## Next Steps

Once you have screenshots:
1. Optimize for web (I can help with this)
2. Add to Medium blog post
3. Create social media graphics
4. Update README with images

## Pro Tips

✅ **Do:**
- Take screenshots at 2x resolution (Retina)
- Capture hover states where interesting
- Include some UI context (don't crop too tight)
- Show real content, not placeholder text

❌ **Don't:**
- Include personal info in screenshots
- Show browser dev tools (unless intentional)
- Use low resolution
- Crop important UI elements

## Need Help?

If screenshots look off:
- Check browser zoom (should be 100%)
- Ensure dark theme is active
- Clear browser cache if styles look wrong
- Try different browser if needed

---

**Ready?** Open `http://localhost:5173` and start capturing! 📸
