/**
 * components/ErrorBoundary.jsx
 *
 * Class-based React Error Boundary — catches unhandled render errors
 * anywhere in the component tree below it and shows a friendly fallback
 * instead of a blank white screen.
 *
 * Usage (in main.jsx):
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */

import { Component } from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log for debugging (could send to Sentry / LogRocket here)
    console.error('❌ [ErrorBoundary] Caught an error:', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight:      '100vh',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          background:     'var(--color-bg, #0f1117)',
          padding:        '24px',
        }}
      >
        <div
          style={{
            maxWidth:     '420px',
            width:        '100%',
            background:   'var(--color-surface, #1a1d27)',
            border:       '1px solid var(--color-border, rgba(255,255,255,0.08))',
            borderRadius: '20px',
            padding:      '40px 32px',
            textAlign:    'center',
            boxShadow:    '0 25px 60px rgba(0,0,0,0.4)',
          }}
        >
          {/* Icon */}
          <div
            style={{
              width:        '64px',
              height:       '64px',
              borderRadius: '50%',
              background:   'rgba(239,68,68,0.12)',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              margin:       '0 auto 20px',
            }}
          >
            <FiAlertTriangle size={28} style={{ color: '#ef4444' }} />
          </div>

          {/* Heading */}
          <h1
            style={{
              fontSize:    '20px',
              fontWeight:  700,
              color:       'var(--color-text, #f1f5f9)',
              marginBottom: '8px',
            }}
          >
            Something went wrong
          </h1>

          {/* Subtext */}
          <p
            style={{
              fontSize:     '14px',
              color:        'var(--color-text-muted, #94a3b8)',
              marginBottom: '28px',
              lineHeight:   1.6,
            }}
          >
            An unexpected error occurred. Our team has been notified. You can
            try refreshing the page or returning to the previous screen.
          </p>

          {/* Error detail (collapsed — useful in dev) */}
          {import.meta.env.DEV && this.state.error && (
            <details
              style={{
                textAlign:    'left',
                marginBottom: '24px',
                fontSize:     '12px',
                background:   'rgba(239,68,68,0.06)',
                border:       '1px solid rgba(239,68,68,0.2)',
                borderRadius: '8px',
                padding:      '12px',
              }}
            >
              <summary
                style={{
                  cursor: 'pointer',
                  color:  '#ef4444',
                  fontWeight: 600,
                  marginBottom: '6px',
                }}
              >
                Error details (dev only)
              </summary>
              <pre
                style={{
                  whiteSpace:   'pre-wrap',
                  wordBreak:    'break-word',
                  color:        'var(--color-text-muted, #94a3b8)',
                  marginTop:    '8px',
                }}
              >
                {this.state.error.toString()}
              </pre>
            </details>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding:      '10px 20px',
                borderRadius: '12px',
                fontSize:     '14px',
                fontWeight:   600,
                cursor:       'pointer',
                background:   'transparent',
                border:       '1px solid var(--color-border, rgba(255,255,255,0.12))',
                color:        'var(--color-text-muted, #94a3b8)',
                transition:   'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Try Again
            </button>
            <button
              onClick={this.handleReload}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '8px',
                padding:      '10px 20px',
                borderRadius: '12px',
                fontSize:     '14px',
                fontWeight:   600,
                cursor:       'pointer',
                background:   'var(--color-primary, #7c3aed)',
                border:       'none',
                color:        '#fff',
                transition:   'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              <FiRefreshCw size={14} />
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
