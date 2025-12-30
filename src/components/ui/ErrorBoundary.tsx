'use client';

import { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component that catches JavaScript errors in child components.
 * Displays a fallback UI instead of crashing the entire application.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
          <div className="flex items-start gap-3">
            <div className="text-red-500 mt-0.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">
                เกิดข้อผิดพลาด
              </h3>
              <p className="text-sm text-red-700 mt-1">
                ไม่สามารถแสดงข้อมูลส่วนนี้ได้ กรุณาลองใหม่อีกครั้ง
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-2">
                  <summary className="text-xs text-red-600 cursor-pointer">
                    รายละเอียดข้อผิดพลาด (สำหรับนักพัฒนา)
                  </summary>
                  <pre className="mt-2 text-xs text-red-800 bg-red-100 p-2 rounded overflow-auto max-h-32">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              <button
                onClick={this.handleRetry}
                className="mt-3 text-sm font-medium text-red-600 hover:text-red-800 underline"
              >
                ลองใหม่อีกครั้ง
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lightweight wrapper for chart-specific errors with a simpler fallback
 */
interface ChartErrorBoundaryProps {
  children: ReactNode;
  chartName?: string;
}

export function ChartErrorBoundary({ children, chartName = 'กราฟ' }: ChartErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-center text-gray-500">
            <svg className="w-10 h-10 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p className="text-sm">ไม่สามารถแสดง{chartName}ได้</p>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
