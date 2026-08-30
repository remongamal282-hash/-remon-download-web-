import { useTranslation } from 'react-i18next';
import { Settings } from 'lucide-react';
import { PlaceholderPage } from '../components/PlaceholderPage';

export function SettingsPage() {
  const { t } = useTranslation();
  return <PlaceholderPage titleKey={t('settings.title')} icon={Settings} />;
}
