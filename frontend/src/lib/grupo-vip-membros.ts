// Membros, planos, grupos e controle de acesso do módulo Grupos VIP.
// Contratos com o backend (pacote grupovip): MembrosContrato.java, GruposResource.java,
// AcessosContrato.java, FinanceiroContrato.java (Cobranca).

import type { FormaPagamento, Plataforma, Situacao } from "./grupo-vip";
import { http } from "./http";

export type Opcao = { id: string; nome: string };

export type Plano = {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  duracaoMeses: number;
  participaIndicacoes: boolean;
  ativo: boolean;
  grupos: Opcao[];
  assinantes: number;
  // grupoId -> o que quem assina pode fazer no grupo (Telegram com o robô)
  permissoes: Record<string, NivelPermissao>;
};

// completo = tudo o que o grupo permite | sem_midia = só texto | leitura = só lê
export type NivelPermissao = "completo" | "sem_midia" | "leitura";

export const rotuloNivel: Record<NivelPermissao, string> = {
  completo: "Tudo liberado",
  sem_midia: "Só texto (sem fotos, vídeos e arquivos)",
  leitura: "Só leitura",
};

// Direitos de administrador (nomes da API do Telegram).
export const direitosAdmin: { valor: string; rotulo: string }[] = [
  { valor: "can_delete_messages", rotulo: "Apagar mensagens" },
  { valor: "can_restrict_members", rotulo: "Silenciar e banir membros" },
  { valor: "can_pin_messages", rotulo: "Fixar mensagens" },
  { valor: "can_invite_users", rotulo: "Convidar pessoas" },
  { valor: "can_change_info", rotulo: "Mudar nome, foto e descrição" },
  { valor: "can_manage_topics", rotulo: "Gerenciar tópicos" },
  { valor: "can_manage_video_chats", rotulo: "Fazer lives (chamadas de vídeo)" },
];

// Permissão do membro num grupo do Telegram com o robô (Permissoes.java).
export type PermissaoMembro = {
  efetiva: NivelPermissao;
  origem: "plano" | "atraso" | "manual" | "administrador";
  administrador: boolean;
  direitos: string[];
  titulo: string | null;
  // escolhido na ficha (null = segue o plano)
  nivel: NivelPermissao | null;
  nivelAte: string | null;
  doPlano: NivelPermissao;
  // o robô já aplicou no Telegram
  aplicada: boolean;
  erro: string | null;
};

export type DadosPermissao = {
  nivel: NivelPermissao | null;
  nivelAte: string | null;
  administrador: boolean;
  direitos: string[];
  titulo: string | null;
};

export type MembroResumo = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  telegramUsuario: string | null;
  telegramConectado: boolean;
  plano: string | null;
  proximoVencimento: string | null;
  pagoAte: string | null;
  situacao: Situacao;
  diasAtraso: number;
  gruposDentro: number;
  gruposComDireito: number;
  membroDesde: string;
  origem: "manual" | "pagina";
  indicadoPor: string | null;
};

export type ListaMembros = {
  membros: MembroResumo[];
  contagem: Record<"todos" | Situacao, number>;
  planos: Plano[];
};

export type StatusCobranca = "pendente" | "atrasada" | "paga" | "cancelada";

export type Cobranca = {
  id: string;
  clienteId: string;
  nome: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: StatusCobranca;
  pagoEm: string | null;
  formaPagamento: FormaPagamento | null;
  origem: "pagina" | "painel";
};

export type AcaoAcesso = "adicionar" | "aguardando" | "remover";

export type GrupoDoMembro = {
  grupoId: string;
  nome: string;
  plataforma: Plataforma;
  automatico: boolean;
  direito: boolean;
  status: "convidado" | "no_grupo" | "removido" | null;
  conviteLink: string | null;
  entrouEm: string | null;
  pendencia: AcaoAcesso | null;
  // só grupos do Telegram com o robô
  permissao: PermissaoMembro | null;
};

export type StatusMensagem = "pendente" | "enviada" | "falhou" | "descartada";

export type Mensagem = {
  id: string;
  clienteId: string;
  nome: string;
  telefone: string | null;
  tipo: string;
  canal: "telegram" | "whatsapp";
  texto: string;
  status: StatusMensagem;
  erro: string | null;
  criadaEm: string;
  enviadaEm: string | null;
  whatsapp: string | null;
};

export type EventoAcesso = {
  id: string;
  momento: string;
  clienteId: string;
  nome: string;
  grupoId: string;
  grupo: string;
  plataforma: Plataforma;
  acao: "convite" | "entrou" | "removido" | "recusado";
  automatico: boolean;
  detalhe: string;
};

export type Pessoa = { id: string; nome: string; situacao: Situacao };

export type MembroDetalhe = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  cpf: string | null;
  dataNascimento: string | null;
  telegramUsuario: string | null;
  telegramConectado: boolean;
  observacoes: string;
  bloqueado: boolean;
  codigo: string;
  origem: "manual" | "pagina";
  membroDesde: string;
  situacao: Situacao;
  diasAtraso: number;
  motivoBloqueio: "manual" | "atraso" | null;
  toleranciaDias: number;
  assinatura: {
    id: string;
    plano: Plano;
    valor: number;
    inicio: string;
    status: "ativa" | "cancelada";
    proximoVencimento: string | null;
    proximaCobrancaId: string | null;
    proximoValor: number | null;
    pagoAte: string | null;
    canceladaEm: string | null;
  } | null;
  grupos: GrupoDoMembro[];
  cobrancas: Cobranca[];
  historico: EventoAcesso[];
  mensagens: Mensagem[];
  indicadoPor: Pessoa | null;
  indicados: Pessoa[];
  comissaoTotal: number;
  saldoComissao: number;
  links: { areaMembro: string; indicacao: string; robo: string | null };
};

export type DadosMembro = {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  dataNascimento: string | null;
  telegramUsuario: string;
  observacoes: string;
};

export type NovoMembro = DadosMembro & {
  planoId: string | null;
  inicio: string | null;
  formaPagamento: FormaPagamento | null;
};

// ---------- Grupos e planos ----------

export type CorGrupo = "blue" | "sky" | "violet" | "indigo" | "amber";

export type Grupo = {
  id: string;
  nome: string;
  descricao: string;
  plataforma: Plataforma;
  cor: CorGrupo;
  linkConvite: string | null;
  telegramChatId: string | null;
  ativo: boolean;
  automatico: boolean;
  noGrupo: number;
  comDireito: number;
  planos: Opcao[];
  createdAt: string;
};

export type GrupoDetectado = { chatId: string; titulo: string; administrador: boolean; visto: string };

export type Grupos = {
  grupos: Grupo[];
  planos: Plano[];
  paginaVendas: string;
  robo: { conectado: boolean; usuario: string | null; erro: string | null };
  detectados: GrupoDetectado[];
};

export type DadosGrupo = {
  nome: string;
  descricao: string;
  plataforma: Plataforma;
  cor: CorGrupo;
  linkConvite: string;
  telegramChatId: string;
  ativo: boolean;
};

export type DadosPlano = {
  nome: string;
  descricao: string;
  preco: number;
  duracaoMeses: number;
  participaIndicacoes: boolean;
  ativo: boolean;
  grupoIds: string[];
  permissoes: Record<string, NivelPermissao>;
};

// ---------- Controle de acesso ----------

export type Pendencia = {
  clienteId: string;
  nome: string;
  telefone: string | null;
  telegramUsuario: string | null;
  telegramConectado: boolean;
  grupoId: string;
  grupo: string;
  plataforma: Plataforma;
  automatico: boolean;
  acao: AcaoAcesso;
  situacao: Situacao;
  motivo: string | null;
  conviteLink: string | null;
  desde: string | null;
};

export type PainelAcessos = {
  pendencias: Pendencia[];
  historico: EventoAcesso[];
  robo: { conectado: boolean; usuario: string | null; erro: string | null; ultimaConsulta: string | null };
  grupos: { id: string; nome: string; plataforma: Plataforma; automatico: boolean; noGrupo: number; comDireito: number }[];
  toleranciaDias: number;
};

export type ResultadoAutomacao = {
  convidados: number;
  removidos: number;
  mensagensCriadas: number;
  mensagensEnviadas: number;
  conteudosPublicados: number;
  livesAvisadas: number;
  erros: string[];
};

export const apiMembros = {
  listar: () => http.get<ListaMembros>("/grupo-vip/membros"),
  buscar: (id: string) => http.get<MembroDetalhe>(`/grupo-vip/membros/${id}`),
  cadastrar: (dados: NovoMembro) => http.post<MembroDetalhe>("/grupo-vip/membros", dados),
  atualizar: (id: string, dados: DadosMembro) => http.put<MembroDetalhe>(`/grupo-vip/membros/${id}`, dados),
  assinar: (id: string, planoId: string, inicio: string, formaPagamento: FormaPagamento | null) =>
    http.post<MembroDetalhe>(`/grupo-vip/membros/${id}/assinatura`, { planoId, inicio, formaPagamento }),
  cancelar: (id: string) => http.post<MembroDetalhe>(`/grupo-vip/membros/${id}/assinatura/cancelar`),
  bloquear: (id: string, bloqueado: boolean) =>
    http.post<MembroDetalhe>(`/grupo-vip/membros/${id}/bloquear`, { bloqueado }),
  receber: (cobrancaId: string, formaPagamento: FormaPagamento) =>
    http.post<MembroDetalhe>(`/grupo-vip/membros/cobrancas/${cobrancaId}/receber`, { formaPagamento }),
  mensagem: (id: string, texto: string) => http.post<Mensagem>(`/grupo-vip/membros/${id}/mensagem`, { texto }),
  permissoes: (id: string, grupoId: string, d: DadosPermissao) =>
    http.put<MembroDetalhe>(`/grupo-vip/membros/${id}/permissoes/${grupoId}`, d),
};

export const apiGrupos = {
  listar: () => http.get<Grupos>("/grupo-vip/grupos"),
  criar: (d: DadosGrupo) => http.post<Grupos>("/grupo-vip/grupos", d),
  atualizar: (id: string, d: DadosGrupo) => http.put<Grupos>(`/grupo-vip/grupos/${id}`, d),
  excluir: (id: string) => http.del<Grupos>(`/grupo-vip/grupos/${id}`),
  criarPlano: (d: DadosPlano) => http.post<Grupos>("/grupo-vip/planos", d),
  atualizarPlano: (id: string, d: DadosPlano) => http.put<Grupos>(`/grupo-vip/planos/${id}`, d),
};

export const apiAcessos = {
  painel: () => http.get<PainelAcessos>("/grupo-vip/acessos"),
  sincronizar: () => http.post<ResultadoAutomacao>("/grupo-vip/acessos/sincronizar"),
  convidar: (grupoId: string, clienteId: string) =>
    http.post<{ link: string | null; whatsapp: string | null }>(`/grupo-vip/acessos/${grupoId}/${clienteId}/convidar`),
  entrou: (grupoId: string, clienteId: string) => http.post<void>(`/grupo-vip/acessos/${grupoId}/${clienteId}/entrou`),
  removido: (grupoId: string, clienteId: string) =>
    http.post<void>(`/grupo-vip/acessos/${grupoId}/${clienteId}/removido`),
  remover: (grupoId: string, clienteId: string) => http.post<void>(`/grupo-vip/acessos/${grupoId}/${clienteId}/remover`),
};

export const rotuloCobranca: Record<StatusCobranca, string> = {
  pendente: "A vencer",
  atrasada: "Atrasada",
  paga: "Paga",
  cancelada: "Cancelada",
};

export const rotuloTipoMensagem: Record<string, string> = {
  boas_vindas: "Boas-vindas",
  lembrete: "Lembrete",
  vencido: "Atraso",
  remocao: "Acesso encerrado",
  reconquista: "Reconquista",
  aniversario: "Aniversário",
  live: "Live",
  anuncio: "Anúncio",
  convite: "Link de entrada",
  manual: "Mensagem",
  suporte: "Suporte",
};
