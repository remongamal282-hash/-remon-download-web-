import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthForm } from './LoginPage';
import { useAuthStore } from '../stores/useAuthStore';

export function RegisterPage() {
  const { t } = useTranslation(); const navigate = useNavigate(); const register = useAuthStore((state) => state.register);
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); if (password !== confirmation) { setError(t('auth.password_mismatch')); return; } setBusy(true); setError(''); try { await register(email, password, confirmation); navigate('/'); } catch { setError(t('auth.registration_failed')); } finally { setBusy(false); } }
  return <AuthForm title={t('auth.register_title')} submitLabel={t('auth.register')} error={error} busy={busy} onSubmit={submit} fields={<><input required type="email" placeholder={t('auth.email')} value={email} onChange={(event) => setEmail(event.target.value)} /><input required minLength={8} type="password" placeholder={t('auth.password')} value={password} onChange={(event) => setPassword(event.target.value)} /><input required minLength={8} type="password" placeholder={t('auth.confirm_password')} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></>} footer={<>{t('auth.have_account')} <Link to="/login">{t('auth.login')}</Link></>} />;
}