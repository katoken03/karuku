#!/bin/bash
# Complete Karuku Release Script (with GitHub Release creation)
# Usage: ./scripts/complete-release.sh <version>

set -e

VERSION=$1
if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 1.0.0"
  exit 1
fi

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting COMPLETE Karuku v$VERSION release process...${NC}"

# Check if gh CLI is available
if command -v gh &> /dev/null && gh auth status &> /dev/null 2>&1; then
    GITHUB_RELEASE=true
    echo -e "${GREEN}✅ GitHub CLI detected and authenticated${NC}"
else
    GITHUB_RELEASE=false
    echo -e "${YELLOW}⚠️  GitHub CLI not available. Will prepare manual release.${NC}"
fi

# Run the main release script
echo -e "${BLUE}📦 Running release preparation...${NC}"
bash /Users/kato/mcp_folder/Karuku/scripts/release.sh "$VERSION"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Release preparation failed${NC}"
    exit 1
fi

# If GitHub CLI is available, create the release automatically
if [ "$GITHUB_RELEASE" = true ]; then
    echo -e "${BLUE}🎯 Creating GitHub Release automatically...${NC}"
    bash /Users/kato/mcp_folder/Karuku/scripts/create-github-release.sh "$VERSION"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}🎉 COMPLETE RELEASE FINISHED!${NC}"
        echo ""
        echo -e "${BLUE}✅ What was completed:${NC}"
        echo "1. ✅ ARM64 and Intel builds created"
        echo "2. ✅ SHA256 hashes calculated"
        echo "3. ✅ Homebrew Cask updated"
        echo "4. ✅ Git commits and tags pushed"
        echo "5. ✅ GitHub Release created with files"
        echo ""
        echo -e "${GREEN}🍺 Users can now install with:${NC}"
        echo "brew tap katoken03/karuku"
        echo "brew install --cask karuku"
        echo ""
        echo -e "${BLUE}🔗 Release: https://github.com/katoken03/karuku/releases/tag/v$VERSION${NC}"
    else
        echo -e "${YELLOW}⚠️  GitHub Release creation failed, but files are ready for manual upload${NC}"
    fi
else
    echo -e "${YELLOW}📋 Manual GitHub Release required:${NC}"
    echo "1. Go to: https://github.com/katoken03/karuku/releases/new"
    echo "2. Choose tag: v$VERSION"
    echo "3. Upload the DMG files from: /Users/kato/mcp_folder/Karuku/dist-electron/"
fi
