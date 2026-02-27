import React from 'react';
import { ShieldCheck, CloudOff } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const PrivacyBadge: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium border border-green-100">
      <ShieldCheck size={14} />
      <span>{t.privacy.encryption}</span>
      <span className="w-px h-3 bg-green-200 mx-1"></span>
      <CloudOff size={14} />
      <span>{t.privacy.minimalData}</span>
    </div>
  );
};