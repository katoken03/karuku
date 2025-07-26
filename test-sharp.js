#!/usr/bin/env node

// Sharp動作確認テスト
try {
    const sharp = require('sharp');
    console.log('✅ Sharp loaded successfully');
    console.log('📦 Sharp version:', sharp.format.jpeg?.id ? 'Available' : 'N/A');
    console.log('🏗️ libvips version:', sharp.format.heif?.id ? 'Available' : 'N/A');
    console.log('🎯 Supported formats:', Object.keys(sharp.format).slice(0, 5).join(', '), '...');
    
    // 簡単な処理テスト
    sharp({
        create: {
            width: 48,
            height: 48,
            channels: 4,
            background: { r: 255, g: 0, b: 0, alpha: 0.5 }
        }
    })
    .png()
    .toBuffer()
    .then(() => {
        console.log('✅ Sharp basic operation successful');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Sharp operation failed:', err.message);
        process.exit(1);
    });
    
} catch (error) {
    console.error('❌ Sharp loading failed:', error.message);
    process.exit(1);
}
