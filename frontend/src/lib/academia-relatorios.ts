// Relatórios da academia.
// Contrato com o backend: backend/src/main/java/br/com/clienteplus/modulos/academia/RelatoriosContrato.java

import { http } from "./http";

export type FaixaSumido = "7_dias" | "14_dias" | "30_dias" | "nunca";

export type Relatorios = {
  dias: number;
  de: string;
  ate: string;
  alunos: {
    resumo: {
      ativos: number;
      novosPeriodo: number;
      canceladosPeriodo: number;
      churnMedio: number;
      ticketMedio: number;
      tempoMedioMeses: number;
    };
    meses: { mes: string; ano: number; ativosFim: number; novos: number; cancelados: number; churn: number }[];
    aniversariantes: { alunoId: string; nome: string; dia: number; idade: number | null; telefone: string | null }[];
  };
  frequencia: {
    mediaSemanalPorAluno: number;
    alunosQueVieram: number;
    ativos: number;
    sumidos: {
      alunoId: string;
      nome: string;
      telefone: string | null;
      plano: string;
      ultimaEntrada: string | null;
      diasSemVir: number | null;
      faixa: FaixaSumido;
    }[];
    maisFrequentes: { alunoId: string; nome: string; entradas: number }[];
  };
  inadimplencia: {
    total: number;
    alunos: number;
    devedores: {
      alunoId: string;
      nome: string;
      telefone: string | null;
      plano: string;
      vencimentoMaisAntigo: string;
      diasAtraso: number;
      mensalidades: number;
      valor: number;
    }[];
  };
  aulas: {
    aula: string;
    professor: string;
    sessoes: number;
    capacidade: number;
    mediaAlunos: number;
    ocupacao: number;
    presenca: number | null;
    faltas: number;
  }[];
  profissionais: {
    id: string;
    nome: string;
    especialidade: string;
    alunosComFicha: number;
    fichasMontadas: number;
    avaliacoes: number;
    atendimentos: number;
    aulasDadas: number;
    comissao: number;
  }[];
};

export const apiRelatorios = {
  montar: (dias = 30) => http.get<Relatorios>(`/academia/relatorios?dias=${dias}`),
};

export const rotuloFaixa: Record<FaixaSumido, string> = {
  "7_dias": "7 a 13 dias",
  "14_dias": "14 a 29 dias",
  "30_dias": "30 dias ou mais",
  nunca: "Nunca veio",
};

// Baixa uma planilha CSV (abre no Excel/Google Planilhas). Usa ";" e BOM,
// como o Excel em português espera.
export function baixarCsv(nome: string, cabecalho: string[], linhas: (string | number | null)[][]) {
  const celula = (v: string | number | null) => {
    if (v === null || v === undefined) return "";
    const t = typeof v === "number" ? String(v).replace(".", ",") : v;
    return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const texto = [cabecalho, ...linhas].map((l) => l.map(celula).join(";")).join("\r\n");
  const blob = new Blob(["﻿" + texto], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nome}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Link do WhatsApp com mensagem pronta.
export function whatsapp(telefone: string | null, mensagem: string) {
  if (!telefone) return null;
  return `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
}
