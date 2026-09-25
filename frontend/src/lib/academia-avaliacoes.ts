// Avaliação física.
// Contrato com o backend: backend/src/main/java/br/com/clienteplus/modulos/academia/AvaliacoesContrato.java

import { http } from "./http";

export type Sexo = "M" | "F";
export type MetodoGordura = "nenhum" | "bioimpedancia" | "dobras_pollock7";
export type ClassificacaoImc = "abaixo" | "normal" | "sobrepeso" | "obesidade_1" | "obesidade_2" | "obesidade_3";
export type SituacaoAvaliacao = "sem_avaliacao" | "pendente" | "em_dia";

export type Dobras = {
  peitoral: number | null;
  axilar: number | null;
  triceps: number | null;
  subescapular: number | null;
  abdominal: number | null;
  suprailiaca: number | null;
  coxa: number | null;
};

export type Medidas = {
  peitoral: number | null;
  cintura: number | null;
  abdomen: number | null;
  quadril: number | null;
  bracoDireito: number | null;
  bracoEsquerdo: number | null;
  coxaDireita: number | null;
  coxaEsquerda: number | null;
  panturrilha: number | null;
};

export type Avaliacao = {
  id: string;
  aluno: { id: string; nome: string };
  profissional: { id: string; nome: string } | null;
  data: string;
  sexo: Sexo;
  idade: number | null;
  peso: number;
  alturaCm: number;
  imc: number;
  classificacaoImc: ClassificacaoImc;
  metodoGordura: MetodoGordura;
  gorduraPct: number | null;
  massaGordaKg: number | null;
  massaMagraKg: number | null;
  relacaoCinturaQuadril: number | null;
  dobras: Dobras;
  medidas: Medidas;
  pressaoSistolica: number | null;
  pressaoDiastolica: number | null;
  fcRepouso: number | null;
  objetivo: string;
  restricoes: string;
  observacoes: string;
};

export type DadosAvaliacao = {
  alunoId: string;
  profissionalId: string | null;
  data: string;
  sexo: Sexo | null;
  idade: number | null;
  peso: number | null;
  alturaCm: number | null;
  metodoGordura: MetodoGordura;
  gorduraPct: number | null;
  dobras: Dobras;
  medidas: Medidas;
  pressaoSistolica: number | null;
  pressaoDiastolica: number | null;
  fcRepouso: number | null;
  objetivo: string;
  restricoes: string;
  observacoes: string;
};

export type AlunoAvaliacao = {
  alunoId: string;
  nome: string;
  situacao: SituacaoAvaliacao;
  ultima: string | null;
  proxima: string | null;
  total: number;
  peso: number | null;
  gorduraPct: number | null;
};

export type PainelAvaliacoes = {
  reavaliacaoDias: number;
  alunos: AlunoAvaliacao[];
  recentes: Avaliacao[];
  contagem: { todos: number; semAvaliacao: number; pendentes: number; emDia: number; noMes: number };
};

export type HistoricoAvaliacoes = {
  aluno: { id: string; nome: string };
  idadeAtual: number | null;
  sexo: Sexo | null;
  situacao: SituacaoAvaliacao;
  proxima: string | null;
  avaliacoes: Avaliacao[];
};

export const apiAvaliacoes = {
  painel: () => http.get<PainelAvaliacoes>("/academia/avaliacoes"),
  historico: (alunoId: string) => http.get<HistoricoAvaliacoes>(`/academia/avaliacoes/aluno/${alunoId}`),
  buscar: (id: string) => http.get<Avaliacao>(`/academia/avaliacoes/${id}`),
  cadastrar: (d: DadosAvaliacao) => http.post<Avaliacao>("/academia/avaliacoes", d),
  atualizar: (id: string, d: DadosAvaliacao) => http.put<Avaliacao>(`/academia/avaliacoes/${id}`, d),
  excluir: (id: string) => http.post<void>(`/academia/avaliacoes/${id}/excluir`),
};

// ---------- Textos ----------

export const rotuloImc: Record<ClassificacaoImc, string> = {
  abaixo: "Abaixo do peso",
  normal: "Peso normal",
  sobrepeso: "Sobrepeso",
  obesidade_1: "Obesidade grau I",
  obesidade_2: "Obesidade grau II",
  obesidade_3: "Obesidade grau III",
};

export const corImc: Record<ClassificacaoImc, string> = {
  abaixo: "text-sky-300",
  normal: "text-emerald-300",
  sobrepeso: "text-amber-300",
  obesidade_1: "text-orange-300",
  obesidade_2: "text-red-300",
  obesidade_3: "text-red-400",
};

export const rotuloMetodo: Record<MetodoGordura, string> = {
  nenhum: "Não medido",
  bioimpedancia: "Bioimpedância (balança)",
  dobras_pollock7: "7 dobras (Pollock)",
};

export const rotuloSituacaoAvaliacao: Record<SituacaoAvaliacao, string> = {
  sem_avaliacao: "Sem avaliação",
  pendente: "Reavaliação pendente",
  em_dia: "Em dia",
};

export const camposDobras: { campo: keyof Dobras; rotulo: string }[] = [
  { campo: "peitoral", rotulo: "Peitoral" },
  { campo: "axilar", rotulo: "Axilar média" },
  { campo: "triceps", rotulo: "Tricipital" },
  { campo: "subescapular", rotulo: "Subescapular" },
  { campo: "abdominal", rotulo: "Abdominal" },
  { campo: "suprailiaca", rotulo: "Suprailíaca" },
  { campo: "coxa", rotulo: "Coxa" },
];

export const camposMedidas: { campo: keyof Medidas; rotulo: string }[] = [
  { campo: "peitoral", rotulo: "Peitoral" },
  { campo: "cintura", rotulo: "Cintura" },
  { campo: "abdomen", rotulo: "Abdômen" },
  { campo: "quadril", rotulo: "Quadril" },
  { campo: "bracoDireito", rotulo: "Braço direito" },
  { campo: "bracoEsquerdo", rotulo: "Braço esquerdo" },
  { campo: "coxaDireita", rotulo: "Coxa direita" },
  { campo: "coxaEsquerda", rotulo: "Coxa esquerda" },
  { campo: "panturrilha", rotulo: "Panturrilha" },
];

// ---------- Cálculos (os mesmos do backend, para mostrar enquanto digita) ----------

export function calcularImc(peso: number | null, alturaCm: number | null) {
  if (!peso || !alturaCm) return null;
  const m = alturaCm / 100;
  return Math.round((peso / (m * m)) * 10) / 10;
}

export function classificarImc(imc: number): ClassificacaoImc {
  if (imc < 18.5) return "abaixo";
  if (imc < 25) return "normal";
  if (imc < 30) return "sobrepeso";
  if (imc < 35) return "obesidade_1";
  if (imc < 40) return "obesidade_2";
  return "obesidade_3";
}

// % de gordura pelas 7 dobras (Jackson & Pollock + Siri).
export function pollock7(d: Dobras, sexo: Sexo | null, idade: number | null) {
  const valores = Object.values(d);
  if (!sexo || !idade || valores.some((v) => v === null || Number.isNaN(v))) return null;
  const s = (valores as number[]).reduce((a, b) => a + b, 0);
  const densidade =
    sexo === "F"
      ? 1.097 - 0.00046971 * s + 0.00000056 * s * s - 0.00012828 * idade
      : 1.112 - 0.00043499 * s + 0.00000055 * s * s - 0.00028826 * idade;
  return Math.round(Math.max(2, Math.min(60, (4.95 / densidade - 4.5) * 100)) * 10) / 10;
}

export const num = (v: number | null | undefined, casas = 1) =>
  v === null || v === undefined ? "—" : v.toLocaleString("pt-BR", { maximumFractionDigits: casas });

// Diferença para a avaliação anterior: "+1,2" / "−0,8"
export function diferenca(atual: number | null, anterior: number | null | undefined) {
  if (atual === null || anterior === null || anterior === undefined) return null;
  return Math.round((atual - anterior) * 10) / 10;
}
