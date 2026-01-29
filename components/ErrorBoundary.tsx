'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary 组件
 * 捕获子组件树中的 JavaScript 错误，记录错误并显示备用 UI
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 记录错误到日志系统
    logger.error('ErrorBoundary caught an error:', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      stack: error.stack
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误 UI
      return (
        <div
          style={{
            padding: '24px',
            margin: '24px',
            borderRadius: '8px',
            backgroundColor: '#fff3f3',
            border: '1px solid #ffcdd2'
          }}
        >
          <h2 style={{ color: '#d32f2f', marginBottom: '16px' }}>
            出错了
          </h2>
          <p style={{ color: '#666', marginBottom: '16px' }}>
            应用遇到了一个错误。请尝试刷新页面或联系支持团队。
          </p>
          {this.state.error && (
            <details style={{ marginBottom: '16px' }}>
              <summary style={{ cursor: 'pointer', color: '#666' }}>
                错误详情
              </summary>
              <pre
                style={{
                  marginTop: '8px',
                  padding: '12px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '12px',
                  color: '#333'
                }}
              >
                {this.state.error.toString()}
                {this.state.error.stack && `\n\n${this.state.error.stack}`}
              </pre>
            </details>
          )}
          <button
            onClick={this.handleReset}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2383E2',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
