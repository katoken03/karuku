import { nativeImage } from 'electron';
import { promises as fs } from 'fs';
import path from 'path';

// SVGファイルを作成してファイルパスから読み込む方法
export async function createSVGFromFile(): Promise<any> {
  const svgContent = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4.98845 17.4524L10.7377 20.8998C11.1189 21.129 11.5553 21.25 12 21.25C12.4447 21.25 12.8811 21.129 13.2623 20.8998L19.0115 17.4524C19.378 17.233 19.6813 16.9224 19.892 16.5508C20.0973 16.1806 20.2067 15.7649 20.2102 15.3415V8.27694C20.2117 7.84969 20.102 7.42941 19.8919 7.05742C19.6817 6.68544 19.3783 6.37459 19.0115 6.15544L13.2623 3.08988C12.8789 2.86726 12.4434 2.75 12 2.75C11.5566 2.75 11.1211 2.86726 10.7377 3.08988L4.98845 6.15544C4.62169 6.37459 4.3183 6.68544 4.10813 7.05742C3.89796 7.42941 3.78825 7.84969 3.78981 8.27694V15.3415C3.79325 15.7649 3.90266 16.1806 4.10803 16.5508C4.31867 16.9224 4.622 17.233 4.98845 17.4524Z" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M19.8813 7.07831L12 11.8092" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M4.11862 7.07831L12 11.8092V21.2499" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M16.3809 12.9336V9.17857L8.06464 4.52188" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

  try {
    // SVGファイルを一時的に作成
    const tempDir = path.join(__dirname, '../temp');
    await fs.mkdir(tempDir, { recursive: true });
    
    const svgPath = path.join(tempDir, 'package-icon.svg');
    await fs.writeFile(svgPath, svgContent, 'utf8');
    
    // ファイルから読み込み
    const image = nativeImage.createFromPath(svgPath);
    
    if (image.isEmpty()) {
      console.log('SVG file image is also empty, using canvas-based icon');
      return createCanvasBasedPackageIcon();
    }
    
    image.setTemplateImage(true);
    console.log('SVG file icon created successfully');
    return image;
  } catch (error) {
    console.error('Failed to create SVG from file:', error);
    return createCanvasBasedPackageIcon();
  }
}

// Canvas（手描き）で太い「K」文字アイコンを作成
export function createCanvasBasedPackageIcon(): any {
  const size = 18;
  const canvas = Buffer.alloc(size * size * 4);
  
  // 背景を透明に
  for (let i = 0; i < canvas.length; i += 4) {
    canvas[i] = 0;
    canvas[i + 1] = 0;
    canvas[i + 2] = 0;
    canvas[i + 3] = 0;
  }
  
  const color = { r: 0, g: 0, b: 0, a: 255 };
  
  // 太い「K」文字を描画
  drawBoldK(canvas, size, color);
  
  const image = nativeImage.createFromBuffer(canvas, { 
    width: size, 
    height: size 
  });
  
  image.setTemplateImage(true);
  console.log('Canvas-based bold K icon created');
  return image;
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

function drawLine(canvas: Buffer, x1: number, y1: number, x2: number, y2: number, size: number, color: {r: number, g: number, b: number, a: number}) {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;
  
  let x = x1;
  let y = y1;
  
  while (true) {
    setPixel(canvas, x, y, size, color.r, color.g, color.b, color.a);
    
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

// 18x18サイズで太い「K」文字を描画
function drawBoldK(canvas: Buffer, size: number, color: {r: number, g: number, b: number, a: number}) {
  const thickness = 2; // 線の太さ
  
  // 左の縦線（上から下まで）
  for (let i = 0; i < thickness; i++) {
    drawLine(canvas, 4 + i, 2, 4 + i, 16, size, color);
  }
  
  // 上の斜め線（左中央から右上へ）
  for (let i = 0; i < thickness; i++) {
    drawLine(canvas, 4 + i, 8, 14, 2 + i, size, color);
  }
  
  // 下の斜め線（左中央から右下へ）
  for (let i = 0; i < thickness; i++) {
    drawLine(canvas, 4 + i, 10, 14, 16 - i, size, color);
  }
}

// 元の関数を更新
export function createFixedSVGIcon(): any {
  // 直接Canvas版を使用（SVGが動作しないため）
  return createCanvasBasedPackageIcon();
}

// 元の関数も保持（フォールバック用）
export function createFallbackIcon(): any {
  const size = 18;
  const canvas = Buffer.alloc(size * size * 4);
  
  // 背景を透明に
  for (let i = 0; i < canvas.length; i += 4) {
    canvas[i] = 0;
    canvas[i + 1] = 0;
    canvas[i + 2] = 0;
    canvas[i + 3] = 0;
  }
  
  // シンプルな四角を描画（パッケージっぽく）
  const color = { r: 0, g: 0, b: 0, a: 255 };
  
  // 外枠
  for (let x = 4; x <= 14; x++) {
    setPixel(canvas, x, 4, size, color.r, color.g, color.b, color.a);
    setPixel(canvas, x, 14, size, color.r, color.g, color.b, color.a);
  }
  for (let y = 4; y <= 14; y++) {
    setPixel(canvas, 4, y, size, color.r, color.g, color.b, color.a);
    setPixel(canvas, 14, y, size, color.r, color.g, color.b, color.a);
  }
  
  // 中央の線（パッケージの分割）
  for (let i = 5; i <= 13; i++) {
    setPixel(canvas, i, 9, size, color.r, color.g, color.b, color.a);
    setPixel(canvas, 9, i, size, color.r, color.g, color.b, color.a);
  }
  
  const image = nativeImage.createFromBuffer(canvas, { 
    width: size, 
    height: size 
  });
  
  image.setTemplateImage(true);
  return image;
}

export function createSimpleVisibleIcon(): any {
  const size = 18;
  const canvas = Buffer.alloc(size * size * 4);
  
  // 背景を透明に
  for (let i = 0; i < canvas.length; i += 4) {
    canvas[i] = 0;
    canvas[i + 1] = 0;
    canvas[i + 2] = 0;
    canvas[i + 3] = 0;
  }
  
  // 黒い団子（テスト用）
  for (let y = 6; y <= 12; y++) {
    for (let x = 6; x <= 12; x++) {
      setPixel(canvas, x, y, size, 0, 0, 0, 255);
    }
  }
  
  // 中央に白い点
  setPixel(canvas, 9, 9, size, 255, 255, 255, 255);
  
  const image = nativeImage.createFromBuffer(canvas, { 
    width: size, 
    height: size 
  });
  
  image.setTemplateImage(true);
  return image;
}

// 既存の関数名との互換性を保つ
export function createTemplateIcon(): any {
  return createFixedSVGIcon();
}

export function createPackageIcon(): any {
  return createFixedSVGIcon();
}

export function createSVGPackageIcon(): any {
  return createFixedSVGIcon();
}

// 高解像度版のアイコン (32x32)
export function createHighResSVGIcon(): any {
  const size = 32;
  const canvas = Buffer.alloc(size * size * 4);
  
  // 背景を透明に
  for (let i = 0; i < canvas.length; i += 4) {
    canvas[i] = 0;
    canvas[i + 1] = 0;
    canvas[i + 2] = 0;
    canvas[i + 3] = 0;
  }
  
  const color = { r: 0, g: 0, b: 0, a: 255 };
  
  // より大きなサイズで太い「K」文字を描画
  drawBoldKHighRes(canvas, size, color);
  
  const image = nativeImage.createFromBuffer(canvas, { 
    width: size, 
    height: size 
  });
  
  image.setTemplateImage(true);
  return image;
}

// 小さなアイコン (16x16)
export function createSmallSVGIcon(): any {
  const size = 16;
  const canvas = Buffer.alloc(size * size * 4);
  
  // 背景を透明に
  for (let i = 0; i < canvas.length; i += 4) {
    canvas[i] = 0;
    canvas[i + 1] = 0;
    canvas[i + 2] = 0;
    canvas[i + 3] = 0;
  }
  
  const color = { r: 0, g: 0, b: 0, a: 255 };
  
  // より小さなサイズで太い「K」文字を描画
  drawBoldKSmall(canvas, size, color);
  
  const image = nativeImage.createFromBuffer(canvas, { 
    width: size, 
    height: size 
  });
  
  image.setTemplateImage(true);
  return image;
}

// 32x32サイズで太い「K」文字を描画
function drawBoldKHighRes(canvas: Buffer, size: number, color: {r: number, g: number, b: number, a: number}) {
  const thickness = 3; // 線の太さ
  
  // 左の縦線（上から下まで）
  for (let i = 0; i < thickness; i++) {
    drawLine(canvas, 6 + i, 4, 6 + i, 28, size, color);
  }
  
  // 上の斜め線（左中央から右上へ）
  for (let i = 0; i < thickness; i++) {
    drawLine(canvas, 6 + i, 16, 26, 4 + i, size, color);
  }
  
  // 下の斜め線（左中央から右下へ）
  for (let i = 0; i < thickness; i++) {
    drawLine(canvas, 6 + i, 16, 26, 28 - i, size, color);
  }
}

// 16x16サイズで太い「K」文字を描画
function drawBoldKSmall(canvas: Buffer, size: number, color: {r: number, g: number, b: number, a: number}) {
  const thickness = 2; // 線の太さ
  
  // 左の縦線（上から下まで）
  for (let i = 0; i < thickness; i++) {
    drawLine(canvas, 3 + i, 2, 3 + i, 14, size, color);
  }
  
  // 上の斜め線（左中央から右上へ）
  for (let i = 0; i < thickness; i++) {
    drawLine(canvas, 3 + i, 8, 13, 2 + i, size, color);
  }
  
  // 下の斜め線（左中央から右下へ）
  for (let i = 0; i < thickness; i++) {
    drawLine(canvas, 3 + i, 8, 13, 14 - i, size, color);
  }
}
