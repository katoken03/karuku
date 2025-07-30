#!/bin/bash
# Karuku Release Script
# Usage: ./scripts/release.sh <version>

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
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Karuku v$VERSION release process...${NC}"

# Paths
KARUKU_DIR="/Users/kato/mcp_folder/Karuku"
HOMEBREW_DIR="/Users/kato/mcp_folder/homebrew-karuku"
DIST_DIR="$KARUKU_DIR/dist-electron"

# Check if directories exist
if [ ! -d "$KARUKU_DIR" ]; then
    echo -e "${RED}❌ Karuku directory not found: $KARUKU_DIR${NC}"
    exit 1
fi

if [ ! -d "$HOMEBREW_DIR" ]; then
    echo -e "${RED}❌ Homebrew tap directory not found: $HOMEBREW_DIR${NC}"
    exit 1
fi

echo -e "${YELLOW}📁 Cleaning previous builds...${NC}"
rm -rf "$DIST_DIR"

echo -e "${YELLOW}🔨 Building ARM64 version...${NC}"
cd "$KARUKU_DIR"
npm run dist:arm64

echo -e "${YELLOW}🔨 Building Intel version...${NC}"
npm run dist:intel

# Check if builds were successful (more flexible file detection)
echo -e "${YELLOW}🔍 Checking build results...${NC}"
cd "$DIST_DIR"
ls -la *.dmg

# Look for actual generated files
ARM64_DMG=$(find "$DIST_DIR" -name "*arm64*.dmg" | head -1)
INTEL_DMG=$(find "$DIST_DIR" -name "*x64*.dmg" -o -name "*intel*.dmg" -o -name "Karuku-$VERSION.dmg" | head -1)

echo -e "${BLUE}Found ARM64 file: $ARM64_DMG${NC}"
echo -e "${BLUE}Found Intel file: $INTEL_DMG${NC}"

if [ ! -f "$ARM64_DMG" ]; then
    echo -e "${RED}❌ ARM64 build failed: $ARM64_DMG not found${NC}"
    exit 1
fi

if [ ! -f "$INTEL_DMG" ]; then
    echo -e "${RED}❌ Intel build failed: $INTEL_DMG not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Both builds completed successfully${NC}"

echo -e "${YELLOW}📊 Calculating SHA256 hashes...${NC}"
cd "$DIST_DIR"

ARM64_SHA=$(shasum -a 256 "$(basename "$ARM64_DMG")" | cut -d' ' -f1)
INTEL_SHA=$(shasum -a 256 "$(basename "$INTEL_DMG")" | cut -d' ' -f1)

echo -e "${BLUE}ARM64 SHA256: $ARM64_SHA${NC}"
echo -e "${BLUE}Intel SHA256: $INTEL_SHA${NC}"

echo -e "${YELLOW}📝 Updating Homebrew Cask...${NC}"
cd "$HOMEBREW_DIR"

# Update Cask file
cat > "Casks/karuku.rb" << EOF
cask "karuku" do
  arch arm: "arm64", intel: "x64"
  
  on_arm do
    version "$VERSION"
    sha256 "$ARM64_SHA"
  end
  
  on_intel do
    version "$VERSION" 
    sha256 "$INTEL_SHA"
  end
  
  url "https://github.com/katoken03/karuku/releases/download/v#{version}/Karuku-#{version}-#{arch}.dmg"
  
  name "Karuku"
  desc "Image optimization Electron app with automatic directory monitoring"
  homepage "https://github.com/katoken03/karuku"
  
  depends_on macos: ">= :big_sur"
  
  app "Karuku.app"
  
  uninstall quit: "com.katoken03.karuku"
  
  zap trash: [
    "~/Library/Application Support/Karuku",
    "~/Library/Preferences/com.katoken03.karuku.plist",
    "~/Library/Logs/Karuku",
    "~/Library/Caches/com.katoken03.karuku"
  ]
end
EOF

echo -e "${GREEN}✅ Homebrew Cask updated${NC}"

echo -e "${YELLOW}📤 Committing and pushing changes...${NC}"

# Commit and push main app
cd "$KARUKU_DIR"
git add .
git commit -m "Release v$VERSION" || echo "No changes to commit in main app"
git push origin main

# Commit and push homebrew tap
cd "$HOMEBREW_DIR"
git add .
git commit -m "Update Karuku to v$VERSION" || echo "No changes to commit in homebrew tap"
git push origin main

echo -e "${YELLOW}🏷️ Creating Git tag...${NC}"
cd "$KARUKU_DIR"
git tag "v$VERSION" || echo "Tag already exists"
git push origin "v$VERSION" || echo "Tag already pushed"

echo -e "${GREEN}✅ Release preparation completed!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Go to: https://github.com/katoken03/karuku/releases"
echo "2. Click 'Create a new release'"
echo "3. Choose tag: v$VERSION"
echo "4. Release title: Karuku v$VERSION"
echo "5. Upload these files:"
echo "   - $ARM64_DMG"
echo "   - $INTEL_DMG"
echo ""
echo -e "${YELLOW}📁 Release files location:${NC}"
echo "ARM64: $ARM64_DMG"
echo "Intel: $INTEL_DMG"
echo ""
echo -e "${GREEN}🎉 Release v$VERSION is ready!${NC}"

# Optional: Open GitHub releases page
read -p "Open GitHub releases page? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open "https://github.com/katoken03/karuku/releases/new?tag=v$VERSION"
fi
