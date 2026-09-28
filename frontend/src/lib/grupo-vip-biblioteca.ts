// Tela "Biblioteca" do módulo Grupos VIP: livros (ou outros materiais), envio em massa (Google Drive,
// computador ou outro grupo do Telegram) e robô bibliotecário. Contrato com o backend: BibliotecaContrato.java.

import type { GrupoOpcao } from "./grupo-vip-conteudos";
import { http } from "./http";

export type Livro = {
  id: string;
  titulo: string;
  arquivoNome: string;
  tamanho: number;
  grupoId: string;
  grupo: string;
  origem: "drive" | "computador" | "telegram";
  pedidos: number;
  // o arquivo já está no Telegram (o robô reenvia na hora)
  noTelegram: boolean;
  autor: string | null;
  // subpasta do Drive (ou escolhida pelo dono)
  categoria: string | null;
  genero: string | null;
  sinopse: string | null;
  capaUrl: string | null;
  ano: number | null;
  // Google Books: pendente (ainda vai buscar) | ok | nao_encontrado | manual (editado pelo dono)
  dadosStatus: "pendente" | "ok" | "nao_encontrado" | "manual";
  // acima de 50 MB: o robô entrega um link temporário (LinksDeLivro.java)
  soLink: boolean;
  createdAt: string;
};

export type DadosLivro = { titulo: string; autor: string; categoria: string; genero: string; sinopse: string };

// Sugestões dos membros (juntadas pelo título).
export type Sugestao = {
  ids: string[];
  titulo: string;
  autor: string | null;
  pedidos: number;
  nomes: string[];
  status: "pendente" | "adicionado" | "recusado";
  livroId: string | null;
  livro: string | null;
  ultimaEm: string;
  respondidaEm: string | null;
};

export type ListaLivros = { livros: Livro[]; total: number; pagina: number; porPagina: number };

export type StatusItem = "pendente" | "enviado" | "pulado" | "grande_demais" | "falhou";

export type ItemImportacao = {
  id: string;
  arquivoNome: string;
  tamanho: number;
  status: StatusItem;
  erro: string | null;
  enviadoEm: string | null;
};

export type StatusImportacao = "recebendo" | "listando" | "enviando" | "pausada" | "concluida" | "falhou";

export type Importacao = {
  id: string;
  grupoId: string;
  grupo: string;
  topico: string | null;
  origem: "drive" | "computador" | "telegram";
  // cópia entre grupos: grupo de origem e andamento da leitura das mensagens
  origemGrupo: string | null;
  copiarMidias: boolean;
  varreduraAtual: number | null;
  varreduraAte: number | null;
  protegidas: number;
  pastaUrl: string | null;
  pastaNome: string | null;
  postarNoGrupo: boolean;
  status: StatusImportacao;
  erro: string | null;
  total: number;
  enviados: number;
  pulados: number;
  grandes: number;
  falhas: number;
  pendentes: number;
  minutosRestantes: number | null;
  createdAt: string;
  concluidaEm: string | null;
};

export type PainelBiblioteca = {
  // dá para ler o Drive (conta de serviço ou chave)
  googleConfigurado: boolean;
  chaveConfigurada: boolean;
  // pasta privada: e-mail com quem compartilhar a pasta (null = sem conta de serviço)
  contaServicoEmail: string | null;
  roboConectado: boolean;
  roboUsuario: string | null;
  // grupos do Telegram com o robô
  grupos: GrupoOpcao[];
  importacoes: Importacao[];
  resumo: { grupoId: string; grupo: string; livros: number }[];
  maisPedidos: { livroId: string; titulo: string; grupo: string; pedidos: number; pedidos30Dias: number }[];
  pedidosHoje: number;
  limitePorDia: number;
  tamanhoMaximo: number;
  extensoes: string[];
  // cópia entre grupos: o Telegram do dono precisa estar ligado ao robô
  donoConectado: boolean;
  linkDono: string | null;
  // Google Books: completar autor, gênero, capa e resumo
  completarLivros: boolean;
  dadosPendentes: number;
  sugestoesPendentes: number;
  // o que a biblioteca guarda: muda os textos (robô e painel) e os formatos aceitos
  tipo: TipoBiblioteca;
};

export type TipoBiblioteca = "livros" | "materiais";

// Palavras da tela conforme o tipo da biblioteca (backend: Vocabulario.java).
export function palavras(tipo: TipoBiblioteca) {
  return tipo === "materiais"
    ? { um: "material", uns: "materiais", Um: "Material", Uns: "Materiais" }
    : { um: "livro", uns: "livros", Um: "Livro", Uns: "Livros" };
}

export type Palavras = ReturnType<typeof palavras>;

export type DadosImportacao = {
  origem: "drive" | "computador" | "telegram";
  pastaUrl: string | null;
  grupoId: string;
  topicoId: string | null;
  postarNoGrupo: boolean;
  // cópia entre grupos
  origemGrupoId: string | null;
  // link da última mensagem do grupo de origem (t.me/c/.../4567)
  ultimaMensagem: string;
  // vazio = começa do início
  primeiraMensagem: string;
  copiarMidias: boolean;
};

export const apiBiblioteca = {
  painel: () => http.get<PainelBiblioteca>("/grupo-vip/biblioteca"),
  salvarChave: (chave: string) => http.put<PainelBiblioteca>("/grupo-vip/biblioteca/google", { chave }),
  salvarContaServico: (json: string) => http.put<PainelBiblioteca>("/grupo-vip/biblioteca/conta-servico", { json }),
  livros: (busca: string, grupo: string | null, pagina: number) =>
    http.get<ListaLivros>(
      `/grupo-vip/biblioteca/livros?busca=${encodeURIComponent(busca)}&pagina=${pagina}${grupo ? `&grupo=${grupo}` : ""}`,
    ),
  excluirLivro: (id: string, doGrupo: boolean) => http.del<void>(`/grupo-vip/biblioteca/livros/${id}?doGrupo=${doGrupo}`),
  editarLivro: (id: string, d: DadosLivro) => http.put<Livro>(`/grupo-vip/biblioteca/livros/${id}`, d),
  buscarDados: (id: string) => http.post<Livro>(`/grupo-vip/biblioteca/livros/${id}/buscar-dados`),
  completar: (ligado: boolean) => http.put<PainelBiblioteca>("/grupo-vip/biblioteca/completar", { ligado }),
  mudarTipo: (tipo: TipoBiblioteca) => http.put<PainelBiblioteca>("/grupo-vip/biblioteca/tipo", { tipo }),
  sugestoes: () => http.get<Sugestao[]>("/grupo-vip/biblioteca/sugestoes"),
  responder: (ids: string[], acao: "adicionado" | "recusado", livroId: string | null) =>
    http.post<Sugestao[]>("/grupo-vip/biblioteca/sugestoes/responder", { ids, acao, livroId }),
  criar: (d: DadosImportacao) => http.post<Importacao>("/grupo-vip/biblioteca/importacoes", d),
  detalhes: (id: string, status: StatusItem | null) =>
    http.get<{ importacao: Importacao; itens: ItemImportacao[] }>(
      `/grupo-vip/biblioteca/importacoes/${id}${status ? `?status=${status}` : ""}`,
    ),
  iniciar: (id: string) => http.post<Importacao>(`/grupo-vip/biblioteca/importacoes/${id}/iniciar`),
  pausar: (id: string) => http.post<Importacao>(`/grupo-vip/biblioteca/importacoes/${id}/pausar`),
  continuar: (id: string) => http.post<Importacao>(`/grupo-vip/biblioteca/importacoes/${id}/continuar`),
  tentarFalhas: (id: string) => http.post<Importacao>(`/grupo-vip/biblioteca/importacoes/${id}/tentar-falhas`),
  excluir: (id: string) => http.del<void>(`/grupo-vip/biblioteca/importacoes/${id}`),
};

// Envia um arquivo do computador para um envio em massa (com progresso).
export function enviarLivro(importacaoId: string, arquivo: File, aoProgredir?: (pct: number) => void): Promise<ItemImportacao> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/grupo-vip/biblioteca/importacoes/${importacaoId}/arquivos`);
    xhr.upload.onprogress = (e) => e.lengthComputable && aoProgredir?.(Math.round((e.loaded * 100) / e.total));
    xhr.onload = () => {
      const corpo = (() => {
        try {
          return JSON.parse(xhr.responseText);
        } catch {
          return null;
        }
      })();
      if (xhr.status >= 200 && xhr.status < 300) resolve(corpo);
      else reject(new Error(corpo?.error ?? `Erro ${xhr.status} ao enviar ${arquivo.name}`));
    };
    xhr.onerror = () => reject(new Error(`Não foi possível enviar ${arquivo.name}`));
    const form = new FormData();
    form.append("arquivo", arquivo, arquivo.name);
    // Pasta escolhida inteira: a subpasta do arquivo vira a categoria
    // ("Livros/Romance/x.pdf" -> "Romance").
    const partes = (arquivo.webkitRelativePath || "").split("/").slice(1, -1);
    if (partes.length) form.append("pasta", partes.join(" / "));
    xhr.send(form);
  });
}

export function tamanho(bytes: number) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1).replace(".", ",")} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function extensao(nome: string) {
  const i = nome.lastIndexOf(".");
  return i >= 0 ? nome.slice(i + 1).toLowerCase() : "";
}

export const rotuloStatusImportacao: Record<StatusImportacao, string> = {
  recebendo: "Recebendo arquivos",
  listando: "Lendo a pasta do Drive",
  enviando: "Enviando",
  pausada: "Pausado",
  concluida: "Concluído",
  falhou: "Falhou",
};

export const rotuloStatusItem: Record<StatusItem, string> = {
  pendente: "Na fila",
  enviado: "Enviado",
  pulado: "Pulado",
  grande_demais: "Grande demais",
  falhou: "Falhou",
};
