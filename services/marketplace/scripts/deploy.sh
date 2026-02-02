#!/bin/bash

# Apply Utopia Deployment Script
# Usage: ./scripts/deploy.sh [dev|prod]

set -e

ENVIRONMENT=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "🚀 Deploying Apply Utopia - Environment: $ENVIRONMENT"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|prod)$ ]]; then
  echo "❌ Invalid environment. Use 'dev' or 'prod'"
  exit 1
fi

# Check if config file exists
CONFIG_FILE="$FRONTEND_DIR/public/config.$ENVIRONMENT.json"
if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ Config file not found: $CONFIG_FILE"
  exit 1
fi

echo "📝 Using config: config.$ENVIRONMENT.json"

# Copy environment-specific config
cp "$CONFIG_FILE" "$FRONTEND_DIR/public/config.json"
echo "✅ Config copied"

# Install dependencies if needed
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "📦 Installing dependencies..."
  cd "$FRONTEND_DIR"
  npm install
fi

# Build frontend
echo "🔨 Building frontend..."
cd "$FRONTEND_DIR"
npm run build

echo "✅ Build complete!"
echo ""
echo "📦 Build output: $FRONTEND_DIR/dist"
echo ""

if [ "$ENVIRONMENT" = "dev" ]; then
  echo "💡 To preview: cd frontend && npm run preview"
else
  echo "💡 Deploy the 'frontend/dist' folder to your hosting provider"
  echo "💡 Ensure HTTPS is enabled for PWA functionality"
fi
