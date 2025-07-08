import React, { useEffect, useState } from 'react';
import { AppConfig, WatchConfig } from '../types/index';
import { useTranslation, i18n, LanguageCode } from '../i18n';
import AddDirectoryButton from './components/AddDirectoryButton';
import DependencyStatus from './components/DependencyStatus';
import WatchConfigItem from './components/WatchConfigItem';

const App: React.FC = () => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [i18nReady, setI18nReady] = useState(false);
  const { t, currentLanguage, setLanguage, supportedLanguages, getLanguageName } = useTranslation();

  useEffect(() => {
    console.log('App component mounted, starting initialization...');
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Step 1: Loading translations...');
      await i18n.loadTranslations();
      
      console.log('Step 2: Detecting system language...');
      const systemLanguage = i18n.detectSystemLanguage();
      console.log('System language detected:', systemLanguage);
      
      console.log('Step 3: Setting language...');
      i18n.setLanguage(systemLanguage);
      
      console.log('Step 4: i18n ready, setting state...');
      setI18nReady(true);
      
      console.log('Step 5: Loading config...');
      await loadConfig();
      
      console.log('Initialization complete!');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setI18nReady(true); // エラーでも継続
      await loadConfig();
    }
  };

  const loadConfig = async () => {
    try {
      console.log('Loading app config...');
      const loadedConfig = await window.electronAPI.getConfig();
      console.log('Config loaded:', loadedConfig);
      setConfig(loadedConfig);
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (newConfig: AppConfig) => {
    try {
      await window.electronAPI.saveConfig(newConfig);
      setConfig(newConfig);
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  };

  const handleAddDirectory = async () => {
    try {
      const directoryPath = await window.electronAPI.selectDirectory();
      if (directoryPath) {
        const newWatchConfig = await window.electronAPI.addWatchConfig(
          directoryPath
        );
        if (config && newWatchConfig) {
          const updatedConfig = {
            ...config,
            watchConfigs: [...config.watchConfigs, newWatchConfig],
          };
          setConfig(updatedConfig);
        }
      }
    } catch (error) {
      console.error('Failed to add directory:', error);
    }
  };

  const handleRemoveDirectory = async (configId: string) => {
    try {
      await window.electronAPI.removeWatchConfig(configId);
      if (config) {
        const updatedConfig = {
          ...config,
          watchConfigs: config.watchConfigs.filter((c) => c.id !== configId),
        };
        setConfig(updatedConfig);
      }
    } catch (error) {
      console.error('Failed to remove directory:', error);
    }
  };

  const handleUpdateWatchConfig = (updatedConfig: WatchConfig) => {
    if (config) {
      const updatedConfigs = config.watchConfigs.map((c) =>
        c.id === updatedConfig.id ? updatedConfig : c
      );
      const newConfig = { ...config, watchConfigs: updatedConfigs };
      saveConfig(newConfig);
    }
  };

  const handleNotificationToggle = (enabled: boolean) => {
    if (config) {
      const newConfig = { ...config, notifications: enabled };
      saveConfig(newConfig);
    }
  };

  const handleLanguageChange = (language: LanguageCode) => {
    console.log('Language change requested:', language);
    setLanguage(language);
  };

  const handleTestNotification = async () => {
    try {
      console.log('Testing notification...');
      await window.electronAPI.testNotification();
      console.log('Test notification sent');
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  };

  console.log('Render state:', { loading, i18nReady, config: !!config, currentLanguage });

  // ローディング表示の優先順位
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading configuration...</div>
      </div>
    );
  }

  if (!i18nReady) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Initializing translations...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Failed to load configuration</div>
      </div>
    );
  }

  // デバッグ用テスト翻訳
  console.log('Testing translation:', t('settings.title'));

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>{t('settings.title')}</h1>
          
          {/* 言語選択セクション */}
          <div style={styles.languageSelector}>
            <select 
              value={currentLanguage} 
              onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
              style={styles.languageSelect}
            >
              {supportedLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {getLanguageName(lang)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>{t('settings.dependencies')}</h2>
        <DependencyStatus />
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>{t('settings.generalSettings')}</h2>
        <div style={styles.settingRow}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={config.notifications}
              onChange={(e) => handleNotificationToggle(e.target.checked)}
              style={styles.checkbox}
            />
            {t('settings.notifications')}
          </label>
          <button 
            onClick={handleTestNotification}
            style={styles.testButton}
          >
            {t('settings.testNotification')}
          </button>
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>{t('settings.watchDirectories')}</h2>
          <AddDirectoryButton onClick={handleAddDirectory} />
        </div>

        {config.watchConfigs.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No directories are being watched.</p>
            <p>
              Click "{t('settings.addDirectory')}" to start monitoring a folder for PNG images.
            </p>
          </div>
        ) : (
          <div style={styles.watchList}>
            {config.watchConfigs.map((watchConfig) => (
              <WatchConfigItem
                key={watchConfig.id}
                config={watchConfig}
                onUpdate={handleUpdateWatchConfig}
                onRemove={handleRemoveDirectory}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh', // 最小高さを設定
    minWidth: '100%',   // 最小幅を設定
    boxSizing: 'border-box' as const, // ボックスサイジングを明示
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0,
  },
  languageSelector: {
    display: 'flex',
    alignItems: 'center',
  },
  languageSelect: {
    padding: '6px 12px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    backgroundColor: 'white',
    fontSize: '14px',
    minWidth: '120px',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    margin: 0,
    lineHeight: '1.8',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#333',
    cursor: 'pointer',
  },
  checkbox: {
    marginRight: '8px',
  },
  settingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testButton: {
    padding: '6px 12px',
    fontSize: '12px',
    border: '1px solid #007AFF',
    backgroundColor: '#007AFF',
    color: 'white',
    borderRadius: '4px',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#0051D5',
    },
  },
  emptyState: {
    textAlign: 'center' as const,
    color: '#666',
    padding: '40px 20px',
  },
  watchList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  loading: {
    textAlign: 'center' as const,
    padding: '40px',
    fontSize: '16px',
    color: '#666',
  },
  error: {
    textAlign: 'center' as const,
    padding: '40px',
    fontSize: '16px',
    color: '#d73a49',
  },
};

export default App;
