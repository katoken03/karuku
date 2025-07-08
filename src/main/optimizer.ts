import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { promisify } from 'util';
import path from 'path';
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

  async optimizeImage(filePath: string): Promise<ProcessedFile> {
    const result: ProcessedFile = {
      filePath,
      originalSize: 0,
      optimizedSize: 0,
      timestamp: new Date(),
      success: false,
    };

    try {
      // pngquantのパスを取得
      const pngquantPath = await this.findPngquantPath();
      if (!pngquantPath) {
        throw new Error('pngquant not found. Please install pngquant using: brew install pngquant');
      }

      // 元のファイルサイズを取得
      const originalStats = await fs.stat(filePath);
      result.originalSize = originalStats.size;

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

      console.log(`Optimized: ${filePath} (${originalStats.size} → ${optimizedStats.size} bytes)`);
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      await this.logProcessedFile(result);
      console.error(`Failed to optimize: ${filePath}`, error);
    }

    return result;
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
