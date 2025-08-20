import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-indigo-900 flex flex-col items-center justify-center p-4 text-white text-center">
          <h1 className="text-3xl font-bold text-red-500">Something Went Wrong</h1>
          <p className="mt-4 text-gray-300 max-w-md">
            An unexpected error occurred. This might be a temporary issue. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Refresh Page
          </button>
          {this.state.error && (
             <details className="mt-6 text-left text-xs text-gray-400 max-w-md w-full">
                <summary className="cursor-pointer">Error Details</summary>
                <pre className="mt-2 bg-gray-800 p-2 rounded-lg overflow-auto">
                    {this.state.error.toString()}
                </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
