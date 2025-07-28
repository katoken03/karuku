#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function removeDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    console.log(`🗑️ Removing ${dirPath}...`);
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`✅ Removed ${dirPath}`);
  } else {
    console.log(`⚠️ Directory ${dirPath} does not exist`);
  }
}

console.log('🧹 Cleaning build directories...');

// distディレクトリを削除
const distPath = path.join(__dirname, 'dist');
removeDirectory(distPath);

// dist-electronディレクトリも削除
const distElectronPath = path.join(__dirname, 'dist-electron');
removeDirectory(distElectronPath);

console.log('✅ Clean completed!');
console.log('💡 Now run: npm run build');
