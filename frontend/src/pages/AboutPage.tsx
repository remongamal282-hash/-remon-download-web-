import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import { PlaceholderPage } from '../components/PlaceholderPage';

export function AboutPage() {
  const { t } = useTranslation();
  return <PlaceholderPage titleKey={t('about.title')} icon={Info} description={t('about.subtitle')} />;
}
