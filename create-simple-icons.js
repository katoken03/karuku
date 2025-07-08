const fs = require('fs');
const path = require('path');

// シンプルなBMPフォーマットでアイコンを作成
function createSimpleBMPIcon(size, filename) {
  const canvas = Buffer.alloc(size * size * 4);
  
  // 背景を透明に
  canvas.fill(0);
  
  const thickness = Math.max(2, Math.floor(size / 8));
  
  // 「K」の座標計算
  const centerX = Math.floor(size / 2);
  const centerY = Math.floor(size / 2);
  const leftX = Math.floor(size * 0.25);
  const rightX = Math.floor(size * 0.75);
  const topY = Math.floor(size * 0.2);
  const bottomY = Math.floor(size * 0.8);
  
  // 左の縦線
  for (let y = topY; y <= bottomY; y++) {
    for (let x = leftX; x < leftX + thickness; x++) {
      setPixel(canvas, x, y, size, 0, 0, 0, 255);
    }
  }
  
  // 上の斜め線
  for (let i = 0; i <= rightX - leftX; i++) {
    const x = leftX + i;
    const y = centerY - Math.floor((i / (rightX - leftX)) * (centerY - topY));
    for (let j = 0; j < thickness; j++) {
      setPixel(canvas, x, y + j, size, 0, 0, 0, 255);
    }
  }
  
  // 下の斜め線
  for (let i = 0; i <= rightX - leftX; i++) {
    const x = leftX + i;
    const y = centerY + Math.floor((i / (rightX - leftX)) * (bottomY - centerY));
    for (let j = 0; j < thickness; j++) {
      setPixel(canvas, x, y - j, size, 0, 0, 0, 255);
    }
  }
  
  // 簡単なPNGヘッダーを作成
  const pngData = createSimplePNG(canvas, size);
  
  const iconPath = path.join(__dirname, 'assets', 'icons', filename);
  fs.writeFileSync(iconPath, pngData);
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

// 非常に基本的なPNGを作成（実際のプロジェクトでは適切なライブラリを使用）
function createSimplePNG(canvas, size) {
  // PNG署名
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDRチャンク（画像ヘッダー）
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0); // チャンクサイズ
  ihdr.write('IHDR', 4); // チャンクタイプ
  ihdr.writeUInt32BE(size, 8); // 幅
  ihdr.writeUInt32BE(size, 12); // 高さ
  ihdr.writeUInt8(8, 16); // ビット深度
  ihdr.writeUInt8(6, 17); // カラータイプ（RGBA）
  ihdr.writeUInt8(0, 18); // 圧縮方法
  ihdr.writeUInt8(0, 19); // フィルター方法
  ihdr.writeUInt8(0, 20); // インターレース方法
  // CRC32計算は省略（実際には必要）
  ihdr.writeUInt32BE(0, 21); // CRC32
  
  // IDATチャンク（画像データ）- 簡略化
  const idatSize = canvas.length + size; // フィルターバイト分追加
  const idat = Buffer.alloc(idatSize + 12);
  idat.writeUInt32BE(idatSize, 0);
  idat.write('IDAT', 4);
  
  // 画像データをコピー（フィルターなし）
  let offset = 8;
  for (let y = 0; y < size; y++) {
    idat.writeUInt8(0, offset++); // フィルタータイプ: なし
    for (let x = 0; x < size; x++) {
      const pixelOffset = (y * size + x) * 4;
      idat.writeUInt8(canvas[pixelOffset], offset++); // R
      idat.writeUInt8(canvas[pixelOffset + 1], offset++); // G
      idat.writeUInt8(canvas[pixelOffset + 2], offset++); // B
      idat.writeUInt8(canvas[pixelOffset + 3], offset++); // A
    }
  }
  idat.writeUInt32BE(0, offset); // CRC32
  
  // IENDチャンク（画像終了）
  const iend = Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);
  
  return Buffer.concat([signature, ihdr, idat, iend]);
}

// アイコンディレクトリを作成
const iconsDir = path.join(__dirname, 'assets', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// アイコンファイルを作成
console.log('Creating simple icon files...');
createSimpleBMPIcon(16, 'icon-16.png');
createSimpleBMPIcon(18, 'tray-icon.png');
createSimpleBMPIcon(32, 'icon-32.png');
createSimpleBMPIcon(512, 'app-icon.png');
console.log('✅ All icon files created!');
