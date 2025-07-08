import { createAppIcon } from './appIcon';
import { createSVGPackageIcon, createHighResSVGIcon, createSmallSVGIcon } from './iconHelper';
import { promises as fs } from 'fs';
import path from 'path';

// アイコンファイルを生成して保存
export async function generateIconFiles() {
  const assetsDir = path.join(__dirname, '../../assets');
  
  try {
    await fs.mkdir(assetsDir, { recursive: true });
    
    // メニューバー用SVGアイコン (18x18)
    const trayIcon = createSVGPackageIcon();
    const trayIconPng = trayIcon.toPNG();
    await fs.writeFile(path.join(assetsDir, 'tray-icon.png'), trayIconPng);
    
    // 高解像度SVGアイコン (32x32)
    const highResIcon = createHighResSVGIcon();
    const highResIconPng = highResIcon.toPNG();
    await fs.writeFile(path.join(assetsDir, 'icon-32.png'), highResIconPng);
    
    // 小さなSVGアイコン (16x16)
    const smallIcon = createSmallSVGIcon();
    const smallIconPng = smallIcon.toPNG();
    await fs.writeFile(path.join(assetsDir, 'icon-16.png'), smallIconPng);
    
    // アプリケーションアイコン (512x512)
    const appIcon = createAppIcon();
    const appIconPng = appIcon.toPNG();
    await fs.writeFile(path.join(assetsDir, 'app-icon.png'), appIconPng);
    
    console.log('✅ Original SVG icons generated successfully');
  } catch (error) {
    console.error('❌ Failed to generate icon files:', error);
  }
}
