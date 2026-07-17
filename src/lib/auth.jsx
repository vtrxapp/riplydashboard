import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

export function PrivateRoute({ children }) {
  const { isLoaded, isSignedIn } = useClerkAuth();

  if (!isLoaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Montserrat', color: '#7B8499' }}>
        Loading…
      </div>
    );
  }

  return isSignedIn ? children : <Navigate to="/admin/auth" replace />;
}
