// Página pública personalizável, igual para todos os módulos (Academia, Grupos
// VIP e os próximos). O dono monta a página no editor (tema + seções) e
// publica; a página pública do módulo desenha com components/pagina/PaginaPublica.
//
// Cada módulo tem um adaptador (lib/pagina-<modulo>.tsx) que diz: quais seções
// podem ser usadas, a página padrão e como transformar os dados do módulo
// (nome, planos, horários...) em DadosPagina.
//
// Contrato com o backend: backend/src/main/java/br/com/clienteplus/modulos/paginas/PaginaContrato.java
// (o servidor guarda o JSON da página sem interpretar as seções)

import {
  BookOpen,
  CalendarDays,
  ChartLine,
  Check,
  CirclePlay,
  Clock,
  Dumbbell,
  Flame,
  Gem,
  Gift,
  GraduationCap,
  Heart,
  Leaf,
  Lock,
  Medal,
  MessageCircle,
  Music,
  PawPrint,
  Rocket,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { http } from "./http";

// ---------- Tema ----------

export type Fundo = "marinho" | "preto" | "grafite" | "roxo" | "verde" | "vinho" | "claro" | "creme";
export type Fonte = "poppins" | "outfit" | "inter" | "anton";
export type Cantos = "redondos" | "suaves" | "retos";

// cor1 → cor2: degradê dos botões e destaques
export type Tema = { fundo: Fundo; cor1: string; cor2: string; fonte: Fonte; cantos: Cantos };

export const fundos: Record<
  Fundo,
  { nome: string; fundo: string; card: string; linha: string; titulo: string; texto: string; suave: string; escuro: boolean }
> = {
  marinho: { nome: "Azul-marinho", fundo: "#060a13", card: "rgba(255,255,255,0.035)", linha: "rgba(255,255,255,0.1)", titulo: "#ffffff", texto: "#cbd5e1", suave: "#94a3b8", escuro: true },
  preto: { nome: "Preto", fundo: "#000000", card: "rgba(255,255,255,0.045)", linha: "rgba(255,255,255,0.11)", titulo: "#ffffff", texto: "#d4d4d8", suave: "#a1a1aa", escuro: true },
  grafite: { nome: "Grafite", fundo: "#16171b", card: "rgba(255,255,255,0.045)", linha: "rgba(255,255,255,0.1)", titulo: "#ffffff", texto: "#d4d4d8", suave: "#a1a1aa", escuro: true },
  roxo: { nome: "Roxo escuro", fundo: "#0d0718", card: "rgba(255,255,255,0.04)", linha: "rgba(255,255,255,0.1)", titulo: "#ffffff", texto: "#d8d0e8", suave: "#a59cb8", escuro: true },
  verde: { nome: "Verde escuro", fundo: "#03120c", card: "rgba(255,255,255,0.04)", linha: "rgba(255,255,255,0.1)", titulo: "#ffffff", texto: "#cfe0d8", suave: "#94aca0", escuro: true },
  vinho: { nome: "Vinho", fundo: "#150509", card: "rgba(255,255,255,0.04)", linha: "rgba(255,255,255,0.1)", titulo: "#ffffff", texto: "#e5d3d6", suave: "#b09a9e", escuro: true },
  claro: { nome: "Branco", fundo: "#f6f7fb", card: "#ffffff", linha: "rgba(15,23,42,0.1)", titulo: "#0f172a", texto: "#334155", suave: "#64748b", escuro: false },
  creme: { nome: "Creme", fundo: "#faf6ef", card: "#ffffff", linha: "rgba(68,52,30,0.12)", titulo: "#1c1917", texto: "#44403c", suave: "#78716c", escuro: false },
};

export const coresProntas: { nome: string; cor1: string; cor2: string }[] = [
  { nome: "Laranja", cor1: "#f59e0b", cor2: "#f97316" },
  { nome: "Roxo e rosa", cor1: "#7c3aed", cor2: "#ec4899" },
  { nome: "Azul", cor1: "#38bdf8", cor2: "#2563eb" },
  { nome: "Verde", cor1: "#34d399", cor2: "#059669" },
  { nome: "Vermelho", cor1: "#fb7185", cor2: "#e11d48" },
  { nome: "Dourado", cor1: "#facc15", cor2: "#ca8a04" },
  { nome: "Ciano", cor1: "#22d3ee", cor2: "#0891b2" },
];

export const fontes: Record<Fonte, { nome: string; familia: string }> = {
  poppins: { nome: "Moderna", familia: '"Poppins", "Inter", sans-serif' },
  outfit: { nome: "Arredondada", familia: '"Outfit", "Inter", sans-serif' },
  inter: { nome: "Simples", familia: '"Inter", sans-serif' },
  anton: { nome: "Impacto", familia: '"Anton", "Impact", sans-serif' },
};

export const cantos: Record<Cantos, { nome: string; card: string; pequeno: string; botao: string }> = {
  redondos: { nome: "Redondos", card: "24px", pequeno: "16px", botao: "12px" },
  suaves: { nome: "Suaves", card: "12px", pequeno: "10px", botao: "8px" },
  retos: { nome: "Retos", card: "3px", pequeno: "3px", botao: "3px" },
};

// ---------- Ícones que o dono pode escolher ----------

export const icones = {
  check: { nome: "Certo", icone: Check },
  raio: { nome: "Raio", icone: Zap },
  escudo: { nome: "Escudo", icone: ShieldCheck },
  estrela: { nome: "Estrela", icone: Star },
  brilho: { nome: "Brilho", icone: Sparkles },
  presente: { nome: "Presente", icone: Gift },
  coracao: { nome: "Coração", icone: Heart },
  fogo: { nome: "Fogo", icone: Flame },
  trofeu: { nome: "Troféu", icone: Trophy },
  medalha: { nome: "Medalha", icone: Medal },
  diamante: { nome: "Diamante", icone: Gem },
  alvo: { nome: "Alvo", icone: Target },
  foguete: { nome: "Foguete", icone: Rocket },
  grafico: { nome: "Gráfico", icone: ChartLine },
  cadeado: { nome: "Cadeado", icone: Lock },
  relogio: { nome: "Relógio", icone: Clock },
  calendario: { nome: "Calendário", icone: CalendarDays },
  pessoas: { nome: "Pessoas", icone: Users },
  conversa: { nome: "Conversa", icone: MessageCircle },
  livro: { nome: "Livro", icone: BookOpen },
  video: { nome: "Vídeo", icone: CirclePlay },
  estudo: { nome: "Estudo", icone: GraduationCap },
  haltere: { nome: "Haltere", icone: Dumbbell },
  folha: { nome: "Folha", icone: Leaf },
  musica: { nome: "Música", icone: Music },
  pata: { nome: "Pata", icone: PawPrint },
  sorriso: { nome: "Sorriso", icone: Smile },
} satisfies Record<string, { nome: string; icone: LucideIcon }>;

export type IdIcone = keyof typeof icones;

// ---------- Seções ----------

type Base<T extends string> = { id: string; tipo: T; visivel: boolean };
export type ItemIcone = { icone: IdIcone; texto: string };

export type SecaoTopo = Base<"topo"> & {
  logo: string | null; // imagem; null = marca padrão do módulo
  mostrarNome: boolean;
  titulo: string;
  destaque: string; // parte do título que fica colorida
  texto: string;
  capa: string | null;
  escurecer: number; // 0 a 90: quanto a foto de capa fica escura
  alinhamento: "esquerda" | "centro";
  mostrarNumero: boolean; // "112 membros ativos"
  selos: ItemIcone[];
  botao: string;
};
export type SecaoAviso = Base<"aviso"> & { texto: string; link: string };
export type SecaoBeneficios = Base<"beneficios"> & { titulo: string; texto: string; itens: ItemIcone[] };
export type SecaoPlanos = Base<"planos"> & {
  titulo: string;
  texto: string;
  destaque: string; // "auto" | "nenhum" | id do plano
  selo: string;
  botao: string;
  mostrarItens: boolean;
  ocultos: string[]; // ids dos planos que não aparecem
};
export type SecaoPassos = Base<"passos"> & { titulo: string; itens: { titulo: string; texto: string }[] };
export type SecaoTexto = Base<"texto"> & {
  titulo: string;
  texto: string;
  imagem: string | null;
  lado: "esquerda" | "direita";
  botao: string;
  link: string; // vazio = vai para os planos
};
export type SecaoVideo = Base<"video"> & { titulo: string; texto: string; url: string };
export type SecaoDepoimentos = Base<"depoimentos"> & {
  titulo: string;
  itens: { nome: string; detalhe: string; texto: string; foto: string | null; estrelas: number }[];
};
export type SecaoImagens = Base<"imagens"> & { titulo: string; itens: { imagem: string | null; legenda: string }[] };
export type SecaoPerguntas = Base<"perguntas"> & { titulo: string; itens: { pergunta: string; resposta: string }[] };
export type SecaoEquipe = Base<"equipe"> & { titulo: string; texto: string; itens: { nome: string; cargo: string; foto: string | null }[] };
export type SecaoAulas = Base<"aulas"> & { titulo: string; texto: string };
export type SecaoHorarios = Base<"horarios"> & { titulo: string; texto: string };
export type SecaoLocal = Base<"localizacao"> & { titulo: string; endereco: string; mostrarMapa: boolean };
export type SecaoChamada = Base<"chamada"> & { titulo: string; texto: string; botao: string };
export type SecaoContato = Base<"contato"> & {
  texto: string;
  instagram: string;
  facebook: string;
  youtube: string;
  tiktok: string;
  site: string;
  rodape: string;
};

export type Secao =
  | SecaoTopo
  | SecaoAviso
  | SecaoBeneficios
  | SecaoPlanos
  | SecaoPassos
  | SecaoTexto
  | SecaoVideo
  | SecaoDepoimentos
  | SecaoImagens
  | SecaoPerguntas
  | SecaoEquipe
  | SecaoAulas
  | SecaoHorarios
  | SecaoLocal
  | SecaoChamada
  | SecaoContato;

export type TipoSecao = Secao["tipo"];
export type SecaoDo<T extends TipoSecao> = Extract<Secao, { tipo: T }>;

export type PaginaConfig = { versao: 1; tema: Tema; secoes: Secao[] };

// ---------- Dados que vêm do módulo ----------

export type PlanoPagina = {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  periodo: string; // "por mês"
  itens: { texto: string; selo?: ReactNode }[]; // ex.: grupos que o plano libera
};

export type DadosPagina = {
  nome: string;
  logoPadrao?: ReactNode;
  numero?: { valor: number; rotulo: string } | null; // "112 membros ativos"
  convite?: string | null; // "Ana te convidou para o grupo"
  whatsapp: string | null;
  mensagemWhatsapp: string;
  endereco?: string | null;
  planos: PlanoPagina[];
  horarios?: { dia: string; texto: string; hoje: boolean }[];
  aulas?: { nome: string; descricao: string; professor: string | null; cor: string | null; horarios: { dia: string; hora: string }[] }[];
  equipe?: { nome: string; cargo: string }[];
};

// Adaptador de cada módulo (lib/pagina-<modulo>.tsx). D = JSON que a página
// pública do módulo recebe do backend.
export type ModuloPagina<D> = {
  modulo: string; // /api/paginas/<modulo>
  titulo: string; // "Página de vendas"
  // seções que o dono pode adicionar (topo e planos já vêm na página)
  tipos: TipoSecao[];
  normalizar: (d: D) => DadosPagina;
  padrao: (d: D) => PaginaConfig;
  // cores dos botões do editor (as do painel do módulo)
  acento: [string, string];
  // onde o dono troca o endereço, WhatsApp, planos... (link para as telas do módulo)
  // planos null = os planos vêm do Cliente Plus (Produtos/Planos), fora do módulo
  ondeMudar: { endereco: string; planos: string | null; whatsapp: string };
};

// ---------- Catálogo de seções ----------

let contador = 0;
export const novoId = () => `s${Date.now().toString(36)}${(contador++).toString(36)}`;

export const catalogo: {
  [T in TipoSecao]: {
    nome: string;
    descricao: string;
    unica?: boolean; // só uma por página
    fixa?: boolean; // não pode ser apagada
    nova: (d: DadosPagina) => Omit<SecaoDo<T>, "id" | "tipo" | "visivel">;
  };
} = {
  topo: {
    nome: "Topo",
    descricao: "A primeira coisa que a pessoa vê: logo, título, foto de capa e o botão para os planos.",
    unica: true,
    fixa: true,
    nova: (d) => ({
      logo: null,
      mostrarNome: true,
      titulo: `Entre para o ${d.nome}`,
      destaque: d.nome,
      texto: "",
      capa: null,
      escurecer: 65,
      alinhamento: "esquerda",
      mostrarNumero: true,
      selos: [],
      botao: "Ver planos",
    }),
  },
  aviso: {
    nome: "Faixa de aviso",
    descricao: "Uma faixa colorida com uma frase curta. Ex.: promoção, cupom ou vagas abertas.",
    nova: () => ({ texto: "🔥 Promoção por tempo limitado: use o cupom BEMVINDO", link: "" }),
  },
  beneficios: {
    nome: "Benefícios",
    descricao: "Lista do que a pessoa ganha, cada item com um ícone.",
    nova: () => ({
      titulo: "O que você recebe",
      texto: "",
      itens: [
        { icone: "check", texto: "Primeiro benefício" },
        { icone: "check", texto: "Segundo benefício" },
        { icone: "check", texto: "Terceiro benefício" },
      ],
    }),
  },
  planos: {
    nome: "Planos",
    descricao: "Os planos à venda, com preço e botão. Os planos em si (nome, preço) são cadastrados no módulo.",
    unica: true,
    fixa: true,
    nova: () => ({
      titulo: "Escolha seu plano",
      texto: "",
      destaque: "auto",
      selo: "Mais escolhido",
      botao: "Quero este plano",
      mostrarItens: true,
      ocultos: [],
    }),
  },
  passos: {
    nome: "Como funciona",
    descricao: "Passo a passo numerado (ex.: escolha, pague, receba o acesso).",
    nova: () => ({
      titulo: "Como funciona",
      itens: [
        { titulo: "Escolha o plano", texto: "Veja os planos e escolha o seu." },
        { titulo: "Faça o pagamento", texto: "Rápido e seguro." },
        { titulo: "Pronto!", texto: "Você recebe o acesso na hora." },
      ],
    }),
  },
  texto: {
    nome: "Texto com foto",
    descricao: "Um bloco livre: título, texto, uma foto ao lado e um botão. Bom para \"Quem somos\".",
    nova: () => ({ titulo: "Quem somos", texto: "Conte a sua história aqui.", imagem: null, lado: "direita", botao: "", link: "" }),
  },
  video: {
    nome: "Vídeo",
    descricao: "Um vídeo do YouTube, do Vimeo ou enviado do seu computador.",
    nova: () => ({ titulo: "Veja como funciona", texto: "", url: "" }),
  },
  depoimentos: {
    nome: "Depoimentos",
    descricao: "O que os clientes dizem, com nome, foto e estrelas.",
    nova: () => ({
      titulo: "Quem já entrou aprova",
      itens: [
        { nome: "Nome do cliente", detalhe: "Cliente há 6 meses", texto: "Escreva aqui o que o cliente falou.", foto: null, estrelas: 5 },
        { nome: "Nome do cliente", detalhe: "Cliente há 1 ano", texto: "Escreva aqui o que o cliente falou.", foto: null, estrelas: 5 },
      ],
    }),
  },
  imagens: {
    nome: "Galeria de fotos",
    descricao: "Várias fotos lado a lado, com legenda opcional.",
    nova: () => ({ titulo: "Por dentro", itens: [] }),
  },
  perguntas: {
    nome: "Perguntas frequentes",
    descricao: "Perguntas e respostas que abrem com um toque.",
    nova: () => ({
      titulo: "Perguntas frequentes",
      itens: [
        { pergunta: "Como faço para assinar?", resposta: "Escolha o plano, preencha seus dados e faça o pagamento." },
        { pergunta: "Posso cancelar quando quiser?", resposta: "Sim. Você cancela quando quiser, sem multa." },
      ],
    }),
  },
  equipe: {
    nome: "Equipe",
    descricao: "Fotos, nomes e funções das pessoas da equipe.",
    nova: (d) => ({
      titulo: "Nossa equipe",
      texto: "",
      itens: (d.equipe ?? []).map((p) => ({ nome: p.nome, cargo: p.cargo, foto: null })),
    }),
  },
  aulas: {
    nome: "Aulas da semana",
    descricao: "As aulas com dias e horários. Vêm sozinhas do cadastro de aulas.",
    unica: true,
    nova: () => ({ titulo: "Aulas coletivas", texto: "" }),
  },
  horarios: {
    nome: "Horário de funcionamento",
    descricao: "Os dias e horários em que vocês abrem. Vêm sozinhos das Configurações.",
    unica: true,
    nova: () => ({ titulo: "Horário de funcionamento", texto: "" }),
  },
  localizacao: {
    nome: "Endereço e mapa",
    descricao: "O endereço, um mapa e o botão \"Como chegar\".",
    unica: true,
    nova: () => ({ titulo: "Onde estamos", endereco: "", mostrarMapa: true }),
  },
  chamada: {
    nome: "Chamada final",
    descricao: "Um bloco em destaque convidando a pessoa a assinar, com botão para os planos.",
    nova: () => ({ titulo: "Pronto para começar?", texto: "Escolha seu plano e entre hoje mesmo.", botao: "Quero entrar agora" }),
  },
  contato: {
    nome: "Contato e rodapé",
    descricao: "Botão do WhatsApp, redes sociais e o texto do rodapé.",
    unica: true,
    nova: (d) => ({
      texto: "Dúvidas? Fale com a gente no WhatsApp",
      instagram: "",
      facebook: "",
      youtube: "",
      tiktok: "",
      site: "",
      rodape: `© ${new Date().getFullYear()} ${d.nome}`,
    }),
  },
};

export function novaSecao<T extends TipoSecao>(tipo: T, d: DadosPagina, extra?: Partial<SecaoDo<T>>): SecaoDo<T> {
  return { id: novoId(), tipo, visivel: true, ...catalogo[tipo].nova(d), ...extra } as SecaoDo<T>;
}

// Completa uma página salva com o que faltar (seções de versões antigas,
// campos novos) e garante topo no início e uma seção de planos.
export function completar(bruta: unknown, d: DadosPagina, padrao: PaginaConfig): PaginaConfig {
  if (!bruta || typeof bruta !== "object") return padrao;
  const b = bruta as { tema?: Partial<Tema>; secoes?: unknown[] };
  const tema: Tema = { ...padrao.tema, ...(b.tema ?? {}) };
  if (!(tema.fundo in fundos)) tema.fundo = padrao.tema.fundo;
  if (!(tema.fonte in fontes)) tema.fonte = padrao.tema.fonte;
  if (!(tema.cantos in cantos)) tema.cantos = padrao.tema.cantos;
  const secoes: Secao[] = [];
  for (const s of Array.isArray(b.secoes) ? b.secoes : []) {
    if (!s || typeof s !== "object") continue;
    const x = s as Partial<Secao>;
    if (!x.tipo || !(x.tipo in catalogo)) continue;
    if (catalogo[x.tipo].unica && secoes.some((o) => o.tipo === x.tipo)) continue;
    const base = catalogo[x.tipo].nova(d) as Record<string, unknown>;
    const junta: Record<string, unknown> = { ...base, ...x, id: typeof x.id === "string" && x.id ? x.id : novoId() };
    junta.visivel = x.visivel !== false;
    // listas: mantém só se forem listas
    for (const k of Object.keys(base)) if (Array.isArray(base[k]) && !Array.isArray(junta[k])) junta[k] = base[k];
    secoes.push(junta as Secao);
  }
  const topo = secoes.findIndex((s) => s.tipo === "topo");
  if (topo === -1) secoes.unshift(padrao.secoes.find((s) => s.tipo === "topo") ?? novaSecao("topo", d));
  else if (topo > 0) secoes.unshift(...secoes.splice(topo, 1));
  if (!secoes.some((s) => s.tipo === "planos")) secoes.splice(1, 0, novaSecao("planos", d));
  return { versao: 1, tema, secoes };
}

// ---------- Apoio ----------

export function linkZap(numero: string | null | undefined, mensagem = "") {
  if (!numero) return null;
  return `https://wa.me/55${numero}${mensagem ? `?text=${encodeURIComponent(mensagem)}` : ""}`;
}

export function periodo(meses: number) {
  return meses === 1 ? "por mês" : meses === 12 ? "por ano" : `a cada ${meses} meses`;
}

export const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Só deixa passar endereços comuns (o servidor também confere).
export function enderecoSeguro(url: string | null | undefined): string | undefined {
  const u = (url ?? "").trim();
  if (!u) return undefined;
  if (/^(https?:\/\/|\/|#|mailto:|tel:)/i.test(u)) return u;
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(u)) return `https://${u}`; // "meusite.com.br"
  return undefined;
}

// ---------- API do editor ----------

export type Versao = { id: string; publicadaEm: string };

export type EditorPaginaApi<D> = {
  rascunho: unknown | null;
  publicada: unknown | null;
  pendente: boolean;
  publicadaEm: string | null;
  link: string;
  dados: D;
  versoes: Versao[];
};

export const apiPagina = {
  buscar: <D>(modulo: string) => http.get<EditorPaginaApi<D>>(`/paginas/${modulo}`),
  salvar: (modulo: string, pagina: PaginaConfig) => http.put<{ pendente: boolean }>(`/paginas/${modulo}/rascunho`, pagina),
  publicar: <D>(modulo: string) => http.post<EditorPaginaApi<D>>(`/paginas/${modulo}/publicar`),
  descartar: <D>(modulo: string) => http.post<EditorPaginaApi<D>>(`/paginas/${modulo}/descartar`),
  restaurar: <D>(modulo: string, id: string) => http.post<EditorPaginaApi<D>>(`/paginas/${modulo}/versoes/${id}/restaurar`),
};
