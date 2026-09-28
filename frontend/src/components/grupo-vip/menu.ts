import {
  BookOpen,
  Bot,
  ChartColumn,
  CircleDollarSign,
  Clapperboard,
  FileText,
  Globe,
  Headset,
  LayoutDashboard,
  Megaphone,
  Send,
  Settings,
  ShieldCheck,
  Tags,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export type SubItem = { secao: string; rotulo: string };
export type ItemMenu = {
  secao: string | null; // null = Dashboard (/grupo-vip)
  rotulo: string;
  icone: LucideIcon;
  filhos?: SubItem[];
};

export const menuGrupoVip: ItemMenu[] = [
  { secao: null, rotulo: "Dashboard", icone: LayoutDashboard },
  { secao: "membros", rotulo: "Membros", icone: Users },
  { secao: "grupos", rotulo: "Grupos e planos", icone: Send },
  { secao: "pagina", rotulo: "Página de vendas", icone: Globe },
  { secao: "acessos", rotulo: "Controle de acesso", icone: ShieldCheck },
  { secao: "telegram", rotulo: "Telegram", icone: Bot },
  { secao: "biblioteca", rotulo: "Biblioteca", icone: BookOpen },
  { secao: "conteudos", rotulo: "Conteúdos", icone: FileText },
  { secao: "categorias", rotulo: "Categorias", icone: Tags },
  { secao: "lives-e-eventos", rotulo: "Lives e Eventos", icone: Clapperboard },
  { secao: "anuncios", rotulo: "Anúncios", icone: Megaphone },
  { secao: "automacao", rotulo: "Automação", icone: Workflow },
  {
    secao: "financeiro",
    rotulo: "Financeiro",
    icone: CircleDollarSign,
    filhos: [
      { secao: "receitas", rotulo: "Receitas" },
      { secao: "assinaturas", rotulo: "Assinaturas" },
      { secao: "saques", rotulo: "Saques e indicações" },
    ],
  },
  { secao: "relatorios", rotulo: "Relatórios", icone: ChartColumn },
  { secao: "suporte", rotulo: "Suporte", icone: Headset },
  { secao: "configuracoes", rotulo: "Configurações", icone: Settings },
];

// Todas as seções que abrem uma página, incluindo as do submenu.
export function rotuloDaSecao(secao: string): string | undefined {
  for (const item of menuGrupoVip) {
    if (item.secao === secao) return item.rotulo;
    const filho = item.filhos?.find((f) => f.secao === secao);
    if (filho) return `${item.rotulo} · ${filho.rotulo}`;
  }
  return undefined;
}
