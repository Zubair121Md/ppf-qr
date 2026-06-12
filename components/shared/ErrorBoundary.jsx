'use client';

import { Component } from 'react';
import Button from '@/components/ui/Button';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-surface text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-500 mb-6 max-w-sm">
            The app hit an error. Try again or go back to your orders.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => this.setState({ hasError: false, error: null })}>
              Try again
            </Button>
            <Button variant="secondary" onClick={() => window.location.href = '/worker/orders'}>
              My orders
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
