export type WatchConfig = {
  id: string;
  path: string;
  pattern: string;
  enabled: boolean;
};

export type AppConfig = {
  watchConfigs: WatchConfig[];
  notifications: boolean;
  autoStart: boolean;
  retinaOptimization: boolean;
};

export type ProcessedFile = {
  filePath: string;
  originalSize: number;
  optimizedSize: number;
  timestamp: Date;
  success: boolean;
  error?: string;
  resized?: boolean;
  originalDimensions?: { width: number; height: number };
  resizedDimensions?: { width: number; height: number };
};

export type LogEntry = {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: any;
};

export interface InstallationResult {
  success: boolean;
  message: string;
  details?: string;
}

export interface InstallationProgress {
  stage: 'checking' | 'updating' | 'installing' | 'verifying' | 'completed' | 'error';
  message: string;
  progress?: number;
}

export interface NotificationTestResult {
  success: boolean;
  reason?: 'permission_denied' | 'system_error';
  message: string;
}

export interface NotificationPermissionStatus {
  hasPermission: boolean;
  canShow: boolean;
}
