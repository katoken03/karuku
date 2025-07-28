import chokidar from 'chokidar';
import path from 'path';
import { WatchConfig, ProcessedFile } from '../types/index';
import { ImageOptimizer } from './optimizer';

export class FileWatcher {
  private watchers: Map<string, chokidar.FSWatcher> = new Map();
  private optimizer: ImageOptimizer;

  constructor(optimizer: ImageOptimizer) {
    this.optimizer = optimizer;
  }

  startWatching(config: WatchConfig, resizeRatio: number | null = null, onFileProcessed?: (filePath: string, result: ProcessedFile) => void): void {
    if (this.watchers.has(config.id)) {
      this.stopWatching(config.id);
    }

    console.log(`Starting to watch: ${config.path} with pattern: ${config.pattern} (Resize ratio: ${resizeRatio})`);

    const watcher = chokidar.watch(config.path, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true,
      ignoreInitial: true, // 既存ファイルは無視
    });

    watcher.on('add', async (filePath) => {
      if (this.matchesPattern(filePath, config.pattern)) {
        console.log(`New file detected: ${filePath}`);
        
        // 少し待ってからファイルが完全に書き込まれるのを確認
        setTimeout(async () => {
          try {
            const result = await this.optimizer.optimizeImage(filePath, resizeRatio);
            onFileProcessed?.(filePath, result);
          } catch (error) {
            console.error(`Error processing file ${filePath}:`, error);
            const errorResult: ProcessedFile = {
              filePath,
              originalSize: 0,
              optimizedSize: 0,
              timestamp: new Date(),
              success: false,
              error: error instanceof Error ? error.message : String(error),
            };
            onFileProcessed?.(filePath, errorResult);
          }
        }, 1000); // 1秒待機
      }
    });

    watcher.on('error', (error) => {
      console.error(`Watcher error for ${config.path}:`, error);
    });

    this.watchers.set(config.id, watcher);
  }

  stopWatching(configId: string): void {
    const watcher = this.watchers.get(configId);
    if (watcher) {
      watcher.close();
      this.watchers.delete(configId);
      console.log(`Stopped watching: ${configId}`);
    }
  }

  stopAllWatching(): void {
    for (const [id, watcher] of this.watchers) {
      watcher.close();
    }
    this.watchers.clear();
    console.log('Stopped all watchers');
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    const fileName = path.basename(filePath);
    
    // 簡単なパターンマッチング（*.png形式）
    if (pattern === '*.png') {
      return fileName.toLowerCase().endsWith('.png');
    }
    
    // 正規表現パターン
    try {
      const regex = new RegExp(pattern);
      return regex.test(fileName);
    } catch (error) {
      console.error(`Invalid pattern: ${pattern}`, error);
      return false;
    }
  }

  getActiveWatchers(): string[] {
    return Array.from(this.watchers.keys());
  }
}
