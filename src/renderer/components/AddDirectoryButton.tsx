import React from 'react';
import { useTranslation } from '../../i18n';

type Props = {
  onClick: () => void;
};

const AddDirectoryButton: React.FC<Props> = ({ onClick }) => {
  const { t } = useTranslation();
  
  return (
    <button onClick={onClick} style={styles.button}>
      + {t('settings.addDirectory')}
    </button>
  );
};

const styles = {
  button: {
    backgroundColor: '#007AFF',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};

export default AddDirectoryButton;
