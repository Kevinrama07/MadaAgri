import { Component } from 'react';
import styles from './RouteErrorBoundary.module.css';

class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Route loading error:', error);
    console.error('Error info:', errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorBox}>
            <h1>❌ Erreur de chargement de page</h1>
            <p className={styles.errorMessage}>
              {this.state.error?.message || 'Une erreur est survenue lors du chargement de la page'}
            </p>
            {import.meta.env.MODE === 'development' && (
              <details className={styles.errorDetails}>
                <summary>Détails techniques (développement)</summary>
                <pre>{this.state.error?.toString()}</pre>
                {this.state.errorInfo && (
                  <pre>{this.state.errorInfo.componentStack}</pre>
                )}
              </details>
            )}
            <button onClick={() => window.location.reload()} className={styles.reloadBtn}>
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;
