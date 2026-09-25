import type { ErrorComponentProps } from "@tanstack/react-router";

export function ErroBackend({ error }: ErrorComponentProps) {
  return (
    <div className="grid h-full place-items-center bg-bg p-8">
      <div className="max-w-md rounded-2xl border border-line bg-surface p-6 text-center">
        <h1 className="font-display text-xl font-semibold">Não consegui falar com o backend</h1>
        <p className="mt-2 text-sm text-muted">
          Confira se o terminal mostra <code>[backend] rodando</code>. Se não mostrar, feche e rode{" "}
          <code>npm run dev</code> de novo.
        </p>
        <p className="mt-4 text-xs text-muted/70">
          {error instanceof Error ? error.message : String(error)}
        </p>
      </div>
    </div>
  );
}
