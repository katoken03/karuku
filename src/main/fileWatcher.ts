import chokidar from 'chokidar';
import path from 'path';
import { WatchConfig, ProcessedFile } from '../types/index';
import { ImageOptimizer } from './optimizer';

export class FileWatcher {
  private watchers: Map<string, chokidar.FSWatcher> = new Map();
  private optimizer: ImageOptimizer;
  private recentUnlinks = new Map<string, number>(); // ディレクトリパス → unlinkタイムスタンプ
  private readonly RENAME_DETECTION_TIMEOUT = 1000; // 1秒以内をリネームと判定

  constructor(optimizer: ImageOptimizer) {
    this.optimizer = optimizer;
    
    // 定期的な古いunlinkエントリのクリーンアップ
    setInterval(() => {
      this.cleanupOldUnlinks();
    }, 60000); // 1分ごと
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
      atomic: false, // リネーム検出のため無効化
    });

    // unlinkイベントを記録（リネーム検出用）
    watcher.on('unlink', (filePath) => {
      if (this.matchesPattern(filePath, config.pattern)) {
        const directory = path.dirname(filePath);
        this.recentUnlinks.set(directory, Date.now());
        if (process.env.NODE_ENV === 'development') {
          console.log(`📝 File unlinked: ${filePath}`);
        }
      }
    });

    watcher.on('add', async (filePath) => {
      if (this.matchesPattern(filePath, config.pattern)) {
        // リネーム判定
        if (this.isLikelyRename(filePath)) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`⏭️ Detected rename, skipping: ${filePath}`);
          }
          return; // リサイズ処理をスキップ
        }

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
    this.recentUnlinks.clear(); // メモリクリーンアップ
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

  private isLikelyRename(filePath: string): boolean {
    const directory = path.dirname(filePath);
    const unlinkTime = this.recentUnlinks.get(directory);
    
    if (unlinkTime && Date.now() - unlinkTime < this.RENAME_DETECTION_TIMEOUT) {
      const timeDiff = Date.now() - unlinkTime;
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️ Time gap: ${timeDiff}ms (threshold: ${this.RENAME_DETECTION_TIMEOUT}ms)`);
      }
      this.recentUnlinks.delete(directory); // 使用済みエントリを削除
      return true;
    }
    return false;
  }

  private cleanupOldUnlinks(): void {
    const now = Date.now();
    for (const [directory, timestamp] of this.recentUnlinks.entries()) {
      if (now - timestamp > this.RENAME_DETECTION_TIMEOUT * 2) { // タイムアウトの2倍で削除
        this.recentUnlinks.delete(directory);
      }
    }
  }
}
