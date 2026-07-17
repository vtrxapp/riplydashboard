import { useState, useEffect } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { supabase } from './supabase';
import { isDeviceTrusted } from './deviceTrust';

const LOADING_STYLE = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  height: '100vh', fontFamily: 'Montserrat', color: '#7B8499',
};

export function PrivateRoute({ children }) {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const [access, setAccess] = useState(undefined); // undefined = checking, else boolean

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { setAccess(false); return; }

    let cancelled = false;
    setAccess(undefined);
    (async () => {
      const { data, error } = await supabase.rpc('is_admin');
      if (cancelled) return;
      if (error || data !== true) { setAccess(false); return; }
      const trusted = await isDeviceTrusted();
      if (cancelled) return;
      setAccess(trusted);
    })();
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || access === undefined) {
    return <div style={LOADING_STYLE}>Loading…</div>;
  }

  // Not signed in, not an admin, or this browser hasn't completed the
  // device-verification code yet — send back to /admin/auth, which handles
  // showing whichever step is needed.
  if (!access) return <Navigate to="/admin/auth" replace />;

  return children;
}
