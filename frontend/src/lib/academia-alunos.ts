// Alunos, planos, matrículas e mensalidades do módulo Academia.
// Contrato com o backend: backend/src/main/java/br/com/clienteplus/modulos/academia/AlunosContrato.java
// (alunos, planos e matrículas são clientes, planos e assinaturas do Cliente Plus).

import type { FichaResumo } from "./academia-treinos";
import { http } from "./http";

export type Situacao = "ativo" | "em_atraso" | "sem_matricula";
export type StatusCobranca = "pendente" | "atrasada" | "paga" | "cancelada";
export type FormaPagamento = "dinheiro" | "pix" | "cartao_credito" | "cartao_debito" | "boleto";

export type Plano = { id: string; nome: string; descricao: string; preco: number; duracaoMeses: number };

export type AlunoResumo = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  plano: string | null;
  proximoVencimento: string | null;
  situacao: Situacao;
  alunoDesde: string;
};

export type ListaAlunos = {
  alunos: AlunoResumo[];
  contagem: { todos: number; ativo: number; emAtraso: number; semMatricula: number };
};

export type Cobranca = {
  id: string;
  alunoId: string;
  aluno: string;
  plano: string;
  valor: number;
  vencimento: string;
  status: StatusCobranca;
  pagoEm: string | null;
  formaPagamento: FormaPagamento | null;
  // avulso = venda de serviço (plano = o que foi vendido)
  tipo: "mensalidade" | "avulso";
};

export type AlunoDetalhe = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  cpf: string | null;
  dataNascimento: string | null;
  alunoDesde: string;
  situacao: Situacao;
  matricula: {
    id: string;
    plano: Plano;
    valor: number;
    inicio: string;
    proximoVencimento: string | null;
  } | null;
  // ficha de treino ativa (null = sem ficha)
  ficha: FichaResumo | null;
  // entradas (check-ins)
  frequencia: { ultimos30Dias: number; ultimaEntrada: string | null };
  cobrancas: Cobranca[];
};

export type DadosAluno = {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  dataNascimento: string | null;
};

export type Faturamento = {
  resumo: {
    recebidoMes: number;
    qtdRecebidoMes: number;
    aReceberMes: number;
    qtdAReceberMes: number;
    emAtraso: number;
    qtdEmAtraso: number;
  };
  cobrancas: Cobranca[];
};

export const apiAlunos = {
  listar: () => http.get<ListaAlunos>("/academia/alunos"),
  buscar: (id: string) => http.get<AlunoDetalhe>(`/academia/alunos/${id}`),
  cadastrar: (dados: DadosAluno) => http.post<AlunoDetalhe>("/academia/alunos", dados),
  atualizar: (id: string, dados: DadosAluno) => http.put<AlunoDetalhe>(`/academia/alunos/${id}`, dados),
  matricular: (id: string, planoId: string, inicio: string) =>
    http.post<AlunoDetalhe>(`/academia/alunos/${id}/matricula`, { planoId, inicio }),
  cancelarMatricula: (id: string) => http.post<AlunoDetalhe>(`/academia/alunos/${id}/matricula/cancelar`),
  planos: () => http.get<Plano[]>("/academia/planos"),
  faturamento: () => http.get<Faturamento>("/academia/cobrancas"),
  receber: (cobrancaId: string, formaPagamento: FormaPagamento) =>
    http.post<Cobranca>(`/academia/cobrancas/${cobrancaId}/receber`, { formaPagamento }),
};

// ---------- Textos e formatos ----------

export const rotuloSituacao: Record<Situacao, string> = {
  ativo: "Ativo",
  em_atraso: "Em atraso",
  sem_matricula: "Sem matrícula",
};

export const rotuloCobranca: Record<StatusCobranca, string> = {
  pendente: "A vencer",
  atrasada: "Atrasada",
  paga: "Paga",
  cancelada: "Cancelada",
};

export const rotuloForma: Record<FormaPagamento, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  boleto: "Boleto",
};

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// 1 -> "por mês", 3 -> "a cada 3 meses"
export function periodicidade(meses: number) {
  return meses === 1 ? "por mês" : `a cada ${meses} meses`;
}

export const fmt = {
  moeda: (v: number) => moeda.format(v),
  // "2026-09-24" -> "24/09/2026"
  data: (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "—"),
  // "11987654321" -> "(11) 98765-4321"
  telefone: (t: string | null) => {
    if (!t) return "—";
    const m = t.match(/^(\d{2})(\d{4,5})(\d{4})$/);
    return m ? `(${m[1]}) ${m[2]}-${m[3]}` : t;
  },
  // "12345678901" -> "123.456.789-01"
  cpf: (c: string | null) => (c ? c.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4") : "—"),
};

// Data de hoje no formato do campo <input type="date">.
export function hojeIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Quantos dias faltam (positivo) ou passaram (negativo) até a data.
export function diasAte(iso: string) {
  const [a, m, d] = iso.split("-").map(Number);
  const alvo = new Date(a, m - 1, d).getTime();
  const [ha, hm, hd] = hojeIso().split("-").map(Number);
  return Math.round((alvo - new Date(ha, hm - 1, hd).getTime()) / 86_400_000);
}

// "vence hoje", "vence em 3 dias", "atrasada há 5 dias"
export function prazo(iso: string) {
  const dias = diasAte(iso);
  if (dias === 0) return "vence hoje";
  if (dias === 1) return "vence amanhã";
  if (dias > 1) return `vence em ${dias} dias`;
  return dias === -1 ? "atrasada há 1 dia" : `atrasada há ${-dias} dias`;
}

export function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}
