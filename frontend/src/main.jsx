import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { AuthProvider } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { AccessibilityProvider } from './context/AccessibilityContext.jsx'

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Portal Global Crash caught:', error, errorInfo);
    this.setState({ errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F8FAFC',
          color: '#0F172A',
          padding: 24,
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: 600,
            width: '100%',
            background: '#FFFFFF',
            border: '2px solid #EF4444',
            borderRadius: 12,
            padding: 24,
            boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#DC2626', marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>⚠️</span>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Portal Component Error</h2>
            </div>
            <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px 0' }}>
              The portal encountered an issue while rendering. Please click Reload below to recover.
            </p>
            <pre style={{
              background: '#F1F5F9',
              padding: 12,
              borderRadius: 8,
              fontSize: 11,
              fontFamily: 'monospace',
              color: '#991B1B',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap'
            }}>
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 16,
                background: '#0B296B',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 6,
                padding: '8px 18px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Reload Portal
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <LanguageProvider>
        <AccessibilityProvider>
          <AuthProvider>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </AuthProvider>
        </AccessibilityProvider>
      </LanguageProvider>
    </GlobalErrorBoundary>
  </React.StrictMode>,
)
