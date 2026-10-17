import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * Top-level error boundary. Renders a calm, readable fallback instead of a blank screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, message: '' };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('DeadlockLab crashed:', error, info.componentStack);
  }

  private handleReload = (): void => {
    this.setState({ hasError: false, message: '' });
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-off-white" role="alert">
          <div className="panel p-24 max-w-page w-full">
            <h1 className="section-heading text-heading-sm mb-16">Something went wrong</h1>
            <p className="text-charcoal mb-16">
              DeadlockLab hit an unexpected error and stopped to avoid showing incorrect results.
            </p>
            <pre className="text-body-sm text-graphite whitespace-pre-wrap border border-fog p-16 mb-24">
              {this.state.message || 'Unknown error'}
            </pre>
            <button type="button" className="btn btn-ember" onClick={this.handleReload}>
              Reload the app
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
