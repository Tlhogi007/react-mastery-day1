#!/bin/bash

# Screenshot Organization Script for React Mastery
# Run this after taking screenshots

SCREENSHOTS_DIR="/Users/tlhogi/react-mastery-day1/screenshots"
DESKTOP="$HOME/Desktop"

echo "🖼️  React Mastery Screenshot Organizer"
echo "======================================"
echo ""

# Create subdirectories
mkdir -p "$SCREENSHOTS_DIR/landing"
mkdir -p "$SCREENSHOTS_DIR/app"
mkdir -p "$SCREENSHOTS_DIR/social"

echo "📁 Created directories:"
echo "  - screenshots/landing (for landing page shots)"
echo "  - screenshots/app (for app interface shots)"
echo "  - screenshots/social (for social media graphics)"
echo ""

# Check for recent screenshots on Desktop
echo "🔍 Looking for recent screenshots on Desktop..."
RECENT_SCREENSHOTS=$(find "$DESKTOP" -name "Screen Shot*.png" -mmin -30 2>/dev/null)

if [ -z "$RECENT_SCREENSHOTS" ]; then
    echo "❌ No recent screenshots found on Desktop"
    echo ""
    echo "📸 Take your screenshots now using:"
    echo "   Cmd + Shift + 4 (select area)"
    echo "   Cmd + Shift + 3 (full screen)"
    echo ""
    echo "Then run this script again!"
else
    COUNT=$(echo "$RECENT_SCREENSHOTS" | wc -l | xargs)
    echo "✅ Found $COUNT recent screenshot(s)"
    echo ""
    echo "Screenshots found:"
    echo "$RECENT_SCREENSHOTS" | while read file; do
        echo "  - $(basename "$file")"
    done
    echo ""
    
    read -p "Move these to screenshots/landing? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "$RECENT_SCREENSHOTS" | while read file; do
            mv "$file" "$SCREENSHOTS_DIR/landing/"
            echo "✅ Moved $(basename "$file")"
        done
        echo ""
        echo "🎉 Screenshots organized!"
    else
        echo "Skipped moving files"
    fi
fi

echo ""
echo "📋 Screenshot Checklist:"
echo "========================"
echo ""
echo "Landing Page:"
echo "  [ ] Hero section with animated terminal"
echo "  [ ] Concept cards (all 4)"
echo "  [ ] Before/After comparison"
echo "  [ ] 30-day timeline"
echo "  [ ] Final CTA section"
echo ""
echo "App Interface:"
echo "  [ ] Dashboard/home view"
echo "  [ ] Day 1 content page"
echo "  [ ] Code playground"
echo "  [ ] Quiz interface"
echo "  [ ] Progress tracking"
echo "  [ ] Analytics panel"
echo ""
echo "Optional:"
echo "  [ ] Screen recording of terminal animation (convert to GIF)"
echo "  [ ] Hover states on concept cards"
echo "  [ ] Mobile responsive view"
echo ""
echo "💡 Tips:"
echo "  - Use Cmd + Shift + 4 for precise selection"
echo "  - Hide browser bookmarks bar (Cmd + Shift + B)"
echo "  - Use incognito window for clean look"
echo "  - Optimal resolution: 1920x1080 or 1440x900"
echo ""
echo "📂 Screenshots saved to: $SCREENSHOTS_DIR"
