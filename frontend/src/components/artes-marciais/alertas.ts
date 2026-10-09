import type { LinkProps } from "@tanstack/react-router";
import { Award, Baby, CalendarCheck, IdCard, PackageMinus, Trophy, Wrench, type LucideIcon } from "lucide-react";
import type { TipoAlertaLutas } from "../../lib/artes-marciais";

// Avisos do Artes Marciais no "Requer atenção" e no sininho do topo.
export const estiloAlertaLutas: Record<TipoAlertaLutas, { icone: LucideIcon; cor: string }> = {
  aptos_graduar: { icone: Award, cor: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  exame: { icone: CalendarCheck, cor: "bg-red-500/15 text-red-400 border-red-500/30" },
  evento: { icone: Trophy, cor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  equipamentos: { icone: Wrench, cor: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  filiacoes: { icone: IdCard, cor: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  kids_sem_responsavel: { icone: Baby, cor: "bg-pink-500/15 text-pink-300 border-pink-500/30" },
  estoque: { icone: PackageMinus, cor: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30" },
};

export const destinoAlertaLutas: Record<TipoAlertaLutas, LinkProps> = {
  aptos_graduar: { to: "/academia/graduacoes", search: { filtro: "aptos" } },
  exame: { to: "/academia/graduacoes", search: { aba: "exames" } },
  evento: { to: "/academia/eventos" },
  equipamentos: { to: "/academia/equipamentos" },
  filiacoes: { to: "/academia/eventos", search: { aba: "filiacoes" } },
  kids_sem_responsavel: { to: "/academia/responsaveis" },
  estoque: { to: "/academia/loja" },
};
