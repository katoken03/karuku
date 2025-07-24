import React from 'react';
import { useTranslation } from '../../i18n';
import '../styles/button.css';

type Props = {
  onClick: () => void;
};

const AddDirectoryButton: React.FC<Props> = ({ onClick }) => {
  const { t } = useTranslation();
  
  return (
    <button onClick={onClick} className="btn-primary">
      + {t('settings.addDirectory')}
    </button>
  );
};

export default AddDirectoryButton;
