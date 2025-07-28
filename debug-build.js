#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing console.log optimization fix...\n');

// distディレクトリをクリーンアップ
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  console.log('🗑️ Cleaning existing dist directory...');
  fs.rmSync(distPath, { recursive: true });
}

try {
  console.log('🔨 Running test build command...');
  const result = execSync('npm run build:production:no-logs', { 
    stdio: 'pipe',
    encoding: 'utf8',
    cwd: __dirname,
    env: { ...process.env, NODE_ENV: 'production' }
  });
  
  console.log('Build output:');
  console.log(result);
  
  // ビルドされたファイルを確認
  const rendererPath = path.join(distPath, 'renderer', 'renderer.js');
  if (fs.existsSync(rendererPath)) {
    const content = fs.readFileSync(rendererPath, 'utf8');
    const hasConsoleLog = content.includes('console.log');
    const hasConsoleWarn = content.includes('console.warn');
    const hasConsoleError = content.includes('console.error');
    
    // ファイルの最初の1000文字を表示（デバッグ用）
    console.log('\n📝 First 1000 characters of renderer.js:');
    console.log(content.substring(0, 1000));
    console.log('...\n');
    
    console.log('📊 Build result analysis:');
    console.log(`  renderer.js size: ${(content.length / 1024).toFixed(2)} KB`);
    console.log(`  Contains console.log: ${hasConsoleLog ? '❌ YES' : '✅ NO'}`);
    console.log(`  Contains console.warn: ${hasConsoleWarn ? '❌ YES' : '✅ NO'}`);
    console.log(`  Contains console.error: ${hasConsoleError ? '✅ YES (should remain)' : '❌ NO'}`);
    
    if (hasConsoleLog || hasConsoleWarn) {
      console.log('\n⚠️ Console.log optimization still not working!');
      
      // console.logが含まれている部分を抽出（より詳細に）
      const lines = content.split('\n');
      const consoleLines = lines.filter(line => 
        line.includes('console.log') || line.includes('console.warn')
      ).slice(0, 10); // 最初の10行を表示
      
      console.log('\nSample console statements found:');
      consoleLines.forEach((line, index) => {
        console.log(`  ${index + 1}: ${line.trim().substring(0, 150)}...`);
      });
    } else {
      console.log('\n✅ Console.log optimization successful!');
    }
  } else {
    console.log('\n❌ renderer.js not found!');
  }
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.error('\nBuild output:');
  console.error(error.stdout || 'No stdout');
  console.error('Build errors:');
  console.error(error.stderr || 'No stderr');
}
