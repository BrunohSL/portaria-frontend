"use client";
import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8">
          <h2 className="text-lg font-semibold text-foreground">Algo deu errado</h2>
          <p className="text-sm text-muted-foreground text-center max-w-md">Ocorreu um erro inesperado. Tente recarregar a pagina.</p>
          <Button variant="outline" onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}>Recarregar pagina</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
