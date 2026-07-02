import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// ─── Inline SVG icons ────────────────────────────────────────────────────────

const IconUser = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="8" r="3.4" stroke="#9AA3B2" strokeWidth="1.9" />
    <path d="M5 20c0-3.6 3-5.6 7-5.6s7 2 7 5.6" stroke="#9AA3B2" strokeWidth="1.9" strokeLinecap="round" />
  </svg>
);

const IconBuilding = ({ color = '#0098F0' }) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M12 3.5 4 7v1.5h16V7l-8-3.5Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M6 11v6M10 11v6M14 11v6M18 11v6M4 19.5h16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const IconMail = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="3" stroke="#9AA3B2" strokeWidth="1.9" />
    <path d="m4.5 7 7.5 5.5L19.5 7" stroke="#9AA3B2" strokeWidth="1.9" strokeLinejoin="round" />
  </svg>
);

const IconLock = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.5" stroke="#9AA3B2" strokeWidth="1.9" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="#9AA3B2" strokeWidth="1.9" strokeLinecap="round" />
  </svg>
);

const IconChevronDown = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="m6 9 6 6 6-6" stroke="#9AA3B2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconCheck = ({ color = '#fff', size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M5 12.5l4.5 4.5L19 7" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconCheckBlue = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="m5 12.5 4.5 4.5L19 7" stroke="#0098F0" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconEye = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" stroke="#9AA3B2" strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="2.7" stroke="#9AA3B2" strokeWidth="1.8" />
  </svg>
);

const IconEyeOff = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
    <path d="M4 4l16 16" stroke="#9AA3B2" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M9.5 5.8A8.7 8.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.6M6.4 7.6A16 16 0 0 0 2.5 12S6 18.5 12 18.5a8.6 8.6 0 0 0 3.3-.65" stroke="#9AA3B2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconToastCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="#19BFFF" strokeWidth="2" />
    <path d="m8 12 2.5 2.5L16 9" stroke="#19BFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormField({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#5B6473', marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}

function InputRow({ children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 11,
      background: '#fff', border: '1.5px solid #E2E6EC',
      borderRadius: 14, padding: '0 16px', height: 52,
    }}>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text', inputMode }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
      inputMode={inputMode}
      style={{
        flex: 1, border: 'none', background: 'none',
        fontSize: 14.5, fontWeight: 600, color: '#1A2233',
        outline: 'none', fontFamily: 'inherit',
      }}
    />
  );
}

function PasswordInput({ value, onChange, placeholder, showPw, onToggle }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 11,
      background: '#fff', border: '1.5px solid #E2E6EC',
      borderRadius: 14, padding: '0 16px', height: 52,
    }}>
      <IconLock />
      <input
        value={value}
        onChange={onChange}
        type={showPw ? 'text' : 'password'}
        placeholder={placeholder}
        style={{
          flex: 1, border: 'none', background: 'none',
          fontSize: 14.5, fontWeight: 600, color: '#1A2233',
          outline: 'none', fontFamily: 'inherit',
        }}
      />
      <button
        onClick={onToggle}
        style={{ border: 'none', background: 'none', padding: 0, display: 'flex', flexShrink: 0 }}
        type="button"
        aria-label={showPw ? 'Hide password' : 'Show password'}
      >
        {showPw ? <IconEye /> : <IconEyeOff />}
      </button>
    </div>
  );
}

function Checkbox({ checked, onToggle, children }) {
  return (
    <button
      onClick={onToggle}
      type="button"
      style={{
        display: 'flex', alignItems: 'center', gap: 11,
        border: 'none', background: 'none', padding: 0,
        textAlign: 'left', cursor: 'pointer',
      }}
    >
      <div style={{
        width: 22, height: 22, borderRadius: 7, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: checked ? '#0098F0' : '#fff',
        border: `1.5px solid ${checked ? '#0098F0' : '#D4D9E2'}`,
      }}>
        {checked && <IconCheck />}
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 500, color: '#5B6473' }}>{children}</span>
    </button>
  );
}

function UniversityDropdown({ value, open, onToggle, onSelect, universities }) {
  const border = open ? '#0098F0' : '#E2E6EC';
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onToggle}
        type="button"
        style={{
          display: 'flex', alignItems: 'center', gap: 11,
          width: '100%', background: '#fff',
          border: `1.5px solid ${border}`, borderRadius: 14,
          padding: '0 16px', height: 52, cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <IconBuilding />
        <span style={{
          flex: 1, textAlign: 'left', fontSize: 14.5, fontWeight: 600,
          color: value ? '#1A2233' : '#9AA3B2',
        }}>
          {value || 'Select your university'}
        </span>
        <IconChevronDown />
      </button>
      {open && (
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 'calc(100% + 8px)', zIndex: 10,
          background: '#fff', border: '1.5px solid #E8EBF0',
          borderRadius: 14, boxShadow: '0 12px 30px rgba(16,24,40,0.14)',
          overflow: 'hidden', maxHeight: 212, overflowY: 'auto',
        }}>
          {universities.map((u, i) => {
            const active = u === value;
            return (
              <button
                key={u}
                onClick={() => onSelect(u)}
                type="button"
                style={{
                  display: 'flex', alignItems: 'center',
                  width: '100%', border: 'none',
                  background: active ? '#F1F8FF' : '#fff',
                  cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 14, fontWeight: active ? 700 : 600,
                  color: active ? '#0098F0' : '#1A2233',
                  padding: '13px 16px',
                  borderBottom: i < universities.length - 1 ? '1px solid #F1F3F7' : 'none',
                }}
              >
                <span style={{ flex: 1, textAlign: 'left' }}>{u}</span>
                {active && <IconCheckBlue />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RoleDropdown({ value, open, onToggle, onSelect, roles }) {
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onToggle}
        type="button"
        style={{
          display: 'flex', alignItems: 'center',
          width: '100%', background: '#fff',
          border: '1.5px solid #E2E6EC', borderRadius: 14,
          padding: '0 16px', height: 52, cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <span style={{
          flex: 1, textAlign: 'left', fontSize: 14, fontWeight: 600,
          color: value ? '#1A2233' : '#9AA3B2',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {value || 'Select'}
        </span>
        <IconChevronDown />
      </button>
      {open && (
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', left: 0, right: 0, top: 8, zIndex: 10,
            background: '#fff', border: '1.5px solid #E8EBF0',
            borderRadius: 14, boxShadow: '0 12px 30px rgba(16,24,40,0.14)',
            overflow: 'hidden',
          }}>
            {roles.map((r, i) => {
              const active = r === value;
              return (
                <button
                  key={r}
                  onClick={() => onSelect(r)}
                  type="button"
                  style={{
                    display: 'block', width: '100%', border: 'none',
                    background: active ? '#F1F8FF' : '#fff',
                    cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 14, fontWeight: active ? 700 : 600,
                    color: active ? '#0098F0' : '#1A2233',
                    padding: '13px 16px', textAlign: 'left',
                    borderBottom: i < roles.length - 1 ? '1px solid #F1F3F7' : 'none',
                  }}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Toast({ message }) {
  return (
    <div style={{
      position: 'fixed', left: '50%', transform: 'translateX(-50%)',
      bottom: 30, zIndex: 50,
      display: 'flex', alignItems: 'center', gap: 10,
      background: '#0E1726', color: '#fff',
      borderRadius: 14, padding: '13px 18px',
      boxShadow: '0 10px 28px rgba(14,23,38,0.4)',
      whiteSpace: 'nowrap',
      animation: 'toastIn 0.2s ease',
    }}>
      <IconToastCheck />
      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{message}</span>
    </div>
  );
}

// ─── Brand panel ─────────────────────────────────────────────────────────────

function BrandPanel() {
  return (
    <div style={{
      flexShrink: 0, width: '46%', minWidth: 420,
      position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(160deg,#0E84E0 0%,#19BFFF 55%,#2FD2D2 100%)',
      display: 'flex', flexDirection: 'column',
      padding: '48px 56px', boxSizing: 'border-box',
    }}>
      {/* Texture overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'repeating-linear-gradient(135deg,rgba(255,255,255,0.05) 0,rgba(255,255,255,0.05) 2px,transparent 2px,transparent 22px)',
        pointerEvents: 'none',
      }} />
      {/* Decorative circles */}
      <div style={{
        position: 'absolute', width: 360, height: 360, borderRadius: '50%',
        background: 'rgba(255,255,255,0.10)', top: -90, right: -80, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 240, height: 240, borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)', bottom: 40, left: -70, pointerEvents: 'none',
      }} />

      {/* Logo / wordmark */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
        <img
          src="/riply-logo.png"
          alt="Riply"
          style={{ width: 48, height: 48, objectFit: 'contain', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))' }}
        />
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 0.5, color: '#fff', lineHeight: 1 }}>RIPLY</div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>
            ANALYTICS · ADMIN
          </div>
        </div>
      </div>

      {/* Hero copy */}
      <div style={{ position: 'relative', marginTop: 'auto' }}>
        <div style={{
          fontSize: 38, fontWeight: 800, letterSpacing: -1, lineHeight: 1.12,
          color: '#fff', textWrap: 'balance',
        }}>
          The campus engagement command center.
        </div>
        <div style={{
          fontSize: 15, lineHeight: 1.6, color: 'rgba(255,255,255,0.88)',
          marginTop: 18, maxWidth: 420,
        }}>
          Track active students, approve events, monitor groups, and message organizers — all from one dashboard built for university administrators.
        </div>

        <div style={{ display: 'flex', gap: 34, marginTop: 34 }}>
          {[['120+', 'Campus clubs'], ['28K', 'Active students'], ['1.4K', 'Events / yr']].map(([num, label]) => (
            <div key={label}>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: -1 }}>{num}</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.82)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative', marginTop: 34, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
        © 2026 Riply · University engagement platform
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const UNIVERSITIES = [
  'University of Manitoba',
  'University of Winnipeg',
  'Brandon University',
  'Université de Saint-Boniface',
  'Red River College Polytech',
];

const ROLES = ['Club Organizer', 'Department Staff', 'UMSU Administrator'];

export default function AdminAuth() {
  const navigate = useNavigate();

  const [mode, setMode] = useState('signup'); // 'signup' | 'login'
  const [loading, setLoading] = useState(false);

  // Shared fields
  const [university, setUniversity] = useState('');
  const [uniOpen, setUniOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Signup-only fields
  const [name, setName] = useState('');
  const [campus, setCampus] = useState('');
  const [role, setRole] = useState('');
  const [roleOpen, setRoleOpen] = useState(false);
  const [terms, setTerms] = useState(false);

  // Login-only fields
  const [remember, setRemember] = useState(true);

  // Toast
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate('/admin/dashboard', { replace: true });
    });
  }, [navigate]);

  const switchMode = (next) => {
    setMode(next);
    setUniOpen(false);
    setRoleOpen(false);
    setShowPw(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (mode === 'signup') {
      if (!university) { showToast('Please select your university'); return; }
      if (!name.trim()) { showToast('Please enter your full name'); return; }
      if (!terms) { showToast('Please accept the Terms to continue'); return; }

      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, university, campus, role } },
      });
      setLoading(false);

      if (error) { showToast(error.message); return; }

      // The handle_new_user() DB trigger creates the profile row automatically.
      if (data.session) {
        showToast('Account created! Signing you in…');
        navigate('/admin/dashboard');
      } else {
        showToast('Account created! Check your email to confirm before signing in.');
        switchMode('login');
      }
    } else {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);

      if (error) { showToast(error.message); return; }
      navigate('/admin/dashboard');
    }
  };

  const handleForgot = async () => {
    if (!email) { showToast('Enter your email above first'); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) { showToast(error.message); return; }
    showToast('Password reset link sent to your email');
  };

  const handleSSO = () => showToast('University SSO coming soon');

  const isSignup = mode === 'signup';

  const tabOnStyle = {
    flex: 1, height: 42, border: 'none', borderRadius: 10,
    cursor: 'pointer', fontFamily: 'inherit',
    fontSize: 13.5, fontWeight: 700,
    background: 'linear-gradient(135deg,#19BFFF,#0E84E0)',
    color: '#fff', boxShadow: '0 4px 12px rgba(2,162,240,0.28)',
  };
  const tabOffStyle = {
    flex: 1, height: 42, border: 'none', borderRadius: 10,
    cursor: 'pointer', fontFamily: 'inherit',
    fontSize: 13.5, fontWeight: 700, background: 'none', color: '#7B8499',
  };

  return (
    <>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      <div style={{
        minHeight: '100vh', display: 'flex',
        background: '#EEF1F6',
        fontFamily: "'Montserrat', -apple-system, system-ui, sans-serif",
        color: '#0E1726',
      }}>
        <BrandPanel />

        {/* ── Right form panel ── */}
        <div style={{
          flex: 1, minWidth: 0,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          overflowY: 'auto', padding: '48px 40px', boxSizing: 'border-box',
        }}>
          <div style={{ width: '100%', maxWidth: 440, margin: 'auto' }}>

            {/* Segmented mode toggle */}
            <div style={{
              display: 'flex', gap: 4,
              background: '#fff', border: '1.5px solid #E2E6EC',
              borderRadius: 14, padding: 4,
            }}>
              <button style={isSignup ? tabOnStyle : tabOffStyle} onClick={() => switchMode('signup')} type="button">
                Create account
              </button>
              <button style={!isSignup ? tabOnStyle : tabOffStyle} onClick={() => switchMode('login')} type="button">
                Sign in
              </button>
            </div>

            <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: -0.6, marginTop: 26 }}>
              {isSignup ? 'Set up your admin workspace' : 'Welcome back'}
            </div>
            <div style={{ fontSize: 14, color: '#7B8499', marginTop: 6 }}>
              {isSignup
                ? 'Choose your university and create your administrator login.'
                : 'Sign in to your university analytics dashboard.'}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 26 }}>
              {isSignup && (
                <FormField label="Full name">
                  <InputRow>
                    <IconUser />
                    <TextInput
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Jane Doe"
                    />
                  </InputRow>
                </FormField>
              )}

              {isSignup && (
                <FormField label="University">
                  <UniversityDropdown
                    value={university}
                    open={uniOpen}
                    onToggle={() => { setUniOpen(o => !o); setRoleOpen(false); }}
                    onSelect={v => { setUniversity(v); setUniOpen(false); }}
                    universities={UNIVERSITIES}
                  />
                </FormField>
              )}

              {isSignup && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <FormField label="Campus">
                    <InputRow>
                      <TextInput
                        value={campus}
                        onChange={e => setCampus(e.target.value)}
                        placeholder="Fort Garry"
                      />
                    </InputRow>
                  </FormField>
                  <FormField label="Role">
                    <RoleDropdown
                      value={role}
                      open={roleOpen}
                      onToggle={() => { setRoleOpen(o => !o); setUniOpen(false); }}
                      onSelect={v => { setRole(v); setRoleOpen(false); }}
                      roles={ROLES}
                    />
                  </FormField>
                </div>
              )}

              <FormField label="Admin email">
                <InputRow>
                  <IconMail />
                  <TextInput
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@umanitoba.ca"
                    inputMode="email"
                    type="email"
                  />
                </InputRow>
              </FormField>

              {!isSignup && (
                <div>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', marginBottom: 8,
                  }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#5B6473' }}>Password</div>
                    <span
                      onClick={handleForgot}
                      style={{ fontSize: 12.5, fontWeight: 700, color: '#0098F0', cursor: 'pointer' }}
                    >
                      Forgot?
                    </span>
                  </div>
                  <PasswordInput
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    showPw={showPw}
                    onToggle={() => setShowPw(v => !v)}
                  />
                </div>
              )}

              {isSignup && (
                <FormField label="Password">
                  <PasswordInput
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    showPw={showPw}
                    onToggle={() => setShowPw(v => !v)}
                  />
                </FormField>
              )}

              {isSignup && (
                <Checkbox checked={terms} onToggle={() => setTerms(v => !v)}>
                  I agree to the{' '}
                  <span style={{ color: '#0098F0', fontWeight: 700 }}>Terms</span>
                  {' '}and confirm I'm an authorized university administrator.
                </Checkbox>
              )}

              {!isSignup && (
                <Checkbox checked={remember} onToggle={() => setRemember(v => !v)}>
                  Keep me signed in on this device
                </Checkbox>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', height: 54, border: 'none', borderRadius: 15,
                  background: loading ? '#9AA3B2' : 'linear-gradient(135deg,#19BFFF,#0E84E0)',
                  color: '#fff', fontSize: 16, fontWeight: 800,
                  cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  boxShadow: loading ? 'none' : '0 8px 22px rgba(2,162,240,0.4)',
                  marginTop: 2, transition: 'background 0.2s',
                }}
              >
                {loading ? 'Please wait…' : isSignup ? 'Create admin account' : 'Sign in to dashboard'}
              </button>
            </form>

            {/* SSO divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '24px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#E2E6EC' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#9AA3B2' }}>or continue with</span>
              <div style={{ flex: 1, height: 1, background: '#E2E6EC' }} />
            </div>
            <button
              onClick={handleSSO}
              type="button"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 11,
                width: '100%', height: 50, border: '1.5px solid #E2E6EC',
                borderRadius: 14, background: '#fff', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 14, fontWeight: 700, color: '#1A2233',
              }}
            >
              <IconBuilding color="#0E84E0" />
              University SSO
            </button>

            <div style={{ textAlign: 'center', fontSize: 13, color: '#7B8499', marginTop: 24 }}>
              {isSignup ? 'Already have an admin account?' : 'New to Riply Analytics?'}{' '}
              <span
                onClick={() => switchMode(isSignup ? 'login' : 'signup')}
                style={{ color: '#0098F0', fontWeight: 800, cursor: 'pointer' }}
              >
                {isSignup ? 'Sign in' : 'Create account'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast} />}
    </>
  );
}
