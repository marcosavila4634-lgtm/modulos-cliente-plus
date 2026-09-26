// Contrato com o backend: backend/src/main/java/br/com/clienteplus/modulos/academia/DashboardAcademia.java

export type DashboardAcademia = {
  demo: boolean;
  academia: { nome: string };
  gestor: { nome: string; cargo: string };
  notificacoes: number;
  frase: string;
  indicadores: {
    alunosAtivos: { valor: number; variacao: number; noUltimoMes: number };
    matriculasMes: { valor: number; variacao: number; mesAnterior: number };
    faturamentoMensal: { valor: number; variacao: number; mesAnterior: number };
    inadimplencia: { valor: number; variacao: number; mesAnterior: number };
    checkinsHoje: { valor: number; variacao: number; ultimo: string } | null;
  };
  evolucaoAlunos: { mes: string; ativos: number; novos: number }[];
  // as 7 horas mais cheias do dia da semana de hoje
  horariosPico: { hora: string; ocupacao: number }[];
  alertas: {
    tipo:
      | "mensalidades_atrasadas"
      | "vencem_em_breve"
      | "sem_matricula"
      | "fichas_treino"
      | "sem_frequencia"
      | "reavaliacao"
      | "cancelamentos";
    titulo: string;
    descricao: string;
  }[];
  // despesas null enquanto não houver nenhuma despesa paga
  receitaDespesas: { mes: string; receita: number; despesas: number | null }[];
  tiposPlanos: { nome: string; percentual: number }[];
  atividades: {
    tipo: "matricula" | "pagamento" | "cancelamento" | "novo_aluno";
    texto: string;
    quando: string;
  }[];
};

export async function buscarDashboard(): Promise<DashboardAcademia> {
  const res = await fetch("/api/academia/dashboard");
  if (!res.ok) throw new Error(`Erro ${res.status} ao buscar o painel da academia`);
  return res.json() as Promise<DashboardAcademia>;
}

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});
const brlCentavos = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export const formatar = {
  moeda: (v: number) => brl.format(v),
  moedaCentavos: (v: number) => brlCentavos.format(v),
  percentual: (v: number) => `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`,
  // 800 -> "800", 12500 -> "12,5k"
  milhar: (v: number) =>
    v < 1000 ? String(v) : `${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k`,
};

// "quinta-feira, 24 de setembro" -> "Quinta-feira, 24 de Setembro"
export function dataPorExtenso(data = new Date()) {
  const texto = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(data);
  return texto
    .split(" ")
    .map((p) => (p === "de" ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(" ");
}
