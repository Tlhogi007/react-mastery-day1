#!/bin/bash

# Automated Screenshot Script
# Uses Node 18+ for Playwright compatibility

echo "🎬 React Mastery Screenshot Automation"
echo "======================================"
echo ""

# Check if dev server is running
if ! curl -s http://localhost:5173 > /dev/null; then
    echo "❌ Dev server not running!"
    echo ""
    echo "Please start it first:"
    echo "  npm run dev"
    echo ""
    exit 1
fi

echo "✅ Dev server is running"
echo ""

# Switch to Node 18+
echo "🔄 Switching to Node 18..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 18

echo ""
echo "📦 Installing Chromium (first time only)..."
npx playwright install chromium

echo ""
echo "📸 Taking screenshots..."
node take-screenshots.js

echo ""
echo "✅ Done! Check screenshots/ folder"
