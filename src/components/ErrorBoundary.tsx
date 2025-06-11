'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; name?: string },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; name?: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`🚨 Error en ${this.props.name || 'Component'}:`, error);
    console.error('📍 Error Stack:', error.stack);
    console.error('📱 Component Stack:', errorInfo.componentStack);
    console.error('📝 Error Info:', errorInfo);
    
    // Enviar error a servicio externo (opcional)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('last_error', JSON.stringify({
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        component: this.props.name
      }));
    }
    
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#fee', 
          border: '2px solid #f00',
          borderRadius: '8px',
          margin: '10px',
          fontFamily: 'monospace'
        }}>
          <h2 style={{ color: '#d00' }}>🚨 Error en {this.props.name}</h2>
          <details style={{ marginTop: '10px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              📝 Mensaje: {this.state.error?.message}
            </summary>
            <pre style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto',
              marginTop: '10px'
            }}>
              {this.state.error?.stack}
            </pre>
          </details>
          
          <details style={{ marginTop: '10px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              📱 Component Stack
            </summary>
            <pre style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto',
              marginTop: '10px'
            }}>
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
          
          <button 
            onClick={() => this.setState({ hasError: false })}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
