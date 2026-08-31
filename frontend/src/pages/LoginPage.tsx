import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/useAuthStore';
import { Seo } from '../components/Seo';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError(t('auth.invalid_credentials'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Seo title={t('auth.login_title')} description={t('auth.invalid_credentials')} path="/login" noindex />
      <AuthForm
        title={t('auth.login_title')}
        submitLabel={t('auth.login')}
        error={error}
        busy={busy}
        onSubmit={submit}
        fields={
          <>
            <div className="flex flex-col gap-2">
              <label htmlFor="login-email" className="text-sm font-medium text-slate-700">{t('auth.email')}</label>
              <input id="login-email" required type="email" placeholder={t('auth.email')} value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200" />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="login-password" className="text-sm font-medium text-slate-700">{t('auth.password')}</label>
              <input id="login-password" required type="password" placeholder={t('auth.password')} value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-200" />
            </div>
          </>
        }
        footer={<>{t('auth.no_account')} <Link to="/register">{t('auth.register')}</Link></>}
      />
    </>
  );
}

export function AuthForm({ title, submitLabel, error, busy, onSubmit, fields, footer }: { title: string; submitLabel: string; error: string; busy: boolean; onSubmit: (event: FormEvent) => void; fields: React.ReactNode; footer: React.ReactNode }) {
  return <section className="max-w-md mx-auto px-4 py-16"><div className="glass-card p-6"><h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>{title}</h1><form className="flex flex-col gap-4" onSubmit={onSubmit}><div className="flex flex-col gap-3">{fields}</div>{error && <p role="alert" className="text-sm text-red-400">{error}</p>}<button className="btn-primary justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" disabled={busy}>{busy ? '...' : submitLabel}</button></form><p className="text-sm mt-5" style={{ color: 'var(--color-text-secondary)' }}>{footer}</p></div></section>;
}