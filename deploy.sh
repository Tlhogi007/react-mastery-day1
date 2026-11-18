#!/bin/bash
set -euo pipefail

echo "Building React Mastery..."
cd "$(dirname "$0")"
npm run build

echo "Deploying to Vercel (production)..."
echo "Requires: vercel login"
vercel --prod --yes

echo ""
echo "After deploy, confirm env vars in Vercel → Settings → Environment Variables:"
echo "  VITE_CONTENT_REPO_URL=https://github.com/Tlhogi007/react-mastery-content"
echo "  CONTENT_REPO_URL=https://github.com/Tlhogi007/react-mastery-content.git"
echo "  VITE_GA_TRACKING_ID=..."
echo "  (and any AI provider keys you use)"
