import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import path from 'path';
import sharp from 'sharp';
import { ProcessedFile } from '../types/index';

const execAsync = promisify(exec);

export class ImageOptimizer {
  private logFilePath: string;
  private pngquantPath: string | null = null;

  constructor(configDir: string) {
    this.logFilePath = path.join(configDir, 'processed_files.log');
  }

  private async findPngquantPath(): Promise<string | null> {
    if (this.pngquantPath) {
      return this.pngquantPath;
    }

    // 一般的なパスを順番に試す
    const possiblePaths = [
      'pngquant', // PATH環境変数に含まれている場合
      '/usr/local/bin/pngquant', // Homebrewのデフォルト（Intel Mac）
      '/opt/homebrew/bin/pngquant', // Homebrewのデフォルト（Apple Silicon Mac）
      '/usr/bin/pngquant', // システムインストール
      '/usr/local/opt/pngquant/bin/pngquant', // Homebrewの古いパス
    ];

    for (const pngquantPath of possiblePaths) {
      try {
        await execAsync(`"${pngquantPath}" --version`);
        this.pngquantPath = pngquantPath;
        console.log(`Found pngquant at: ${pngquantPath}`);
        return pngquantPath;
      } catch {
        // このパスにpngquantが見つからない場合は次を試す
      }
    }

    // whichコマンドを使って検索
    try {
      const { stdout } = await execAsync('which pngquant');
      const foundPath = stdout.trim();
      if (foundPath) {
        this.pngquantPath = foundPath;
        console.log(`Found pngquant using which: ${foundPath}`);
        return foundPath;
      }
    } catch {
      // which コマンドでも見つからない
    }

    // Homebrewのパスを直接検索
    try {
      const { stdout } = await execAsync('brew --prefix pngquant 2>/dev/null');
      const brewPath = stdout.trim();
      if (brewPath) {
        const pngquantPath = path.join(brewPath, 'bin', 'pngquant');
        await execAsync(`"${pngquantPath}" --version`);
        this.pngquantPath = pngquantPath;
        console.log(`Found pngquant via brew: ${pngquantPath}`);
        return pngquantPath;
      }
    } catch {
      // Homebrewでも見つからない
    }

    return null;
  }

  async optimizeImage(filePath: string, resizeRatio: number | null = null): Promise<ProcessedFile> {
    const result: ProcessedFile = {
      filePath,
      originalSize: 0,
      optimizedSize: 0,
      timestamp: new Date(),
      success: false,
    };

    try {
      // 元のファイルサイズを取得
      const originalStats = await fs.stat(filePath);
      result.originalSize = originalStats.size;

      // リサイズが指定されている場合
      if (resizeRatio !== null) {
        await this.resizeImage(filePath, resizeRatio, result);
      }

      // pngquantのパスを取得
      const pngquantPath = await this.findPngquantPath();
      if (!pngquantPath) {
        throw new Error('pngquant not found. Please install pngquant using: brew install pngquant');
      }

      // pngquantで最適化（元ファイルを上書き）
      const command = `"${pngquantPath}" --force --ext .png "${filePath}"`;
      console.log(`Executing: ${command}`);
      await execAsync(command);

      // 最適化後のファイルサイズを取得
      const optimizedStats = await fs.stat(filePath);
      result.optimizedSize = optimizedStats.size;
      result.success = true;

      // ログに記録
      await this.logProcessedFile(result);

      const resizeInfo = result.resized ? ` (resized from ${result.originalDimensions?.width}x${result.originalDimensions?.height} to ${result.resizedDimensions?.width}x${result.resizedDimensions?.height})` : '';
      console.log(`Optimized: ${filePath} (${originalStats.size} → ${optimizedStats.size} bytes)${resizeInfo}`);
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      await this.logProcessedFile(result);
      console.error(`Failed to optimize: ${filePath}`, error);
    }

    return result;
  }

  private async resizeImage(filePath: string, ratio: number, result: ProcessedFile): Promise<void> {
    try {
      console.log(`🔍 Analyzing image for resize: ${filePath} (ratio: ${ratio})`);
      
      // 画像のメタデータを取得
      const metadata = await sharp(filePath).metadata();
      
      if (!metadata.width || !metadata.height) {
        console.log('⚠️ Unable to get image dimensions, skipping resize');
        return;
      }

      const originalWidth = metadata.width;
      const originalHeight = metadata.height;
      
      // 指定された比率でサイズを計算
      const newWidth = Math.floor(originalWidth * ratio);
      const newHeight = Math.floor(originalHeight * ratio);
      
      console.log(`📐 Resizing image: ${originalWidth}x${originalHeight} → ${newWidth}x${newHeight} (${Math.round(ratio * 100)}%)`);
      
      // リサイズを実行
      await sharp(filePath)
        .resize(newWidth, newHeight, {
          kernel: sharp.kernel.lanczos3,  // 高品質なリサイズアルゴリズム
          withoutEnlargement: true,     // 拡大は行わない
        })
        .png({
          compressionLevel: 6,           // PNG圧縮レベル
          adaptiveFiltering: true,       // 適応フィルタリング
        })
        .toFile(filePath + '.tmp');
      
      // 元ファイルを置き換え
      await fs.rename(filePath + '.tmp', filePath);
      
      // リサイズ情報を記録
      result.resized = true;
      result.originalDimensions = { width: originalWidth, height: originalHeight };
      result.resizedDimensions = { width: newWidth, height: newHeight };
      
      console.log(`✅ Image resized successfully: ${filePath}`);
    } catch (error) {
      console.error(`❌ Failed to resize image: ${filePath}`, error);
      
      // 一時ファイルをクリーンアップ
      try {
        await fs.unlink(filePath + '.tmp');
      } catch {
        // 一時ファイルが存在しない場合は無視
      }
      
      // リサイズに失敗してもエラーは投げない（最適化は続行）
      result.error = `Resize failed: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  private async logProcessedFile(result: ProcessedFile): Promise<void> {
    try {
      const logEntry = {
        timestamp: result.timestamp.toISOString(),
        filePath: result.filePath,
        originalSize: result.originalSize,
        optimizedSize: result.optimizedSize,
        success: result.success,
        error: result.error,
      };

      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.appendFile(this.logFilePath, logLine, 'utf8');
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  async getProcessedFiles(limit: number = 100): Promise<ProcessedFile[]> {
    try {
      const logContent = await fs.readFile(this.logFilePath, 'utf8');
      const lines = logContent.trim().split('\n').filter(line => line);
      
      return lines
        .slice(-limit) // 最新のlimit件を取得
        .map(line => {
          const data = JSON.parse(line);
          return {
            ...data,
            timestamp: new Date(data.timestamp),
          };
        })
        .reverse(); // 新しい順にソート
    } catch (error) {
      return [];
    }
  }

  async checkPngquantAvailable(): Promise<boolean> {
    try {
      const pngquantPath = await this.findPngquantPath();
      return pngquantPath !== null;
    } catch {
      return false;
    }
  }

  async getPngquantPath(): Promise<string | null> {
    return await this.findPngquantPath();
  }
}
