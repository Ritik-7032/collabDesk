import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled rendering error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 p-6">
          <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-100">
                Application Error
              </h2>
              <p className="text-sm text-zinc-400">
                An unexpected UI rendering issue occurred. Your data in the cloud is safe.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-zinc-950/80 border border-zinc-800/80 rounded-lg p-3 text-xs text-red-300 font-mono overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = "/dashboard")}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition cursor-pointer shadow-lg shadow-indigo-500/20"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
