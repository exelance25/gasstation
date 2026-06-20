"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * React hata sınırı — beklenmeyen render/işlem hatalarını yakalar.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
    console.error("[GasPump ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="mx-auto max-w-md rounded-lg border border-neon-red/80 bg-neon-red/10 p-6 text-center shadow-neon-red"
          role="alert"
        >
          <h2 className="text-lg font-bold text-neon-red">Kritik Hata</h2>
          <p className="mt-2 text-sm text-red-200">{this.state.message}</p>
          <button
            type="button"
            className="mt-4 rounded-md border border-neon-red/60 px-4 py-2 text-sm hover:bg-neon-red/20"
            onClick={() => this.setState({ hasError: false, message: "" })}
          >
            Tekrar Dene
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
