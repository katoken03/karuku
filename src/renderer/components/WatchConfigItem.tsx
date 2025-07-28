import React, { useState } from 'react';
import { WatchConfig } from '../../types/index';
import { useTranslation } from '../../i18n';
import '../styles/button.css';

type Props = {
  config: WatchConfig;
  onUpdate: (config: WatchConfig) => void;
  onRemove: (configId: string) => void;
};

const WatchConfigItem: React.FC<Props> = ({ config, onUpdate, onRemove }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editPattern, setEditPattern] = useState(config.pattern);
  const { t } = useTranslation();

  const handlePatternChange = () => {
    const updatedConfig = { ...config, pattern: editPattern };
    onUpdate(updatedConfig);
    setIsEditing(false);
  };

  const handleEnabledToggle = () => {
    const updatedConfig = { ...config, enabled: !config.enabled };
    onUpdate(updatedConfig);
  };

  const handleRemove = () => {
    if (window.confirm(t('settings.removeDirectory') + '?')) {
      onRemove(config.id);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.pathSection}>
          <span style={styles.pathLabel}>{t('settings.path')}:</span>
          <span style={styles.path}>{config.path}</span>
        </div>
        <div style={styles.controls}>
          <label style={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={handleEnabledToggle}
              style={styles.checkbox}
            />
            {t('settings.enabled')}
          </label>
          <button onClick={handleRemove} className="btn-danger">
            {t('settings.removeDirectory')}
          </button>
        </div>
      </div>
      
      <div style={styles.patternSection}>
        <span style={styles.patternLabel}>{t('settings.pattern')}:</span>
        {isEditing ? (
          <div style={styles.editGroup}>
            <input
              type="text"
              value={editPattern}
              onChange={(e) => setEditPattern(e.target.value)}
              style={styles.patternInput}
              placeholder="e.g., *.png or ^ss.*\.png$"
            />
            <button onClick={handlePatternChange} style={styles.saveButton}>
              {t('common.save')}
            </button>
            <button onClick={() => setIsEditing(false)} style={styles.cancelButton}>
              {t('common.cancel')}
            </button>
          </div>
        ) : (
          <div style={styles.patternDisplay}>
            <code style={styles.pattern}>{config.pattern}</code>
            <button onClick={() => setIsEditing(true)} style={styles.editButton}>
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    border: '1px solid #e1e5e9',
    borderRadius: '6px',
    padding: '16px',
    backgroundColor: '#f8f9fa',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  pathSection: {
    flex: 1,
    minWidth: 0,
  },
  pathLabel: {
    fontSize: '12px',
    color: '#666',
    fontWeight: '500',
    display: 'block',
    marginBottom: '4px',
  },
  path: {
    fontSize: '14px',
    color: '#333',
    wordBreak: 'break-all' as const,
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginLeft: '16px',
  },
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#333',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  checkbox: {
    marginRight: '6px',
  },
  patternSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  patternLabel: {
    fontSize: '12px',
    color: '#666',
    fontWeight: '500',
    whiteSpace: 'nowrap' as const,
  },
  patternDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
  },
  pattern: {
    backgroundColor: '#e9ecef',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '13px',
    fontFamily: 'Monaco, Consolas, monospace',
    color: '#495057',
  },
  editButton: {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  editGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
  },
  patternInput: {
    flex: 1,
    padding: '6px 8px',
    border: '1px solid #ced4da',
    borderRadius: '4px',
    fontSize: '13px',
    fontFamily: 'Monaco, Consolas, monospace',
  },
  saveButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 12px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 12px',
    fontSize: '12px',
    cursor: 'pointer',
  },
};

export default WatchConfigItem;
