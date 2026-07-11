import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { signUp } from '@/services/auth.service';
import { ROLE_OPTIONS, SignupSchema, UNIVERSITIES, fieldErrors } from '../schemas';
import type { UserRole } from '@/types/user';
import { FormField } from './FormField';
import { Dropdown } from './Dropdown';
import { PasswordInput } from './PasswordInput';
import { Icon } from '@/components/ui/Icon';
import { useUiStore } from '@/stores/uiStore';
import { toErrorMessage } from '@/lib/errors';

interface SignupFormState {
  name: string;
  university: string;
  campus: string;
  role: UserRole | '';
  email: string;
  password: string;
  terms: boolean;
}

const INITIAL: SignupFormState = { name: '', university: '', campus: '', role: '', email: '', password: '', terms: false };

export function SignupForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const navigate = useNavigate();
  const showToast = useUiStore((s) => s.showToast);
  const [form, setForm] = useState<SignupFormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const signupMutation = useMutation({
    mutationFn: async () => {
      const parsed = SignupSchema.parse({ ...form, role: form.role || 'organizer' });
      return signUp(parsed);
    },
    onSuccess: (data) => {
      if (data.session) {
        showToast('Account created! Signing you in…');
        navigate('/admin/dashboard');
      } else {
        showToast('Account created! Check your email to confirm before signing in.');
        onSwitchToLogin();
      }
    },
    onError: (err) => showToast(toErrorMessage(err), 'error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = SignupSchema.safeParse({ ...form, role: form.role || 'organizer' });
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      return;
    }
    setErrors({});
    signupMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 26 }} noValidate>
      <FormField label="Full name" error={errors.name}>
        <div className="input-row">
          <Icon name="user" size={19} color="var(--color-text-faint)" />
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Jane Doe" autoComplete="name" />
        </div>
      </FormField>

      <FormField label="University" error={errors.university}>
        <Dropdown
          value={form.university}
          onChange={(v) => setForm((f) => ({ ...f, university: v }))}
          options={[...UNIVERSITIES]}
          placeholder="Select your university"
          icon="building"
        />
      </FormField>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <FormField label="Campus">
          <div className="input-row">
            <input value={form.campus} onChange={(e) => setForm((f) => ({ ...f, campus: e.target.value }))} placeholder="Fort Garry" />
          </div>
        </FormField>
        <FormField label="Role" error={errors.role}>
          <Dropdown
            value={ROLE_OPTIONS.find((r) => r.value === form.role)?.label ?? ''}
            onChange={(label) => {
              const opt = ROLE_OPTIONS.find((r) => r.label === label);
              setForm((f) => ({ ...f, role: opt?.value ?? 'organizer' }));
            }}
            options={ROLE_OPTIONS.map((r) => r.label)}
            placeholder="Select"
          />
        </FormField>
      </div>

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

      <FormField label="Password" error={errors.password}>
        <PasswordInput value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} placeholder="Create a strong password" autoComplete="new-password" />
      </FormField>

      <button
        type="button"
        onClick={() => setForm((f) => ({ ...f, terms: !f.terms }))}
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
            background: form.terms ? 'var(--color-brand-500)' : 'var(--color-surface)',
            border: `1.5px solid ${form.terms ? 'var(--color-brand-500)' : 'var(--color-border-strong)'}`,
          }}
        >
          {form.terms && <Icon name="check" size={13} color="#fff" />}
        </span>
        <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          I agree to the <span style={{ color: 'var(--color-brand-500)', fontWeight: 700 }}>Terms</span> and confirm I'm an
          authorized university administrator.
        </span>
      </button>
      {errors.terms && <div role="alert" style={{ fontSize: 12.5, color: 'var(--color-red)', fontWeight: 600, marginTop: -10 }}>{errors.terms}</div>}

      <button type="submit" disabled={signupMutation.isPending} className="btn btn-primary" style={{ width: '100%', height: 54, fontSize: 16, borderRadius: 15 }}>
        {signupMutation.isPending ? 'Please wait…' : 'Create admin account'}
      </button>

      <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
        Already have an admin account?{' '}
        <button type="button" onClick={onSwitchToLogin} style={{ color: 'var(--color-brand-500)', fontWeight: 800, cursor: 'pointer', border: 'none', background: 'none' }}>
          Sign in
        </button>
      </div>
    </form>
  );
}
