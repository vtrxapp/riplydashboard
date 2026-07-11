import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render-time errors in its subtree so one broken feature (e.g. a
 * chart choking on unexpected data) can't take down the entire dashboard.
 * Used both at the app root and around each routed feature page.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '60px 24px',
            textAlign: 'center',
            minHeight: 240,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 800 }}>{this.props.fallbackTitle ?? 'Something went wrong'}</div>
          <div style={{ fontSize: 14, color: 'var(--color-text-muted)', maxWidth: 420 }}>
            {this.state.error.message || 'An unexpected error occurred while rendering this section.'}
          </div>
          <Button variant="primary" onClick={this.handleReset}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
