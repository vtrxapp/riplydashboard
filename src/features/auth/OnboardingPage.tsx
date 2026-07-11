import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/react';
import { BrandPanel } from './components/BrandPanel';
import { FormField } from './components/FormField';
import { Dropdown } from './components/Dropdown';
import { Icon } from '@/components/ui/Icon';
import { OnboardingSchema, ROLE_OPTIONS, UNIVERSITIES, fieldErrors } from './schemas';
import type { UserRole } from '@/types/user';
import { useCreateProfile } from '@/hooks/queries/useAuthProfile';

interface FormState {
  name: string;
  university: string;
  campus: string;
  role: UserRole | '';
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const createProfile = useCreateProfile();

  const [form, setForm] = useState<FormState>({
    name: user?.fullName || '',
    university: '',
    campus: '',
    role: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = OnboardingSchema.safeParse({ ...form, role: form.role || 'organizer' });
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      return;
    }
    if (!user?.id) return;
    setErrors({});
    createProfile.mutate(
      {
        id: user.id,
        name: result.data.name,
        email: user.primaryEmailAddress?.emailAddress ?? null,
        university: result.data.university,
        campus: result.data.campus ?? '',
        role: result.data.role,
      },
      { onSuccess: () => navigate('/admin/dashboard', { replace: true }) },
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        fontFamily: 'var(--font-sans)',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
      }}
    >
      <BrandPanel />

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          overflowY: 'auto',
          padding: '48px 40px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ width: '100%', maxWidth: 440, margin: 'auto' }}>
          <h1 style={{ fontSize: 27, fontWeight: 800, letterSpacing: -0.6 }}>Set up your admin workspace</h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 6 }}>
            You're signed in — just a couple more details before you reach the dashboard.
          </p>

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

            <button
              type="submit"
              disabled={createProfile.isPending}
              className="btn btn-primary"
              style={{ width: '100%', height: 54, fontSize: 16, borderRadius: 15 }}
            >
              {createProfile.isPending ? 'Setting up…' : 'Enter dashboard'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
