const fs = require('fs');
const path = require('path');

// シンプルなPNGアイコンを作成する関数
function createSimpleIcon(size, filename) {
  // PNG形式のバイナリデータを作成（シンプルな黒い「K」）
  const canvas = Buffer.alloc(size * size * 4);
  
  // 背景を透明に
  for (let i = 0; i < canvas.length; i += 4) {
    canvas[i] = 0;     // R
    canvas[i + 1] = 0; // G
    canvas[i + 2] = 0; // B
    canvas[i + 3] = 0; // A (透明)
  }
  
  const thickness = Math.max(1, Math.floor(size / 10));
  const color = { r: 0, g: 0, b: 0, a: 255 };
  
  // 「K」の形を描画
  const centerX = Math.floor(size / 2);
  const centerY = Math.floor(size / 2);
  const leftX = Math.floor(size * 0.2);
  const rightX = Math.floor(size * 0.8);
  const topY = Math.floor(size * 0.2);
  const bottomY = Math.floor(size * 0.8);
  
  // 左の縦線
  for (let y = topY; y <= bottomY; y++) {
    for (let i = 0; i < thickness; i++) {
      setPixel(canvas, leftX + i, y, size, color.r, color.g, color.b, color.a);
    }
  }
  
  // 上の斜め線
  const steps = rightX - leftX;
  for (let i = 0; i <= steps; i++) {
    const x = leftX + i;
    const y = centerY - Math.floor((i / steps) * (centerY - topY));
    for (let j = 0; j < thickness; j++) {
      setPixel(canvas, x, y + j, size, color.r, color.g, color.b, color.a);
    }
  }
  
  // 下の斜め線
  for (let i = 0; i <= steps; i++) {
    const x = leftX + i;
    const y = centerY + Math.floor((i / steps) * (bottomY - centerY));
    for (let j = 0; j < thickness; j++) {
      setPixel(canvas, x, y - j, size, color.r, color.g, color.b, color.a);
    }
  }
  
  // 簡易PNG形式で保存
  const pngData = createPNG(canvas, size);
  fs.writeFileSync(path.join(__dirname, 'assets', 'icons', filename), pngData);
  console.log(`✅ Created ${filename} (${size}x${size})`);
}

function setPixel(canvas, x, y, size, r, g, b, a) {
  if (x >= 0 && x < size && y >= 0 && y < size) {
    const offset = (y * size + x) * 4;
    canvas[offset] = r;
    canvas[offset + 1] = g;
    canvas[offset + 2] = b;
    canvas[offset + 3] = a;
  }
}

// 簡易PNG作成（実際にはちゃんとしたPNGライブラリを使用するのが良い）
function createPNG(canvas, size) {
  // これは実際には動作しないダミーです
  // 本来はsharpやcanvasライブラリを使用してください
  return Buffer.from([]);
}

// アイコンファイルを作成
console.log('Creating icon files...');
createSimpleIcon(16, 'icon-16.png');
createSimpleIcon(18, 'tray-icon.png');
createSimpleIcon(32, 'icon-32.png');
createSimpleIcon(512, 'app-icon.png');
console.log('✅ All icon files created!');
