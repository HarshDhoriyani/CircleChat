import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-dark-300 min-h-[300px]">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            {this.props.title || 'Something went wrong rendering this section'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-5 leading-relaxed">
            {this.state.error?.message || 'An unexpected rendering error occurred. Please reload to restore session.'}
          </p>
          <Button
            size="sm"
            variant="primary"
            icon={RefreshCw}
            onClick={this.handleReload}
          >
            Reload Component
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
