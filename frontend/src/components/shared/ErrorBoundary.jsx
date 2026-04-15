import { Component } from 'react';

/**
 * React Error Boundary — catches render errors in child component trees.
 *
 * Without this, a single component throwing during render crashes the
 * entire SPA with a blank white screen. This shows a recoverable UI instead.
 *
 * Usage:
 *   <ErrorBoundary label="Editor">
 *     <SomeComplexComponent />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console so developers can see it — in production this would
    // go to an error tracking service (e.g. Sentry)
    console.error(`[ErrorBoundary: ${this.props.label || 'unknown'}]`, error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { label = 'This section', minimal } = this.props;

    if (minimal) {
      return (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 8,
          color: '#f87171',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span>⚠</span>
          <span>{label} failed to load.</span>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 4,
              color: '#f87171',
              cursor: 'pointer',
              padding: '2px 8px',
              fontSize: 11,
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return (
      <div style={{
        minHeight: '40vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        color: 'var(--text2)',
        padding: 40,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 36 }}>⚠️</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
          {label} crashed
        </div>
        <div style={{ fontSize: 13, maxWidth: 420, color: 'var(--text3)' }}>
          Something went wrong in this section. Your other work is not affected.
        </div>
        {process.env.NODE_ENV === 'development' && this.state.error && (
          <pre style={{
            fontSize: 11,
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '10px 14px',
            maxWidth: 600,
            textAlign: 'left',
            overflow: 'auto',
            color: '#f87171',
            marginTop: 8,
          }}>
            {this.state.error.message}
          </pre>
        )}
        <button
          onClick={() => this.setState({ hasError: false, error: null })}
          style={{
            marginTop: 8,
            padding: '8px 20px',
            background: 'var(--accent3)',
            border: 'none',
            borderRadius: 6,
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'var(--font-ui)',
          }}
        >
          Try again
        </button>
      </div>
    );
  }
}
