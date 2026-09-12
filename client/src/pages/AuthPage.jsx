import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useRoute } from '../router';

export default function AuthPage() {
  const navigate = useNavigate();
  const { query } = useRoute();
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const loginResult = mode === 'login' ? await login(form) : await register(form);
      const returnTo = query.get('returnTo');
      navigate(returnTo || (mode === 'login' && loginResult?.role === 'ADMIN' ? '/admin/analytics' : '/'));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We could not verify those details.');
    } finally {
      setSubmitting(false);
    }
  };

  let submitLabel = 'Create account';
  if (submitting) submitLabel = 'Working...';
  else if (mode === 'login') submitLabel = 'Sign in';

  return (
    <main className="page-width page-section auth-layout">
      <section className="auth-copy"><p className="eyebrow">Velora account</p><h1>Keep the good<br /><em>things close.</em></h1><p>Sign in to sync your cart, place orders, and keep a clear record of what you chose.</p></section>
      <form className="auth-form" onSubmit={submit}>
        <div className="auth-tabs"><button className={mode === 'login' ? 'active' : ''} type="button" onClick={() => setMode('login')}>Sign in</button><button className={mode === 'register' ? 'active' : ''} type="button" onClick={() => setMode('register')}>Create account</button></div>
        <label>Email<input type="email" value={form.email} required autoComplete="email" onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
        <label>Password<input type="password" value={form.password} required minLength="6" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
        {error && <p className="field-error" role="alert">{error}</p>}
        <button className="button button-dark button-full" type="submit" disabled={submitting}>{submitLabel}</button>
      </form>
    </main>
  );
}
