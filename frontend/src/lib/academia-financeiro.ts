// Despesas, resultado do mês, comissões e benefícios.
// Contrato com o backend: backend/src/main/java/br/com/clienteplus/modulos/academia/FinanceiroContrato.java

import { http } from "./http";

type Ref = { id: string; nome: string };

// ---------- Despesas ----------

export type CategoriaDespesa =
  | "aluguel"
  | "salarios"
  | "comissoes"
  | "energia"
  | "agua"
  | "internet"
  | "equipamentos"
  | "manutencao"
  | "limpeza"
  | "marketing"
  | "impostos"
  | "sistemas"
  | "outros";

export type FormaDespesa = "dinheiro" | "pix" | "cartao_credito" | "cartao_debito" | "boleto" | "transferencia";

export type Despesa = {
  id: string;
  descricao: string;
  categoria: CategoriaDespesa;
  fornecedor: string;
  valor: number;
  vencimento: string;
  status: "pendente" | "atrasada" | "paga" | "cancelada";
  pagoEm: string | null;
  formaPagamento: FormaDespesa | null;
  recorrente: boolean;
  observacao: string;
};

export type DadosDespesa = {
  descricao: string;
  categoria: CategoriaDespesa;
  fornecedor: string;
  valor: number | null;
  vencimento: string;
  recorrente: boolean;
  observacao: string;
};

export type PainelDespesas = {
  resumo: {
    pagoMes: number;
    qtdPagoMes: number;
    aPagarMes: number;
    qtdAPagarMes: number;
    atrasadas: number;
    qtdAtrasadas: number;
  };
  despesas: Despesa[];
};

export type Resultado = {
  meses: {
    mes: string;
    ano: number;
    numeroMes: number;
    mensalidades: number;
    servicos: number;
    receita: number;
    despesas: number;
    resultado: number;
  }[];
  despesasPorCategoria: { categoria: CategoriaDespesa; valor: number }[];
  receitaPorForma: { categoria: string; valor: number }[];
};

// ---------- Comissões ----------

export type ComissoesProfissionais = {
  competencia: string;
  total: number;
  pago: number;
  profissionais: {
    profissional: Ref;
    atendimentos: number;
    vendido: number;
    comissao: number;
    paga: boolean;
    pagaEm: string | null;
    itens: {
      vendaId: string;
      pagoEm: string;
      aluno: string;
      servico: string;
      valor: number;
      pct: number;
      comissao: number;
    }[];
  }[];
};

export type ComissoesIndicacoes = {
  competencia: string;
  percentuais: number[];
  total: number;
  pagamentosComComissao: number;
  indicadores: number;
  ranking: { aluno: Ref; indicadosAtivos: number; rede: number; comissaoMes: number }[];
  linhas: {
    data: string;
    pagante: Ref;
    beneficiario: Ref;
    nivel: number;
    origem: string;
    base: number;
    pct: number;
    comissao: number;
  }[];
};

// ---------- Benefícios ----------

export type TipoBeneficio = "parceiro" | "indicacao" | "fidelidade" | "aniversario" | "frequencia";

export type Beneficio = {
  id: string;
  titulo: string;
  descricao: string;
  tipo: TipoBeneficio;
  regra: number | null;
  recompensa: string;
  parceiro: string;
  codigo: string;
  validade: string | null;
  ativo: boolean;
  elegiveis: number;
  resgatados: number;
  aEntregar: number;
};

export type DadosBeneficio = {
  titulo: string;
  descricao: string;
  tipo: TipoBeneficio;
  regra: number | null;
  recompensa: string;
  parceiro: string;
  codigo: string;
  validade: string | null;
  ativo?: boolean;
};

export type DetalheBeneficio = {
  beneficio: Beneficio;
  referencia: string;
  alunos: {
    alunoId: string;
    nome: string;
    motivo: string;
    situacao: "disponivel" | "resgatado" | "entregue";
    resgateId: string | null;
    resgatadoEm: string | null;
    origem: "recepcao" | "area_cliente" | null;
  }[];
};

export type BeneficiosDoAluno = {
  academia: string;
  aluno: string;
  beneficios: {
    beneficio: Beneficio;
    situacao: "bloqueado" | "disponivel" | "resgatado" | "entregue";
    progresso: string;
    atual: number;
    meta: number | null;
  }[];
};

export const apiFinanceiro = {
  despesas: () => http.get<PainelDespesas>("/academia/despesas"),
  cadastrarDespesa: (d: DadosDespesa) => http.post<Despesa>("/academia/despesas", d),
  atualizarDespesa: (id: string, d: DadosDespesa) => http.put<Despesa>(`/academia/despesas/${id}`, d),
  pagarDespesa: (id: string, formaPagamento: FormaDespesa, data: string) =>
    http.post<Despesa>(`/academia/despesas/${id}/pagar`, { formaPagamento, data }),
  cancelarDespesa: (id: string) => http.post<void>(`/academia/despesas/${id}/cancelar`),
  resultado: (meses = 6) => http.get<Resultado>(`/academia/financeiro/resultado?meses=${meses}`),

  comissoesProfissionais: (mes: string) => http.get<ComissoesProfissionais>(`/academia/comissoes/profissionais?mes=${mes}`),
  pagarComissao: (profissionalId: string, mes: string, formaPagamento: FormaDespesa) =>
    http.post<ComissoesProfissionais>(`/academia/comissoes/profissionais/${profissionalId}/pagar`, { mes, formaPagamento }),
  comissoesIndicacoes: (mes: string) => http.get<ComissoesIndicacoes>(`/academia/comissoes/indicacoes?mes=${mes}`),

  beneficios: () => http.get<Beneficio[]>("/academia/beneficios"),
  beneficio: (id: string) => http.get<DetalheBeneficio>(`/academia/beneficios/${id}`),
  cadastrarBeneficio: (d: DadosBeneficio) => http.post<DetalheBeneficio>("/academia/beneficios", d),
  atualizarBeneficio: (id: string, d: DadosBeneficio) => http.put<DetalheBeneficio>(`/academia/beneficios/${id}`, d),
  resgatar: (id: string, alunoId: string) => http.post<DetalheBeneficio>(`/academia/beneficios/${id}/resgatar`, { alunoId }),
  entregar: (id: string, resgateId: string) =>
    http.post<DetalheBeneficio>(`/academia/beneficios/${id}/resgates/${resgateId}/entregar`),

  beneficiosDoAluno: (alunoId: string) => http.get<BeneficiosDoAluno>(`/area-cliente/${alunoId}/beneficios`),
  resgatarComoAluno: (alunoId: string, beneficioId: string) =>
    http.post<void>(`/area-cliente/${alunoId}/beneficios/${beneficioId}/resgatar`),
};

// ---------- Textos ----------

export const rotuloCategoriaDespesa: Record<CategoriaDespesa, string> = {
  aluguel: "Aluguel",
  salarios: "Salários",
  comissoes: "Comissões",
  energia: "Energia",
  agua: "Água",
  internet: "Internet e telefone",
  equipamentos: "Equipamentos",
  manutencao: "Manutenção",
  limpeza: "Limpeza",
  marketing: "Marketing",
  impostos: "Impostos",
  sistemas: "Sistemas",
  outros: "Outros",
};

export const categoriasDespesa = Object.keys(rotuloCategoriaDespesa) as CategoriaDespesa[];

export const rotuloFormaDespesa: Record<FormaDespesa, string> = {
  pix: "Pix",
  boleto: "Boleto",
  transferencia: "Transferência",
  dinheiro: "Dinheiro",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
};

export const rotuloTipoBeneficio: Record<TipoBeneficio, string> = {
  indicacao: "Por indicações",
  fidelidade: "Por tempo de casa",
  frequencia: "Por frequência no mês",
  aniversario: "Aniversariantes do mês",
  parceiro: "Cupom de parceiro",
};

// Regra em texto: "3 indicados ativos", "6 meses de academia"...
export function regraBeneficio(b: Pick<Beneficio, "tipo" | "regra" | "parceiro">) {
  switch (b.tipo) {
    case "indicacao":
      return `${b.regra} ${b.regra === 1 ? "indicado ativo" : "indicados ativos"}`;
    case "fidelidade":
      return `${b.regra} ${b.regra === 1 ? "mês" : "meses"} de academia`;
    case "frequencia":
      return `${b.regra} check-ins no mês`;
    case "aniversario":
      return "No mês do aniversário";
    case "parceiro":
      return `Todos os alunos ativos · ${b.parceiro}`;
  }
}

// "2026-09" -> "setembro de 2026"
export function nomeMes(competencia: string) {
  const [a, m] = competencia.split("-").map(Number);
  return new Date(a, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function somarMeses(competencia: string, n: number) {
  const [a, m] = competencia.split("-").map(Number);
  const d = new Date(a, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
