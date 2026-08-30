import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/useAuthStore';

export function LoginPage() {
  const { t } = useTranslation(); const navigate = useNavigate(); const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setError(''); try { await login(email, password); navigate('/'); } catch { setError(t('auth.invalid_credentials')); } finally { setBusy(false); } }
  return <AuthForm title={t('auth.login_title')} submitLabel={t('auth.login')} error={error} busy={busy} onSubmit={submit} fields={<><input required type="email" placeholder={t('auth.email')} value={email} onChange={(event) => setEmail(event.target.value)} /><input required type="password" placeholder={t('auth.password')} value={password} onChange={(event) => setPassword(event.target.value)} /></>} footer={<>{t('auth.no_account')} <Link to="/register">{t('auth.register')}</Link></>} />;
}

export function AuthForm({ title, submitLabel, error, busy, onSubmit, fields, footer }: { title: string; submitLabel: string; error: string; busy: boolean; onSubmit: (event: FormEvent) => void; fields: React.ReactNode; footer: React.ReactNode }) {
  return <section className="max-w-md mx-auto px-4 py-16"><div className="glass-card p-6"><h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>{title}</h1><form className="flex flex-col gap-4" onSubmit={onSubmit}><div className="flex flex-col gap-3">{fields}</div>{error && <p role="alert" className="text-sm text-red-400">{error}</p>}<button className="btn-primary justify-center" disabled={busy}>{busy ? '...' : submitLabel}</button></form><p className="text-sm mt-5" style={{ color: 'var(--color-text-secondary)' }}>{footer}</p></div></section>;
}