const es = {
  // Menu items
  'menu.settings': 'Configuración...',
  'menu.showLogs': 'Mostrar registros...',
  'menu.watchingDirectories': 'Monitoreando {{count}} directorios',
  'menu.quit': 'Salir',
  
  // Settings window
  'settings.title': 'Configuración de Karuku',
  'settings.dependencies': 'Dependencias',
  'settings.generalSettings': 'Configuración general',
  'settings.watchDirectories': 'Directorios monitoreados',
  'settings.notifications': 'Notificaciones',
  'settings.testNotification': 'Probar notificación',
  'settings.autoStart': 'Inicio automático',
  'settings.retinaOptimization': 'Tamaño de píxeles de imagen',
  'resize.ratio25': 'Reducir al 25%',
  'resize.ratio50': 'Reducir al 50%',
  'resize.ratio75': 'Reducir al 75%',
  'resize.noResize': 'Mantener tamaño original',
  'settings.addDirectory': 'Agregar directorio',
  'settings.removeDirectory': 'Eliminar directorio',
  'settings.enabled': 'Habilitado',
  'settings.pattern': 'Patrón',
  'settings.path': 'Ruta',
  
  // Dependency status
  'dependency.pngquantInstalled': 'pngquant está instalado',
  'dependency.pngquantNotInstalled': 'pngquant no está instalado',
  'dependency.installing': 'Instalando pngquant...',
  'dependency.installButton': 'Instalar pngquant',
  
  // Logs window
  'logs.title': 'Registros de procesamiento',
  'logs.statistics': 'Estadísticas',
  'logs.totalFiles': 'Total de archivos',
  'logs.successCount': 'Éxitos',
  'logs.errorCount': 'Errores',
  'logs.refresh': 'Actualizar',
  'logs.openLogFile': 'Abrir archivo de registro',
  'logs.processingTime': 'Hora',
  'logs.fileName': 'Nombre del archivo',
  'logs.originalSize': 'Tamaño original',
  'logs.optimizedSize': 'Tamaño optimizado',
  'logs.compressionRatio': 'Compresión',
  'logs.status': 'Estado',
  'logs.success': 'Éxito',
  'logs.failed': 'Fallido',
  
  // Installation window
  'installation.title': 'Instalando dependencias',
  'installation.installing': 'Instalando...',
  'installation.completed': 'Instalación completada exitosamente',
  'installation.failed': 'Falló la instalación',
  'installation.progress': 'Progreso',
  
  // Notifications
  'notification.imageOptimized': 'Imagen optimizada: {{fileName}}',
  'notification.optimizationFailed': 'Error al optimizar: {{fileName}}',
  'notification.directoryAdded': 'Directorio agregado a la lista de monitoreo: {{path}}',
  'notification.directoryRemoved': 'Directorio eliminado de la lista de monitoreo: {{path}}',
  'notification.permissionRequired': 'Se requiere permiso de notificación. Por favor, permite las notificaciones en Configuración del sistema e inténtalo de nuevo.',
  'notification.testFailed': 'Error al probar la notificación. Por favor, inténtalo de nuevo.',
  
  // Empty state messages
  'emptyState.noDirectories': 'No se están monitoreando directorios.',
  'emptyState.clickToAdd': 'Haz clic en "{{addButton}}" para comenzar a monitorear una carpeta de imágenes PNG.',
  
  // Common
  'common.browse': 'Examinar',
  'common.cancel': 'Cancelar',
  'common.ok': 'Aceptar',
  'common.close': 'Cerrar',
  'common.save': 'Guardar',
  'common.loading': 'Cargando...',
  'common.error': 'Error',
  'common.success': 'Éxito'
};

export default es;
