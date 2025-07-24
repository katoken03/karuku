import { contextBridge, ipcRenderer } from 'electron';
import { AppConfig, WatchConfig, ProcessedFile, InstallationResult, NotificationTestResult, NotificationPermissionStatus } from '../types/index';

const electronAPI = {
  getConfig: (): Promise<AppConfig> => ipcRenderer.invoke('get-config'),
  saveConfig: (config: AppConfig): Promise<boolean> => ipcRenderer.invoke('save-config', config),
  selectDirectory: (): Promise<string | null> => ipcRenderer.invoke('select-directory'),
  addWatchConfig: (directoryPath: string): Promise<WatchConfig> => ipcRenderer.invoke('add-watch-config', directoryPath),
  removeWatchConfig: (configId: string): Promise<boolean> => ipcRenderer.invoke('remove-watch-config', configId),
  getLogs: (limit?: number): Promise<ProcessedFile[]> => ipcRenderer.invoke('get-logs', limit),
  openLogFile: (): Promise<void> => ipcRenderer.invoke('open-log-file'),
  checkPngquant: (): Promise<boolean> => ipcRenderer.invoke('check-pngquant'),
  installPngquant: (): Promise<InstallationResult> => ipcRenderer.invoke('install-pngquant'),
  testNotification: (): Promise<NotificationTestResult> => ipcRenderer.invoke('test-notification'),
  checkNotificationPermission: (): Promise<NotificationPermissionStatus> => ipcRenderer.invoke('check-notification-permission'),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}
