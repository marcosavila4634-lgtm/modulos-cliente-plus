// Financeiro, relatórios, suporte e configurações do módulo Grupos VIP.
// Contratos com o backend (pacote grupovip): FinanceiroContrato.java, Relatorios.java,
// Suporte.java, ConfiguracoesResource.java.

import type { Plataforma, Situacao } from "./grupo-vip";
import type { Cobranca, GrupoDetectado } from "./grupo-vip-membros";
import { http } from "./http";

export type Receitas = {
  mes: string;
  resumo: {
    recebido: number;
    qtdRecebido: number;
    recebidoMesAnterior: number;
    aReceber: number;
    qtdAReceber: number;
    emAtraso: number;
    qtdEmAtraso: number;
    ticketMedio: number;
  };
  porDia: { dia: string; valor: number }[];
  porPlano: { nome: string; valor: number; quantidade: number }[];
  porForma: { nome: string; valor: number; quantidade: number }[];
  recebidas: Cobranca[];
  emAberto: Cobranca[];
};

export type AssinaturaLinha = {
  clienteId: string;
  nome: string;
  telefone: string | null;
  plano: string;
  valor: number;
  duracaoMeses: number;
  inicio: string;
  situacao: Situacao;
  proximoVencimento: string | null;
  proximaCobrancaId: string | null;
  proximoValor: number | null;
  pagoAte: string | null;
  canceladaEm: string | null;
};

export type Assinaturas = {
  assinaturas: AssinaturaLinha[];
  receitaMensal: number;
  previsao30Dias: number;
  ativas: number;
  canceladasMes: number;
};

export type Saque = {
  id: string;
  clienteId: string;
  nome: string;
  telefone: string | null;
  valor: number;
  chavePix: string;
  status: "solicitado" | "pago" | "recusado";
  motivo: string | null;
  createdAt: string;
  pagoEm: string | null;
  saldoDisponivel: number;
};

export type Indicador = {
  clienteId: string;
  nome: string;
  indicados: number;
  indicadosAtivos: number;
  comissaoMes: number;
  comissaoTotal: number;
  saldo: number;
};

export type Saques = {
  saques: Saque[];
  aPagar: number;
  pagoMes: number;
  comissoesMes: number;
  indicadores: Indicador[];
  comissoesRecentes: {
    data: string;
    beneficiario: string;
    pagador: string;
    nivel: number;
    percentual: number;
    valorPagamento: number;
    valor: number;
  }[];
  percentuais: number[];
};

export type Relatorio = {
  meses: { mes: string; rotulo: string; novos: number; saidas: number; ativos: number; receita: number }[];
  retencao: {
    mediaMeses: number;
    cancelamentoMes: number;
    porPlano: { plano: string; ativos: number; mediaMeses: number; receitaTotal: number }[];
  };
  receitaPorGrupo: { grupo: string; plataforma: Plataforma; receita: number; membros: number }[];
  origens: { origem: string; quantidade: number }[];
  inadimplencia: {
    clienteId: string;
    nome: string;
    telefone: string | null;
    plano: string;
    valor: number;
    vencimento: string;
    dias: number;
    situacao: Situacao;
  }[];
  conteudos: { titulo: string; categoria: string | null; publicadoEm: string | null; visualizacoes: number; pessoas: number }[];
  indicadores: Indicador[];
};

export type Chamado = {
  id: string;
  clienteId: string;
  nome: string;
  telefone: string | null;
  situacao: Situacao | null;
  assunto: string;
  status: "aberto" | "respondido" | "resolvido";
  // área do membro ou conversa com o robô do Telegram
  origem: "area" | "telegram";
  createdAt: string;
  atualizadoEm: string;
  mensagens: { id: string; autor: "membro" | "equipe"; texto: string; createdAt: string }[];
};

export type Cupom = {
  id: string;
  codigo: string;
  tipo: "percentual" | "valor";
  valor: number;
  validade: string | null;
  limiteUsos: number | null;
  usos: number;
  ativo: boolean;
};

export type DadosCupom = Omit<Cupom, "id" | "usos">;

export type Configuracoes = {
  nomeNegocio: string;
  slug: string;
  descricaoPagina: string;
  beneficios: string;
  fotoCapa: string | null;
  gestorNome: string;
  gestorSobrenome: string;
  gestorCargo: string;
  frase: string;
  fraseDestaque: string;
  toleranciaDias: number;
  chavePix: string | null;
  nomeRecebedor: string | null;
  cidadeRecebedor: string | null;
  whatsappSuporte: string | null;
  robo: { conectado: boolean; usuario: string | null; erro: string | null; ultimaConsulta: string | null };
  paginaVendas: string;
  enderecoPublico: string;
  cupons: Cupom[];
  detectados: GrupoDetectado[];
};

export type DadosConfiguracoes = Omit<Configuracoes, "robo" | "paginaVendas" | "enderecoPublico" | "cupons" | "detectados">;

export const apiFinanceiro = {
  receitas: (mes?: string) => http.get<Receitas>(`/grupo-vip/financeiro/receitas${mes ? `?mes=${mes}` : ""}`),
  assinaturas: () => http.get<Assinaturas>("/grupo-vip/financeiro/assinaturas"),
  saques: () => http.get<Saques>("/grupo-vip/financeiro/saques"),
  pagarSaque: (id: string) => http.post<Saques>(`/grupo-vip/financeiro/saques/${id}/pagar`),
  recusarSaque: (id: string, motivo: string) => http.post<Saques>(`/grupo-vip/financeiro/saques/${id}/recusar`, { motivo }),
  relatorios: (meses = 12) => http.get<Relatorio>(`/grupo-vip/relatorios?meses=${meses}`),
};

export const apiSuporte = {
  listar: () => http.get<Chamado[]>("/grupo-vip/suporte"),
  responder: (id: string, texto: string) => http.post<Chamado[]>(`/grupo-vip/suporte/${id}/responder`, { texto }),
  resolver: (id: string) => http.post<Chamado[]>(`/grupo-vip/suporte/${id}/resolver`),
  reabrir: (id: string) => http.post<Chamado[]>(`/grupo-vip/suporte/${id}/reabrir`),
};

export const apiConfig = {
  buscar: () => http.get<Configuracoes>("/grupo-vip/configuracoes"),
  salvar: (d: DadosConfiguracoes) => http.put<Configuracoes>("/grupo-vip/configuracoes", d),
  conectarRobo: (token: string) => http.post<Configuracoes>("/grupo-vip/configuracoes/robo", { token }),
  desconectarRobo: () => http.del<Configuracoes>("/grupo-vip/configuracoes/robo"),
  criarCupom: (d: DadosCupom) => http.post<Configuracoes>("/grupo-vip/configuracoes/cupons", d),
  atualizarCupom: (id: string, d: DadosCupom) => http.put<Configuracoes>(`/grupo-vip/configuracoes/cupons/${id}`, d),
  excluirCupom: (id: string) => http.del<Configuracoes>(`/grupo-vip/configuracoes/cupons/${id}`),
};

// Mês "2026-09" -> "Setembro de 2026"
export function nomeMes(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  const t = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(a, m - 1, 1));
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function somarMes(mes: string, n: number) {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(a, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
