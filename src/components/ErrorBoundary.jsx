import { Component } from 'react'

/**
 * ErrorBoundary que captura errores de renderizado en React.
 * Muestra información del error en lugar de una página en blanco.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          margin: '1rem',
          borderRadius: '12px',
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-default, #334155)',
          color: 'var(--text-primary, #f1f5f9)',
          fontFamily: 'monospace',
          fontSize: '14px',
          overflow: 'auto'
        }}>
          <h3 style={{ color: '#ef4444', marginBottom: '1rem' }}>
            Error en esta sección
          </h3>
          <p style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
            {this.state.error?.message || 'Error desconocido'}
          </p>
          {this.state.error?.stack && (
            <pre style={{
              fontSize: '12px',
              padding: '1rem',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '8px',
              overflow: 'auto',
              maxHeight: '300px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {this.state.error.stack}
            </pre>
          )}
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null, errorInfo: null })
              window.location.reload()
            }}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Recargar página
          </button>
        </div>
      )
    }

    return this.props.children
  }
}