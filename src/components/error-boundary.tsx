"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * Catches unexpected runtime errors and shows a friendly recovery screen.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[TekBakiye] Error boundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-lg font-semibold text-foreground">Bir şeyler ters gitti.</p>
          <p className="text-sm text-muted">Lütfen sayfayı yenileyin.</p>
          <Button onClick={() => window.location.reload()}>Sayfayı Yenile</Button>
        </main>
      );
    }
    return this.props.children;
  }
}
