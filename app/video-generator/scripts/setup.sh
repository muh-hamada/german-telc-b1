#!/bin/bash

# Setup script for video generator
# Run this to set up the entire system

set -e

echo "🎬 TELC Video Generator Setup"
echo "=============================="
echo ""

# Check if we're in the right directory
if [ ! -f "GETTING_STARTED.md" ]; then
  echo "❌ Error: Please run this script from the app/video-generator directory"
  exit 1
fi

# 1. Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
echo "✓ Frontend dependencies installed"
echo ""

# 2. Install functions dependencies
echo "📦 Installing Cloud Functions dependencies..."
cd ../functions
npm install
echo "✓ Cloud Functions dependencies installed"
echo ""

# 3. Build functions
echo "🔨 Building Cloud Functions..."
npm run build
echo "✓ Cloud Functions built"
echo ""

cd ..

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Set up YouTube API credentials (see YOUTUBE_SETUP.md)"
echo "2. Configure Firebase Functions:"
echo "   cd functions"
echo "   firebase functions:config:set \\"
echo "     youtube.client_id=\"YOUR_CLIENT_ID\" \\"
echo "     youtube.client_secret=\"YOUR_CLIENT_SECRET\" \\"
echo "     youtube.refresh_token=\"YOUR_REFRESH_TOKEN\""
echo ""
echo "3. Start the frontend:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "4. Deploy Cloud Functions:"
echo "   cd functions"
echo "   npm run deploy"
echo ""
echo "For detailed instructions, see GETTING_STARTED.md"

