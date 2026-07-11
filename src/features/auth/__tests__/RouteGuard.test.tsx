import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const mockUseAuth = vi.fn();

vi.mock('../AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

import { RouteGuard, RedirectIfAuthed, OnboardingGuard } from '../RouteGuard';

function renderWithRoute(node: React.ReactNode, initialPath = '/admin/dashboard/overview') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/admin/dashboard/overview" element={node} />
        <Route path="/admin/onboarding" element={node} />
        <Route path="/admin/auth" element={<div>Auth screen</div>} />
        <Route path="/admin/dashboard" element={<div>Dashboard screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RouteGuard', () => {
  it('shows a loading state while the Clerk session is being resolved', () => {
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

  it('renders children for authenticated, fully-onboarded users', () => {
    mockUseAuth.mockReturnValue({ status: 'authenticated', needsOnboarding: false });
    renderWithRoute(
      <RouteGuard>
        <div>Protected content</div>
      </RouteGuard>,
    );
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('redirects signed-in users with no profile row yet to onboarding', () => {
    mockUseAuth.mockReturnValue({ status: 'authenticated', needsOnboarding: true });
    renderWithRoute(
      <RouteGuard>
        <div>Protected content</div>
      </RouteGuard>,
    );
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });
});

describe('RedirectIfAuthed', () => {
  it('redirects already-onboarded, authenticated users to the dashboard', () => {
    mockUseAuth.mockReturnValue({ status: 'authenticated', needsOnboarding: false });
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

describe('OnboardingGuard', () => {
  it('redirects unauthenticated visitors to the auth screen', () => {
    mockUseAuth.mockReturnValue({ status: 'unauthenticated' });
    renderWithRoute(
      <OnboardingGuard>
        <div>Onboarding form</div>
      </OnboardingGuard>,
      '/admin/onboarding',
    );
    expect(screen.getByText('Auth screen')).toBeInTheDocument();
  });

  it('renders the onboarding form for signed-in users with no profile yet', () => {
    mockUseAuth.mockReturnValue({ status: 'authenticated', needsOnboarding: true });
    renderWithRoute(
      <OnboardingGuard>
        <div>Onboarding form</div>
      </OnboardingGuard>,
      '/admin/onboarding',
    );
    expect(screen.getByText('Onboarding form')).toBeInTheDocument();
  });

  it('redirects already-onboarded users straight to the dashboard', () => {
    mockUseAuth.mockReturnValue({ status: 'authenticated', needsOnboarding: false });
    renderWithRoute(
      <OnboardingGuard>
        <div>Onboarding form</div>
      </OnboardingGuard>,
      '/admin/onboarding',
    );
    expect(screen.queryByText('Onboarding form')).not.toBeInTheDocument();
  });
});
