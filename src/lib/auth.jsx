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
  const { isLoaded, isSignedIn, userId } = useClerkAuth();
  const [isAdmin, setIsAdmin] = useState(undefined); // undefined = checking

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { setIsAdmin(false); return; }

    let cancelled = false;
    setIsAdmin(undefined);
    supabase.rpc('is_admin').then(({ data, error }) => {
      if (cancelled) return;
      setIsAdmin(!error && data === true);
    });
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || isAdmin === undefined) {
    return <div style={LOADING_STYLE}>Loading…</div>;
  }

  if (!isAdmin) return <Navigate to="/admin/auth" replace />;

  // Admin, but this browser hasn't completed the email-code device check yet —
  // send them back to /admin/auth, which handles showing that step.
  if (!isDeviceTrusted(userId)) return <Navigate to="/admin/auth" replace />;

  return children;
}
