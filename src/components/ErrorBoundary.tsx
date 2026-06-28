import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            background: '#030405',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '420px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: '28px',
              }}
            >
              ⚠️
            </div>
            <h1
              style={{
                color: '#F5F0E6',
                fontSize: '22px',
                fontWeight: 700,
                marginBottom: '8px',
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                color: '#7D8291',
                fontSize: '14px',
                lineHeight: 1.6,
                marginBottom: '28px',
              }}
            >
              An unexpected error occurred. Please reload the page or go back to
              the homepage.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 28px',
                  borderRadius: '12px',
                  background: '#B88717',
                  color: '#030405',
                  fontWeight: 600,
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Reload Page
              </button>
              <a
                href="/"
                style={{
                  padding: '12px 28px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#F5F0E6',
                  fontWeight: 600,
                  fontSize: '14px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
