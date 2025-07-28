import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ProcessedFile } from '../types/index';
import { useTranslation, i18n } from '../i18n';
import './styles/global.css';
import './styles/button.css';

const LogsApp: React.FC = () => {
  const [logs, setLogs] = useState<ProcessedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, currentLanguage } = useTranslation();

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    // i18nの初期化（静的インポートで既に読み込み済み）
    await i18n.loadTranslations();
    
    // システム言語の検出と設定
    const systemLanguage = i18n.detectSystemLanguage();
    i18n.setLanguage(systemLanguage);
    
    // ログの読み込み
    await loadLogs();
  };

  const loadLogs = async () => {
    try {
      const loadedLogs = await window.electronAPI.getLogs(200);
      setLogs(loadedLogs);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const openLogFile = async () => {
    try {
      await window.electronAPI.openLogFile();
    } catch (error) {
      console.error('Failed to open log file:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    // 言語に応じたロケールマッピング
    const localeMap: Record<string, string> = {
      'en': 'en-US',
      'ja': 'ja-JP',
      'zh-CN': 'zh-CN',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'ko': 'ko-KR',
      'pt': 'pt-BR'
    };
    
    const locale = localeMap[currentLanguage] || 'en-US';
    
    // 日本語の場合は特別なフォーマットを使用
    if (currentLanguage === 'ja') {
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // 24時間表記
      }).format(date);
    }
    
    // その他の言語は各言語のネイティブ表示
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const calculateSavings = (original: number, optimized: number): string => {
    if (original === 0) return '0%';
    const savings = ((original - optimized) / original) * 100;
    return savings.toFixed(1) + '%';
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <h1 className="title">{t('logs.title')}</h1>
        <div style={styles.headerActions}>
          <button onClick={loadLogs} className="btn-primary">
            {t('logs.refresh')}
          </button>
          <button onClick={openLogFile} className="btn-primary">
            {t('logs.openLogFile')}
          </button>
        </div>
      </header>

      {logs.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No files have been processed yet.</p>
          <p>Add some directories to watch and drop PNG files to see them here.</p>
        </div>
      ) : (
        <div style={styles.logList}>
          <div style={styles.stats}>
            <div style={styles.stat}>
              <span style={styles.statValue}>{logs.length}</span>
              <span style={styles.statLabel}>{t('logs.totalFiles')}</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statValue}>
                {logs.filter(log => log.success).length}
              </span>
              <span style={styles.statLabel}>{t('logs.successCount')}</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statValue}>
                {logs.filter(log => !log.success).length}
              </span>
              <span style={styles.statLabel}>{t('logs.errorCount')}</span>
            </div>
          </div>

          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>{t('logs.processingTime')}</th>
                  <th style={styles.th}>{t('logs.fileName')}</th>
                  <th style={styles.th}>{t('logs.originalSize')}</th>
                  <th style={styles.th}>{t('logs.optimizedSize')}</th>
                  <th style={styles.th}>{t('logs.compressionRatio')}</th>
                  <th style={styles.th}>{t('logs.status')}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr key={index} style={styles.tableRow}>
                    <td style={styles.td}>
                      {formatDate(log.timestamp)}
                    </td>
                    <td style={styles.tdFile}>
                      <span title={log.filePath}>
                        {log.filePath.split('/').pop() || log.filePath}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {formatFileSize(log.originalSize)}
                    </td>
                    <td style={styles.td}>
                      {log.success ? formatFileSize(log.optimizedSize) : '-'}
                    </td>
                    <td style={styles.td}>
                      {log.success ? calculateSavings(log.originalSize, log.optimizedSize) : '-'}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.status,
                        ...(log.success ? styles.statusSuccess : styles.statusError)
                      }}>
                        {log.success ? t('logs.success') : t('logs.failed')}
                      </span>
                      {log.error && (
                        <div style={styles.error} title={log.error}>
                          {log.error.length > 50 ? log.error.substring(0, 50) + '...' : log.error}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  emptyState: {
    textAlign: 'center' as const,
    backgroundColor: 'white',
    padding: '60px 20px',
    borderRadius: '8px',
    color: '#666',
  },
  logList: {
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  stats: {
    display: 'flex',
    padding: '20px',
    borderBottom: '1px solid #e1e5e9',
    gap: '40px',
  },
  stat: {
    textAlign: 'center' as const,
  },
  statValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#666',
    marginTop: '4px',
  },
  tableContainer: {
    overflowX: 'auto' as const,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
  },
  th: {
    padding: '12px',
    textAlign: 'left' as const,
    fontSize: '12px',
    fontWeight: '600',
    color: '#666',
    borderBottom: '1px solid #e1e5e9',
  },
  tableRow: {
    borderBottom: '1px solid #e1e5e9',
  },
  td: {
    padding: '12px',
    fontSize: '14px',
    color: '#333',
    whiteSpace: 'nowrap' as const,
  },
  tdFile: {
    padding: '12px',
    fontSize: '14px',
    color: '#333',
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    webkitTextOverflow: 'ellipsis' as any,
    whiteSpace: 'nowrap' as const,
  },
  status: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
  },
  statusSuccess: {
    backgroundColor: 'var(--color-sage)',
    color: 'var(--color-dark)',
  },
  statusError: {
    backgroundColor: 'var(--color-coral)',
    color: 'var(--color-red)',
  },
  error: {
    fontSize: '11px',
    color: 'var(--color-red)',
    marginTop: '4px',
    fontStyle: 'italic',
  },
};

// ログアプリの初期化
const container = document.getElementById('logs-root');
if (container) {
  const root = createRoot(container);
  root.render(<LogsApp />);
}
