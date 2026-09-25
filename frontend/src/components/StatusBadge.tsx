import { statusLabel, type StatusModulo } from "../lib/api";

const estilos: Record<StatusModulo, string> = {
  planejado: "bg-surface-2 text-muted border-line",
  em_desenvolvimento: "bg-warning/10 text-warning border-warning/30",
  pronto_para_migrar: "bg-brand/10 text-brand border-brand/30",
  migrado: "bg-success/10 text-success border-success/30",
};

export function StatusBadge({ status }: { status: StatusModulo }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${estilos[status]}`}
    >
      {statusLabel[status]}
    </span>
  );
}
