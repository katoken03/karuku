import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  dialog,
  Notification,
  shell,
  nativeImage,
  screen,
} from 'electron';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import {
  AppConfig,
  WatchConfig,
  ProcessedFile,
  NotificationTestResult,
  NotificationPermissionStatus,
} from '../types/index';
import { FileWatcher } from './fileWatcher';
import { ImageOptimizer } from './optimizer';
import { DependencyInstaller } from './dependencyInstaller';
import { InstallationProgress, InstallationResult } from '../types/index';
import { mainI18n } from './i18n';
// import { createFixedSVGIcon } from './iconHelper';  // 不要になったのでコメントアウト
// import { generateIconFiles } from './generateIcons';  // 不要になったのでコメントアウト

class KarukuApp {
  private tray: Tray | null = null;
  private settingsWindow: BrowserWindow | null = null;
  private logWindow: BrowserWindow | null = null;
  private installationWindow: BrowserWindow | null = null;
  private configDir: string;
  private configPath: string;
  private config: AppConfig;
  private fileWatcher: FileWatcher;
  private optimizer: ImageOptimizer;
  private dependencyInstaller: DependencyInstaller;
  private hasShownPermissionDialog: boolean = false;

  constructor() {
    this.configDir = path.join(
      os.homedir(),
      'Library',
      'Application Support',
      'Karuku'
    );
    this.configPath = path.join(this.configDir, 'config.json');
    this.config = this.getDefaultConfig();
    this.optimizer = new ImageOptimizer(this.configDir);
    this.fileWatcher = new FileWatcher(this.optimizer);
    this.dependencyInstaller = new DependencyInstaller((progress) => {
      this.handleInstallationProgress(progress);
    });
  }

  async initialize(): Promise<void> {
    await this.ensureConfigDirectory();
    // await generateIconFiles(); // 不要になったのでコメントアウト
    await this.loadConfig();
    await this.checkDependencies();
    this.createTray();
    this.setupIPC();
    this.startWatching();
    // 初期化後にメニューを更新（設定読み込み後）
    this.updateTrayMenu();
  }

  private getDefaultConfig(): AppConfig {
    // デフォルトの監視ディレクトリを設定
    const desktopPath = path.join(os.homedir(), 'Desktop');

    // デスクトップディレクトリが存在するかチェック
    const watchConfigs: WatchConfig[] = [];

    try {
      // 同期的にチェックすることで初期化でのパフォーマンスを維持
      const fs = require('fs');
      if (fs.existsSync(desktopPath)) {
        watchConfigs.push({
          id: 'default-desktop-watcher',
          path: desktopPath,
          pattern: '*.png',
          enabled: true,
        });
        console.log(`✅ Desktop directory found: ${desktopPath}`);
      } else {
        console.log(`⚠️ Desktop directory not found: ${desktopPath}`);
        // フォールバックとしてホームディレクトリを使用
        const homePath = os.homedir();
        watchConfigs.push({
          id: 'default-home-watcher',
          path: homePath,
          pattern: '*.png',
          enabled: true,
        });
        console.log(`✅ Using home directory as fallback: ${homePath}`);
      }
    } catch (error) {
      console.error('❌ Error checking desktop directory:', error);
      // エラーが発生した場合は空の設定を返す
    }

    return {
      watchConfigs,
      notifications: true,
      autoStart: true,
      resizeRatio: this.isRetinaDisplay() ? 0.5 : null,
    };
  }

  private async ensureConfigDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.configDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create config directory:', error);
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      const loadedConfig = JSON.parse(configData);

      // 設定のマイグレーション処理
      const migratedConfig = this.migrateConfig(loadedConfig);

      // デフォルト設定とマージ
      this.config = { ...this.getDefaultConfig(), ...migratedConfig };

      // 監視ディレクトリが空の場合はデフォルトを追加
      if (!this.config.watchConfigs || this.config.watchConfigs.length === 0) {
        console.log(
          'ℹ️ No watch directories configured, adding default desktop watcher'
        );
        const defaultConfig = this.getDefaultConfig();
        this.config.watchConfigs = defaultConfig.watchConfigs;
        await this.saveConfig(); // デフォルト設定を保存
        console.log(
          `✅ Default desktop watcher added: ${defaultConfig.watchConfigs[0].path}`
        );
      }

      // マイグレーション後の設定を保存
      if (migratedConfig !== loadedConfig) {
        await this.saveConfig();
        console.log('✅ Configuration migrated to new format');
      }
    } catch (error) {
      // ファイルが存在しない場合はデフォルト設定を使用
      console.log('ℹ️ Config file not found, creating default configuration');
      this.config = this.getDefaultConfig();
      await this.saveConfig();
      console.log(
        `✅ Default configuration created with desktop watcher: ${this.config.watchConfigs[0].path}`
      );
    }
  }

  private migrateConfig(config: any): AppConfig {
    // retinaOptimization (boolean) → resizeRatio (number | null) のマイグレーション
    if (config.hasOwnProperty('retinaOptimization') && !config.hasOwnProperty('resizeRatio')) {
      console.log('🔄 Migrating retinaOptimization to resizeRatio');
      const resizeRatio = config.retinaOptimization ? 0.5 : null;
      config.resizeRatio = resizeRatio;
      delete config.retinaOptimization;
      console.log(`✅ Migration complete: resizeRatio = ${resizeRatio}`);
    }

    return config;
  }

  private async saveConfig(): Promise<void> {
    try {
      await fs.writeFile(
        this.configPath,
        JSON.stringify(this.config, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  private async checkDependencies(): Promise<void> {
    const isAvailable = await this.optimizer.checkPngquantAvailable();
    if (!isAvailable) {
      console.error('❌ pngquant not found.');
      await this.showDependencyInstallDialog();
    } else {
      const pngquantPath = await this.optimizer.getPngquantPath();
      console.log(`✅ pngquant found at: ${pngquantPath}`);
      this.showNotification(
        mainI18n.t('notification.ready'),
        `pngquant is ready at: ${pngquantPath}`
      );
    }
  }

  private async showDependencyInstallDialog(): Promise<void> {
    const result = await dialog.showMessageBox({
      type: 'question',
      title: mainI18n.t('dialog.pngquantSetupRequired.title'),
      message: mainI18n.t('dialog.pngquantSetupRequired.message'),
      detail: mainI18n.t('dialog.pngquantSetupRequired.detail'),
      buttons: [
        mainI18n.t('dialog.pngquantSetupRequired.installAutomatically'),
        mainI18n.t('dialog.pngquantSetupRequired.showManualSteps'),
        mainI18n.t('dialog.pngquantSetupRequired.skipForNow'),
      ],
      defaultId: 0,
      cancelId: 2,
    });

    switch (result.response) {
      case 0: // Install automatically
        await this.startAutomaticInstallation();
        break;
      case 1: // Show manual steps
        this.showManualInstallationSteps();
        break;
      case 2: // Skip for now
        this.showNotification(
          mainI18n.t('notification.setupIncomplete'),
          'pngquant is required for image optimization. You can install it later from the settings.'
        );
        break;
    }
  }

  private async startAutomaticInstallation(): Promise<void> {
    console.log('Starting automatic installation process...');

    // インストールウィンドウを表示
    this.openInstallationDialog();

    try {
      const result = await this.dependencyInstaller.installPngquant();

      console.log('Installation result:', result);

      // インストールウィンドウに結果を送信
      if (this.installationWindow) {
        this.installationWindow.webContents.send(
          'installation-complete',
          result
        );

        // 成功した場合は少し待ってからウィンドウを閉じる
        if (result.success) {
          setTimeout(() => {
            if (this.installationWindow) {
              this.installationWindow.close();
            }
          }, 3000);
        }
      }

      if (result.success) {
        console.log('✅ pngquant installation completed successfully');
        this.showNotification(
          mainI18n.t('notification.installationComplete'),
          'pngquant has been successfully installed and is ready to use!'
        );
      } else {
        console.error('❌ pngquant installation failed:', result.message);
        this.showNotification(
          mainI18n.t('notification.installationFailed'),
          `Installation failed: ${result.message}`
        );
      }
    } catch (error) {
      console.error('❌ Installation error:', error);
      const errorResult = {
        success: false,
        message: 'Unexpected error occurred',
        details: error instanceof Error ? error.message : String(error),
      };

      if (this.installationWindow) {
        this.installationWindow.webContents.send(
          'installation-complete',
          errorResult
        );
      }

      this.showNotification(
        mainI18n.t('notification.installationError'),
        `Unexpected error: ${errorResult.details}`
      );
    }
  }

  private showManualInstallationSteps(): void {
    const steps = this.dependencyInstaller.getManualInstallationSteps();
    const message = steps.join('\n');

    dialog
      .showMessageBox({
        type: 'info',
        title: mainI18n.t('dialog.manualInstallation.title'),
        message: mainI18n.t('dialog.manualInstallation.message'),
        detail: message,
        buttons: [
          mainI18n.t('dialog.manualInstallation.copyToClipboard'),
          mainI18n.t('dialog.manualInstallation.close'),
        ],
        defaultId: 0,
      })
      .then((result) => {
        if (result.response === 0) {
          // Copy to clipboard
          const { clipboard } = require('electron');
          clipboard.writeText(message);
          this.showNotification(
            mainI18n.t('notification.copied'),
            'Installation steps have been copied to clipboard.'
          );
        }
      });
  }

  private openInstallationDialog(): void {
    if (this.installationWindow) {
      this.installationWindow.focus();
      return;
    }

    this.installationWindow = new BrowserWindow({
      width: 500,
      height: 400,
      resizable: false,
      fullscreenable: false,
      titleBarStyle: 'hiddenInset',
      modal: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    this.installationWindow.loadFile(
      path.join(__dirname, '../renderer/installation.html')
    );

    this.installationWindow.on('closed', () => {
      this.installationWindow = null;
    });
  }

  private handleInstallationProgress(progress: InstallationProgress): void {
    if (this.installationWindow) {
      this.installationWindow.webContents.send(
        'installation-progress',
        progress
      );
    }
    console.log(
      `Installation progress: ${progress.stage} - ${progress.message}`
    );
  }

  private createTray(): void {
    // アイコンファイルのパスを設定（PNGファイルを使用）
    const iconPath = path.join(__dirname, '../../assets/icons/tray-icon.png');

    // アイコンファイルが存在するかチェック
    let trayIcon;
    try {
      const originalIcon = nativeImage.createFromPath(iconPath);
      if (originalIcon.isEmpty()) {
        throw new Error('PNG icon file is empty or invalid');
      }
      // タスクトレイ用に適切なサイズにリサイズ（22x22px）
      trayIcon = originalIcon.resize({ width: 22, height: 22 });
      // メニューバーアイコンとして設定
      trayIcon.setTemplateImage(true);
      console.log('✅ Tray icon loaded from PNG file successfully');
    } catch (error) {
      console.error('❌ Failed to load tray icon from PNG file:', error);
      console.error('❌ Application will exit due to missing tray icon');
      app.quit();
      return;
    }

    this.tray = new Tray(trayIcon);
    this.updateTrayMenu(); // 初期メニューを設定
    this.tray.setToolTip('Karuku - Image Optimizer');
  }

  // メニューを動的に更新するメソッド
  private updateTrayMenu(): void {
    if (!this.tray) return;

    const activeWatchersCount = this.config.watchConfigs.filter(
      (c) => c.enabled
    ).length;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: mainI18n.t('menu.title'),
        type: 'normal',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: mainI18n.t('menu.settings'),
        click: () => this.openSettings(),
      },
      {
        label: mainI18n.t('menu.showLogs'),
        click: () => this.openLogs(),
      },
      { type: 'separator' },
      {
        label: mainI18n.t('menu.watchingDirectories', {
          count: activeWatchersCount,
        }),
        type: 'normal',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: mainI18n.t('menu.quit'),
        click: () => app.quit(),
      },
    ]);

    this.tray.setContextMenu(contextMenu);
    console.log(
      `Tray menu updated: watching ${activeWatchersCount} directories`
    );
  }

  private openSettings(): void {
    if (this.settingsWindow) {
      this.settingsWindow.focus();
      return;
    }

    // ログウィンドウと全く同じ設定にする
    this.settingsWindow = new BrowserWindow({
      width: 600,
      height: 650,
      minWidth: 500,
      minHeight: 400,
      resizable: true,
      movable: true,
      minimizable: true,
      maximizable: true,
      closable: true,
      fullscreenable: true,
      titleBarStyle: 'default',
      show: false,
      frame: true, // フレームを明示的に有効に
      transparent: false, // 透明性を明示的に無効に
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
    });

    console.log('Settings window config:');
    console.log('- Resizable:', this.settingsWindow.isResizable());
    console.log('- Movable:', this.settingsWindow.isMovable());
    console.log('- Frame:', true);

    this.settingsWindow.loadFile(
      path.join(__dirname, '../renderer/index.html')
    );

    this.settingsWindow.once('ready-to-show', () => {
      this.settingsWindow?.show();
      // 開発環境では開発者ツールを自動で開く
      if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
        this.settingsWindow?.webContents.openDevTools();
      }
      console.log('Settings window after show:');
      console.log('- Resizable:', this.settingsWindow?.isResizable());
      console.log('- Movable:', this.settingsWindow?.isMovable());
    });

    this.settingsWindow.on('closed', () => {
      this.settingsWindow = null;
    });
  }

  private openLogs(): void {
    if (this.logWindow) {
      this.logWindow.focus();
      return;
    }

    this.logWindow = new BrowserWindow({
      width: 850,
      height: 600,
      minWidth: 600,
      minHeight: 400,
      resizable: true,
      movable: true,
      minimizable: true,
      maximizable: true,
      closable: true,
      fullscreenable: true,
      titleBarStyle: 'default',
      show: false,
      frame: true, // フレームを明示的に有効に
      transparent: false, // 透明性を明示的に無効に
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
    });

    console.log('Log window config:');
    console.log('- Resizable:', this.logWindow.isResizable());
    console.log('- Movable:', this.logWindow.isMovable());
    console.log('- Frame:', true);

    this.logWindow.loadFile(path.join(__dirname, '../renderer/logs.html'));

    this.logWindow.once('ready-to-show', () => {
      this.logWindow?.show();
      // 開発環境では開発者ツールを自動で開く
      if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
        this.logWindow?.webContents.openDevTools();
      }
      console.log('Log window after show:');
      console.log('- Resizable:', this.logWindow?.isResizable());
      console.log('- Movable:', this.logWindow?.isMovable());
    });

    this.logWindow.on('closed', () => {
      this.logWindow = null;
    });
  }

  private setupIPC(): void {
    // 設定の取得
    ipcMain.handle('get-config', () => this.config);

    // 設定の保存
    ipcMain.handle('save-config', async (_, newConfig: AppConfig) => {
      this.config = newConfig;
      await this.saveConfig();
      this.restartWatching();
      this.updateTrayMenu(); // メニューを更新
      return true;
    });

    // ディレクトリ選択ダイアログ
    ipcMain.handle('select-directory', async () => {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory'],
        buttonLabel: mainI18n.t('dialog.selectDirectory'),
      });

      return result.canceled ? null : result.filePaths[0];
    });

    // ウォッチ設定の追加
    ipcMain.handle('add-watch-config', async (_, directoryPath: string) => {
      const newConfig: WatchConfig = {
        id: uuidv4(),
        path: directoryPath,
        pattern: '*.png',
        enabled: true,
      };

      this.config.watchConfigs.push(newConfig);
      await this.saveConfig();
      this.startWatchingConfig(newConfig);
      this.updateTrayMenu(); // メニューを更新
      return newConfig;
    });

    // ウォッチ設定の削除
    ipcMain.handle('remove-watch-config', async (_, configId: string) => {
      this.config.watchConfigs = this.config.watchConfigs.filter(
        (c) => c.id !== configId
      );
      await this.saveConfig();
      this.fileWatcher.stopWatching(configId);
      this.updateTrayMenu(); // メニューを更新
      return true;
    });

    // ログの取得
    ipcMain.handle('get-logs', async (_, limit?: number) => {
      return await this.optimizer.getProcessedFiles(limit);
    });

    // ログファイルを開く
    ipcMain.handle('open-log-file', () => {
      const logPath = path.join(this.configDir, 'processed_files.log');
      shell.showItemInFolder(logPath);
    });

    // pngquantのインストール状態確認
    ipcMain.handle('check-pngquant', async () => {
      return await this.optimizer.checkPngquantAvailable();
    });

    // pngquantの手動インストール開始
    ipcMain.handle('install-pngquant', async () => {
      try {
        const result = await this.dependencyInstaller.installPngquant();
        if (result.success) {
          this.showNotification(
            mainI18n.t('notification.installationComplete'),
            'pngquant has been successfully installed and is ready to use!'
          );
        } else {
          this.showNotification(
            mainI18n.t('notification.installationFailed'),
            `Installation failed: ${result.message}`
          );
        }
        return result;
      } catch (error) {
        console.error('❌ Installation error:', error);
        return {
          success: false,
          message: 'Unexpected error occurred',
          details: error instanceof Error ? error.message : String(error),
        };
      }
    });

    // インストールダイアログを閉じる
    ipcMain.on('close-installation-dialog', () => {
      if (this.installationWindow) {
        this.installationWindow.close();
      }
    });

    // 通知テスト用IPC
    ipcMain.handle('test-notification', async () => {
      console.log('Testing notification...');

      // 起動時通知と同じ方式で、許可チェックをスキップして直接通知を送信
      console.log('✅ Sending test notification (permission check skipped)');
      await this.showNotification(
        'Test Notification',
        'This is a test notification from Karuku'
      );

      return {
        success: true,
        message: 'Test notification sent successfully',
      } as NotificationTestResult;
    });

    // 通知許可状態をチェック
    ipcMain.handle('check-notification-permission', async () => {
      return await this.checkNotificationPermission();
    });

    // ディスプレイ情報を取得
    ipcMain.handle('get-display-info', () => {
      return this.getDisplayInfo();
    });
  }

  private startWatching(): void {
    for (const config of this.config.watchConfigs) {
      if (config.enabled) {
        this.startWatchingConfig(config);
      }
    }
  }

  private startWatchingConfig(config: WatchConfig): void {
    this.fileWatcher.startWatching(config, this.config.resizeRatio, (filePath, result) => {
      if (this.config.notifications) {
        const title = result.success
          ? mainI18n.t('notification.imageOptimized')
          : mainI18n.t('notification.optimizationFailed');

        let body: string;
        if (
          result.success &&
          result.originalSize > 0 &&
          result.optimizedSize > 0
        ) {
          // 圧縮率を計算
          const compressionRatio = Math.round(
            ((result.originalSize - result.optimizedSize) /
              result.originalSize) *
              100
          );
          
          // リサイズ情報を含めた通知メッセージ
          const resizeInfo = result.resized 
            ? ` (${result.originalDimensions?.width}x${result.originalDimensions?.height} → ${result.resizedDimensions?.width}x${result.resizedDimensions?.height})` 
            : '';
          body = `圧縮率 ( ${compressionRatio}% )${resizeInfo} : ${path.basename(filePath)}`;
        } else if (result.success) {
          body = `Successfully optimized: ${path.basename(filePath)}`;
        } else {
          body = `Failed to optimize: ${path.basename(filePath)}`;
        }

        this.showNotification(title, body);
      }
    });
  }

  private restartWatching(): void {
    this.fileWatcher.stopAllWatching();
    this.startWatching();
  }

  private async checkNotificationPermission(): Promise<NotificationPermissionStatus> {
    console.log('🔍 Checking notification permission...');

    if (!Notification.isSupported()) {
      console.log('❌ Notifications are not supported on this system');
      return { hasPermission: false, canShow: false };
    }

    // macOS専用の詳細チェック
    if (process.platform === 'darwin') {
      try {
        // osascriptを使ってシステムの通知設定を確認
        const hasSystemPermission = await this.checkMacOSNotificationSettings();
        console.log(`🍎 macOS notification permission: ${hasSystemPermission}`);

        return {
          hasPermission: hasSystemPermission,
          canShow: hasSystemPermission,
        };
      } catch (error) {
        console.error('❌ Failed to check macOS notification settings:', error);
        // フォールバックとしてElectronの標準チェックを使用
      }
    }

    // 標準的なチェック（フォールバック）
    try {
      // テスト通知を作成して実際に許可されているかチェック
      const testNotification = new Notification({
        title: 'Permission Test',
        body: 'Testing notification permission',
        silent: true, // 音を出さない
      });

      return new Promise((resolve) => {
        testNotification.on('show', () => {
          console.log('✅ Test notification shown - permission granted');
          testNotification.close(); // すぐに閉じる
          resolve({ hasPermission: true, canShow: true });
        });

        testNotification.on('failed', () => {
          console.log('❌ Test notification failed - permission denied');
          resolve({ hasPermission: false, canShow: false });
        });

        testNotification.show();

        // タイムアウト処理
        setTimeout(() => {
          resolve({ hasPermission: false, canShow: false });
        }, 1000);
      });
    } catch (error) {
      console.error('❌ Failed to test notification permission:', error);
      return { hasPermission: false, canShow: false };
    }
  }

  private async checkMacOSNotificationSettings(): Promise<boolean> {
    return new Promise((resolve) => {
      const bundleId = app.getName() || 'Karuku';

      // AppleScriptを使ってシステム環境設定の通知設定を確認
      const script = `
        tell application "System Events"
          try
            set notificationSettings to (do shell script "defaults read com.apple.ncprefs.plist | grep -A 10 '${bundleId}' | grep 'flags = ' | head -1 | cut -d '=' -f 2 | tr -d ' ;'")
            if notificationSettings is not equal to "" then
              set flagsValue to notificationSettings as integer
              -- フラグが0でない場合は通知が有効
              return (flagsValue is not equal to 0)
            else
              return false
            end if
          on error
            return false
          end try
        end tell
      `;

      exec(`osascript -e '${script}'`, (error, stdout, stderr) => {
        if (error) {
          console.log('📝 AppleScript check failed, using alternative method');
          // 代替方法：sqlite3でNotificationCenterのデータベースを確認
          this.checkNotificationCenterDB()
            .then(resolve)
            .catch(() => resolve(false));
          return;
        }

        const result = stdout.trim() === 'true';
        console.log(`🔍 macOS notification check result: ${result}`);
        resolve(result);
      });
    });
  }

  private async checkNotificationCenterDB(): Promise<boolean> {
    return new Promise((resolve) => {
      const bundleId = app.getName() || 'Karuku';

      // Notification Centerのデータベースから設定を確認
      const dbPath = path.join(
        os.homedir(),
        'Library/Application Support/com.apple.notificationcenterui/data.db'
      );

      const query = `SELECT flags FROM app WHERE bundleid LIKE '%${bundleId}%' LIMIT 1;`;

      exec(`sqlite3 "${dbPath}" "${query}"`, (error, stdout, stderr) => {
        if (error) {
          console.log('📝 SQLite check failed, assuming permission required');
          resolve(false);
          return;
        }

        const flags = parseInt(stdout.trim());
        const hasPermission = !isNaN(flags) && flags !== 0;

        console.log(
          `💾 Notification Center DB check: flags=${flags}, hasPermission=${hasPermission}`
        );
        resolve(hasPermission);
      });
    });
  }

  private async showNotification(title: string, body: string): Promise<void> {
    console.log(`📢 Attempting to show notification: "${title}" - "${body}"`);

    if (!Notification.isSupported()) {
      console.log('❌ Notifications are not supported on this system');
      return;
    }

    console.log('✅ Notifications are supported');

    try {
      console.log('🚀 Creating notification...');
      const notification = new Notification({
        title,
        body,
        icon: path.join(__dirname, '../../assets/app-icon.png'), // アプリアイコンを追加
        sound: 'default', // デフォルトサウンドを追加
      });

      notification.on('show', () => {
        console.log('✅ Notification successfully shown');
      });

      notification.on('click', () => {
        console.log('👆 Notification clicked');
      });

      notification.on('close', () => {
        console.log('❌ Notification closed');
      });

      notification.on('failed', (error) => {
        console.error('❌ Notification failed to show:', error);
        // 初回失敗時のみ、ユーザーに設定確認を促す
        if (!this.hasShownPermissionDialog) {
          this.hasShownPermissionDialog = true;
          this.promptForNotificationPermission();
        }
      });

      notification.show();
      console.log(`✅ Notification command sent: ${title}`);
    } catch (error) {
      console.error('❌ Failed to show notification:', error);
      // 初回失敗時のみ、ユーザーに設定確認を促す
      if (!this.hasShownPermissionDialog) {
        this.hasShownPermissionDialog = true;
        this.promptForNotificationPermission();
      }
    }
  }

  private async openNotificationSettings(): Promise<void> {
    console.log('🔧 Opening notification settings...');

    if (process.platform === 'darwin') {
      try {
        // macOSバージョンを取得
        const osVersion = await this.getMacOSVersion();
        console.log(`🍎 macOS version: ${osVersion}`);

        if (osVersion >= 13) {
          // macOS Ventura (13.0+) - System Settingsの通知トップを開く
          await this.openVenturaNotificationSettings();
        } else if (osVersion >= 12) {
          // macOS Monterey (12.0+) - System Preferencesの通知トップを開く
          await this.openMontereyNotificationSettings();
        } else {
          // 古いmacOS - 汎用的な方法
          await this.openGenericNotificationSettings();
        }
      } catch (error) {
        console.error('❌ Failed to open notification settings:', error);
        // エラーの場合は汎用的な通知設定を開く
        this.openGenericNotificationSettings();
      }
    } else {
      console.log(
        'ℹ️ Notification settings opening is only supported on macOS'
      );
    }
  }

  private async getMacOSVersion(): Promise<number> {
    return new Promise((resolve) => {
      exec('sw_vers -productVersion', (error, stdout) => {
        if (error) {
          console.error('Failed to get macOS version:', error);
          resolve(12); // デフォルトとしてMontereyを仮定
          return;
        }

        const version = stdout.trim();
        const majorVersion = parseInt(version.split('.')[0]);
        resolve(majorVersion);
      });
    });
  }

  private async openVenturaNotificationSettings(): Promise<void> {
    console.log('🎆 Opening macOS Ventura/Sonoma notification settings...');

    // 通知設定のトップページを開くコマンド
    const venturaCommands = [
      `open "x-apple.systemsettings:com.apple.settings.notifications"`,
      `open "x-apple.systemsettings:notifications"`,
    ];

    for (const command of venturaCommands) {
      try {
        console.log(`🚀 Executing: ${command}`);
        await new Promise((resolve, reject) => {
          exec(command, (error) => {
            if (error) {
              console.log(`❌ Command failed: ${command}`);
              reject(error);
            } else {
              console.log(`✅ Command succeeded: ${command}`);
              resolve(true);
            }
          });
        });

        // 成功したらメッセージを表示して終了
        this.showNotificationSuccessMessage();
        return;
      } catch (error) {
        console.log('🔄 Trying next command...');
        continue;
      }
    }

    // すべて失敗した場合はフォールバック
    console.log('❌ All Ventura commands failed, falling back...');
    this.openGenericNotificationSettings();
  }

  private async openMontereyNotificationSettings(): Promise<void> {
    console.log('🏠 Opening macOS Monterey notification settings...');

    // 通知設定のトップページを開くコマンド
    const montereyCommands = [
      `open "x-apple.systempreferences:com.apple.preference.notifications"`,
    ];

    for (const command of montereyCommands) {
      try {
        console.log(`🚀 Executing: ${command}`);
        await new Promise((resolve, reject) => {
          exec(command, (error) => {
            if (error) {
              console.log(`❌ Command failed: ${command}`);
              reject(error);
            } else {
              console.log(`✅ Command succeeded: ${command}`);
              resolve(true);
            }
          });
        });

        // 成功したらメッセージを表示して終了
        this.showNotificationSuccessMessage();
        return;
      } catch (error) {
        console.log('🔄 Trying next command...');
        continue;
      }
    }

    // すべて失敗した場合はフォールバック
    console.log('❌ All Monterey commands failed, falling back...');
    this.openGenericNotificationSettings();
  }

  private showNotificationSuccessMessage(): void {
    setTimeout(() => {
      dialog.showMessageBox({
        type: 'info',
        title: '🔔 通知設定が開きました',
        message:
          '通知設定が開きました。アプリリストからKarukuを探してください。',
        detail:
          '通知を「許可」に設定して、再度「通知をテスト」ボタンをクリックして動作を確認してください。',
        buttons: ['理解しました'],
        defaultId: 0,
      });
    }, 500);
  }

  private async openNotificationSettingsWithAppleScript(
    bundleId: string
  ): Promise<void> {
    const script = `
      tell application "System Preferences"
        activate
        set current pane to pane "com.apple.preference.notifications"
        delay 3
      end tell
      
      tell application "System Events"
        tell process "System Preferences"
          try
            -- アプリリストからKarukuを探す
            set appList to outline 1 of scroll area 1 of group 1 of tab group 1 of window 1
            
            -- Karukuを探すためにリストをスクロール
            repeat with i from 1 to count of rows of appList
              set currentRow to row i of appList
              try
                set appName to value of static text 1 of UI element 1 of currentRow
                if appName contains "Karuku" then
                  -- Karukuを発見したらクリック
                  select currentRow
                  delay 0.5
                  click currentRow
                  delay 2
                  
                  -- クリック成功をログに記録
                  log "Successfully clicked on Karuku"
                  exit repeat
                end if
              on error rowError
                -- 行の読み取りエラーはスキップ
                log "Row read error: " & rowError
              end try
            end repeat
            
          on error generalError
            log "General AppleScript error: " & generalError
          end try
        end tell
      end tell
    `;

    exec(`osascript -e '${script}'`, (error, stdout, stderr) => {
      if (error) {
        console.log('📝 AppleScript approach failed, trying fallback...');
        console.error('AppleScript error:', error.message);
        if (stderr) console.error('AppleScript stderr:', stderr);

        // フォールバック: 汎用的な通知設定を開く
        this.openGenericNotificationSettings();
      } else {
        console.log('✅ AppleScript completed');
        if (stdout) console.log('AppleScript output:', stdout);

        // 成功メッセージを表示
        setTimeout(() => {
          dialog.showMessageBox({
            type: 'info',
            title: mainI18n.t('dialog.notificationInstruction.title'),
            message: '✅ Karukuの通知設定が開きました',
            detail:
              '通知を「許可」に設定して、再度「通知をテスト」ボタンをクリックして動作を確認してください。',
            buttons: [mainI18n.t('dialog.notificationInstruction.understood')],
            defaultId: 0,
          });
        }, 1000);
      }
    });
  }

  private async openGenericNotificationSettings(): Promise<void> {
    console.log('🔄 Opening generic notification settings as fallback...');

    // 汎用的な通知設定を開く（フォールバック）
    exec(
      'open "x-apple.systempreferences:com.apple.preference.notifications"',
      (error) => {
        if (error) {
          console.log('🔄 Opening System Preferences main page...');
          exec('open "x-apple.systempreferences:com.apple.preference"');
        } else {
          console.log('✅ Generic notification settings opened');

          // ユーザーにKarukuを手動で探すように指示
          this.showNotificationSearchInstruction();
        }
      }
    );
  }

  private async showNotificationSearchInstruction(): Promise<void> {
    setTimeout(() => {
      dialog.showMessageBox({
        type: 'info',
        title: mainI18n.t('dialog.notificationInstruction.title'),
        message: mainI18n.t('dialog.notificationInstruction.message'),
        detail: mainI18n.t('dialog.notificationInstruction.detail'),
        buttons: [mainI18n.t('dialog.notificationInstruction.understood')],
        defaultId: 0,
      });
    }, 1500); // 設定画面が開くまで少し待つ
  }

  private async promptForNotificationPermission(): Promise<void> {
    const result = await dialog.showMessageBox({
      type: 'question',
      title: mainI18n.t('dialog.notificationPermission.title'),
      message: mainI18n.t('dialog.notificationPermission.message'),
      detail: mainI18n.t('dialog.notificationPermission.detail'),
      buttons: [
        mainI18n.t('dialog.notificationPermission.openSettings'),
        mainI18n.t('dialog.notificationPermission.cancel'),
      ],
      defaultId: 0,
      cancelId: 1,
    });

    if (result.response === 0) {
      await this.openNotificationSettings();
    }
  }

  // Retina検出機能
  private isRetinaDisplay(): boolean {
    try {
      const primaryDisplay = screen.getPrimaryDisplay();
      const scaleFactor = primaryDisplay.scaleFactor;
      console.log(`🖥️ Primary display scale factor: ${scaleFactor}`);
      return scaleFactor > 1;
    } catch (error) {
      console.error('❌ Failed to detect retina display:', error);
      return false;
    }
  }

  private getDisplayInfo(): { isRetina: boolean; scaleFactor: number } {
    try {
      const primaryDisplay = screen.getPrimaryDisplay();
      const scaleFactor = primaryDisplay.scaleFactor;
      const isRetina = scaleFactor > 1;
      
      console.log(`🖥️ Display info - Scale factor: ${scaleFactor}, Retina: ${isRetina}`);
      
      return { isRetina, scaleFactor };
    } catch (error) {
      console.error('❌ Failed to get display info:', error);
      return { isRetina: false, scaleFactor: 1 };
    }
  }

  destroy(): void {
    this.fileWatcher.stopAllWatching();
    if (this.settingsWindow) {
      this.settingsWindow.close();
    }
    if (this.logWindow) {
      this.logWindow.close();
    }
    if (this.installationWindow) {
      this.installationWindow.close();
    }
  }
}

// アプリケーションの初期化
let karukuApp: KarukuApp | null = null;

app.whenReady().then(async () => {
  karukuApp = new KarukuApp();
  await karukuApp.initialize();
});

app.on('window-all-closed', (event: Electron.Event) => {
  // macOSでは通常、ウィンドウが全て閉じられてもアプリは終了しない
  event.preventDefault();
});

app.on('before-quit', () => {
  if (karukuApp) {
    karukuApp.destroy();
  }
});

app.dock?.hide(); // Dockからアプリを隠す
