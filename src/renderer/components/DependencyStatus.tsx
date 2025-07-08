import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n';

const DependencyStatus: React.FC = () => {
  const [pngquantInstalled, setPngquantInstalled] = useState<boolean | null>(
    null
  );
  const [checking, setChecking] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    checkPngquantStatus();
  }, []);

  const checkPngquantStatus = async () => {
    try {
      setChecking(true);
      const isInstalled = await window.electronAPI.checkPngquant();
      setPngquantInstalled(isInstalled);
    } catch (error) {
      console.error('Failed to check pngquant status:', error);
      setPngquantInstalled(false);
    } finally {
      setChecking(false);
    }
  };

  const handleInstallPngquant = async () => {
    try {
      setInstalling(true);
      setLastError(null);
      const result = await window.electronAPI.installPngquant();

      if (result.success) {
        console.log('Installation completed successfully');
        setLastError(null);
        // インストール成功後に状態を再確認
        setTimeout(() => {
          checkPngquantStatus();
        }, 1000);
      } else {
        console.error('Installation failed:', result.message);
        if (result.details) {
          console.error('Details:', result.details);
        }
        setLastError(
          `${result.message}${result.details ? `: ${result.details}` : ''}`
        );
        // インストール失敗の場合もUIを更新
        setPngquantInstalled(false);
      }
    } catch (error) {
      console.error('Failed to install pngquant:', error);
      setLastError(error instanceof Error ? error.message : String(error));
      setPngquantInstalled(false);
    } finally {
      setInstalling(false);
    }
  };

  const getStatusIcon = () => {
    if (checking) {
      return '⏳';
    }
    return pngquantInstalled ? '✅' : '❌';
  };

  const getStatusText = () => {
    if (checking) {
      return t('common.loading');
    }
    return pngquantInstalled 
      ? t('dependency.pngquantInstalled') 
      : t('dependency.pngquantNotInstalled');
  };

  const getStatusColor = () => {
    if (checking) {
      return '#666';
    }
    return pngquantInstalled ? '#34C759' : '#FF3B30';
  };

  return (
    <div style={styles.container}>
      <div style={styles.dependency}>
        <div style={styles.info}>
          <div style={styles.name}>
            pngquant
          </div>
        </div>

        <div style={styles.status}>
          <div style={styles.statusBadge}>
            <span style={styles.statusIcon}>{getStatusIcon()}</span>
            <span style={{ ...styles.statusText, color: getStatusColor() }}>
              {getStatusText()}
            </span>
          </div>

          {/* インストールボタンは未インストール時のみ表示 */}
          {!checking && !pngquantInstalled && (
            <button
              onClick={handleInstallPngquant}
              disabled={installing}
              style={{
                ...styles.installButton,
                ...(installing ? styles.installButtonDisabled : {}),
              }}>
              {installing ? t('dependency.installing') : t('dependency.installButton')}
            </button>
          )}
        </div>
      </div>

      {!checking && !pngquantInstalled && (
        <div style={styles.helpText}>
          💡 <strong>Tip:</strong> You can also install pngquant manually using:{' '}
          <code>brew install pngquant</code>
        </div>
      )}

      {lastError && (
        <div style={styles.errorText}>
          ❌ <strong>{t('common.error')}:</strong> {lastError}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  dependency: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
  },
  info: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  name: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    border: '1px solid #e9ecef',
  },
  statusIcon: {
    fontSize: '14px',
  },
  statusText: {
    fontSize: '14px',
    fontWeight: '500',
  },
  installButton: {
    padding: '8px 16px',
    backgroundColor: '#007AFF',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  installButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  helpText: {
    fontSize: '13px',
    color: '#666',
    padding: '12px',
    backgroundColor: '#fff3cd',
    borderRadius: '6px',
    border: '1px solid #ffeaa7',
  },
  errorText: {
    fontSize: '13px',
    color: '#d32f2f',
    padding: '12px',
    backgroundColor: '#ffebee',
    borderRadius: '6px',
    border: '1px solid #ffcdd2',
  },
};

export default DependencyStatus;
