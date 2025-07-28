#!/bin/bash

# distディレクトリを削除
echo "🗑️ Removing existing dist directory..."
rm -rf /Users/kato/mcp_folder/Karuku/dist

# 本番ビルドを実行（console.log削除）
echo "🔨 Running production build without console logs..."
cd /Users/kato/mcp_folder/Karuku
NODE_ENV=production npm run build

# ビルド結果を確認
echo "📊 Checking build results..."
if [ -f "dist/renderer/renderer.js" ]; then
    echo "✅ renderer.js found"
    echo "📄 File size: $(wc -c < dist/renderer/renderer.js) bytes"
    
    # console.logの存在確認
    if grep -q "console\.log" dist/renderer/renderer.js; then
        echo "❌ console.log still present!"
        echo "Sample occurrences:"
        grep -n "console\.log" dist/renderer/renderer.js | head -5
    else
        echo "✅ console.log successfully removed!"
    fi
    
    # console.errorの存在確認（残るべき）
    if grep -q "console\.error" dist/renderer/renderer.js; then
        echo "✅ console.error properly retained"
    else
        echo "⚠️ console.error also removed (may be intentional)"
    fi
else
    echo "❌ renderer.js not found!"
fi
