import { Component, type ErrorInfo, type ReactNode } from 'react';
import { emitTelemetry } from '../observability/auraTelemetry';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class AuraErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    emitTelemetry({
      category: 'app',
      event: 'react_error_boundary',
      message: error.message,
      componentStack: info.componentStack?.slice(0, 500),
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
          <h1 style={{ marginTop: 0 }}>Something went wrong</h1>
          <p style={{ color: 'var(--aura-muted)' }}>
            The app hit an unexpected error. Try reloading the page — your local journey data stays on this device.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16,
              width: '100%',
              padding: '14px 16px',
              borderRadius: 14,
              border: 'none',
              background: 'linear-gradient(135deg, #c9b8ff, #f4b8c5)',
              color: '#1c1530',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Reload the page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
