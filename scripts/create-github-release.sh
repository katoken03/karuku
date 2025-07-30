#!/bin/bash
# GitHub Release Creator
# Usage: ./scripts/create-github-release.sh <version>

set -e

VERSION=$1
if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 1.0.0"
  exit 1
fi

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

KARUKU_DIR="/Users/kato/mcp_folder/Karuku"
DIST_DIR="$KARUKU_DIR/dist-electron"

# Find actual DMG files
ARM64_DMG=$(find "$DIST_DIR" -name "*arm64*.dmg" | head -1)
INTEL_DMG=$(find "$DIST_DIR" -name "*x64*.dmg" -o -name "*intel*.dmg" -o -name "Karuku-$VERSION.dmg" | head -1)

echo -e "${BLUE}🎯 Creating GitHub Release v$VERSION...${NC}"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}⚠️  GitHub CLI (gh) is not installed.${NC}"
    echo "Install with: brew install gh"
    echo "Then authenticate with: gh auth login"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Please authenticate with GitHub CLI:${NC}"
    echo "gh auth login"
    exit 1
fi

cd "$KARUKU_DIR"

# Create release notes
RELEASE_NOTES="## 🎉 Karuku v$VERSION

### ✨ 機能
- PNG画像の自動最適化（pngquant使用）
- ディレクトリ監視機能
- Apple Silicon・Intel両対応
- 自動pngquantインストール
- 処理ログ・統計表示

### 📥 インストール方法

**Homebrew経由（推奨）:**
\`\`\`bash
brew tap katoken03/karuku
brew install --cask karuku
\`\`\`

**手動インストール:**
下記のファイルをダウンロードしてインストール

### 💾 ダウンロード
- \`Karuku-$VERSION-arm64.dmg\` - Apple Silicon Mac用
- \`Karuku-$VERSION-x64.dmg\` - Intel Mac用

### ⚙️ 要件
- macOS 11.0 (Big Sur) 以降"

echo -e "${YELLOW}📝 Creating GitHub Release...${NC}"

# Create the release
gh release create "v$VERSION" \
    --title "Karuku v$VERSION" \
    --notes "$RELEASE_NOTES" \
    "$ARM64_DMG" \
    "$INTEL_DMG"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ GitHub Release v$VERSION created successfully!${NC}"
    echo ""
    echo -e "${BLUE}🔗 Release URL:${NC}"
    echo "https://github.com/katoken03/karuku/releases/tag/v$VERSION"
    echo ""
    echo -e "${YELLOW}📦 Uploaded files:${NC}"
    echo "- Karuku-$VERSION-arm64.dmg"
    echo "- Karuku-$VERSION-x64.dmg"
    echo ""
    echo -e "${GREEN}🎉 Release is now live! Users can install with:${NC}"
    echo "brew tap katoken03/karuku"
    echo "brew install --cask karuku"
else
    echo -e "${RED}❌ Failed to create GitHub Release${NC}"
    exit 1
fi
