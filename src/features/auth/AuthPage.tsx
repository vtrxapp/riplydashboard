import { useState } from 'react';
import { SignIn, SignUp } from '@clerk/react';
import { BrandPanel } from './components/BrandPanel';

/** Matches Clerk's embedded form chrome to the rest of the app (see src/styles/tokens.css). */
const clerkAppearance = {
  variables: {
    colorPrimary: '#0098F0',
    colorBackground: 'var(--color-surface)',
    colorInputBackground: 'var(--color-surface)',
    colorInputForeground: 'var(--color-text)',
    colorForeground: 'var(--color-text)',
    colorMutedForeground: 'var(--color-text-muted)',
    colorBorder: 'var(--color-border-strong)',
    colorDanger: 'var(--color-red)',
    fontFamily: 'Montserrat, -apple-system, system-ui, sans-serif',
    borderRadius: '13px',
  },
  elements: {
    rootBox: { width: '100%' },
    cardBox: { width: '100%', boxShadow: 'none', border: 'none' },
    card: { padding: 0, boxShadow: 'none', border: 'none', background: 'transparent' },
    header: { display: 'none' },
    footer: { display: 'none' },
    formButtonPrimary: {
      height: 54,
      fontSize: 16,
      fontWeight: 800,
      borderRadius: 15,
      backgroundImage: 'linear-gradient(135deg,#19BFFF,#0E84E0)',
      boxShadow: '0 8px 22px rgba(2,162,240,0.4)',
    },
  },
};

export default function AuthPage() {
  const [mode, setMode] = useState<'signup' | 'login'>('login');
  const isSignup = mode === 'signup';

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
          <div
            role="tablist"
            aria-label="Authentication mode"
            style={{
              display: 'flex',
              gap: 4,
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border-strong)',
              borderRadius: 14,
              padding: 4,
            }}
          >
            <button
              role="tab"
              aria-selected={isSignup}
              onClick={() => setMode('signup')}
              className={isSignup ? 'btn btn-primary' : 'btn'}
              style={{
                flex: 1,
                height: 42,
                fontSize: 13.5,
                borderRadius: 10,
                background: isSignup ? undefined : 'none',
                color: isSignup ? undefined : 'var(--color-text-muted)',
                boxShadow: isSignup ? undefined : 'none',
              }}
            >
              Create account
            </button>
            <button
              role="tab"
              aria-selected={!isSignup}
              onClick={() => setMode('login')}
              className={!isSignup ? 'btn btn-primary' : 'btn'}
              style={{
                flex: 1,
                height: 42,
                fontSize: 13.5,
                borderRadius: 10,
                background: !isSignup ? undefined : 'none',
                color: !isSignup ? undefined : 'var(--color-text-muted)',
                boxShadow: !isSignup ? undefined : 'none',
              }}
            >
              Sign in
            </button>
          </div>

          <h1 style={{ fontSize: 27, fontWeight: 800, letterSpacing: -0.6, marginTop: 26 }}>
            {isSignup ? 'Create your admin account' : 'Welcome back'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 6 }}>
            {isSignup
              ? "You'll choose your university and role on the next step."
              : 'Sign in to your university analytics dashboard.'}
          </p>

          <div style={{ marginTop: 26 }}>
            {isSignup ? (
              <SignUp routing="hash" forceRedirectUrl="/admin/onboarding" appearance={clerkAppearance} />
            ) : (
              <SignIn routing="hash" forceRedirectUrl="/admin/dashboard" appearance={clerkAppearance} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
