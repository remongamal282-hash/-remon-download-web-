import { useTranslation } from 'react-i18next';
import { Monitor } from 'lucide-react';
import { PlaceholderPage } from '../components/PlaceholderPage';

export function DesktopPage() {
  const { t } = useTranslation();
  return <PlaceholderPage titleKey={t('desktop.title')} icon={Monitor} description={t('desktop.subtitle')} />;
}
