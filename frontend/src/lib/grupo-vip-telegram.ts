// Tela "Telegram" do módulo Grupos VIP: controle dos grupos pelo robô,
// moderação e enquetes. Contrato com o backend: TelegramContrato.java.

import type { GrupoOpcao } from "./grupo-vip-conteudos";
import { http } from "./http";

export type Topico = { id: string; nome: string; threadId: number };

export type GrupoTelegram = {
  id: string;
  nome: string;
  chatId: string | null;
  // robô conectado + ID do grupo: o robô pode agir
  automatico: boolean;
  protegerConteudo: boolean;
  moderarLinks: boolean;
  palavrasProibidas: string;
  silenciarMinutos: number;
  boasVindasGrupo: string | null;
  apagarAvisosEntrada: boolean;
  travado: boolean;
  // "22:00" (null = sem trava automática)
  travaInicio: string | null;
  travaFim: string | null;
  topicos: Topico[];
  moderadas7Dias: number;
};

// Lido na hora do Telegram (erro preenchido se não deu para ler).
export type InfoTelegram = {
  titulo: string | null;
  descricao: string | null;
  membros: number | null;
  forum: boolean;
  travado: boolean | null;
  erro: string | null;
};

export type Moderacao = {
  id: string;
  grupoId: string;
  grupo: string;
  nome: string;
  motivo: "link" | "palavra";
  detalhe: string;
  texto: string;
  silenciadoAte: string | null;
  momento: string;
};

export type PainelTelegram = { roboConectado: boolean; roboUsuario: string | null; grupos: GrupoTelegram[] };

export type DetalhesGrupo = { grupo: GrupoTelegram; info: InfoTelegram | null; moderacao: Moderacao[] };

export type DadosRegras = {
  protegerConteudo: boolean;
  moderarLinks: boolean;
  palavrasProibidas: string;
  silenciarMinutos: number;
  boasVindasGrupo: string;
  apagarAvisosEntrada: boolean;
  travaInicio: string;
  travaFim: string;
};

// Só o que vier preenchido muda.
export type DadosGrupoTelegram = { titulo?: string; descricao?: string; foto?: string };

export type EnvioEnquete = {
  id: string;
  grupoId: string;
  grupo: string;
  topico: string | null;
  status: "enviada" | "falhou" | "encerrada";
  erro: string | null;
  votos: number[];
  total: number;
};

export type Enquete = {
  id: string;
  pergunta: string;
  opcoes: string[];
  tipo: "enquete" | "quiz";
  correta: number | null;
  explicacao: string | null;
  anonima: boolean;
  multipla: boolean;
  encerrada: boolean;
  createdAt: string;
  envios: EnvioEnquete[];
  // soma de todos os grupos
  votos: number[];
  total: number;
};

export type DadosEnquete = {
  pergunta: string;
  opcoes: string[];
  tipo: "enquete" | "quiz";
  correta: number | null;
  explicacao: string;
  anonima: boolean;
  multipla: boolean;
  grupoIds: string[];
  topicos: Record<string, string>;
};

export type ListaEnquetes = { enquetes: Enquete[]; grupos: GrupoOpcao[]; roboConectado: boolean };

export const apiTelegram = {
  painel: () => http.get<PainelTelegram>("/grupo-vip/telegram"),
  detalhes: (id: string) => http.get<DetalhesGrupo>(`/grupo-vip/telegram/grupos/${id}`),
  salvarRegras: (id: string, d: DadosRegras) => http.put<DetalhesGrupo>(`/grupo-vip/telegram/grupos/${id}/regras`, d),
  mudarDados: (id: string, d: DadosGrupoTelegram) => http.put<DetalhesGrupo>(`/grupo-vip/telegram/grupos/${id}/dados`, d),
  travar: (id: string) => http.post<DetalhesGrupo>(`/grupo-vip/telegram/grupos/${id}/travar`),
  liberar: (id: string) => http.post<DetalhesGrupo>(`/grupo-vip/telegram/grupos/${id}/liberar`),
  criarTopico: (id: string, nome: string) => http.post<DetalhesGrupo>(`/grupo-vip/telegram/grupos/${id}/topicos`, { nome }),
  renomearTopico: (id: string, nome: string) => http.put<void>(`/grupo-vip/telegram/topicos/${id}`, { nome }),
  apagarTopico: (id: string) => http.del<void>(`/grupo-vip/telegram/topicos/${id}`),
  moderacao: () => http.get<Moderacao[]>("/grupo-vip/telegram/moderacao"),

  enquetes: () => http.get<ListaEnquetes>("/grupo-vip/telegram/enquetes"),
  criarEnquete: (d: DadosEnquete) => http.post<ListaEnquetes>("/grupo-vip/telegram/enquetes", d),
  encerrarEnquete: (id: string) => http.post<ListaEnquetes>(`/grupo-vip/telegram/enquetes/${id}/encerrar`),
  excluirEnquete: (id: string) => http.del<ListaEnquetes>(`/grupo-vip/telegram/enquetes/${id}`),
};
