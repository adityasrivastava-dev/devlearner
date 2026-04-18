import { Component } from 'react';
import styles from './ErrorBoundary.module.css';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error(`[ErrorBoundary: ${this.props.label || 'unknown'}]`, error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { label = 'This section', minimal } = this.props;
    const retry = () => this.setState({ hasError: false, error: null });

    if (minimal) {
      return (
        <div className={styles.banner}>
          <span aria-hidden="true">⚠</span>
          <span>{label} failed to load.</span>
          <button className={styles.bannerRetry} onClick={retry}>Retry</button>
        </div>
      );
    }

    return (
      <div className={styles.fullPage} role="alert">
        <div className={styles.crashIcon} aria-hidden="true">⚠️</div>
        <div className={styles.crashTitle}>{label} crashed</div>
        <div className={styles.crashHint}>
          Something went wrong in this section. Your other work is not affected.
        </div>
        {process.env.NODE_ENV === 'development' && this.state.error && (
          <pre className={styles.crashStack}>{this.state.error.message}</pre>
        )}
        <button className={styles.crashRetry} onClick={retry}>Try again</button>
      </div>
    );
  }
}
