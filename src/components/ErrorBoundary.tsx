import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/Button';

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
    console.error('DeadLockLab crashed:', error, info.componentStack);
  }

  private handleReload = (): void => {
    this.setState({ hasError: false, message: '' });
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-24 bg-tint-bg" role="alert">
          <div className="border border-line bg-white p-24 max-w-[560px] w-full rounded-none shadow-none">
            <h1 className="font-poppins text-h3 font-semibold text-ink mb-16">Something went wrong</h1>
            <p className="font-mono text-mono-body text-muted mb-16">
              DeadLockLab hit an unexpected error and stopped to avoid showing incorrect results.
            </p>
            <pre className="font-mono text-[13px] text-muted whitespace-pre-wrap border border-line p-16 mb-24 bg-tint-bg">
              {this.state.message || 'Unknown error'}
            </pre>
            <Button variant="primary" onClick={this.handleReload}>
              Reload the app
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
