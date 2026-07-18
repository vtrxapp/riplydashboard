import { useState, useEffect } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { supabase } from './supabase';
import { isDeviceTrusted } from './deviceTrust';

const LOADING_STYLE = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  height: '100vh', fontFamily: 'Montserrat', color: '#7B8499',
};

// Temporary escape hatch so the dashboard UI can be reviewed while
// Resend's sandbox sender restriction blocks the device-verification
// email. Set VITE_BYPASS_AUTH=true in Vercel to enable, then unset it —
// never leave this on by default. Read once at module load: it's a
// build-time env var, not something that changes at runtime.
const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true';

export function PrivateRoute({ children }) {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const [access, setAccess] = useState(undefined); // undefined = checking, else boolean

  useEffect(() => {
    if (BYPASS_AUTH) return;
    if (!isLoaded) return;
    if (!isSignedIn) { setAccess(false); return; }

    let cancelled = false;
    setAccess(undefined);
    (async () => {
      try {
        const { data, error } = await supabase.rpc('is_admin');
        if (cancelled) return;
        if (error || data !== true) { setAccess(false); return; }
        const trusted = await isDeviceTrusted();
        if (cancelled) return;
        setAccess(trusted);
      } catch {
        // Fail closed rather than leaving the route stuck on "Loading…"
        // forever if either check rejects (e.g. a network error).
        if (!cancelled) setAccess(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn]);

  if (BYPASS_AUTH) return children;

  if (!isLoaded || access === undefined) {
    return <div style={LOADING_STYLE}>Loading…</div>;
  }

  // Not signed in, not an admin, or this browser hasn't completed the
  // device-verification code yet — send back to /admin/auth, which handles
  // showing whichever step is needed.
  if (!access) return <Navigate to="/admin/auth" replace />;

  return children;
}
