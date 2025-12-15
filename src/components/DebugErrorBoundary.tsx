import React from 'react';

interface Props {
  children: React.ReactNode;
  componentName: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class DebugErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`ERROR IN ${this.props.componentName}:`, error);
    console.error('Error details:', errorInfo);
    console.error('Stack trace:', error.stack);
    
    // Check if this is the specific string conversion error
    if (error.message?.includes("can't convert item to string")) {
      console.error('🚨 STRING CONVERSION ERROR FOUND IN:', this.props.componentName);
      console.error('Component stack:', errorInfo.componentStack);
      
      // Try to identify the problematic element
      if (errorInfo.componentStack) {
        const lines = errorInfo.componentStack.split('\n');
        console.error('Most recent component:', lines[1]);
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="text-red-800 font-semibold">Error in {this.props.componentName}</h3>
          <p className="text-red-600 text-sm mt-1">{this.state.error?.message}</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}