import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react';
import { PlaceholderPage } from '../components/PlaceholderPage';

export function SchedulerPage() {
  const { t } = useTranslation();
  return <PlaceholderPage titleKey={t('scheduler.title')} icon={Calendar} description={t('scheduler.empty')} />;
}
