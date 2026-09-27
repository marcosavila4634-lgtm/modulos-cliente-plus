// Conteúdos, categorias, lives, anúncios e automações do módulo Grupos VIP.
// Contratos com o backend (pacote grupovip): ConteudosContrato.java, AutomacaoResource.java.

import type { Plataforma } from "./grupo-vip";
import type { Mensagem, Opcao, ResultadoAutomacao } from "./grupo-vip-membros";
import { http } from "./http";

export type CorCategoria = "orange" | "sky" | "violet" | "emerald" | "rose" | "amber";

// topicos: tópicos do grupo (Telegram no modo fórum); vazio = grupo sem tópicos
export type GrupoOpcao = { id: string; nome: string; plataforma: Plataforma; automatico: boolean; topicos: Opcao[] };

export type Categoria = { id: string; nome: string; cor: CorCategoria; conteudos: number; visualizacoes: number };

export type Publicacao = {
  id: string;
  grupoId: string;
  grupo: string;
  plataforma: Plataforma;
  status: "pendente" | "enviado" | "manual" | "falhou" | "apagado";
  // em "enviado" o erro é um aviso (ex.: não deu para fixar)
  erro: string | null;
  enviadoEm: string | null;
  topicoId: string | null;
  topico: string | null;
  // o robô postou e guarda o post: dá para fixar, editar e apagar
  noTelegram: boolean;
  fixado: boolean;
};

export type Conteudo = {
  id: string;
  titulo: string;
  texto: string;
  categoriaId: string | null;
  categoria: string | null;
  cor: CorCategoria | null;
  midiaUrl: string | null;
  midiaTipo: "imagem" | "video" | null;
  link: string | null;
  botaoTexto: string | null;
  fixar: boolean;
  status: "rascunho" | "agendado" | "publicado";
  agendadoPara: string | null;
  publicadoEm: string | null;
  naAreaMembro: boolean;
  createdAt: string;
  grupos: Publicacao[];
  visualizacoes: number;
  pessoas: number;
};

export type DadosConteudo = {
  titulo: string;
  texto: string;
  categoriaId: string | null;
  midiaUrl: string | null;
  midiaTipo: "imagem" | "video" | null;
  link: string;
  // com link: o link vira um botão no post do Telegram
  botaoTexto: string;
  fixar: boolean;
  grupoIds: string[];
  // grupo -> tópico onde postar
  topicos: Record<string, string>;
  naAreaMembro: boolean;
  quando: "agora" | "agendar" | "rascunho";
  // "2026-09-27T20:00"
  agendadoPara: string | null;
  // já publicado: edita também os posts do Telegram
  atualizarNosGrupos: boolean;
};

export type ListaConteudos = { conteudos: Conteudo[]; categorias: Categoria[]; grupos: GrupoOpcao[] };

export type StatusLive = "agendado" | "ao_vivo" | "encerrado" | "cancelado";

export type Live = {
  id: string;
  titulo: string;
  descricao: string;
  foto: string | null;
  link: string | null;
  comecaEm: string;
  duracaoMinutos: number;
  avisoMinutos: number;
  avisadoEm: string | null;
  status: StatusLive;
  grupoId: string | null;
  grupo: string | null;
};

export type DadosLive = {
  titulo: string;
  descricao: string;
  foto: string | null;
  link: string;
  comecaEm: string;
  duracaoMinutos: number;
  avisoMinutos: number;
  grupoId: string | null;
};

export type TipoAnuncio = "conteudo" | "manutencao" | "live" | "material" | "promocao";
export type PublicoAnuncio = "todos" | "em_dia" | "atrasados" | "sem_acesso" | "plano" | "grupo" | "novos";

export type Anuncio = {
  id: string;
  titulo: string;
  texto: string;
  tipo: TipoAnuncio;
  publico: PublicoAnuncio;
  publicoRef: string | null;
  publicoNome: string | null;
  destinatarios: number;
  postadoNosGrupos: boolean;
  enviadoEm: string;
  enviadas: number;
  pendentes: number;
};

export type DadosAnuncio = {
  titulo: string;
  texto: string;
  tipo: TipoAnuncio;
  publico: PublicoAnuncio;
  publicoRef: string | null;
  postarNosGrupos: boolean;
};

export type ContagemPublico = { quantidade: number; semCanal: number; telegram: number; whatsapp: number };

export type TipoAutomacao = "boas_vindas" | "lembrete" | "vencido" | "remocao" | "reconquista" | "aniversario" | "live";

export type Automacao = {
  tipo: TipoAutomacao;
  titulo: string;
  descricao: string;
  ativa: boolean;
  dias: number;
  texto: string;
  usaDias: boolean;
  enviadas: number;
};

export type PainelAutomacao = {
  automacoes: Automacao[];
  pendentes: Mensagem[];
  recentes: Mensagem[];
  contagem: { pendentesWhatsapp: number; falhas: number; enviadasHoje: number };
  roboConectado: boolean;
  roboUsuario: string | null;
  exemplo: Record<string, string>;
};

export const apiConteudos = {
  listar: () => http.get<ListaConteudos>("/grupo-vip/conteudos"),
  criar: (d: DadosConteudo) => http.post<Conteudo>("/grupo-vip/conteudos", d),
  atualizar: (id: string, d: DadosConteudo) => http.put<Conteudo>(`/grupo-vip/conteudos/${id}`, d),
  publicar: (id: string) => http.post<Conteudo>(`/grupo-vip/conteudos/${id}/publicar`),
  excluir: (id: string) => http.del<void>(`/grupo-vip/conteudos/${id}`),
  marcarPublicado: (publicacaoId: string) => http.post<void>(`/grupo-vip/publicacoes/${publicacaoId}/publicado`),
  tentarDeNovo: (publicacaoId: string) => http.post<void>(`/grupo-vip/publicacoes/${publicacaoId}/tentar`),
  fixar: (publicacaoId: string) => http.post<void>(`/grupo-vip/publicacoes/${publicacaoId}/fixar`),
  desafixar: (publicacaoId: string) => http.post<void>(`/grupo-vip/publicacoes/${publicacaoId}/desafixar`),
  apagarDoGrupo: (publicacaoId: string) => http.post<void>(`/grupo-vip/publicacoes/${publicacaoId}/apagar`),

  categorias: () => http.get<Categoria[]>("/grupo-vip/categorias"),
  criarCategoria: (nome: string, cor: CorCategoria) => http.post<Categoria[]>("/grupo-vip/categorias", { nome, cor }),
  atualizarCategoria: (id: string, nome: string, cor: CorCategoria) =>
    http.put<Categoria[]>(`/grupo-vip/categorias/${id}`, { nome, cor }),
  excluirCategoria: (id: string) => http.del<Categoria[]>(`/grupo-vip/categorias/${id}`),

  lives: () => http.get<{ eventos: Live[]; grupos: GrupoOpcao[] }>("/grupo-vip/lives"),
  criarLive: (d: DadosLive) => http.post<Live>("/grupo-vip/lives", d),
  atualizarLive: (id: string, d: DadosLive) => http.put<Live>(`/grupo-vip/lives/${id}`, d),
  cancelarLive: (id: string) => http.post<Live>(`/grupo-vip/lives/${id}/cancelar`),
  avisarLive: (id: string) => http.post<Live>(`/grupo-vip/lives/${id}/avisar`),
  excluirLive: (id: string) => http.del<void>(`/grupo-vip/lives/${id}`),

  anuncios: () => http.get<{ anuncios: Anuncio[]; planos: Opcao[]; grupos: Opcao[] }>("/grupo-vip/anuncios"),
  contarPublico: (publico: PublicoAnuncio, ref: string | null) =>
    http.get<ContagemPublico>(`/grupo-vip/anuncios/publico?publico=${publico}${ref ? `&ref=${ref}` : ""}`),
  enviarAnuncio: (d: DadosAnuncio) =>
    http.post<{ anuncios: Anuncio[]; planos: Opcao[]; grupos: Opcao[] }>("/grupo-vip/anuncios", d),
};

export const apiAutomacao = {
  painel: () => http.get<PainelAutomacao>("/grupo-vip/automacao"),
  salvar: (tipo: TipoAutomacao, ativa: boolean, dias: number, texto: string) =>
    http.put<PainelAutomacao>(`/grupo-vip/automacao/${tipo}`, { ativa, dias, texto }),
  rodar: () => http.post<ResultadoAutomacao>("/grupo-vip/automacao/rodar"),
  marcarEnviada: (id: string) => http.post<Mensagem>(`/grupo-vip/automacao/mensagens/${id}/enviada`),
  descartar: (id: string) => http.post<Mensagem>(`/grupo-vip/automacao/mensagens/${id}/descartar`),
  reenviar: (id: string) => http.post<Mensagem>(`/grupo-vip/automacao/mensagens/${id}/reenviar`),
};

// Selo colorido de cada categoria.
export const corCategoria: Record<string, string> = {
  orange: "bg-orange-500/15 text-orange-300",
  sky: "bg-sky-500/15 text-sky-300",
  violet: "bg-violet-500/15 text-violet-300",
  emerald: "bg-emerald-500/15 text-emerald-300",
  rose: "bg-rose-500/15 text-rose-300",
  amber: "bg-amber-500/15 text-amber-300",
};

export const rotuloPublico: Record<PublicoAnuncio, string> = {
  todos: "Todos os membros",
  em_dia: "Quem tem acesso",
  atrasados: "Pagamento atrasado",
  sem_acesso: "Sem acesso (ex-membros e pendentes)",
  plano: "Assinantes de um plano",
  grupo: "Membros de um grupo",
  novos: "Novos (últimos 30 dias)",
};

export const rotuloTipoAnuncio: Record<TipoAnuncio, string> = {
  conteudo: "Conteúdo novo",
  manutencao: "Manutenção",
  live: "Live",
  material: "Material",
  promocao: "Promoção",
};

export const variaveisMensagem: { nome: string; descricao: string }[] = [
  { nome: "{nome}", descricao: "primeiro nome do membro" },
  { nome: "{negocio}", descricao: "nome do seu negócio" },
  { nome: "{plano}", descricao: "plano assinado" },
  { nome: "{valor}", descricao: "valor da mensalidade" },
  { nome: "{vencimento}", descricao: "data de vencimento" },
  { nome: "{grupos}", descricao: "grupos do plano" },
  { nome: "{dias_tolerancia}", descricao: "dias de tolerância" },
  { nome: "{link_area}", descricao: "área do membro (pagar e entrar)" },
  { nome: "{link_indicacao}", descricao: "link de indicação do membro" },
  { nome: "{link_vendas}", descricao: "página de vendas" },
];

// Troca {nome}, {plano}... pelos valores (prévia na tela).
export function preencher(modelo: string, valores: Record<string, string>) {
  return modelo.replace(/\{([a-z_]+)\}/g, (tudo, chave: string) => valores[chave] ?? tudo);
}

// Valor do campo <input type="datetime-local"> a partir de um instante.
export function paraCampoDataHora(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
