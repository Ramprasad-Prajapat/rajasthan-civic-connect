import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Component Error Boundary Caught Error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container py-5 text-center my-5">
          <div className="card border-0 shadow-lg rounded-4 p-4 p-md-5 max-w-600 mx-auto bg-white">
            <div className="rounded-circle bg-danger-soft text-danger d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '64px', height: '64px' }}>
              <i className="bi bi-exclamation-triangle-fill fs-2"></i>
            </div>
            <h3 className="fw-extrabold text-secondary mb-2">Something went wrong</h3>
            <p className="text-muted small mb-4">
              An unhandled rendering exception occurred in this module. Our system has logged the event.
            </p>

            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <div className="text-start bg-dark text-danger p-3 rounded-3 mb-4 overflow-x-auto font-monospace" style={{ fontSize: '0.75rem' }}>
                <strong>{this.state.error.toString()}</strong>
              </div>
            )}

            <div className="d-flex justify-content-center gap-2">
              <button onClick={this.handleReset} className="btn btn-primary rounded-pill px-4 py-2 fw-semibold">
                <i className="bi bi-arrow-counterclockwise me-1"></i> Reload Workspace
              </button>
              <a href="/" className="btn btn-outline-secondary rounded-pill px-4 py-2 fw-semibold">
                <i className="bi bi-house me-1"></i> Return Home
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
