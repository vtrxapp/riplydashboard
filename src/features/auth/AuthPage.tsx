import { useState } from 'react';
import { BrandPanel } from './components/BrandPanel';
import { LoginForm } from './components/LoginForm';
import { SignupForm } from './components/SignupForm';

export default function AuthPage() {
  const [mode, setMode] = useState<'signup' | 'login'>('login');
  const isSignup = mode === 'signup';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'var(--font-sans)', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <BrandPanel />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '48px 40px', boxSizing: 'border-box' }}>
        <div style={{ width: '100%', maxWidth: 440, margin: 'auto' }}>
          <div role="tablist" aria-label="Authentication mode" style={{ display: 'flex', gap: 4, background: 'var(--color-surface)', border: '1.5px solid var(--color-border-strong)', borderRadius: 14, padding: 4 }}>
            <button
              role="tab"
              aria-selected={isSignup}
              onClick={() => setMode('signup')}
              className={isSignup ? 'btn btn-primary' : 'btn'}
              style={{ flex: 1, height: 42, fontSize: 13.5, borderRadius: 10, background: isSignup ? undefined : 'none', color: isSignup ? undefined : 'var(--color-text-muted)', boxShadow: isSignup ? undefined : 'none' }}
            >
              Create account
            </button>
            <button
              role="tab"
              aria-selected={!isSignup}
              onClick={() => setMode('login')}
              className={!isSignup ? 'btn btn-primary' : 'btn'}
              style={{ flex: 1, height: 42, fontSize: 13.5, borderRadius: 10, background: !isSignup ? undefined : 'none', color: !isSignup ? undefined : 'var(--color-text-muted)', boxShadow: !isSignup ? undefined : 'none' }}
            >
              Sign in
            </button>
          </div>

          <h1 style={{ fontSize: 27, fontWeight: 800, letterSpacing: -0.6, marginTop: 26 }}>
            {isSignup ? 'Set up your admin workspace' : 'Welcome back'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 6 }}>
            {isSignup ? 'Choose your university and create your administrator login.' : 'Sign in to your university analytics dashboard.'}
          </p>

          {isSignup ? <SignupForm onSwitchToLogin={() => setMode('login')} /> : <LoginForm onSwitchToSignup={() => setMode('signup')} />}
        </div>
      </div>
    </div>
  );
}
