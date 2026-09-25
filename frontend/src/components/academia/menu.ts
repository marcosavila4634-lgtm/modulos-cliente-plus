import {
  Activity,
  BadgePercent,
  CalendarDays,
  CircleCheck,
  Clock,
  Dumbbell,
  FileChartColumn,
  FingerprintPattern,
  Gift,
  HeartPulse,
  LayoutDashboard,
  Settings,
  UserCog,
  Users,
  UsersRound,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type ItemMenu = { secao: string | null; rotulo: string; icone: LucideIcon };

// secao null = Dashboard (/academia). As demais abrem /academia/<secao>.
export const menuAcademia: ItemMenu[] = [
  { secao: null, rotulo: "Dashboard", icone: LayoutDashboard },
  { secao: "alunos", rotulo: "Alunos", icone: Users },
  { secao: "check-in", rotulo: "Check-in", icone: CircleCheck },
  { secao: "controle-de-acesso", rotulo: "Controle de acesso", icone: FingerprintPattern },
  { secao: "treinos", rotulo: "Treinos", icone: Dumbbell },
  { secao: "exercicios", rotulo: "Exercícios", icone: Activity },
  { secao: "avaliacao-fisica", rotulo: "Avaliação física", icone: HeartPulse },
  { secao: "aulas-e-turmas", rotulo: "Aulas e turmas", icone: UsersRound },
  { secao: "agenda", rotulo: "Agenda", icone: CalendarDays },
  { secao: "horarios-de-pico", rotulo: "Horários de pico", icone: Clock },
  { secao: "profissionais", rotulo: "Profissionais", icone: UserCog },
  { secao: "servicos", rotulo: "Serviços", icone: Wrench },
  { secao: "faturamento", rotulo: "Faturamento", icone: Wallet },
  { secao: "comissao", rotulo: "Comissão", icone: BadgePercent },
  { secao: "beneficios", rotulo: "Benefícios", icone: Gift },
  { secao: "relatorios", rotulo: "Relatórios", icone: FileChartColumn },
  { secao: "configuracoes", rotulo: "Configurações", icone: Settings },
];
