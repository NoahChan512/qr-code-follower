#!/usr/bin/env bash
set -euo pipefail

REPO_NAME="qr-tracker"
SITE_NAME="noah-qr-tracker"

cd "$(dirname "$0")"

echo "Checking GitHub login..."
gh auth status >/dev/null

echo "Checking Netlify login..."
netlify status >/dev/null

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "Creating GitHub repo: $REPO_NAME"
  gh repo create "NoahChan0512/$REPO_NAME" --private --source=. --remote=origin --push
else
  echo "Pushing to existing origin..."
  git push -u origin main
fi

echo "Creating/linking Netlify site..."
netlify init --manual --name "$SITE_NAME"

echo "Setting required Netlify environment variable placeholder..."
echo "IMPORTANT: Set ADMIN_PASSWORD in Netlify UI or run:"
echo "  netlify env:set ADMIN_PASSWORD '<your-password>'"

echo "Triggering deploy..."
netlify deploy --prod --dir=public --functions=netlify/functions

echo "Done. Check the Netlify URL above."
