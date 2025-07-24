import os from 'os';

type LanguageCode = 'en' | 'ja' | 'zh-CN' | 'es' | 'fr' | 'de' | 'ko' | 'pt';

type MainTranslationKey = 
  // Menu items
  | 'menu.title'
  | 'menu.settings'
  | 'menu.showLogs'
  | 'menu.watchingDirectories'
  | 'menu.quit'
  
  // Notifications
  | 'notification.ready'
  | 'notification.setupIncomplete'
  | 'notification.installationComplete'
  | 'notification.installationFailed'
  | 'notification.installationError'
  | 'notification.copied'
  | 'notification.imageOptimized'
  | 'notification.optimizationFailed'
  
  // Dialog messages
  | 'dialog.pngquantSetupRequired.title'
  | 'dialog.pngquantSetupRequired.message'
  | 'dialog.pngquantSetupRequired.detail'
  | 'dialog.pngquantSetupRequired.installAutomatically'
  | 'dialog.pngquantSetupRequired.showManualSteps'
  | 'dialog.pngquantSetupRequired.skipForNow'
  | 'dialog.manualInstallation.title'
  | 'dialog.manualInstallation.message'
  | 'dialog.manualInstallation.copyToClipboard'
  | 'dialog.manualInstallation.close'
  | 'dialog.selectDirectory'
  
  // Notification permission dialog
  | 'dialog.notificationPermission.title'
  | 'dialog.notificationPermission.message'
  | 'dialog.notificationPermission.detail'
  | 'dialog.notificationPermission.openSettings'
  | 'dialog.notificationPermission.cancel'
  
  // Notification instruction dialog
  | 'dialog.notificationInstruction.title'
  | 'dialog.notificationInstruction.message'
  | 'dialog.notificationInstruction.detail'
  | 'dialog.notificationInstruction.understood';

type MainTranslationMap = Record<MainTranslationKey, string>;

const translations: Record<LanguageCode, MainTranslationMap> = {
  'en': {
    // Menu items
    'menu.title': 'Karuku (Image Resizer)',
    'menu.settings': 'Settings...',
    'menu.showLogs': 'Show Logs...',
    'menu.watchingDirectories': 'Watching {{count}} directories',
    'menu.quit': 'Quit',
    
    // Notifications
    'notification.ready': 'Karuku - Ready',
    'notification.setupIncomplete': 'Karuku - Setup Incomplete',
    'notification.installationComplete': 'Karuku - Installation Complete',
    'notification.installationFailed': 'Karuku - Installation Failed',
    'notification.installationError': 'Karuku - Installation Error',
    'notification.copied': 'Karuku - Copied',
    'notification.imageOptimized': 'Image Optimized',
    'notification.optimizationFailed': 'Optimization Failed',
    
    // Dialog messages
    'dialog.pngquantSetupRequired.title': 'pngquant Setup Required',
    'dialog.pngquantSetupRequired.message': 'This app requires pngquant to optimize images.',
    'dialog.pngquantSetupRequired.detail': 'pngquant was not found on your system. Would you like to install it automatically using Homebrew?',
    'dialog.pngquantSetupRequired.installAutomatically': 'Install automatically',
    'dialog.pngquantSetupRequired.showManualSteps': 'Show manual steps',
    'dialog.pngquantSetupRequired.skipForNow': 'Skip for now',
    'dialog.manualInstallation.title': 'Manual Installation Steps',
    'dialog.manualInstallation.message': 'Please follow these steps to install pngquant:',
    'dialog.manualInstallation.copyToClipboard': 'Copy to Clipboard',
    'dialog.manualInstallation.close': 'Close',
    'dialog.selectDirectory': 'Select Directory',
    
    // Notification permission dialog
    'dialog.notificationPermission.title': 'Notification Permission Required',
    'dialog.notificationPermission.message': 'Karuku would like to send you notifications when images are optimized.',
    'dialog.notificationPermission.detail': 'Please enable notifications for Karuku in System Preferences > Notifications.',
    'dialog.notificationPermission.openSettings': 'Open System Preferences',
    'dialog.notificationPermission.cancel': 'Cancel',
    
    // Notification instruction dialog
    'dialog.notificationInstruction.title': 'Karuku Notification Settings',
    'dialog.notificationInstruction.message': 'Please enable Karuku notifications',
    'dialog.notificationInstruction.detail': 'In the notification settings that opened, find "Karuku" in the app list and set notifications to "Allow".\n\nAfter setting up, click the "Test Notification" button again to verify it works.',
    'dialog.notificationInstruction.understood': 'Understood'
  },
  
  'ja': {
    // Menu items
    'menu.title': 'Karuku（画像リサイザー）',
    'menu.settings': '設定...',
    'menu.showLogs': 'ログを表示...',
    'menu.watchingDirectories': '{{count}}個のディレクトリを監視中',
    'menu.quit': '終了',
    
    // Notifications
    'notification.ready': 'Karuku - 準備完了',
    'notification.setupIncomplete': 'Karuku - セットアップ未完了',
    'notification.installationComplete': 'Karuku - インストール完了',
    'notification.installationFailed': 'Karuku - インストール失敗',
    'notification.installationError': 'Karuku - インストールエラー',
    'notification.copied': 'Karuku - コピー完了',
    'notification.imageOptimized': '画像を最適化しました',
    'notification.optimizationFailed': '最適化に失敗しました',
    
    // Dialog messages
    'dialog.pngquantSetupRequired.title': 'pngquantのセットアップが必要です',
    'dialog.pngquantSetupRequired.message': 'このアプリは画像を最適化するためにpngquantが必要です。',
    'dialog.pngquantSetupRequired.detail': 'pngquantがシステムで見つかりませんでした。Homebrewを使用して自動的にインストールしますか？',
    'dialog.pngquantSetupRequired.installAutomatically': '自動でインストール',
    'dialog.pngquantSetupRequired.showManualSteps': '手動手順を表示',
    'dialog.pngquantSetupRequired.skipForNow': '今はスキップ',
    'dialog.manualInstallation.title': '手動インストール手順',
    'dialog.manualInstallation.message': 'pngquantをインストールするには以下の手順に従ってください：',
    'dialog.manualInstallation.copyToClipboard': 'クリップボードにコピー',
    'dialog.manualInstallation.close': '閉じる',
    'dialog.selectDirectory': 'ディレクトリを選択',
    
    // Notification permission dialog
    'dialog.notificationPermission.title': '通知の許可が必要です',
    'dialog.notificationPermission.message': 'Karukuが画像の最適化完了時に通知を送信するには許可が必要です。',
    'dialog.notificationPermission.detail': 'システム環境設定 > 通知でKarukuの通知を有効にしてください。',
    'dialog.notificationPermission.openSettings': 'システム環境設定を開く',
    'dialog.notificationPermission.cancel': 'キャンセル',
    
    // Notification instruction dialog
    'dialog.notificationInstruction.title': 'Karuku 通知設定',
    'dialog.notificationInstruction.message': 'Karukuの通知設定を有効にしてください',
    'dialog.notificationInstruction.detail': '開いた通知設定のアプリリストから「Karuku」を探して、通知を「許可」に設定してください。\n\n設定後、再度「通知をテスト」ボタンをクリックして動作を確認してください。',
    'dialog.notificationInstruction.understood': '理解しました'
  },
  
  'zh-CN': {
    // Menu items
    'menu.title': 'Karuku（图像调整器）',
    'menu.settings': '设置...',
    'menu.showLogs': '显示日志...',
    'menu.watchingDirectories': '正在监视 {{count}} 个目录',
    'menu.quit': '退出',
    
    // Notifications
    'notification.ready': 'Karuku - 就绪',
    'notification.setupIncomplete': 'Karuku - 设置未完成',
    'notification.installationComplete': 'Karuku - 安装完成',
    'notification.installationFailed': 'Karuku - 安装失败',
    'notification.installationError': 'Karuku - 安装错误',
    'notification.copied': 'Karuku - 已复制',
    'notification.imageOptimized': '图像已优化',
    'notification.optimizationFailed': '优化失败',
    
    // Dialog messages
    'dialog.pngquantSetupRequired.title': '需要设置 pngquant',
    'dialog.pngquantSetupRequired.message': '此应用需要 pngquant 来优化图像。',
    'dialog.pngquantSetupRequired.detail': '在您的系统中未找到 pngquant。您想使用 Homebrew 自动安装吗？',
    'dialog.pngquantSetupRequired.installAutomatically': '自动安装',
    'dialog.pngquantSetupRequired.showManualSteps': '显示手动步骤',
    'dialog.pngquantSetupRequired.skipForNow': '暂时跳过',
    'dialog.manualInstallation.title': '手动安装步骤',
    'dialog.manualInstallation.message': '请按照以下步骤安装 pngquant：',
    'dialog.manualInstallation.copyToClipboard': '复制到剪贴板',
    'dialog.manualInstallation.close': '关闭',
    'dialog.selectDirectory': '选择目录',
    
    // Notification permission dialog
    'dialog.notificationPermission.title': '需要通知权限',
    'dialog.notificationPermission.message': 'Karuku 希望在优化图像时向您发送通知。',
    'dialog.notificationPermission.detail': '请在系统偏好设置 > 通知中启用 Karuku 的通知。',
    'dialog.notificationPermission.openSettings': '打开系统偏好设置',
    'dialog.notificationPermission.cancel': '取消',
    
    // Notification instruction dialog
    'dialog.notificationInstruction.title': 'Karuku 通知设置',
    'dialog.notificationInstruction.message': '请启用 Karuku 通知',
    'dialog.notificationInstruction.detail': '在打开的通知设置中，从应用列表中找到“Karuku”并将通知设置为“允许”。\n\n设置完成后，再次点击“测试通知”按钮验证是否正常工作。',
    'dialog.notificationInstruction.understood': '我知道了'
  },
  
  'es': {
    // Menu items
    'menu.title': 'Karuku (Redimensionador de imágenes)',
    'menu.settings': 'Configuración...',
    'menu.showLogs': 'Mostrar registros...',
    'menu.watchingDirectories': 'Monitoreando {{count}} directorios',
    'menu.quit': 'Salir',
    
    // Notifications
    'notification.ready': 'Karuku - Listo',
    'notification.setupIncomplete': 'Karuku - Configuración incompleta',
    'notification.installationComplete': 'Karuku - Instalación completada',
    'notification.installationFailed': 'Karuku - Instalación fallida',
    'notification.installationError': 'Karuku - Error de instalación',
    'notification.copied': 'Karuku - Copiado',
    'notification.imageOptimized': 'Imagen optimizada',
    'notification.optimizationFailed': 'Optimización fallida',
    
    // Dialog messages
    'dialog.pngquantSetupRequired.title': 'Se requiere configuración de pngquant',
    'dialog.pngquantSetupRequired.message': 'Esta aplicación requiere pngquant para optimizar imágenes.',
    'dialog.pngquantSetupRequired.detail': 'pngquant no se encontró en su sistema. ¿Le gustaría instalarlo automáticamente usando Homebrew?',
    'dialog.pngquantSetupRequired.installAutomatically': 'Instalar automáticamente',
    'dialog.pngquantSetupRequired.showManualSteps': 'Mostrar pasos manuales',
    'dialog.pngquantSetupRequired.skipForNow': 'Omitir por ahora',
    'dialog.manualInstallation.title': 'Pasos de instalación manual',
    'dialog.manualInstallation.message': 'Por favor, siga estos pasos para instalar pngquant:',
    'dialog.manualInstallation.copyToClipboard': 'Copiar al portapapeles',
    'dialog.manualInstallation.close': 'Cerrar',
    'dialog.selectDirectory': 'Seleccionar directorio',
    
    // Notification permission dialog
    'dialog.notificationPermission.title': 'Permiso de notificación requerido',
    'dialog.notificationPermission.message': 'Karuku quiere enviarte notificaciones cuando las imágenes sean optimizadas.',
    'dialog.notificationPermission.detail': 'Por favor, habilita las notificaciones para Karuku en Configuración del Sistema > Notificaciones.',
    'dialog.notificationPermission.openSettings': 'Abrir Configuración del Sistema',
    'dialog.notificationPermission.cancel': 'Cancelar',
    
    // Notification instruction dialog
    'dialog.notificationInstruction.title': 'Configuración de notificaciones de Karuku',
    'dialog.notificationInstruction.message': 'Por favor, habilita las notificaciones de Karuku',
    'dialog.notificationInstruction.detail': 'En la configuración de notificaciones que se abrió, busca "Karuku" en la lista de aplicaciones y establece las notificaciones en "Permitir".\n\nDespués de configurar, haz clic en el botón "Probar notificación" nuevamente para verificar que funciona.',
    'dialog.notificationInstruction.understood': 'Entendido'
  },
  
  'fr': {
    // Menu items
    'menu.title': 'Karuku (Redimensionneur d\'images)',
    'menu.settings': 'Paramètres...',
    'menu.showLogs': 'Afficher les journaux...',
    'menu.watchingDirectories': 'Surveillance de {{count}} répertoires',
    'menu.quit': 'Quitter',
    
    // Notifications
    'notification.ready': 'Karuku - Prêt',
    'notification.setupIncomplete': 'Karuku - Configuration incomplète',
    'notification.installationComplete': 'Karuku - Installation terminée',
    'notification.installationFailed': 'Karuku - Installation échouée',
    'notification.installationError': 'Karuku - Erreur d\'installation',
    'notification.copied': 'Karuku - Copié',
    'notification.imageOptimized': 'Image optimisée',
    'notification.optimizationFailed': 'Optimisation échouée',
    
    // Dialog messages
    'dialog.pngquantSetupRequired.title': 'Configuration de pngquant requise',
    'dialog.pngquantSetupRequired.message': 'Cette application nécessite pngquant pour optimiser les images.',
    'dialog.pngquantSetupRequired.detail': 'pngquant n\'a pas été trouvé sur votre système. Souhaitez-vous l\'installer automatiquement avec Homebrew?',
    'dialog.pngquantSetupRequired.installAutomatically': 'Installer automatiquement',
    'dialog.pngquantSetupRequired.showManualSteps': 'Afficher les étapes manuelles',
    'dialog.pngquantSetupRequired.skipForNow': 'Ignorer pour l\'instant',
    'dialog.manualInstallation.title': 'Étapes d\'installation manuelle',
    'dialog.manualInstallation.message': 'Veuillez suivre ces étapes pour installer pngquant:',
    'dialog.manualInstallation.copyToClipboard': 'Copier dans le presse-papiers',
    'dialog.manualInstallation.close': 'Fermer',
    'dialog.selectDirectory': 'Sélectionner un répertoire',
    
    // Notification permission dialog
    'dialog.notificationPermission.title': 'Autorisation de notification requise',
    'dialog.notificationPermission.message': 'Karuku souhaite vous envoyer des notifications lors de l\'optimisation d\'images.',
    'dialog.notificationPermission.detail': 'Veuillez activer les notifications pour Karuku dans Préférences Système > Notifications.',
    'dialog.notificationPermission.openSettings': 'Ouvrir les Préférences Système',
    'dialog.notificationPermission.cancel': 'Annuler',
    
    // Notification instruction dialog
    'dialog.notificationInstruction.title': 'Paramètres de notification Karuku',
    'dialog.notificationInstruction.message': 'Veuillez activer les notifications Karuku',
    'dialog.notificationInstruction.detail': 'Dans les paramètres de notification qui se sont ouverts, trouvez "Karuku" dans la liste des applications et définissez les notifications sur "Autoriser".\n\nAprès la configuration, cliquez à nouveau sur le bouton "Tester les notifications" pour vérifier que cela fonctionne.',
    'dialog.notificationInstruction.understood': 'Compris'
  },
  
  'de': {
    // Menu items
    'menu.title': 'Karuku (Bildgrößenänderer)',
    'menu.settings': 'Einstellungen...',
    'menu.showLogs': 'Protokolle anzeigen...',
    'menu.watchingDirectories': '{{count}} Verzeichnisse werden überwacht',
    'menu.quit': 'Beenden',
    
    // Notifications
    'notification.ready': 'Karuku - Bereit',
    'notification.setupIncomplete': 'Karuku - Setup unvollständig',
    'notification.installationComplete': 'Karuku - Installation abgeschlossen',
    'notification.installationFailed': 'Karuku - Installation fehlgeschlagen',
    'notification.installationError': 'Karuku - Installationsfehler',
    'notification.copied': 'Karuku - Kopiert',
    'notification.imageOptimized': 'Bild optimiert',
    'notification.optimizationFailed': 'Optimierung fehlgeschlagen',
    
    // Dialog messages
    'dialog.pngquantSetupRequired.title': 'pngquant-Setup erforderlich',
    'dialog.pngquantSetupRequired.message': 'Diese App benötigt pngquant zur Bildoptimierung.',
    'dialog.pngquantSetupRequired.detail': 'pngquant wurde auf Ihrem System nicht gefunden. Möchten Sie es automatisch mit Homebrew installieren?',
    'dialog.pngquantSetupRequired.installAutomatically': 'Automatisch installieren',
    'dialog.pngquantSetupRequired.showManualSteps': 'Manuelle Schritte anzeigen',
    'dialog.pngquantSetupRequired.skipForNow': 'Vorerst überspringen',
    'dialog.manualInstallation.title': 'Manuelle Installationsschritte',
    'dialog.manualInstallation.message': 'Bitte befolgen Sie diese Schritte zur Installation von pngquant:',
    'dialog.manualInstallation.copyToClipboard': 'In Zwischenablage kopieren',
    'dialog.manualInstallation.close': 'Schließen',
    'dialog.selectDirectory': 'Verzeichnis auswählen',
    
    // Notification permission dialog
    'dialog.notificationPermission.title': 'Benachrichtigungserlaubnis erforderlich',
    'dialog.notificationPermission.message': 'Karuku möchte Ihnen Benachrichtigungen senden, wenn Bilder optimiert werden.',
    'dialog.notificationPermission.detail': 'Bitte aktivieren Sie Benachrichtigungen für Karuku in Systemeinstellungen > Benachrichtigungen.',
    'dialog.notificationPermission.openSettings': 'Systemeinstellungen öffnen',
    'dialog.notificationPermission.cancel': 'Abbrechen',
    
    // Notification instruction dialog
    'dialog.notificationInstruction.title': 'Karuku Benachrichtigungseinstellungen',
    'dialog.notificationInstruction.message': 'Bitte aktivieren Sie Karuku-Benachrichtigungen',
    'dialog.notificationInstruction.detail': 'In den geöffneten Benachrichtigungseinstellungen finden Sie "Karuku" in der App-Liste und setzen die Benachrichtigungen auf "Erlauben".\n\nNach der Einrichtung klicken Sie erneut auf die Schaltfläche "Benachrichtigung testen", um zu überprüfen, ob es funktioniert.',
    'dialog.notificationInstruction.understood': 'Verstanden'
  },
  
  'ko': {
    // Menu items
    'menu.title': 'Karuku (이미지 크기 조정기)',
    'menu.settings': '설정...',
    'menu.showLogs': '로그 보기...',
    'menu.watchingDirectories': '{{count}}개 디렉토리 모니터링 중',
    'menu.quit': '종료',
    
    // Notifications
    'notification.ready': 'Karuku - 준비됨',
    'notification.setupIncomplete': 'Karuku - 설정 미완료',
    'notification.installationComplete': 'Karuku - 설치 완료',
    'notification.installationFailed': 'Karuku - 설치 실패',
    'notification.installationError': 'Karuku - 설치 오류',
    'notification.copied': 'Karuku - 복사됨',
    'notification.imageOptimized': '이미지가 최적화되었습니다',
    'notification.optimizationFailed': '최적화에 실패했습니다',
    
    // Dialog messages
    'dialog.pngquantSetupRequired.title': 'pngquant 설정이 필요합니다',
    'dialog.pngquantSetupRequired.message': '이 앱은 이미지를 최적화하기 위해 pngquant가 필요합니다.',
    'dialog.pngquantSetupRequired.detail': '시스템에서 pngquant를 찾을 수 없습니다. Homebrew를 사용하여 자동으로 설치하시겠습니까?',
    'dialog.pngquantSetupRequired.installAutomatically': '자동으로 설치',
    'dialog.pngquantSetupRequired.showManualSteps': '수동 단계 표시',
    'dialog.pngquantSetupRequired.skipForNow': '지금은 건너뛰기',
    'dialog.manualInstallation.title': '수동 설치 단계',
    'dialog.manualInstallation.message': 'pngquant를 설치하려면 다음 단계를 따라하세요:',
    'dialog.manualInstallation.copyToClipboard': '클립보드에 복사',
    'dialog.manualInstallation.close': '닫기',
    'dialog.selectDirectory': '디렉토리 선택',
    
    // Notification permission dialog
    'dialog.notificationPermission.title': '알림 권한이 필요합니다',
    'dialog.notificationPermission.message': 'Karuku가 이미지 최적화 시 알림을 보내려고 합니다.',
    'dialog.notificationPermission.detail': '시스템 환경설정 > 알림에서 Karuku의 알림을 활성화해 주세요.',
    'dialog.notificationPermission.openSettings': '시스템 환경설정 열기',
    'dialog.notificationPermission.cancel': '취소',
    
    // Notification instruction dialog
    'dialog.notificationInstruction.title': 'Karuku 알림 설정',
    'dialog.notificationInstruction.message': 'Karuku 알림을 활성화해 주세요',
    'dialog.notificationInstruction.detail': '열린 알림 설정에서 앱 목록에서 "Karuku"를 찾아 알림을 "허용"으로 설정해 주세요.\n\n설정 후 "알림 테스트" 버튼을 다시 클릭하여 작동을 확인해 주세요.',
    'dialog.notificationInstruction.understood': '이해했습니다'
  },
  
  'pt': {
    // Menu items
    'menu.title': 'Karuku (Redimensionador de imagens)',
    'menu.settings': 'Configurações...',
    'menu.showLogs': 'Mostrar logs...',
    'menu.watchingDirectories': 'Monitorando {{count}} diretórios',
    'menu.quit': 'Sair',
    
    // Notifications
    'notification.ready': 'Karuku - Pronto',
    'notification.setupIncomplete': 'Karuku - Configuração incompleta',
    'notification.installationComplete': 'Karuku - Instalação concluída',
    'notification.installationFailed': 'Karuku - Instalação falhou',
    'notification.installationError': 'Karuku - Erro de instalação',
    'notification.copied': 'Karuku - Copiado',
    'notification.imageOptimized': 'Imagem otimizada',
    'notification.optimizationFailed': 'Otimização falhou',
    
    // Dialog messages
    'dialog.pngquantSetupRequired.title': 'Configuração do pngquant necessária',
    'dialog.pngquantSetupRequired.message': 'Este aplicativo requer pngquant para otimizar imagens.',
    'dialog.pngquantSetupRequired.detail': 'pngquant não foi encontrado em seu sistema. Gostaria de instalá-lo automaticamente usando o Homebrew?',
    'dialog.pngquantSetupRequired.installAutomatically': 'Instalar automaticamente',
    'dialog.pngquantSetupRequired.showManualSteps': 'Mostrar passos manuais',
    'dialog.pngquantSetupRequired.skipForNow': 'Pular por enquanto',
    'dialog.manualInstallation.title': 'Passos de instalação manual',
    'dialog.manualInstallation.message': 'Por favor, siga estes passos para instalar o pngquant:',
    'dialog.manualInstallation.copyToClipboard': 'Copiar para área de transferência',
    'dialog.manualInstallation.close': 'Fechar',
    'dialog.selectDirectory': 'Selecionar diretório',
    
    // Notification permission dialog
    'dialog.notificationPermission.title': 'Permissão de notificação necessária',
    'dialog.notificationPermission.message': 'Karuku gostaria de enviar notificações quando as imagens forem otimizadas.',
    'dialog.notificationPermission.detail': 'Por favor, habilite as notificações para o Karuku em Preferências do Sistema > Notificações.',
    'dialog.notificationPermission.openSettings': 'Abrir Preferências do Sistema',
    'dialog.notificationPermission.cancel': 'Cancelar',
    
    // Notification instruction dialog
    'dialog.notificationInstruction.title': 'Configurações de notificação do Karuku',
    'dialog.notificationInstruction.message': 'Por favor, ative as notificações do Karuku',
    'dialog.notificationInstruction.detail': 'Nas configurações de notificação que abriram, encontre "Karuku" na lista de aplicativos e defina as notificações como "Permitir".\n\nApós a configuração, clique no botão "Testar notificação" novamente para verificar se funciona.',
    'dialog.notificationInstruction.understood': 'Entendido'
  }
};

class MainI18n {
  private currentLanguage: LanguageCode = 'en';
  private fallbackLanguage: LanguageCode = 'en';

  constructor() {
    this.detectAndSetSystemLanguage();
  }

  private detectAndSetSystemLanguage(): void {
    const systemLanguage = this.detectSystemLanguage();
    this.setLanguage(systemLanguage);
  }

  private detectSystemLanguage(): LanguageCode {
    // Node.js環境（Electronメインプロセス）
    let systemLang = 'en';
    
    // macOSの言語設定を取得
    if (process.platform === 'darwin') {
      try {
        const { execSync } = require('child_process');
        // macOSのシステム言語設定を取得
        const result = execSync('defaults read -g AppleLanguages', { encoding: 'utf8' });
        const languages = result.match(/"([^"]+)"/g);
        if (languages && languages.length > 0) {
          systemLang = languages[0].replace(/"/g, '');
          console.log('macOS system language detected:', systemLang);
        }
      } catch (error) {
        console.warn('Failed to detect macOS language, falling back to env vars:', error);
        systemLang = process.env.LANG || process.env.LANGUAGE || 'en';
      }
    } else {
      // その他のOS
      systemLang = process.env.LANG || process.env.LANGUAGE || 'en';
    }
    
    return this.mapToSupportedLanguage(systemLang);
  }

  private mapToSupportedLanguage(locale: string): LanguageCode {
    const normalized = locale.toLowerCase().replace('_', '-');
    
    // 完全一致
    const supportedLanguages = Object.keys(translations) as LanguageCode[];
    if (supportedLanguages.includes(normalized as LanguageCode)) {
      return normalized as LanguageCode;
    }

    // 言語コードのみで一致
    const langCode = normalized.split('-')[0];
    const matches = supportedLanguages.filter(lang => lang.startsWith(langCode));
    if (matches.length > 0) {
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

    return mappings[normalized] || mappings[langCode] || 'en';
  }

  setLanguage(language: LanguageCode): void {
    if (translations[language]) {
      this.currentLanguage = language;
    } else {
      console.warn(`Language ${language} not available, falling back to ${this.fallbackLanguage}`);
      this.currentLanguage = this.fallbackLanguage;
    }
  }

  getCurrentLanguage(): LanguageCode {
    return this.currentLanguage;
  }

  t(key: MainTranslationKey, params?: Record<string, string | number>): string {
    const translation = translations[this.currentLanguage]?.[key] || 
                       translations[this.fallbackLanguage]?.[key] || 
                       key;

    if (!params) {
      return translation;
    }

    return Object.entries(params).reduce((text, [param, value]) => {
      return text.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
    }, translation);
  }
}

// シングルトンインスタンス
export const mainI18n = new MainI18n();

export type { LanguageCode, MainTranslationKey };
