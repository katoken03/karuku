import React from 'react';
import en from './locales/en';
import ja from './locales/ja';
import zhCN from './locales/zh-CN';
import es from './locales/es';
import fr from './locales/fr';
import de from './locales/de';
import ko from './locales/ko';
import pt from './locales/pt';

type LanguageCode = 'en' | 'ja' | 'zh-CN' | 'es' | 'fr' | 'de' | 'ko' | 'pt';

type TranslationKey = 
  // Menu items
  | 'menu.settings'
  | 'menu.showLogs'
  | 'menu.watchingDirectories'
  | 'menu.quit'
  
  // Settings window
  | 'settings.title'
  | 'settings.dependencies'
  | 'settings.generalSettings'
  | 'settings.watchDirectories'
  | 'settings.notifications'
  | 'settings.testNotification'
  | 'settings.autoStart'
  | 'settings.addDirectory'
  | 'settings.removeDirectory'
  | 'settings.enabled'
  | 'settings.pattern'
  | 'settings.path'
  
  // Dependency status
  | 'dependency.pngquantInstalled'
  | 'dependency.pngquantNotInstalled'
  | 'dependency.installing'
  | 'dependency.installButton'
  
  // Logs window
  | 'logs.title'
  | 'logs.statistics'
  | 'logs.totalFiles'
  | 'logs.successCount'
  | 'logs.errorCount'
  | 'logs.refresh'
  | 'logs.openLogFile'
  | 'logs.processingTime'
  | 'logs.fileName'
  | 'logs.originalSize'
  | 'logs.optimizedSize'
  | 'logs.compressionRatio'
  | 'logs.status'
  | 'logs.success'
  | 'logs.failed'
  
  // Installation window
  | 'installation.title'
  | 'installation.installing'
  | 'installation.completed'
  | 'installation.failed'
  | 'installation.progress'
  
  // Notifications
  | 'notification.imageOptimized'
  | 'notification.optimizationFailed'
  | 'notification.directoryAdded'
  | 'notification.directoryRemoved'
  | 'notification.permissionRequired'
  | 'notification.testFailed'
  
  // Empty state messages
  | 'emptyState.noDirectories'
  | 'emptyState.clickToAdd'
  
  // Common
  | 'common.browse'
  | 'common.cancel'
  | 'common.ok'
  | 'common.close'
  | 'common.save'
  | 'common.loading'
  | 'common.error'
  | 'common.success';

type TranslationMap = Record<TranslationKey, string>;

// 静的インポートで翻訳を初期化
const staticTranslations: Record<LanguageCode, TranslationMap> = {
  'en': en,
  'ja': ja,
  'zh-CN': zhCN,
  'es': es,
  'fr': fr,
  'de': de,
  'ko': ko,
  'pt': pt
};

class I18n {
  private currentLanguage: LanguageCode = 'en';
  private translations: Record<LanguageCode, TranslationMap> = staticTranslations;
  private fallbackLanguage: LanguageCode = 'en';
  private listeners: (() => void)[] = [];

  async loadTranslations(): Promise<void> {
    // 静的インポートを使用するので、すでに翻訳は読み込み済み
    console.log('✅ Translations loaded (static import)');
    console.log('Available languages:', Object.keys(this.translations));
    console.log('Sample translation test:', this.translations.en['settings.title']);
  }

  setLanguage(language: LanguageCode): void {
    console.log(`Attempting to set language to: ${language}`);
    console.log('Available translations:', Object.keys(this.translations));
    
    if (this.translations[language]) {
      console.log(`✅ Successfully setting language to: ${language}`);
      this.currentLanguage = language;
      this.notifyListeners();
    } else {
      console.warn(`❌ Language ${language} not available, falling back to ${this.fallbackLanguage}`);
      console.warn('Available languages:', Object.keys(this.translations));
      this.currentLanguage = this.fallbackLanguage;
      this.notifyListeners();
    }
  }

  getCurrentLanguage(): LanguageCode {
    return this.currentLanguage;
  }

  getSupportedLanguages(): LanguageCode[] {
    return Object.keys(this.translations) as LanguageCode[];
  }

  getLanguageName(language: LanguageCode): string {
    const languageNames: Record<LanguageCode, string> = {
      'en': 'English',
      'ja': '日本語',
      'zh-CN': '简体中文',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch',
      'ko': '한국어',
      'pt': 'Português'
    };
    return languageNames[language] || language;
  }

  t(key: TranslationKey, params?: Record<string, string | number>): string {
    const translation = this.translations[this.currentLanguage]?.[key] || 
                       this.translations[this.fallbackLanguage]?.[key] || 
                       key;

    // 翻訳が見つからない場合のデバッグ情報
    if (translation === key) {
      console.warn(`❌ Translation not found for key: ${key} (language: ${this.currentLanguage})`);
      console.warn('Available keys for current language:', Object.keys(this.translations[this.currentLanguage] || {}));
    }

    if (!params) {
      return translation;
    }

    return Object.entries(params).reduce((text, [param, value]) => {
      return text.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
    }, translation);
  }

  detectSystemLanguage(): LanguageCode {
    let detectedLang = 'en';
    
    if (typeof navigator !== 'undefined') {
      // ブラウザー環境 - 複数の方法で言語を検出
      detectedLang = 
        navigator.language || 
        (navigator.languages && navigator.languages[0]) || 
        // @ts-ignore - ブラウザー互換性のため
        navigator.userLanguage || 
        // @ts-ignore
        navigator.browserLanguage || 
        'en';
      console.log('Browser language detected:', detectedLang);
      console.log('All available languages:', navigator.languages);
    } else if (typeof process !== 'undefined') {
      // Node.js環境（Electronメインプロセス）
      const systemLang = process.env.LANG || process.env.LANGUAGE || 'en';
      detectedLang = systemLang;
      console.log('System language detected:', systemLang);
    }
    
    const mappedLang = this.mapToSupportedLanguage(detectedLang);
    console.log('Final mapped language:', mappedLang);
    return mappedLang;
  }

  private mapToSupportedLanguage(locale: string): LanguageCode {
    const normalized = locale.toLowerCase().replace('_', '-');
    console.log('Normalizing locale:', locale, '->', normalized);
    
    // 完全一致
    const supportedLanguages = this.getSupportedLanguages();
    if (supportedLanguages.includes(normalized as LanguageCode)) {
      return normalized as LanguageCode;
    }

    // 言語コードのみで一致
    const langCode = normalized.split('-')[0];
    const matches = supportedLanguages.filter(lang => lang.startsWith(langCode));
    if (matches.length > 0) {
      console.log(`Found language match for ${langCode}:`, matches[0]);
      return matches[0];
    }

    // マッピング
    const mappings: Record<string, LanguageCode> = {
      'zh': 'zh-CN',
      'zh-hans': 'zh-CN',
      'zh-cn': 'zh-CN',
      'zh-sg': 'zh-CN',
      'pt-br': 'pt',
      'es-es': 'es',
      'es-mx': 'es',
      'fr-fr': 'fr',
      'fr-ca': 'fr',
      'de-de': 'de',
      'de-at': 'de',
      'ko-kr': 'ko',
    };

    const mappedLang = mappings[normalized] || mappings[langCode] || 'en';
    console.log(`Using mapped language: ${mappedLang} for locale: ${locale}`);
    return mappedLang;
  }

  // リスナー機能（Reactでの状態同期用）
  addListener(listener: () => void): void {
    this.listeners.push(listener);
  }

  removeListener(listener: () => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

// シングルトンインスタンス
export const i18n = new I18n();

// React Hook
export function useTranslation() {
  const [currentLanguage, setCurrentLanguage] = React.useState<LanguageCode>(i18n.getCurrentLanguage());

  React.useEffect(() => {
    const listener = () => {
      setCurrentLanguage(i18n.getCurrentLanguage());
    };

    i18n.addListener(listener);
    return () => i18n.removeListener(listener);
  }, []);

  return {
    t: (key: TranslationKey, params?: Record<string, string | number>) => i18n.t(key, params),
    currentLanguage,
    setLanguage: (language: LanguageCode) => i18n.setLanguage(language),
    supportedLanguages: i18n.getSupportedLanguages(),
    getLanguageName: (language: LanguageCode) => i18n.getLanguageName(language)
  };
}

export type { LanguageCode, TranslationKey };
