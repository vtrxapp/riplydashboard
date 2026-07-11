import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider } from 'react-router-dom';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastViewport } from '@/components/ui/ToastViewport';
import { useUiStore } from '@/stores/uiStore';
import { router } from './router';

function ThemeSync() {
  const theme = useUiStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  return null;
}

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Riply Admin hit a snag">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeSync />
          <RouterProvider router={router} />
          <ToastViewport />
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
