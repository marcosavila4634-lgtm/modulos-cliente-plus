import {
  Activity,
  Award,
  Baby,
  BadgePercent,
  CalendarDays,
  CircleCheck,
  Clock,
  ConciergeBell,
  Dumbbell,
  FileChartColumn,
  FingerprintPattern,
  Gift,
  Globe,
  GraduationCap,
  HeartPulse,
  LayoutDashboard,
  MessagesSquare,
  QrCode,
  Settings,
  Shirt,
  Timer,
  Trophy,
  UserCog,
  Users,
  UsersRound,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { ehArtesMarciais } from "../../lib/modulo-atual";

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
  { secao: "pagina", rotulo: "Página da academia", icone: Globe },
  { secao: "configuracoes", rotulo: "Configurações", icone: Settings },
];

// Módulo Artes Marciais: as mesmas telas (abrem em /artes-marciais/<secao>)
// mais as de luta. Treinos e Exercícios (musculação) ficam de fora.
export const menuArtesMarciais: ItemMenu[] = [
  { secao: null, rotulo: "Dashboard", icone: LayoutDashboard },
  { secao: "agenda", rotulo: "Agenda", icone: CalendarDays },
  { secao: "alunos", rotulo: "Alunos", icone: Users },
  { secao: "responsaveis", rotulo: "Kids e responsáveis", icone: Baby },
  { secao: "aulas-e-turmas", rotulo: "Aulas e turmas", icone: UsersRound },
  { secao: "profissionais", rotulo: "Professores", icone: GraduationCap },
  { secao: "graduacoes", rotulo: "Graduações", icone: Award },
  { secao: "avaliacao-fisica", rotulo: "Avaliações físicas", icone: HeartPulse },
  { secao: "presenca", rotulo: "Presença / Check-in", icone: QrCode },
  { secao: "eventos", rotulo: "Eventos e campeonatos", icone: Trophy },
  { secao: "faturamento", rotulo: "Financeiro", icone: Wallet },
  { secao: "comissao", rotulo: "Comissão", icone: BadgePercent },
  { secao: "servicos", rotulo: "Serviços", icone: ConciergeBell },
  { secao: "equipamentos", rotulo: "Equipamentos", icone: Wrench },
  { secao: "loja", rotulo: "Uniformes e loja", icone: Shirt },
  { secao: "beneficios", rotulo: "Benefícios", icone: Gift },
  { secao: "comunicacao", rotulo: "Comunicação", icone: MessagesSquare },
  { secao: "relatorios", rotulo: "Relatórios", icone: FileChartColumn },
  { secao: "cronometro", rotulo: "Cronômetro", icone: Timer },
  { secao: "pagina", rotulo: "Página da academia", icone: Globe },
  { secao: "configuracoes", rotulo: "Configurações", icone: Settings },
];

export const menuDoModulo = () => (ehArtesMarciais() ? menuArtesMarciais : menuAcademia);
