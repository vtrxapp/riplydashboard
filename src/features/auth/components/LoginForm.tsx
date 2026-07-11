import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { signIn, sendPasswordReset } from '@/services/auth.service';
import { LoginSchema, UNIVERSITIES, fieldErrors, type LoginInput } from '../schemas';
import { FormField } from './FormField';
import { Dropdown } from './Dropdown';
import { PasswordInput } from './PasswordInput';
import { Icon } from '@/components/ui/Icon';
import { useUiStore } from '@/stores/uiStore';
import { toErrorMessage } from '@/lib/errors';

export function LoginForm({ onSwitchToSignup }: { onSwitchToSignup: () => void }) {
  const navigate = useNavigate();
  const showToast = useUiStore((s) => s.showToast);
  const [form, setForm] = useState<LoginInput>({ university: '', email: '', password: '' });
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loginMutation = useMutation({
    mutationFn: () => signIn(form.email, form.password),
    onSuccess: () => navigate('/admin/dashboard'),
    onError: (err) => showToast(toErrorMessage(err), 'error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = LoginSchema.safeParse(form);
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      return;
    }
    setErrors({});
    loginMutation.mutate();
  };

  const handleForgot = async () => {
    if (!form.email) {
      showToast('Enter your email above first', 'error');
      return;
    }
    try {
      await sendPasswordReset(form.email);
      showToast('Password reset link sent to your email');
    } catch (err) {
      showToast(toErrorMessage(err), 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 26 }} noValidate>
      <FormField label="University" error={errors.university}>
        <Dropdown
          value={form.university}
          onChange={(v) => setForm((f) => ({ ...f, university: v }))}
          options={[...UNIVERSITIES]}
          placeholder="Select your university"
          icon="building"
        />
      </FormField>

      <FormField label="Admin email" error={errors.email}>
        <div className="input-row">
          <Icon name="mail" size={19} color="var(--color-text-faint)" />
          <input
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="admin@umanitoba.ca"
            type="email"
            autoComplete="email"
          />
        </div>
      </FormField>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label htmlFor="login-password" className="field-label" style={{ marginBottom: 0 }}>
            Password
          </label>
          <button type="button" onClick={handleForgot} style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-brand-500)', border: 'none', background: 'none', cursor: 'pointer' }}>
            Forgot?
          </button>
        </div>
        <PasswordInput
          id="login-password"
          value={form.password}
          onChange={(v) => setForm((f) => ({ ...f, password: v }))}
          placeholder="Enter your password"
          autoComplete="current-password"
        />
        {errors.password && <div role="alert" style={{ fontSize: 12.5, color: 'var(--color-red)', marginTop: 6, fontWeight: 600 }}>{errors.password}</div>}
      </div>

      <button
        type="button"
        onClick={() => setRemember((r) => !r)}
        style={{ display: 'flex', alignItems: 'center', gap: 11, border: 'none', background: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 22,
            height: 22,
            borderRadius: 7,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: remember ? 'var(--color-brand-500)' : 'var(--color-surface)',
            border: `1.5px solid ${remember ? 'var(--color-brand-500)' : 'var(--color-border-strong)'}`,
          }}
        >
          {remember && <Icon name="check" size={13} color="#fff" />}
        </span>
        <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--color-text-secondary)' }}>Keep me signed in on this device</span>
      </button>

      <button type="submit" disabled={loginMutation.isPending} className="btn btn-primary" style={{ width: '100%', height: 54, fontSize: 16, borderRadius: 15 }}>
        {loginMutation.isPending ? 'Please wait…' : 'Sign in to dashboard'}
      </button>

      <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
        New to Riply Analytics?{' '}
        <button type="button" onClick={onSwitchToSignup} style={{ color: 'var(--color-brand-500)', fontWeight: 800, cursor: 'pointer', border: 'none', background: 'none' }}>
          Create account
        </button>
      </div>
    </form>
  );
}
