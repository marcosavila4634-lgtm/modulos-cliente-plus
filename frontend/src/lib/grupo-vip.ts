// Dashboard do módulo Grupos VIP e formatos usados em todas as telas.
// Contrato com o backend: backend/src/main/java/br/com/clienteplus/modulos/grupovip/DashboardGrupoVip.java

import { http } from "./http";

export type Plataforma = "telegram" | "whatsapp";

export type Situacao =
  | "em_dia"
  | "vencendo"
  | "atrasado"
  | "bloqueado"
  | "aguardando_pagamento"
  | "cancelando"
  | "sem_plano";

export type ComMesAnterior = { valor: number; variacao: number; mesAnterior: number };

export type Alerta = { chave: string; titulo: string; descricao: string; quantidade: number; link: string };

export type DashboardGrupoVip = {
  grupoAtual: { nome: string };
  gestor: { nome: string; sobrenome: string; cargo: string };
  frase: string;
  fraseDestaque: string;
  indicadores: {
    membrosAtivos: ComMesAnterior;
    conteudosPublicados: ComMesAnterior;
    visualizacoes: ComMesAnterior;
    receitaMes: ComMesAnterior;
    novosEsteMes: number;
    ticketMedio: number;
  };
  membrosRecentes: { id: string; nome: string; plano: string; grupo: string; data: string; situacao: Situacao }[];
  crescimentoMembros: { mes: string; membros: number; data?: string }[];
  conteudosMaisAcessados: { titulo: string; acessos: number }[];
  planosMembros: { nome: string; percentual: number; quantidade: number }[];
  avisos: {
    tipo: "conteudo" | "manutencao" | "live" | "material" | "promocao";
    titulo: string;
    quando: string;
    destinatarios: number;
  }[];
  grupos: {
    id: string;
    nome: string;
    plataforma: Plataforma;
    membros: number;
    cor: "blue" | "sky" | "violet" | "indigo" | "amber";
    automatico: boolean;
  }[];
  proximosEventos: { id: string; titulo: string; foto: string | null; quando: string; status: "ao_vivo" | "agendado" }[];
  pendencias: {
    adicionar: number;
    remover: number;
    aguardando: number;
    mensagensWhatsapp: number;
    publicacoesManuais: number;
    chamadosAbertos: number;
    saquesSolicitados: number;
    cobrancasAtrasadas: number;
  };
  alertas: Alerta[];
  roboConectado: boolean;
  paginaVendas: string;
};

export const buscarDashboard = () => http.get<DashboardGrupoVip>("/grupo-vip/dashboard");

// ---------- Textos ----------

export const rotuloSituacao: Record<Situacao, string> = {
  em_dia: "Em dia",
  vencendo: "Vence em breve",
  atrasado: "Atrasado",
  bloqueado: "Bloqueado",
  aguardando_pagamento: "Aguardando pagamento",
  cancelando: "Cancelou",
  sem_plano: "Sem acesso",
};

export const explicacaoSituacao: Record<Situacao, string> = {
  em_dia: "Pagamento em dia, com acesso aos grupos.",
  vencendo: "A mensalidade vence nos próximos dias. Continua com acesso.",
  atrasado: "Mensalidade vencida, ainda dentro da tolerância. Continua com acesso.",
  bloqueado: "Sem acesso: atraso maior que a tolerância ou bloqueio manual.",
  aguardando_pagamento: "Assinou e ainda não pagou a primeira mensalidade.",
  cancelando: "Cancelou a assinatura. Tem acesso até o fim do período pago.",
  sem_plano: "Sem assinatura ativa.",
};

export const nomePlataforma: Record<Plataforma, string> = { telegram: "Telegram", whatsapp: "WhatsApp" };

export type FormaPagamento = "dinheiro" | "pix" | "cartao_credito" | "cartao_debito" | "boleto";

export const rotuloForma: Record<string, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  boleto: "Boleto",
  cortesia: "Cortesia",
};

// ---------- Formatos ----------

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const numero = new Intl.NumberFormat("pt-BR");

export const formatar = {
  moeda: (v: number) => moeda.format(v),
  numero: (v: number) => numero.format(v),
  // 1500 -> "1,5k"
  curto: (v: number) =>
    v < 1000 ? String(v) : `${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k`,
  // "2025-09-09" ou "2025-09-09T10:00:00Z" -> "09/09/2025"
  data: (iso: string | null | undefined) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "—"),
  // instante -> "27/09 às 14:30"
  diaHora: (iso: string | null | undefined) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} às ${String(
      d.getHours(),
    ).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  },
  // "11987654321" -> "(11) 98765-4321"
  telefone: (t: string | null | undefined) => {
    if (!t) return "—";
    const m = t.match(/^(\d{2})(\d{4,5})(\d{4})$/);
    return m ? `(${m[1]}) ${m[2]}-${m[3]}` : t;
  },
  cpf: (c: string | null | undefined) => (c ? c.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4") : "—"),
};

// 1 -> "por mês", 3 -> "a cada 3 meses"
export function periodicidade(meses: number) {
  return meses === 1 ? "por mês" : `a cada ${meses} meses`;
}

// Data de hoje no formato do campo <input type="date">.
export function hojeIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Quantos dias faltam (positivo) ou passaram (negativo) até a data.
export function diasAte(iso: string) {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  const alvo = new Date(a, m - 1, d).getTime();
  const [ha, hm, hd] = hojeIso().split("-").map(Number);
  return Math.round((alvo - new Date(ha, hm - 1, hd).getTime()) / 86_400_000);
}

// "vence hoje", "vence em 3 dias", "venceu há 5 dias"
export function prazo(iso: string) {
  const dias = diasAte(iso);
  if (dias === 0) return "vence hoje";
  if (dias === 1) return "vence amanhã";
  if (dias > 1) return `vence em ${dias} dias`;
  return dias === -1 ? "venceu ontem" : `venceu há ${-dias} dias`;
}

// "há 5 min", "há 3 horas", "há 2 dias"
export function haQuanto(iso: string) {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return h === 1 ? "há 1 hora" : `há ${h} horas`;
  const d = Math.round(h / 24);
  return d === 1 ? "há 1 dia" : `há ${d} dias`;
}

export function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

// Compara sem acentos e sem maiúsculas: "joao" encontra "João".
export const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Link do WhatsApp (telefone brasileiro com DDD) com mensagem pronta.
export function linkWhatsapp(telefone: string | null | undefined, mensagem = "") {
  if (!telefone) return null;
  return `https://wa.me/55${telefone}${mensagem ? `?text=${encodeURIComponent(mensagem)}` : ""}`;
}

// Copia um texto; devolve false se o navegador não deixar.
export async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    // http sem https (ex.: celular na rede): usa o jeito antigo
    const area = document.createElement("textarea");
    area.value = texto;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

// Baixa uma planilha CSV (abre no Excel). Usa ";" e BOM, como o Excel em português espera.
export function baixarCsv(nome: string, cabecalho: string[], linhas: (string | number | null | undefined)[][]) {
  const celula = (v: string | number | null | undefined) => {
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
