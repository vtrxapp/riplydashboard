import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const mockUseAuth = vi.fn();

vi.mock('../AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

import { RouteGuard, RedirectIfAuthed } from '../RouteGuard';

function renderWithRoute(node: React.ReactNode, initialPath = '/admin/dashboard/overview') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/admin/dashboard/overview" element={node} />
        <Route path="/admin/auth" element={<div>Auth screen</div>} />
        <Route path="/admin/dashboard" element={<div>Dashboard screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RouteGuard', () => {
  it('shows a loading state while the session is being resolved', () => {
    mockUseAuth.mockReturnValue({ status: 'loading' });
    renderWithRoute(
      <RouteGuard>
        <div>Protected content</div>
      </RouteGuard>,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to the auth screen', () => {
    mockUseAuth.mockReturnValue({ status: 'unauthenticated' });
    renderWithRoute(
      <RouteGuard>
        <div>Protected content</div>
      </RouteGuard>,
    );
    expect(screen.getByText('Auth screen')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders children for authenticated users', () => {
    mockUseAuth.mockReturnValue({ status: 'authenticated' });
    renderWithRoute(
      <RouteGuard>
        <div>Protected content</div>
      </RouteGuard>,
    );
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});

describe('RedirectIfAuthed', () => {
  it('redirects already-authenticated users to the dashboard', () => {
    mockUseAuth.mockReturnValue({ status: 'authenticated' });
    renderWithRoute(
      <RedirectIfAuthed>
        <div>Auth form</div>
      </RedirectIfAuthed>,
      '/admin/dashboard/overview',
    );
    expect(screen.queryByText('Auth form')).not.toBeInTheDocument();
  });

  it('renders children for unauthenticated visitors', () => {
    mockUseAuth.mockReturnValue({ status: 'unauthenticated' });
    renderWithRoute(
      <RedirectIfAuthed>
        <div>Auth form</div>
      </RedirectIfAuthed>,
    );
    expect(screen.getByText('Auth form')).toBeInTheDocument();
  });
});
