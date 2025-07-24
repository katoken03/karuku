const ko = {
  // Menu items
  'menu.settings': '설정...',
  'menu.showLogs': '로그 보기...',
  'menu.watchingDirectories': '{{count}}개 디렉토리 모니터링 중',
  'menu.quit': '종료',
  
  // Settings window
  'settings.title': 'Karuku 설정',
  'settings.dependencies': '의존성',
  'settings.generalSettings': '일반 설정',
  'settings.watchDirectories': '모니터링 디렉토리',
  'settings.notifications': '알림',
  'settings.testNotification': '알림 테스트',
  'settings.autoStart': '자동 시작',
  'settings.addDirectory': '디렉토리 추가',
  'settings.removeDirectory': '디렉토리 제거',
  'settings.enabled': '활성화됨',
  'settings.pattern': '패턴',
  'settings.path': '경로',
  
  // Dependency status
  'dependency.pngquantInstalled': 'pngquant가 설치되어 있습니다',
  'dependency.pngquantNotInstalled': 'pngquant가 설치되어 있지 않습니다',
  'dependency.installing': 'pngquant 설치 중...',
  'dependency.installButton': 'pngquant 설치',
  
  // Logs window
  'logs.title': '처리 로그',
  'logs.statistics': '통계',
  'logs.totalFiles': '전체 파일',
  'logs.successCount': '성공',
  'logs.errorCount': '오류',
  'logs.refresh': '새로고침',
  'logs.openLogFile': '로그 파일 열기',
  'logs.processingTime': '시간',
  'logs.fileName': '파일명',
  'logs.originalSize': '원본 크기',
  'logs.optimizedSize': '최적화된 크기',
  'logs.compressionRatio': '압축률',
  'logs.status': '상태',
  'logs.success': '성공',
  'logs.failed': '실패',
  
  // Installation window
  'installation.title': '의존성 설치',
  'installation.installing': '설치 중...',
  'installation.completed': '설치가 성공적으로 완료되었습니다',
  'installation.failed': '설치에 실패했습니다',
  'installation.progress': '진행률',
  
  // Notifications
  'notification.imageOptimized': '이미지가 최적화되었습니다: {{fileName}}',
  'notification.optimizationFailed': '최적화에 실패했습니다: {{fileName}}',
  'notification.directoryAdded': '모니터링 목록에 디렉토리가 추가되었습니다: {{path}}',
  'notification.directoryRemoved': '모니터링 목록에서 디렉토리가 제거되었습니다: {{path}}',
  'notification.permissionRequired': '알림 권한이 필요합니다. 시스템 설정에서 알림을 허용하고 다시 시도해주세요.',
  'notification.testFailed': '알림 테스트에 실패했습니다. 다시 시도해주세요.',
  
  // Empty state messages
  'emptyState.noDirectories': '모니터링 중인 디렉토리가 없습니다.',
  'emptyState.clickToAdd': 'PNG 이미지 폴더 모니터링을 시작하려면 "{{addButton}}"를 클릭하세요.',
  
  // Common
  'common.browse': '찾아보기',
  'common.cancel': '취소',
  'common.ok': '확인',
  'common.close': '닫기',
  'common.save': '저장',
  'common.loading': '로딩 중...',
  'common.error': '오류',
  'common.success': '성공'
};

export default ko;
