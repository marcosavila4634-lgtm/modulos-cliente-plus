// Contrato com o backend: backend/src/main/java/br/com/clienteplus/modulos/grupovip/DashboardGrupoVip.java

export type Plataforma = "telegram" | "whatsapp";

export type DashboardGrupoVip = {
  demo: boolean;
  grupoAtual: { nome: string };
  gestor: { nome: string; sobrenome: string; cargo: string };
  notificacoes: number;
  frase: string;
  fraseDestaque: string;
  indicadores: {
    membrosAtivos: { valor: number; variacao: number; mesAnterior: number };
    conteudosPublicados: { valor: number; variacao: number; mesAnterior: number };
    visualizacoes: { valor: number; variacao: number; mesAnterior: number };
    receitaMes: { valor: number; variacao: number; mesAnterior: number };
    novosEsteMes: number;
    ticketMedio: number;
  };
  membrosRecentes: {
    nome: string;
    foto: string;
    plano: "Básico" | "VIP" | "Premium" | "Cortesia";
    grupo: string;
    data: string;
    status: "ativo" | "pendente";
  }[];
  crescimentoMembros: { mes: string; membros: number; data?: string }[];
  conteudosMaisAcessados: { titulo: string; acessos: number }[];
  planosMembros: { nome: string; percentual: number }[];
  avisos: {
    tipo: "conteudo" | "manutencao" | "live" | "material";
    titulo: string;
    quando: string;
    status: "enviado";
  }[];
  grupos: {
    nome: string;
    plataforma: Plataforma;
    membros: number;
    cor: "blue" | "sky" | "violet" | "indigo" | "amber";
  }[];
  proximosEventos: {
    titulo: string;
    foto: string;
    quando: string;
    status: "ao_vivo" | "em_breve";
  }[];
};

export async function buscarDashboard(): Promise<DashboardGrupoVip> {
  const res = await fetch("/api/grupo-vip/dashboard");
  if (!res.ok) throw new Error(`Erro ${res.status} ao buscar o painel de Grupos VIP`);
  return res.json() as Promise<DashboardGrupoVip>;
}

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const numero = new Intl.NumberFormat("pt-BR");

export const formatar = {
  moeda: (v: number) => moeda.format(v),
  numero: (v: number) => numero.format(v),
  // 1500 -> "1,5k"
  curto: (v: number) =>
    v < 1000 ? String(v) : `${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k`,
  // "2025-09-09" -> "09/09/2025"
  data: (iso: string) => iso.split("-").reverse().join("/"),
};

// "terça-feira, 9 de setembro de 2025" -> "Terça-feira, 9 de Setembro de 2025"
export function dataPorExtenso(data = new Date()) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
    .format(data)
    .split(" ")
    .map((p) => (p === "de" ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(" ");
}
