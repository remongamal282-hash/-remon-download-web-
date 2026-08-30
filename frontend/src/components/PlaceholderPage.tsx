import type { LucideIcon } from 'lucide-react';

interface PlaceholderPageProps {
  titleKey: string;
  icon: LucideIcon;
  description?: string;
}

export function PlaceholderPage({ titleKey, icon: Icon, description }: PlaceholderPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{
            background: 'var(--color-brand-green-muted)',
            border: '1px solid var(--color-brand-green-border)',
          }}
        >
          <Icon size={36} style={{ color: 'var(--color-brand-green)' }} />
        </div>
        <h1
          className="text-3xl font-bold mb-3"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {titleKey}
        </h1>
        {description && (
          <p className="text-base max-w-md mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
            {description}
          </p>
        )}
        <div
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full text-xs font-medium"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
          }}
        >
          Coming in a future phase
        </div>
      </div>
    </div>
  );
}
