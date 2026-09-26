// Serviços, vendas, agenda e aulas coletivas.
// Contrato com o backend: backend/src/main/java/br/com/clienteplus/modulos/academia/AgendaContrato.java

import type { FormaPagamento, StatusCobranca } from "./academia-alunos";
import { http } from "./http";

type Ref = { id: string; nome: string };

// ---------- Serviços ----------

export type CategoriaServico =
  | "personal"
  | "avaliacao"
  | "nutricao"
  | "fisioterapia"
  | "massagem"
  | "aula_avulsa"
  | "day_use"
  | "outro";

export type Servico = {
  id: string;
  nome: string;
  descricao: string;
  categoria: CategoriaServico;
  preco: number;
  duracaoMinutos: number | null;
  profissional: Ref | null;
  comissaoPct: number;
  participaIndicacoes: boolean;
  ativo: boolean;
  vendasMes: number;
  receitaMes: number;
};

export type DadosServico = {
  nome: string;
  descricao: string;
  categoria: CategoriaServico;
  preco: number | null;
  duracaoMinutos: number | null;
  profissionalId: string | null;
  comissaoPct: number | null;
  participaIndicacoes: boolean;
  ativo?: boolean;
};

export type Venda = {
  id: string;
  aluno: Ref;
  servico: Ref;
  profissional: Ref | null;
  quantidade: number;
  valor: number;
  comissaoPct: number;
  status: StatusCobranca;
  vencimento: string;
  pagoEm: string | null;
  formaPagamento: FormaPagamento | null;
  cobrancaId: string;
  criadaEm: string;
};

export type NovaVenda = {
  alunoId: string;
  servicoId: string;
  profissionalId: string | null;
  quantidade: number;
  valor: number | null;
  vencimento: string;
  receberAgora: boolean;
  formaPagamento: FormaPagamento | null;
};

export type PainelServicos = { servicos: Servico[]; vendas: Venda[]; vendidoMes: number; recebidoMes: number };

// ---------- Agenda ----------

export type TipoAgendamento = "servico" | "avaliacao" | "outro";
export type StatusAgendamento = "agendado" | "confirmado" | "concluido" | "faltou" | "cancelado";

export type Agendamento = {
  id: string;
  aluno: Ref | null;
  profissional: Ref;
  servico: Ref | null;
  tipo: TipoAgendamento;
  titulo: string;
  inicio: string;
  fim: string;
  status: StatusAgendamento;
  observacao: string;
  preco: number | null;
  vendaId: string | null;
};

export type DadosAgendamento = {
  alunoId: string | null;
  profissionalId: string | null;
  servicoId: string | null;
  tipo: TipoAgendamento;
  titulo: string;
  data: string;
  hora: string;
  duracaoMinutos: number | null;
  observacao: string;
};

export type CorAula = "violeta" | "azul" | "verde" | "laranja" | "rosa" | "ciano";

export type AulaNaData = {
  horarioId: string;
  aulaId: string;
  nome: string;
  cor: CorAula;
  sala: string;
  professor: Ref | null;
  data: string;
  hora: string;
  inicio: string;
  fim: string;
  ocupados: number;
  capacidade: number;
};

export type PainelAgenda = {
  inicio: string;
  dias: number;
  profissionais: { id: string; nome: string; especialidade: string }[];
  agendamentos: Agendamento[];
  aulas: AulaNaData[];
};

// ---------- Aulas ----------

export type Aula = {
  id: string;
  nome: string;
  descricao: string;
  professor: Ref | null;
  sala: string;
  capacidade: number;
  duracaoMinutos: number;
  cor: CorAula;
  ativo: boolean;
  horarios: { id: string; diaSemana: number; dia: string; hora: string; fixos: number }[];
};

export type DadosAula = {
  nome: string;
  descricao: string;
  professorId: string | null;
  sala: string;
  capacidade: number | null;
  duracaoMinutos: number | null;
  cor: CorAula;
  ativo?: boolean;
  horarios: { diaSemana: number; hora: string }[];
};

export type GradeAulas = { inicio: string; aulas: Aula[]; semana: AulaNaData[] };

export type StatusPresenca = "reservado" | "presente" | "faltou" | "cancelado";

export type SessaoAula = {
  aula: AulaNaData;
  diaSemana: string;
  passou: boolean;
  participantes: {
    alunoId: string;
    nome: string;
    tipo: "fixo" | "avulso";
    status: StatusPresenca;
    origem: "recepcao" | "area_cliente";
  }[];
  vagas: number;
  presentes: number;
  faltas: number;
};

export type AulasDoAluno = {
  academia: string;
  aluno: string;
  aulas: {
    aula: AulaNaData;
    minhaSituacao: "fixo" | "reservado" | "presente" | "faltou" | null;
    podeReservar: boolean;
    motivo: string | null;
  }[];
};

export const apiAgenda = {
  servicos: () => http.get<PainelServicos>("/academia/servicos"),
  cadastrarServico: (d: DadosServico) => http.post<Servico>("/academia/servicos", d),
  atualizarServico: (id: string, d: DadosServico) => http.put<Servico>(`/academia/servicos/${id}`, d),
  vender: (v: NovaVenda) => http.post<Venda>("/academia/vendas", v),
  cancelarVenda: (id: string) => http.post<void>(`/academia/vendas/${id}/cancelar`),

  agenda: (inicio: string, dias = 7, profissionalId?: string) =>
    http.get<PainelAgenda>(
      `/academia/agenda?inicio=${inicio}&dias=${dias}${profissionalId ? `&profissionalId=${profissionalId}` : ""}`,
    ),
  marcar: (d: DadosAgendamento) => http.post<Agendamento>("/academia/agenda", d),
  alterar: (id: string, d: DadosAgendamento) => http.put<Agendamento>(`/academia/agenda/${id}`, d),
  mudarStatus: (id: string, status: StatusAgendamento, gerarCobranca = false) =>
    http.post<Agendamento>(`/academia/agenda/${id}/status`, { status, gerarCobranca }),

  grade: (semana?: string) => http.get<GradeAulas>(`/academia/aulas${semana ? `?semana=${semana}` : ""}`),
  cadastrarAula: (d: DadosAula) => http.post<Aula>("/academia/aulas", d),
  atualizarAula: (id: string, d: DadosAula) => http.put<Aula>(`/academia/aulas/${id}`, d),
  sessao: (horarioId: string, data: string) => http.get<SessaoAula>(`/academia/aulas/sessao/${horarioId}?data=${data}`),
  reservar: (horarioId: string, alunoId: string, data: string) =>
    http.post<SessaoAula>(`/academia/aulas/sessao/${horarioId}/reservar`, { alunoId, data }),
  cancelarReserva: (horarioId: string, alunoId: string, data: string) =>
    http.post<SessaoAula>(`/academia/aulas/sessao/${horarioId}/cancelar`, { alunoId, data }),
  chamada: (horarioId: string, alunoId: string, data: string, status: StatusPresenca) =>
    http.post<SessaoAula>(`/academia/aulas/sessao/${horarioId}/chamada`, { alunoId, data, status }),
  adicionarFixo: (horarioId: string, alunoId: string) =>
    http.post<void>(`/academia/aulas/horarios/${horarioId}/turma`, { alunoId }),
  removerFixo: (horarioId: string, alunoId: string) =>
    http.post<void>(`/academia/aulas/horarios/${horarioId}/turma/${alunoId}/remover`),

  aulasDoAluno: (alunoId: string) => http.get<AulasDoAluno>(`/area-cliente/${alunoId}/aulas`),
  reservarComoAluno: (alunoId: string, horarioId: string, data: string) =>
    http.post<void>(`/area-cliente/${alunoId}/aulas/reservar`, { horarioId, data }),
  cancelarComoAluno: (alunoId: string, horarioId: string, data: string) =>
    http.post<void>(`/area-cliente/${alunoId}/aulas/cancelar`, { horarioId, data }),
};

// ---------- Textos e cores ----------

export const rotuloCategoria: Record<CategoriaServico, string> = {
  personal: "Personal trainer",
  avaliacao: "Avaliação",
  nutricao: "Nutrição",
  fisioterapia: "Fisioterapia",
  massagem: "Massagem",
  aula_avulsa: "Aula avulsa",
  day_use: "Day use",
  outro: "Outro",
};

export const rotuloStatusAgendamento: Record<StatusAgendamento, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  concluido: "Concluído",
  faltou: "Faltou",
  cancelado: "Cancelado",
};

export const corStatusAgendamento: Record<StatusAgendamento, string> = {
  agendado: "bg-sky-500/15 text-sky-300",
  confirmado: "bg-violet-500/20 text-violet-200",
  concluido: "bg-emerald-500/15 text-emerald-300",
  faltou: "bg-red-500/15 text-red-300",
  cancelado: "bg-slate-500/20 text-slate-400",
};

export const rotuloPresenca: Record<StatusPresenca, string> = {
  reservado: "Esperado",
  presente: "Presente",
  faltou: "Faltou",
  cancelado: "Não vai",
};

// Cores das aulas: fundo, borda e texto.
export const corAula: Record<CorAula, { fundo: string; borda: string; texto: string; ponto: string }> = {
  violeta: { fundo: "bg-violet-500/15", borda: "border-violet-500/50", texto: "text-violet-200", ponto: "bg-violet-400" },
  azul: { fundo: "bg-blue-500/15", borda: "border-blue-500/50", texto: "text-blue-200", ponto: "bg-blue-400" },
  verde: { fundo: "bg-emerald-500/15", borda: "border-emerald-500/50", texto: "text-emerald-200", ponto: "bg-emerald-400" },
  laranja: { fundo: "bg-orange-500/15", borda: "border-orange-500/50", texto: "text-orange-200", ponto: "bg-orange-400" },
  rosa: { fundo: "bg-pink-500/15", borda: "border-pink-500/50", texto: "text-pink-200", ponto: "bg-pink-400" },
  ciano: { fundo: "bg-cyan-500/15", borda: "border-cyan-500/50", texto: "text-cyan-200", ponto: "bg-cyan-400" },
};

export const coresAula = Object.keys(corAula) as CorAula[];

export const diasSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

// ---------- Datas ----------

// "2026-09-25" -> Date local (meia-noite)
export function dataLocal(iso: string) {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(a, m - 1, d);
}

export function isoDe(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function somarDias(iso: string, dias: number) {
  const d = dataLocal(iso);
  d.setDate(d.getDate() + dias);
  return isoDe(d);
}

// Segunda-feira da semana da data.
export function segundaDa(iso: string) {
  const d = dataLocal(iso);
  const dia = (d.getDay() + 6) % 7; // 0 = segunda
  d.setDate(d.getDate() - dia);
  return isoDe(d);
}

// "sex, 25/09"
export function diaCurto(iso: string) {
  const d = dataLocal(iso);
  const semana = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
  return `${semana}, ${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;
}

// "14:30" de um instante ISO
export function horaDe(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
