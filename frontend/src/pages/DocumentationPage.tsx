import { useTranslation } from 'react-i18next';
import { BookOpen } from 'lucide-react';
import { PlaceholderPage } from '../components/PlaceholderPage';

export function DocumentationPage() {
  const { t } = useTranslation();
  return <PlaceholderPage titleKey={t('documentation.title')} icon={BookOpen} />;
}
