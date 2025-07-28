import React, { useEffect, useState } from 'react';
import { AppConfig, WatchConfig } from '../types/index';
import { useTranslation, i18n, LanguageCode } from '../i18n';
import './styles/global.css';
import './styles/button.css';
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

  const handleResizeRatioChange = (ratio: number | null) => {
    if (config) {
      const newConfig = { ...config, resizeRatio: ratio };
      saveConfig(newConfig);
    }
  };

  const getResizeDisplayValue = (ratio: number | null): string => {
    if (ratio === null) return t('resize.noResize');
    if (ratio === 0.25) return t('resize.ratio25');
    if (ratio === 0.5) return t('resize.ratio50');
    if (ratio === 0.75) return t('resize.ratio75');
    return t('resize.noResize');
  };

  const handleLanguageChange = (language: LanguageCode) => {
    console.log('Language change requested:', language);
    setLanguage(language);
  };

  const handleTestNotification = async () => {
    try {
      console.log('Testing notification...');
      const result = await window.electronAPI.testNotification();
      
      if (result.success) {
        console.log('✅ Test notification sent successfully:', result.message);
        // 成功時の視覚的フィードバック（オプション）
        // 必要に応じてUIに成功メッセージを表示
      } else {
        console.log('⚠️ Test notification failed:', result.message);
        
        if (result.reason === 'permission_denied') {
          console.log('📱 Notification permission not granted. System settings opened.');
          // メインプロセス側で適切なダイアログが表示されるため、ここではアラートを表示しない
        }
      }
    } catch (error) {
      console.error('❌ Failed to test notification:', error);
      alert(t('notification.testFailed') || 'Failed to test notification. Please try again.');
    }
  };

  console.log('Render state:', { loading, i18nReady, config: !!config, currentLanguage });

  // ローディング表示の優先順位
  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading configuration...</div>
      </div>
    );
  }

  if (!i18nReady) {
    return (
      <div className="container">
        <div className="loading">Initializing translations...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="container">
        <div className="error">Failed to load configuration</div>
      </div>
    );
  }

  // デバッグ用テスト翻訳
  console.log('Testing translation:', t('settings.title'));

  return (
    <div className="container">
      <header className="header">
        <div className="header-content">
          <h1 className="title">{t('settings.title')}</h1>
          
          {/* 言語選択セクション */}
          <div className="language-selector">
            <select 
              value={currentLanguage} 
              onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
              className="language-select"
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

      <section className="section">
        <h2 className="section-title">{t('settings.dependencies')}</h2>
        <DependencyStatus />
      </section>

      <section className="section">
        <h2 className="section-title">{t('settings.generalSettings')}</h2>
        <div className="setting-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={config.notifications}
              onChange={(e) => handleNotificationToggle(e.target.checked)}
              className="checkbox"
            />
            {t('settings.notifications')}
          </label>
          <button 
            onClick={handleTestNotification}
            className="btn-primary"
          >
            {t('settings.testNotification')}
          </button>
        </div>
        <div className="setting-row">
          <label className="setting-label">
            {t('settings.retinaOptimization')}
          </label>
          <select 
            value={config.resizeRatio === null ? 'none' : config.resizeRatio.toString()}
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'none') {
                handleResizeRatioChange(null);
              } else {
                handleResizeRatioChange(parseFloat(value));
              }
            }}
            className="resize-select"
          >
            <option value="none">{t('resize.noResize')}</option>
            <option value="0.25">{t('resize.ratio25')}</option>
            <option value="0.5">{t('resize.ratio50')}</option>
            <option value="0.75">{t('resize.ratio75')}</option>
          </select>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2 className="section-title">{t('settings.watchDirectories')}</h2>
          <AddDirectoryButton onClick={handleAddDirectory} />
        </div>

        {config.watchConfigs.length === 0 ? (
          <div className="empty-state">
            <p>{t('emptyState.noDirectories')}</p>
            <p>
              {t('emptyState.clickToAdd', { addButton: t('settings.addDirectory') })}
            </p>
          </div>
        ) : (
          <div className="watch-list">
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

export default App;
