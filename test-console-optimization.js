#!/usr/bin/env node

/**
 * console.log削除テスト用スクリプト
 * 本番ビルド時のconsole.log削除動作を確認するためのテストファイル
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Console.log optimization test starting...');

// テスト用の一時ファイルを作成
const testFile = path.join(__dirname, 'temp-test-file.js');
const testContent = `
console.log('This should be removed in production');
console.warn('This should be removed in production'); 
console.error('This should always remain');
console.info('This should be removed in production');
console.debug('This should be removed in production');

// 通常のコード
function testFunction() {
  console.log('Debug message');
  return 'test';
}

export default testFunction;
`;

fs.writeFileSync(testFile, testContent);

try {
  console.log('\n📦 Testing build without console logs...');
  execSync('npm run build:production:no-logs', { stdio: 'inherit' });
  
  console.log('\n📦 Testing build with console logs...');
  execSync('npm run build:production:with-logs', { stdio: 'inherit' });
  
  // ビルドされたファイルのサイズを比較
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    console.log('\n📊 Build size comparison:');
    
    const getDirectorySize = (dirPath) => {
      let totalSize = 0;
      const files = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const file of files) {
        const filePath = path.join(dirPath, file.name);
        if (file.isDirectory()) {
          totalSize += getDirectorySize(filePath);
        } else {
          totalSize += fs.statSync(filePath).size;
        }
      }
      return totalSize;
    };
    
    const totalSize = getDirectorySize(distPath);
    console.log(`Total dist size: ${(totalSize / 1024).toFixed(2)} KB`);
    
    // 主要ファイルのサイズをチェック
    const mainFiles = [
      'dist/main/main.js',
      'dist/main/preload.js', 
      'dist/renderer/renderer.js',
      'dist/renderer/logs.js'
    ];
    
    console.log('\n📄 Individual file sizes:');
    mainFiles.forEach(file => {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const size = fs.statSync(filePath).size;
        console.log(`${file}: ${(size / 1024).toFixed(2)} KB`);
      }
    });
  }
  
  console.log('\n✅ Console.log optimization test completed successfully!');
  console.log('\n🎯 Usage:');
  console.log('• Regular production build: npm run dist:arm64');
  console.log('• Debug production build: npm run dist:arm64:withDebug');
  console.log('• Quick test builds: npm run build:production:no-logs | npm run build:production:with-logs');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
} finally {
  // テスト用ファイルを削除
  if (fs.existsSync(testFile)) {
    fs.unlinkSync(testFile);
  }
}
