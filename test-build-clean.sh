#!/bin/bash

echo "🧹 Cleaning previous build..."
rm -rf /Users/kato/mcp_folder/Karuku/dist

echo "🔨 Building with console.log removal..."
cd /Users/kato/mcp_folder/Karuku
NODE_ENV=production npm run build

echo "📊 Checking results..."
if [ -f "dist/renderer/renderer.js" ]; then
    echo "✅ Build completed successfully"
    
    # ファイルサイズを表示
    echo "📄 File sizes:"
    ls -lh dist/renderer/renderer.js | awk '{print "  renderer.js: " $5}'
    ls -lh dist/renderer/logs.js | awk '{print "  logs.js: " $5}'
    ls -lh dist/main/main.js | awk '{print "  main.js: " $5}'
    
    # console.logの存在確認
    echo ""
    echo "🔍 Checking for console.log occurrences:"
    
    if grep -q "console\.log" dist/renderer/renderer.js; then
        echo "❌ console.log found in renderer.js:"
        grep -n "console\.log" dist/renderer/renderer.js | head -3
    else
        echo "✅ No console.log found in renderer.js"
    fi
    
    if grep -q "console\.log" dist/renderer/logs.js; then
        echo "❌ console.log found in logs.js:"
        grep -n "console\.log" dist/renderer/logs.js | head -3
    else
        echo "✅ No console.log found in logs.js"
    fi
    
    if grep -q "console\.log" dist/main/main.js; then
        echo "❌ console.log found in main.js:"
        grep -n "console\.log" dist/main/main.js | head -3
    else
        echo "✅ No console.log found in main.js"
    fi
    
    # console.errorの存在確認（残すべき）
    echo ""
    echo "🔍 Checking for console.error (should remain):"
    if grep -q "console\.error" dist/renderer/renderer.js; then
        echo "✅ console.error found in renderer.js (as expected)"
    else
        echo "⚠️ No console.error found in renderer.js"
    fi
    
else
    echo "❌ Build failed - renderer.js not found"
fi

echo ""
echo "🎯 Summary:"
echo "  - Use 'npm run dist:arm64' for production builds without console.log"
echo "  - Use 'npm run dist:arm64:withDebug' for debugging with console.log"
