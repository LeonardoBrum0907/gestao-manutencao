import { Component, type ReactNode } from "react";
import { Button, Card } from "../design/ui/controls";

type CrashBoundaryProps = { onCrash: (error: unknown) => void; children: ReactNode };
type CrashBoundaryState = { crashed: boolean };

/**
 * Pega o erro que quebra a montagem de uma tela. Sem isso o React desmonta tudo e sobra a página
 * em branco, sem aviso para quem usa nem para o gestor.
 * @example <CrashBoundary onCrash={tracking.report}><AppRouter /></CrashBoundary>
 */
export class CrashBoundary extends Component<CrashBoundaryProps, CrashBoundaryState> {
  state: CrashBoundaryState = { crashed: false };

  static getDerivedStateFromError(): CrashBoundaryState {
    return { crashed: true };
  }

  componentDidCatch(error: unknown): void {
    this.props.onCrash(error);
  }

  render(): ReactNode {
    return this.state.crashed ? <CrashScreen /> : this.props.children;
  }
}

function CrashScreen() {
  return (
    <div className="flex h-full items-center justify-center overflow-y-auto bg-canvas px-4 py-10">
      <Card className="w-full max-w-md">
        <h1 className="text-lg font-semibold">Esta tela travou</h1>
        <p className="mt-2 text-[15px] text-muted">Recarregue a página para tentar de novo. O que já estava salvo continua salvo.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={() => window.location.reload()}>Recarregar</Button>
          <a className="text-sm font-semibold text-accent hover:underline" href="/">
            Ir para o início
          </a>
        </div>
      </Card>
    </div>
  );
}
