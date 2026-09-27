// Página de vendas (/g/<slug>) e área do membro (/membro/<codigo>): abertas
// pelos clientes, sem login no painel.
// Contrato com o backend: backend/src/main/java/br/com/clienteplus/modulos/grupovip/PublicoContrato.java

import type { Plataforma, Situacao } from "./grupo-vip";
import type { Chamado } from "./grupo-vip-financeiro";
import { http } from "./http";

export type GrupoPublico = { id: string; nome: string; plataforma: Plataforma; descricao: string };

export type PlanoPublico = {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  duracaoMeses: number;
  grupos: GrupoPublico[];
};

export type PaginaVendas = {
  nome: string;
  slug: string;
  descricao: string;
  beneficios: string[];
  fotoCapa: string | null;
  whatsappSuporte: string | null;
  planos: PlanoPublico[];
  indicadoPor: string | null;
  membros: number;
};

export type PedidoCheckout = {
  planoId: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  telegramUsuario: string;
  cupom: string;
  ref: string | null;
};

export type CobrancaArea = {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: "pendente" | "atrasada" | "paga" | "cancelada";
  pagoEm: string | null;
  formaPagamento: string | null;
  pix: { copiaECola: string; chave: string; recebedor: string } | null;
};

export type AreaMembro = {
  negocio: string;
  whatsappSuporte: string | null;
  paginaVendas: string;
  nome: string;
  codigo: string;
  situacao: Situacao;
  diasAtraso: number;
  toleranciaDias: number;
  plano: PlanoPublico | null;
  assinaturaStatus: "ativa" | "cancelada" | null;
  proximoVencimento: string | null;
  pagoAte: string | null;
  grupos: {
    id: string;
    nome: string;
    plataforma: Plataforma;
    descricao: string;
    modo: "automatico" | "assistido";
    status: "no_grupo" | "convidado" | "removido" | null;
    link: string | null;
  }[];
  cobrancas: CobrancaArea[];
  telegram: { roboAtivo: boolean; conectado: boolean; usuario: string | null; linkRobo: string | null };
  conteudos: {
    id: string;
    titulo: string;
    texto: string;
    categoria: string | null;
    cor: string | null;
    midiaUrl: string | null;
    midiaTipo: "imagem" | "video" | null;
    link: string | null;
    publicadoEm: string;
    visto: boolean;
  }[];
  lives: {
    id: string;
    titulo: string;
    descricao: string;
    foto: string | null;
    link: string | null;
    comecaEm: string;
    duracaoMinutos: number;
    status: "agendado" | "ao_vivo" | "encerrado";
  }[];
  indicacao: {
    link: string;
    percentuais: number[];
    indicados: { nome: string; ativo: boolean; desde: string }[];
    ganho: number;
    disponivel: number;
    emAnalise: number;
    sacado: number;
    comissoes: { data: string; de: string; nivel: number; valor: number }[];
    saques: { id: string; data: string; valor: number; status: "solicitado" | "pago" | "recusado"; motivo: string | null }[];
  };
  chamados: Chamado[];
  planos: PlanoPublico[];
  pixConfigurado: boolean;
};

export const apiPublico = {
  pagina: (slug: string, ref?: string) =>
    http.get<PaginaVendas>(`/grupo-vip/publico/${slug}${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`),
  cupom: (slug: string, codigo: string, planoId: string) =>
    http.get<{ codigo: string; desconto: number; valorFinal: number }>(
      `/grupo-vip/publico/${slug}/cupom?codigo=${encodeURIComponent(codigo)}&planoId=${planoId}`,
    ),
  checkout: (slug: string, pedido: PedidoCheckout) =>
    http.post<{ codigo: string }>(`/grupo-vip/publico/${slug}/checkout`, pedido),

  area: (codigo: string) => http.get<AreaMembro>(`/grupo-vip/membro/${codigo}`),
  simularPagamento: (codigo: string, cobrancaId: string) =>
    http.post<AreaMembro>(`/grupo-vip/membro/${codigo}/cobrancas/${cobrancaId}/simular-pagamento`),
  assinar: (codigo: string, planoId: string) => http.post<AreaMembro>(`/grupo-vip/membro/${codigo}/assinar`, { planoId }),
  cancelar: (codigo: string) => http.post<AreaMembro>(`/grupo-vip/membro/${codigo}/cancelar`),
  gerarLink: (codigo: string, grupoId: string) =>
    http.post<AreaMembro>(`/grupo-vip/membro/${codigo}/grupos/${grupoId}/link`),
  ver: (codigo: string, conteudoId: string) => http.post<void>(`/grupo-vip/membro/${codigo}/conteudos/${conteudoId}/ver`),
  sacar: (codigo: string, valor: number, chavePix: string) =>
    http.post<AreaMembro>(`/grupo-vip/membro/${codigo}/saques`, { valor, chavePix }),
  abrirChamado: (codigo: string, assunto: string, texto: string) =>
    http.post<AreaMembro>(`/grupo-vip/membro/${codigo}/chamados`, { assunto, texto }),
  responderChamado: (codigo: string, id: string, texto: string) =>
    http.post<AreaMembro>(`/grupo-vip/membro/${codigo}/chamados/${id}`, { texto }),
};
