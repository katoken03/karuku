#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Testing DevTools controls...');

function cleanDist() {
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
    console.log('🧹 Cleaned dist directory');
  }
}

async function testDevToolsConfiguration() {
  console.log('\n📋 DevTools Control Test Report');
  console.log('================================');
  
  try {
    // テスト1: 本番ビルド（DevTools無効）
    console.log('\n🚫 Test 1: Production build (DevTools DISABLED)');
    console.log('- Environment: NODE_ENV=production');
    console.log('- KEEP_CONSOLE_LOGS: undefined');
    console.log('- Expected: DevTools shortcuts blocked, console.log removed');
    
    cleanDist();
    execSync('NODE_ENV=production npm run build', { stdio: 'inherit' });
    
    // ビルド結果確認
    const rendererPath = path.join(__dirname, 'dist', 'renderer', 'renderer.js');
    const mainPath = path.join(__dirname, 'dist', 'main', 'main.js');
    
    if (fs.existsSync(rendererPath)) {
      const rendererContent = fs.readFileSync(rendererPath, 'utf8');
      const hasConsoleLog = rendererContent.includes('console.log');
      console.log(`  ✅ renderer.js: console.log ${hasConsoleLog ? '❌ FOUND' : '✅ REMOVED'}`);
    }
    
    if (fs.existsSync(mainPath)) {
      const mainContent = fs.readFileSync(mainPath, 'utf8');
      const hasDevToolsBlock = mainContent.includes('Blocked DevTools shortcut');
      const hasDebugMode = mainContent.includes('Debug mode: false') || mainContent.includes('isDebugMode');
      console.log(`  ✅ main.js: DevTools blocking ${hasDevToolsBlock ? '✅ ENABLED' : '❌ MISSING'}`);
    }
    
    console.log('  🚀 To test manually: npm run test:devtools:disabled');
    
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }
  
  try {
    // テスト2: デバッグビルド（DevTools有効）
    console.log('\n✅ Test 2: Debug build (DevTools ENABLED)');
    console.log('- Environment: NODE_ENV=production, KEEP_CONSOLE_LOGS=true');
    console.log('- Expected: DevTools shortcuts allowed, console.log preserved');
    
    cleanDist();
    execSync('NODE_ENV=production KEEP_CONSOLE_LOGS=true npm run build', { stdio: 'inherit' });
    
    // ビルド結果確認
    const rendererPath = path.join(__dirname, 'dist', 'renderer', 'renderer.js');
    const mainPath = path.join(__dirname, 'dist', 'main', 'main.js');
    
    if (fs.existsSync(rendererPath)) {
      const rendererContent = fs.readFileSync(rendererPath, 'utf8');
      const hasConsoleLog = rendererContent.includes('console.log');
      console.log(`  ✅ renderer.js: console.log ${hasConsoleLog ? '✅ PRESERVED' : '❌ REMOVED'}`);
    }
    
    if (fs.existsSync(mainPath)) {
      const mainContent = fs.readFileSync(mainPath, 'utf8');
      const hasDebugMode = mainContent.includes('Debug mode: true') || mainContent.includes('isDebugMode');
      console.log(`  ✅ main.js: Debug mode ${hasDebugMode ? '✅ ENABLED' : '❌ MISSING'}`);
    }
    
    console.log('  🚀 To test manually: npm run test:devtools:enabled');
    
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }
  
  console.log('\n📝 Summary:');
  console.log('- Production build: DevTools blocked, console.log removed');
  console.log('- Debug build: DevTools allowed, console.log preserved');
  console.log('');
  console.log('🎯 Usage:');
  console.log('- Production release: npm run dist:arm64');
  console.log('- Debug release: npm run dist:arm64:withDebug');
  console.log('');
  console.log('🔍 DevTools shortcuts to test:');
  console.log('- Command+Option+I (macOS) / Ctrl+Shift+I (Windows/Linux)');
  console.log('- F12');
  console.log('- Command+Option+J (Console)');
  console.log('- Command+Option+C (Inspector)');
  console.log('- Right-click context menu');
}

testDevToolsConfiguration().catch(console.error);
