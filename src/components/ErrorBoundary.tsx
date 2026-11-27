import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * Last-resort crash guard for the kiosk: a render error in any screen
 * used to blank the whole app. Now the customer sees a retry screen
 * instead of a white page, and the questionnaire state is not lost
 * until they choose to reload.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Something went wrong.' };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('Review-AI crashed:', error, info.componentStack);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, message: '' });
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="content-card p-6 max-w-xs w-full flex flex-col gap-3 text-center">
          <p className="font-medium text-ink text-base">Something went wrong</p>
          <p className="text-sm text-muted leading-relaxed">
            The review form hit a problem. Your answers are safe — please try again.
          </p>
          {this.state.message && (
            <p className="font-mono text-xs text-muted break-words">{this.state.message}</p>
          )}
          <button
            type="button"
            onClick={this.handleRetry}
            className="glass-btn glass-btn--prominent cta w-full"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="glass-btn w-full"
          >
            Reload the page
          </button>
        </div>
      </div>
    );
  }
}
