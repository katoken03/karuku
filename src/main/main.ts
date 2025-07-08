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
} from 'electron';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { AppConfig, WatchConfig, ProcessedFile } from '../types/index';
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
    return {
      watchConfigs: [],
      notifications: true,
      autoStart: true,
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
      this.config = { ...this.getDefaultConfig(), ...JSON.parse(configData) };
    } catch (error) {
      // ファイルが存在しない場合はデフォルト設定を使用
      await this.saveConfig();
    }
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
        mainI18n.t('dialog.pngquantSetupRequired.skipForNow')
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
          mainI18n.t('dialog.manualInstallation.close')
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
    // アイコンファイルのパスを設定（SVGファイルを使用）
    const iconPath = path.join(__dirname, '../../assets/icons/tray-icon.svg');

    // アイコンファイルが存在するかチェック
    let trayIcon;
    try {
      trayIcon = nativeImage.createFromPath(iconPath);
      if (trayIcon.isEmpty()) {
        throw new Error('SVG icon file is empty or invalid');
      }
      // メニューバーアイコンとして設定
      trayIcon.setTemplateImage(true);
      console.log('✅ Tray icon loaded from SVG file successfully');
    } catch (error) {
      console.error('❌ Failed to load tray icon from SVG file:', error);
      // フォールバック: シンプルなアイコンを作成
      trayIcon = this.createFallbackIcon();
    }

    this.tray = new Tray(trayIcon);
    this.updateTrayMenu(); // 初期メニューを設定
    this.tray.setToolTip('Karuku - Image Optimizer');
  }

  // メニューを動的に更新するメソッド
  private updateTrayMenu(): void {
    if (!this.tray) return;

    const activeWatchersCount = this.config.watchConfigs.filter(c => c.enabled).length;
    
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
          count: activeWatchersCount
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
    console.log(`Tray menu updated: watching ${activeWatchersCount} directories`);
  }

  // フォールバック用のシンプルなアイコンを作成
  private createFallbackIcon(): any {
    const size = 18;
    const canvas = Buffer.alloc(size * size * 4);

    // 背景を透明に
    for (let i = 0; i < canvas.length; i += 4) {
      canvas[i] = 0;
      canvas[i + 1] = 0;
      canvas[i + 2] = 0;
      canvas[i + 3] = 0;
    }

    // シンプルな「K」を描画
    const color = { r: 0, g: 0, b: 0, a: 255 };

    // 左の縦線
    for (let y = 3; y <= 15; y++) {
      this.setPixel(canvas, 4, y, size, color.r, color.g, color.b, color.a);
      this.setPixel(canvas, 5, y, size, color.r, color.g, color.b, color.a);
    }

    // 上の斜め線
    for (let i = 0; i < 6; i++) {
      this.setPixel(
        canvas,
        6 + i,
        9 - i,
        size,
        color.r,
        color.g,
        color.b,
        color.a
      );
      this.setPixel(
        canvas,
        6 + i,
        10 - i,
        size,
        color.r,
        color.g,
        color.b,
        color.a
      );
    }

    // 下の斜め線
    for (let i = 0; i < 6; i++) {
      this.setPixel(
        canvas,
        6 + i,
        9 + i,
        size,
        color.r,
        color.g,
        color.b,
        color.a
      );
      this.setPixel(
        canvas,
        6 + i,
        10 + i,
        size,
        color.r,
        color.g,
        color.b,
        color.a
      );
    }

    const image = nativeImage.createFromBuffer(canvas, {
      width: size,
      height: size,
    });

    image.setTemplateImage(true);
    console.log('ℹ️ Using fallback icon');
    return image;
  }

  private setPixel(
    canvas: Buffer,
    x: number,
    y: number,
    size: number,
    r: number,
    g: number,
    b: number,
    a: number = 255
  ) {
    if (x >= 0 && x < size && y >= 0 && y < size) {
      const offset = (y * size + x) * 4;
      canvas[offset] = r;
      canvas[offset + 1] = g;
      canvas[offset + 2] = b;
      canvas[offset + 3] = a;
    }
  }

  private openSettings(): void {
    if (this.settingsWindow) {
      this.settingsWindow.focus();
      return;
    }

    // ログウィンドウと全く同じ設定にする
    this.settingsWindow = new BrowserWindow({
      width: 600,
      height: 600,
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
      await this.showNotification('Test Notification', 'This is a test notification from Karuku');
      return true;
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
    this.fileWatcher.startWatching(config, (filePath, success) => {
      if (this.config.notifications) {
        const title = success 
          ? mainI18n.t('notification.imageOptimized') 
          : mainI18n.t('notification.optimizationFailed');
        const body = success
          ? `Successfully optimized: ${path.basename(filePath)}`
          : `Failed to optimize: ${path.basename(filePath)}`;

        this.showNotification(title, body);
      }
    });
  }

  private restartWatching(): void {
    this.fileWatcher.stopAllWatching();
    this.startWatching();
  }

  private async showNotification(title: string, body: string): Promise<void> {
    console.log(`📢 Attempting to show notification: "${title}" - "${body}"`);
    
    if (!Notification.isSupported()) {
      console.log('❌ Notifications are not supported on this system');
      return;
    }

    console.log('✅ Notifications are supported, checking permissions...');

    // 通知権限をリクエスト
    const permission = await this.requestNotificationPermission();
    console.log(`🔐 Notification permission result: ${permission}`);
    
    if (permission !== 'granted') {
      console.log('❌ Notification permission not granted:', permission);
      return;
    }

    try {
      console.log('🚀 Creating notification...');
      const notification = new Notification({ 
        title, 
        body,
        icon: path.join(__dirname, '../../assets/icons/app-icon.png'), // アプリアイコンを追加
        sound: 'default' // デフォルトサウンドを追加
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
      });
      
      notification.show();
      console.log(`✅ Notification command sent: ${title}`);
    } catch (error) {
      console.error('❌ Failed to show notification:', error);
    }
  }

  private async requestNotificationPermission(): Promise<string> {
    // macOSでの通知権限の確認・リクエスト
    if (process.platform === 'darwin') {
      try {
        // 現在の権限ステータスを確認
        const { systemPreferences } = require('electron');
        const status = systemPreferences.getMediaAccessStatus('microphone'); // 代替として使用
        
        // システム設定での通知許可をチェック
        const hasPermission = await this.checkNotificationPermission();
        if (hasPermission) {
          return 'granted';
        } else {
          // ユーザーに通知許可を求める
          await this.promptForNotificationPermission();
          return await this.checkNotificationPermission() ? 'granted' : 'denied';
        }
      } catch (error) {
        console.error('Error checking notification permission:', error);
        return 'default';
      }
    }
    
    return 'granted'; // 他のプラットフォームではデフォルトで許可
  }

  private async checkNotificationPermission(): Promise<boolean> {
    if (process.platform !== 'darwin') {
      return true; // macOS以外では通常通知は利用可能
    }

    try {
      // macOSでの通知権限確認の改善版
      const { systemPreferences } = require('electron');
      
      // システム設定での通知許可状況を確認
      const notificationPermission = systemPreferences.getMediaAccessStatus('screen-capture');
      console.log('System notification permission status:', notificationPermission);
      
      // 実際に通知を送信してテスト
      const testNotification = new Notification({
        title: 'Karuku Permission Test',
        body: 'Testing notification permission',
        silent: true
      });
      
      return new Promise((resolve) => {
        testNotification.on('show', () => {
          console.log('✅ Notification permission granted');
          testNotification.close();
          resolve(true);
        });
        
        testNotification.on('failed', (error) => {
          console.log('❌ Notification permission denied or failed:', error);
          resolve(false);
        });
        
        testNotification.show();
        
        // 3秒後にタイムアウト
        setTimeout(() => {
          console.log('⚠️ Notification permission test timed out');
          testNotification.close();
          resolve(false);
        }, 3000);
      });
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return false;
    }
  }

  private async promptForNotificationPermission(): Promise<void> {
    const result = await dialog.showMessageBox({
      type: 'question',
      title: mainI18n.t('dialog.notificationPermission.title'),
      message: mainI18n.t('dialog.notificationPermission.message'),
      detail: mainI18n.t('dialog.notificationPermission.detail'),
      buttons: [
        mainI18n.t('dialog.notificationPermission.openSettings'),
        mainI18n.t('dialog.notificationPermission.cancel')
      ],
      defaultId: 0,
      cancelId: 1
    });

    if (result.response === 0) {
      // システム設定を開く（macOS）
      if (process.platform === 'darwin') {
        exec('open "x-apple.systempreferences:com.apple.preference.notifications"');
      }
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
