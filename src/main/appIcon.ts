import { nativeImage } from 'electron';

// 512x512の高解像度アプリケーションアイコン
export function createAppIcon(): any {
  const size = 512;
  const canvas = Buffer.alloc(size * size * 4);
  
  // グラデーション背景を作成
  createGradientBackground(canvas, size);
  
  // 大きな「K」文字を描画
  drawLargeBoldK(canvas, size);
  
  // 最適化エフェクトを描画
  drawOptimizationEffect(canvas, size);
  
  return nativeImage.createFromBuffer(canvas, { 
    width: size, 
    height: size 
  });
}

function setPixel(canvas: Buffer, x: number, y: number, size: number, r: number, g: number, b: number, a: number = 255) {
  if (x >= 0 && x < size && y >= 0 && y < size) {
    const offset = (y * size + x) * 4;
    canvas[offset] = r;
    canvas[offset + 1] = g;
    canvas[offset + 2] = b;
    canvas[offset + 3] = a;
  }
}

function createGradientBackground(canvas: Buffer, size: number) {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // 中心からの距離を計算
      const centerX = size / 2;
      const centerY = size / 2;
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2);
      const ratio = distance / maxDistance;
      
      // macOSアプリらしい美しいブルーグラデーション
      const r = Math.round(65 + (135 - 65) * ratio);
      const g = Math.round(145 + (185 - 145) * ratio);
      const b = Math.round(255 + (235 - 255) * ratio);
      
      setPixel(canvas, x, y, size, r, g, b, 255);
    }
  }
}

function drawLargeBoldK(canvas: Buffer, size: number) {
  const centerX = size / 2;
  const centerY = size / 2;
  const thickness = Math.round(size / 20); // 線の太さをサイズに応じて調整
  
  // 美しい白い色で「K」を描画
  const kColor = { r: 255, g: 255, b: 255, a: 255 };
  
  // 左の縦線の位置とサイズ計算
  const leftX = Math.round(centerX - size * 0.15);
  const topY = Math.round(centerY - size * 0.2);
  const bottomY = Math.round(centerY + size * 0.2);
  const rightX = Math.round(centerX + size * 0.15);
  
  // 左の縦線（上から下まで）
  for (let i = 0; i < thickness; i++) {
    drawThickLine(canvas, leftX + i, topY, leftX + i, bottomY, size, kColor, thickness);
  }
  
  // 上の斜め線（左中央から右上へ）
  for (let i = 0; i < thickness; i++) {
    drawThickLine(canvas, leftX + i, centerY, rightX, topY + i, size, kColor, thickness);
  }
  
  // 下の斜め線（左中央から右下へ）
  for (let i = 0; i < thickness; i++) {
    drawThickLine(canvas, leftX + i, centerY, rightX, bottomY - i, size, kColor, thickness);
  }
  
  // 影を付けて立体感を出す
  const shadowColor = { r: 0, g: 0, b: 0, a: 100 };
  const shadowOffset = Math.round(thickness / 4);
  
  // 影の縦線
  for (let i = 0; i < thickness; i++) {
    drawThickLine(canvas, leftX + i + shadowOffset, topY + shadowOffset, leftX + i + shadowOffset, bottomY + shadowOffset, size, shadowColor, thickness);
  }
  
  // 影の上斜め線
  for (let i = 0; i < thickness; i++) {
    drawThickLine(canvas, leftX + i + shadowOffset, centerY + shadowOffset, rightX + shadowOffset, topY + i + shadowOffset, size, shadowColor, thickness);
  }
  
  // 影の下斜め線
  for (let i = 0; i < thickness; i++) {
    drawThickLine(canvas, leftX + i + shadowOffset, centerY + shadowOffset, rightX + shadowOffset, bottomY - i + shadowOffset, size, shadowColor, thickness);
  }
}

// 太い線を描画するためのヘルパー関数
function drawThickLine(canvas: Buffer, x1: number, y1: number, x2: number, y2: number, size: number, color: {r: number, g: number, b: number, a: number}, thickness: number) {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;
  
  let x = x1;
  let y = y1;
  
  while (true) {
    // 各点で太い線を描画
    for (let i = -Math.floor(thickness/2); i <= Math.floor(thickness/2); i++) {
      for (let j = -Math.floor(thickness/2); j <= Math.floor(thickness/2); j++) {
        setPixel(canvas, x + i, y + j, size, color.r, color.g, color.b, color.a);
      }
    }
    
    if (x === x2 && y === y2) break;
    
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}

function drawOptimizationEffect(canvas: Buffer, size: number) {
  // 最適化を表すパーティクル効果
  const centerX = size / 2;
  const centerY = size / 2;
  const scale = size / 64;
  
  // 緑の粒子（「K」の周りに配置）
  for (let i = 0; i < 30; i++) {
    const angle = (i / 30) * Math.PI * 2;
    const radius = 35 * scale + Math.sin(i * 0.5) * 8 * scale;
    const x = Math.round(centerX + Math.cos(angle) * radius);
    const y = Math.round(centerY + Math.sin(angle) * radius);
    
    // 粒子のサイズを少し変える
    const particleSize = Math.round(3 * scale + Math.sin(i * 0.3) * scale);
    drawFilledCircle(canvas, x, y, particleSize, size, 100, 255, 100, 200);
  }
  
  // 青い粒子（内側の輪）
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2 + Math.PI / 4;
    const radius = 25 * scale + Math.cos(i * 0.7) * 5 * scale;
    const x = Math.round(centerX + Math.cos(angle) * radius);
    const y = Math.round(centerY + Math.sin(angle) * radius);
    
    const particleSize = Math.round(2 * scale);
    drawFilledCircle(canvas, x, y, particleSize, size, 100, 150, 255, 150);
  }
}

function drawFilledCircle(canvas: Buffer, centerX: number, centerY: number, radius: number, size: number, r: number, g: number, b: number, a: number = 255) {
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      const distance = Math.sqrt(x * x + y * y);
      if (distance <= radius) {
        setPixel(canvas, centerX + x, centerY + y, size, r, g, b, a);
      }
    }
  }
}

function drawFilledRoundedRect(canvas: Buffer, x: number, y: number, width: number, height: number, radius: number, size: number, r: number, g: number, b: number, a: number = 255) {
  for (let py = y; py < y + height; py++) {
    for (let px = x; px < x + width; px++) {
      let shouldDraw = true;
      
      // 角の丸めをチェック
      if (px < x + radius && py < y + radius) {
        const dx = (x + radius) - px;
        const dy = (y + radius) - py;
        shouldDraw = dx * dx + dy * dy <= radius * radius;
      } else if (px >= x + width - radius && py < y + radius) {
        const dx = px - (x + width - radius);
        const dy = (y + radius) - py;
        shouldDraw = dx * dx + dy * dy <= radius * radius;
      } else if (px < x + radius && py >= y + height - radius) {
        const dx = (x + radius) - px;
        const dy = py - (y + height - radius);
        shouldDraw = dx * dx + dy * dy <= radius * radius;
      } else if (px >= x + width - radius && py >= y + height - radius) {
        const dx = px - (x + width - radius);
        const dy = py - (y + height - radius);
        shouldDraw = dx * dx + dy * dy <= radius * radius;
      }
      
      if (shouldDraw) {
        setPixel(canvas, px, py, size, r, g, b, a);
      }
    }
  }
}
