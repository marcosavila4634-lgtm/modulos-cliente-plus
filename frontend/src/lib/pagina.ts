// Página pública personalizável, igual para todos os módulos (Academia, Grupos
// VIP e os próximos). O dono monta a página no editor (tema + seções) e
// publica; a página pública do módulo desenha com components/pagina/PaginaPublica.
//
// O FORMATO é o mesmo do "Personalizar Loja" do sistema principal
// (clienteplus.club): { modelo, tema, secoes: [{ id, tipo, visivel, props }] }.
// Lá está no modelo 2; aqui é o modelo 3, que acrescenta `estilo` em cada
// seção (fundo, cores, espaço, colunas...), as combinações de cores no tema e
// as seções que só os módulos têm (vídeo, equipe, aulas, horários, mapa,
// faixa de aviso), a seção "Tela livre" e as PEÇAS LIVRES (`pecas`: textos,
// fotos, botões e formas soltos em qualquer lugar de uma seção).
// `completar` abre páginas do modelo 2 sem perder nada.
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
  Flower2,
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
  Scissors,
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
import type { ModeloPagina } from "./pagina-modelos";
import { MINHA, combinacao, coresDa, coresSeguras, ehCor, type Cores, type Tom } from "./pagina-cores";

// ---------- Tema ----------

export type Fonte = "poppins" | "outfit" | "inter" | "anton";
export type Raio = "redondo" | "suave" | "reto";
export type Densidade = "compacta" | "padrao" | "ampla";

export type Tema = {
  combinacao: string; // chave de uma combinação pronta ou "minha" (editada pelo dono)
  base?: string; // de qual combinação a "minha" partiu
  tom: Tom;
  cores: Cores;
  fonte: Fonte;
  raio: Raio;
  densidade: Densidade; // respiro entre as seções
};

export const fontes: Record<Fonte, { nome: string; familia: string }> = {
  poppins: { nome: "Moderna", familia: '"Poppins", "Inter", sans-serif' },
  outfit: { nome: "Arredondada", familia: '"Outfit", "Inter", sans-serif' },
  inter: { nome: "Simples", familia: '"Inter", sans-serif' },
  anton: { nome: "Impacto", familia: '"Anton", "Impact", sans-serif' },
};

export const raios: Record<Raio, { nome: string; card: string; pequeno: string; botao: string }> = {
  redondo: { nome: "Redondos", card: "24px", pequeno: "16px", botao: "12px" },
  suave: { nome: "Suaves", card: "12px", pequeno: "10px", botao: "8px" },
  reto: { nome: "Retos", card: "3px", pequeno: "3px", botao: "3px" },
};

export const densidades: Record<Densidade, { nome: string; espaco: number }> = {
  compacta: { nome: "Compacto", espaco: 18 },
  padrao: { nome: "Padrão", espaco: 28 },
  ampla: { nome: "Amplo", espaco: 48 },
};

export function novoTema(chave: string, tom: Tom = "escuro", extra?: Partial<Pick<Tema, "fonte" | "raio" | "densidade">>): Tema {
  const c = combinacao(chave) ?? combinacao("cliente-plus")!;
  return { combinacao: c.chave, tom, cores: coresDa(c, tom), fonte: "outfit", raio: "redondo", densidade: "padrao", ...extra };
}

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
  tesoura: { nome: "Tesoura", icone: Scissors },
  flor: { nome: "Flor", icone: Flower2 },
} satisfies Record<string, { nome: string; icone: LucideIcon }>;

export type IdIcone = keyof typeof icones;

// ---------- Estilo de cada seção ----------

export type FundoSecao = "padrao" | "alternado" | "escuro" | "marca" | "cor" | "degrade" | "imagem";
export type Espaco = "nenhum" | "pequeno" | "medio" | "grande";
export type Largura = "estreita" | "normal" | "larga" | "total";
export type TamanhoTitulo = "p" | "m" | "g";

// Tudo opcional: o que não estiver aqui segue o tema da página.
export type Estilo = {
  fundo?: FundoSecao;
  cor?: string; // fundo "cor" e começo do "degrade"
  cor2?: string; // fim do "degrade"
  imagem?: string | null; // fundo "imagem"
  escurecer?: number; // 0 a 90: película escura por cima da foto
  corTexto?: string; // vazio = escolhe sozinho (claro em fundo escuro e vice-versa)
  corDestaque?: string; // botões e ícones só desta seção
  espaco?: Espaco; // em cima e embaixo
  largura?: Largura;
  alinhamento?: "esquerda" | "centro";
  titulo?: TamanhoTitulo;
  colunas?: number; // 0 ou vazio = automático
};

export const fundosSecao: Record<FundoSecao, string> = {
  padrao: "Da página",
  alternado: "Alternado",
  escuro: "Escuro",
  marca: "Cores da marca",
  cor: "Uma cor",
  degrade: "Degradê",
  imagem: "Foto",
};
export const espacos: Record<Espaco, { nome: string; px: number }> = {
  nenhum: { nome: "Nenhum", px: 0 },
  pequeno: { nome: "Pequeno", px: 14 },
  medio: { nome: "Médio", px: 32 },
  grande: { nome: "Grande", px: 72 },
};
export const larguras: Record<Largura, { nome: string; css: string }> = {
  estreita: { nome: "Estreita", css: "720px" },
  normal: { nome: "Normal", css: "1024px" },
  larga: { nome: "Larga", css: "1280px" },
  total: { nome: "Tela toda", css: "100%" },
};
export const tamanhosTitulo: Record<TamanhoTitulo, { nome: string; escala: number }> = {
  p: { nome: "Pequeno", escala: 0.82 },
  m: { nome: "Médio", escala: 1 },
  g: { nome: "Grande", escala: 1.32 },
};

// ---------- Peças livres ----------
//
// Ficam por cima do conteúdo de qualquer seção, cada uma com posição e
// tamanho próprios para o COMPUTADOR e para o CELULAR (o que cabe num não
// cabe no outro). As medidas são em "unidades de desenho": a página do
// computador tem 1200 de largura (centralizada; em telas maiores sobra dos
// lados) e a do celular tem 390. A página troca de um para o outro quando
// tem menos de 768px de largura, e tudo encolhe ou cresce junto com a tela.

export const LARGURA_PC = 1200;
export const LARGURA_CEL = 390;
export const MARGEM = 16; // margem segura, longe da borda da tela
export const MAX_PECAS = 80; // por seção

export type Modo = "pc" | "cel";
export type Caixa = { x: number; y: number; l: number; a: number };
type PecaBase = { id: string; pc: Caixa; cel: Caixa; opacidade?: number };
export type Peca =
  | (PecaBase & {
      tipo: "texto";
      texto: string;
      tamanho: number; // da letra, no computador
      tamanhoCel: number;
      titulo: boolean; // usa a letra dos títulos
      negrito: boolean;
      cor?: string; // vazio = cor dos títulos da seção
      alinhar: "esquerda" | "centro" | "direita";
      linha?: number; // altura da linha (vezes o tamanho da letra); padrão 1,15
    })
  | (PecaBase & { tipo: "imagem"; imagem: string | null; raio: number; inteira?: boolean })
  | (PecaBase & { tipo: "botao"; texto: string; alvo: string; simples?: boolean })
  | (PecaBase & { tipo: "forma"; forma: "retangulo" | "elipse"; cor?: string; cor2?: string; raio: number })
  | (PecaBase & { tipo: "icone"; icone: IdIcone; cor?: string });
export type TipoPeca = Peca["tipo"];

export const nomesPecas: Record<TipoPeca, string> = { texto: "Texto", imagem: "Foto", botao: "Botão", forma: "Forma", icone: "Ícone" };
// texto e botão têm a altura do próprio conteúdo
export const alturaSozinha = (p: Peca) => p.tipo === "texto" || p.tipo === "botao";

const limita = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max));

// Posição no celular a partir da do computador (e o contrário): mesmo lugar
// na tela, cabendo na largura.
export function paraCelular(c: Caixa): Caixa {
  const l = Math.min(c.l, LARGURA_CEL - 2 * MARGEM);
  const centro = ((c.x + c.l / 2) * LARGURA_CEL) / LARGURA_PC;
  return { x: Math.round(limita(centro - l / 2, MARGEM, LARGURA_CEL - MARGEM - l)), y: c.y, l: Math.round(l), a: Math.round((c.a * l) / c.l) };
}
export function paraComputador(c: Caixa): Caixa {
  const centro = ((c.x + c.l / 2) * LARGURA_PC) / LARGURA_CEL;
  return { ...c, x: Math.round(limita(centro - c.l / 2, 0, LARGURA_PC - c.l)) };
}

// "O celular acompanha o computador": o que o dono mexe no computador (mover,
// esticar) é repetido no celular na mesma proporção, para não precisar
// arrumar duas vezes. O que ele mexe no celular fica só no celular.
// Peças que mudaram as duas caixas de uma vez (ex.: "Copiar o lugar") não mexem.
export function celularAcompanha(antes: Peca[], depois: Peca[]): Peca[] {
  const velhas = new Map(antes.map((p) => [p.id, p]));
  const escala = LARGURA_CEL / LARGURA_PC;
  return depois.map((p) => {
    const v = velhas.get(p.id);
    if (!v || v.pc === p.pc || v.cel !== p.cel) return p;
    const [a, b, c] = [v.pc, p.pc, v.cel];
    const l = b.l === a.l ? c.l : Math.round(Math.min(LARGURA_CEL - 2 * MARGEM, Math.max(4, (c.l * b.l) / a.l)));
    const alt = b.a === a.a ? c.a : Math.round(Math.max(4, (c.a * b.a) / a.a));
    // a borda que ficou parada no computador fica parada no celular
    const dx = b.x !== a.x && b.x + b.l === a.x + a.l ? c.l - l : (b.x - a.x) * escala;
    const dy = b.y !== a.y && b.y + b.a === a.y + a.a ? c.a - alt : b.y - a.y;
    const x = Math.round(limita(c.x + dx, Math.min(0, c.x), LARGURA_CEL - Math.min(l, LARGURA_CEL)));
    return { ...p, cel: { x, y: Math.round(c.y + dy), l, a: alt } };
  });
}

// Peça nova, no meio da tela do modo em que o dono está (a outra é calculada).
export function novaPeca(tipo: TipoPeca, modo: Modo, y: number): Peca {
  const tamanhos: Record<TipoPeca, [number, number]> = { texto: [420, 60], imagem: [300, 220], botao: [200, 48], forma: [220, 220], icone: [72, 72] };
  const [l0, a] = tamanhos[tipo];
  const largura = modo === "pc" ? LARGURA_PC : LARGURA_CEL;
  const l = Math.min(l0, largura - 2 * MARGEM);
  const caixa: Caixa = { x: Math.round((largura - l) / 2), y: Math.max(0, Math.round(y)), l, a: Math.round((a * l) / l0) };
  const base = { id: novoId(), pc: modo === "pc" ? caixa : paraComputador(caixa), cel: modo === "cel" ? caixa : paraCelular(caixa) };
  switch (tipo) {
    case "texto":
      return { ...base, tipo, texto: "Escreva aqui", tamanho: 40, tamanhoCel: 28, titulo: true, negrito: true, alinhar: "centro" };
    case "imagem":
      return { ...base, tipo, imagem: null, raio: 16 };
    case "botao":
      return { ...base, tipo, texto: "Ver planos", alvo: "#planos" };
    case "forma":
      return { ...base, tipo, forma: "retangulo", raio: 24 };
    case "icone":
      return { ...base, tipo, icone: "estrela" };
  }
}

// ---------- Seções ----------

type Item = { id: string };
export type ItemIcone = Item & { icone: IdIcone; texto: string };

export type PropsSecao = {
  capa: {
    logo: string | null; // imagem; null = marca padrão do módulo
    mostrarNome: boolean;
    etiqueta: string; // frase pequena acima do título
    titulo: string;
    destaque: string; // parte do título que fica colorida
    texto: string;
    imagem: string | null; // foto de capa
    escurecer: number; // 0 a 90: quanto a foto de capa fica escura
    mostrarNumero: boolean; // "112 membros ativos"
    selos: ItemIcone[];
    botao: string;
    alvo: string; // "#planos", "#contato" ou um endereço completo
    botaoSecundario: string;
    alvoSecundario: string;
    rodape: string; // linha de apoio abaixo dos botões
  };
  aviso: { texto: string; alvo: string };
  destaques: { itens: (Item & { titulo: string; texto: string })[] };
  beneficios: { etiqueta: string; titulo: string; texto: string; itens: (Item & { icone: IdIcone; titulo: string; texto: string })[] };
  planos: {
    etiqueta: string;
    titulo: string;
    texto: string;
    destaque: string; // "auto" | "nenhum" | id do plano
    selo: string;
    botao: string;
    mostrarItens: boolean;
    ocultos: string[]; // ids dos planos que não aparecem
    // usados pelo desenho de planos do sistema principal (filtro por recorrência e tabela)
    filtro: boolean;
    comparativo: boolean;
  };
  comoFunciona: { etiqueta: string; titulo: string; texto: string; itens: (Item & { titulo: string; texto: string })[] };
  sobre: { etiqueta: string; titulo: string; texto: string; imagem: string | null; lado: "esquerda" | "direita"; botao: string; alvo: string };
  video: { titulo: string; texto: string; url: string };
  depoimentos: {
    titulo: string;
    texto: string;
    itens: (Item & { autor: string; detalhe: string; texto: string; foto: string | null; estrelas: number })[];
  };
  galeria: { titulo: string; texto: string; itens: (Item & { imagem: string | null; titulo: string })[] };
  duvidas: { titulo: string; texto: string; itens: (Item & { titulo: string; texto: string })[] };
  equipe: { titulo: string; texto: string; itens: (Item & { nome: string; cargo: string; foto: string | null })[] };
  aulas: { titulo: string; texto: string };
  horarios: { titulo: string; texto: string };
  localizacao: { titulo: string; endereco: string; mostrarMapa: boolean };
  chamada: { titulo: string; texto: string; botao: string; alvo: string };
  contato: { titulo: string; texto: string; instagram: string; facebook: string; youtube: string; tiktok: string; site: string };
  rodape: { texto: string };
  // área em branco: só peças livres. Alturas nas unidades de desenho (ver Peças livres)
  livre: { altura: number; alturaCel: number };
};

export type TipoSecao = keyof PropsSecao;
export type SecaoDo<T extends TipoSecao> = { id: string; tipo: T; visivel: boolean; props: PropsSecao[T]; estilo: Estilo; pecas?: Peca[] };
export type Secao = { [T in TipoSecao]: SecaoDo<T> }[TipoSecao];

export type PaginaConfig = { modelo: 3; tema: Tema; secoes: Secao[] };

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
  // planos null = os planos vêm do Cliente Plus (Produtos/Planos), fora do módulo.
  // (O endereço da página não entra: é definido na criação da loja e só a
  // plataforma muda.)
  ondeMudar: { planos: string | null; whatsapp: string };
  // modelos prontos que o dono pode aplicar no editor ("Modelos prontos"; lib/pagina-modelos.ts)
  modelos?: ModeloPagina[];
};

// ---------- Catálogo de seções ----------

export const novoId = () => `s_${Math.random().toString(36).slice(2, 10)}`;
const item = <T extends object>(x: T): T & Item => ({ id: novoId(), ...x });

export const catalogo: {
  [T in TipoSecao]: {
    nome: string;
    descricao: string;
    unica?: boolean; // só uma por página
    fixa?: boolean; // não pode ser apagada
    estilo?: Estilo; // aparência com que a seção nasce
    alinha?: boolean; // tem a opção "à esquerda / no centro"
    colunas?: number[]; // quantidades de colunas que o dono pode escolher
    nova: (d: DadosPagina) => PropsSecao[T];
  };
} = {
  capa: {
    nome: "Capa",
    descricao: "A primeira coisa que a pessoa vê: logo, título, foto de capa e os botões.",
    unica: true,
    alinha: true,
    nova: (d) => ({
      logo: null,
      mostrarNome: true,
      etiqueta: "",
      titulo: `Entre para o ${d.nome}`,
      destaque: d.nome,
      texto: "",
      imagem: null,
      escurecer: 65,
      mostrarNumero: true,
      selos: [],
      botao: "Ver planos",
      alvo: "#planos",
      botaoSecundario: "",
      alvoSecundario: "",
      rodape: "",
    }),
  },
  aviso: {
    nome: "Faixa de aviso",
    descricao: "Uma faixa colorida com uma frase curta. Ex.: promoção, cupom ou vagas abertas.",
    estilo: { fundo: "marca", espaco: "pequeno", alinhamento: "centro" },
    alinha: true,
    nova: () => ({ texto: "🔥 Promoção por tempo limitado: use o cupom BEMVINDO", alvo: "" }),
  },
  destaques: {
    nome: "Destaques",
    descricao: "Uma linha com números ou frases curtas. Ex.: \"+500 alunos\", \"10 anos de história\".",
    estilo: { fundo: "alternado" },
    colunas: [2, 3, 4],
    nova: () => ({
      itens: [
        item({ titulo: "+500", texto: "clientes atendidos" }),
        item({ titulo: "10 anos", texto: "de história" }),
        item({ titulo: "5 estrelas", texto: "nas avaliações" }),
      ],
    }),
  },
  beneficios: {
    nome: "Benefícios",
    descricao: "Lista do que a pessoa ganha, cada item com um ícone.",
    alinha: true,
    colunas: [1, 2, 3, 4],
    nova: () => ({
      etiqueta: "",
      titulo: "O que você recebe",
      texto: "",
      itens: [
        item({ icone: "check" as IdIcone, titulo: "Primeiro benefício", texto: "" }),
        item({ icone: "check" as IdIcone, titulo: "Segundo benefício", texto: "" }),
        item({ icone: "check" as IdIcone, titulo: "Terceiro benefício", texto: "" }),
      ],
    }),
  },
  planos: {
    nome: "Planos",
    descricao: "Os planos à venda, com preço e botão. Os planos em si (nome, preço) são cadastrados no sistema.",
    unica: true,
    fixa: true,
    alinha: true,
    colunas: [1, 2, 3, 4],
    nova: () => ({
      etiqueta: "",
      titulo: "Escolha seu plano",
      texto: "",
      destaque: "auto",
      selo: "Mais escolhido",
      botao: "Quero este plano",
      mostrarItens: true,
      ocultos: [],
      filtro: true,
      comparativo: true,
    }),
  },
  comoFunciona: {
    nome: "Como funciona",
    descricao: "Passo a passo numerado (ex.: escolha, pague, receba o acesso).",
    alinha: true,
    colunas: [1, 2, 3, 4],
    nova: () => ({
      etiqueta: "",
      titulo: "Como funciona",
      texto: "",
      itens: [
        item({ titulo: "Escolha o plano", texto: "Veja os planos e escolha o seu." }),
        item({ titulo: "Faça o pagamento", texto: "Rápido e seguro." }),
        item({ titulo: "Pronto!", texto: "Você recebe o acesso na hora." }),
      ],
    }),
  },
  sobre: {
    nome: "Texto com foto",
    descricao: "Um bloco livre: título, texto, uma foto ao lado e um botão. Bom para \"Quem somos\".",
    nova: () => ({ etiqueta: "", titulo: "Quem somos", texto: "Conte a sua história aqui.", imagem: null, lado: "direita", botao: "", alvo: "" }),
  },
  video: {
    nome: "Vídeo",
    descricao: "Um vídeo do YouTube, do Vimeo ou enviado do seu computador.",
    estilo: { alinhamento: "centro" },
    alinha: true,
    nova: () => ({ titulo: "Veja como funciona", texto: "", url: "" }),
  },
  depoimentos: {
    nome: "Depoimentos",
    descricao: "O que os clientes dizem, com nome, foto e estrelas.",
    alinha: true,
    colunas: [1, 2, 3],
    nova: () => ({
      titulo: "Quem já entrou aprova",
      texto: "",
      itens: [
        item({ autor: "Nome do cliente", detalhe: "Cliente há 6 meses", texto: "Escreva aqui o que o cliente falou.", foto: null, estrelas: 5 }),
        item({ autor: "Nome do cliente", detalhe: "Cliente há 1 ano", texto: "Escreva aqui o que o cliente falou.", foto: null, estrelas: 5 }),
      ],
    }),
  },
  galeria: {
    nome: "Galeria de fotos",
    descricao: "Várias fotos lado a lado, com legenda opcional.",
    alinha: true,
    colunas: [2, 3, 4],
    nova: () => ({ titulo: "Por dentro", texto: "", itens: [] }),
  },
  duvidas: {
    nome: "Perguntas frequentes",
    descricao: "Perguntas e respostas que abrem com um toque.",
    estilo: { alinhamento: "centro", largura: "estreita" },
    alinha: true,
    nova: () => ({
      titulo: "Perguntas frequentes",
      texto: "",
      itens: [
        item({ titulo: "Como faço para assinar?", texto: "Escolha o plano, preencha seus dados e faça o pagamento." }),
        item({ titulo: "Posso cancelar quando quiser?", texto: "Sim. Você cancela quando quiser, sem multa." }),
      ],
    }),
  },
  equipe: {
    nome: "Equipe",
    descricao: "Fotos, nomes e funções das pessoas da equipe.",
    alinha: true,
    colunas: [2, 3, 4],
    nova: (d) => ({
      titulo: "Nossa equipe",
      texto: "",
      itens: (d.equipe ?? []).map((p) => item({ nome: p.nome, cargo: p.cargo, foto: null })),
    }),
  },
  aulas: {
    nome: "Aulas da semana",
    descricao: "As aulas com dias e horários. Vêm sozinhas do cadastro de aulas.",
    unica: true,
    alinha: true,
    colunas: [1, 2, 3],
    nova: () => ({ titulo: "Aulas coletivas", texto: "" }),
  },
  horarios: {
    nome: "Horário de funcionamento",
    descricao: "Os dias e horários em que vocês abrem. Vêm sozinhos das Configurações.",
    unica: true,
    alinha: true,
    nova: () => ({ titulo: "Horário de funcionamento", texto: "" }),
  },
  localizacao: {
    nome: "Endereço e mapa",
    descricao: "O endereço, um mapa e o botão \"Como chegar\".",
    unica: true,
    alinha: true,
    nova: () => ({ titulo: "Onde estamos", endereco: "", mostrarMapa: true }),
  },
  chamada: {
    nome: "Chamada final",
    descricao: "Um bloco em destaque convidando a pessoa a assinar, com um botão.",
    estilo: { alinhamento: "centro" },
    alinha: true,
    nova: () => ({ titulo: "Pronto para começar?", texto: "Escolha seu plano e entre hoje mesmo.", botao: "Quero entrar agora", alvo: "#planos" }),
  },
  contato: {
    nome: "Contato",
    descricao: "Botão do WhatsApp e as redes sociais.",
    unica: true,
    estilo: { alinhamento: "centro" },
    alinha: true,
    nova: () => ({ titulo: "", texto: "Dúvidas? Fale com a gente no WhatsApp", instagram: "", facebook: "", youtube: "", tiktok: "", site: "" }),
  },
  livre: {
    nome: "Tela livre",
    descricao: "Uma área em branco para montar do seu jeito: solte textos, fotos, botões e formas onde quiser.",
    nova: () => ({ altura: 420, alturaCel: 480 }),
  },
  rodape: {
    nome: "Rodapé",
    descricao: "A última linha da página. Ex.: nome da empresa, CNPJ, endereço.",
    unica: true,
    estilo: { alinhamento: "centro", espaco: "pequeno" },
    alinha: true,
    nova: (d) => ({ texto: `© ${new Date().getFullYear()} ${d.nome}` }),
  },
};

export function novaSecao<T extends TipoSecao>(tipo: T, d: DadosPagina, props?: Partial<PropsSecao[T]>, estilo?: Estilo): SecaoDo<T> {
  return { id: novoId(), tipo, visivel: true, props: { ...catalogo[tipo].nova(d), ...props }, estilo: { ...catalogo[tipo].estilo, ...estilo } };
}

// Para os adaptadores montarem listas da página padrão.
export const novoItem = item;

// ---------- Abrir uma página salva ----------

const escolhe = <T extends string>(v: unknown, opcoes: Record<T, unknown>): T | undefined =>
  typeof v === "string" && v in opcoes ? (v as T) : undefined;

function estiloSeguro(bruto: unknown): Estilo {
  if (!bruto || typeof bruto !== "object") return {};
  const b = bruto as Record<string, unknown>;
  const e: Estilo = {};
  const fundo = escolhe(b.fundo, fundosSecao);
  if (fundo) e.fundo = fundo;
  if (ehCor(b.cor)) e.cor = b.cor;
  if (ehCor(b.cor2)) e.cor2 = b.cor2;
  if (typeof b.imagem === "string" && b.imagem) e.imagem = b.imagem;
  if (typeof b.escurecer === "number") e.escurecer = Math.min(90, Math.max(0, b.escurecer));
  if (ehCor(b.corTexto)) e.corTexto = b.corTexto;
  if (ehCor(b.corDestaque)) e.corDestaque = b.corDestaque;
  const espaco = escolhe(b.espaco, espacos);
  if (espaco) e.espaco = espaco;
  const largura = escolhe(b.largura, larguras);
  if (largura) e.largura = largura;
  if (b.alinhamento === "esquerda" || b.alinhamento === "centro") e.alinhamento = b.alinhamento;
  const titulo = escolhe(b.titulo, tamanhosTitulo);
  if (titulo) e.titulo = titulo;
  if (typeof b.colunas === "number" && b.colunas >= 1 && b.colunas <= 4) e.colunas = Math.round(b.colunas);
  return e;
}

const numero = (v: unknown, min: number, max: number, padrao: number) => (typeof v === "number" && Number.isFinite(v) ? limita(Math.round(v), min, max) : padrao);

function caixaSegura(bruto: unknown): Caixa | null {
  if (!bruto || typeof bruto !== "object") return null;
  const b = bruto as Record<string, unknown>;
  if (typeof b.x !== "number" || typeof b.y !== "number") return null;
  return { x: numero(b.x, -2000, 4000, 0), y: numero(b.y, -2000, 20000, 0), l: numero(b.l, 4, 4000, 100), a: numero(b.a, 4, 8000, 100) };
}

function pecasSeguras(bruto: unknown): Peca[] {
  if (!Array.isArray(bruto)) return [];
  const pecas: Peca[] = [];
  for (const x of bruto.slice(0, MAX_PECAS)) {
    if (!x || typeof x !== "object") continue;
    const b = x as Record<string, unknown>;
    const tipo = escolhe(b.tipo, nomesPecas);
    const pc = caixaSegura(b.pc) ?? caixaSegura(b.cel);
    if (!tipo || !pc) continue;
    // o que faltar fica igual a uma peça nova daquele tipo
    const peca = { ...novaPeca(tipo, "pc", 0), ...b, tipo, id: typeof b.id === "string" && b.id ? b.id : novoId(), pc, cel: caixaSegura(b.cel) ?? paraCelular(pc) } as Peca;
    for (const k of ["cor", "cor2"] as const) if (k in peca && !ehCor((peca as Record<string, unknown>)[k])) delete (peca as Record<string, unknown>)[k];
    pecas.push(peca);
  }
  return pecas;
}

function temaSeguro(bruto: unknown, padrao: Tema): Tema {
  if (!bruto || typeof bruto !== "object") return padrao;
  const b = bruto as Record<string, unknown>;
  const tom: Tom = b.tom === "claro" || b.tom === "escuro" ? b.tom : padrao.tom;
  const fonte = escolhe(b.fonte, fontes) ?? (b.titulacao === "neutra" ? "inter" : b.titulacao === "display" ? "outfit" : padrao.fonte);
  const raio = escolhe(b.raio, raios) ?? padrao.raio;
  const densidade = escolhe(b.densidade, densidades) ?? padrao.densidade;
  // modelo 2 (sistema principal): só a cor da marca
  if (!b.cores && ehCor(b.marca)) {
    return { combinacao: MINHA, tom, cores: coresDa({ cor1: b.marca, cor2: b.marca }, tom), fonte, raio, densidade };
  }
  const pronta = combinacao(typeof b.combinacao === "string" ? b.combinacao : null);
  const base = combinacao(typeof b.base === "string" ? b.base : null);
  const partida = coresDa(pronta ?? base ?? padrao.cores, tom);
  if (pronta) return { combinacao: pronta.chave, tom, cores: coresSeguras(b.cores, partida), fonte, raio, densidade };
  return { combinacao: MINHA, ...(base ? { base: base.chave } : {}), tom, cores: coresSeguras(b.cores, partida), fonte, raio, densidade };
}

// Completa uma página salva com o que faltar (seções de versões antigas,
// campos novos, páginas do modelo 2) e garante uma seção de planos. (A capa
// não é obrigatória: o dono pode soltá-la em peças livres ou montar a dele.)
export function completar(bruta: unknown, d: DadosPagina, padrao: PaginaConfig): PaginaConfig {
  if (!bruta || typeof bruta !== "object") return padrao;
  const b = bruta as { modelo?: unknown; tema?: unknown; secoes?: unknown };
  if (!Array.isArray(b.secoes) || (b.modelo !== 2 && b.modelo !== 3)) return padrao;
  const secoes: Secao[] = [];
  for (const s of b.secoes) {
    if (!s || typeof s !== "object") continue;
    const x = s as { id?: unknown; tipo?: unknown; visivel?: unknown; props?: unknown; estilo?: unknown; pecas?: unknown };
    const tipo = escolhe(x.tipo, catalogo);
    if (!tipo) continue;
    const info = catalogo[tipo];
    if (info.unica && secoes.some((o) => o.tipo === tipo)) continue;
    const base = info.nova(d) as Record<string, unknown>;
    const salvas = (x.props && typeof x.props === "object" ? x.props : {}) as Record<string, unknown>;
    const props: Record<string, unknown> = { ...base, ...salvas };
    for (const k of Object.keys(base)) {
      if (!Array.isArray(base[k])) continue;
      // listas: mantém só se forem listas, e todo item precisa de id (arrastar)
      props[k] = Array.isArray(salvas[k])
        ? (salvas[k] as unknown[]).map((i) => (i && typeof i === "object" ? { ...i, id: (i as Item).id || novoId() } : i))
        : base[k];
    }
    // no modelo 2, fundo e alinhamento ficavam junto com o conteúdo
    const estilo = { ...info.estilo, ...estiloSeguro({ fundo: salvas.fundo, alinhamento: salvas.alinhamento }), ...estiloSeguro(x.estilo) };
    const pecas = pecasSeguras(x.pecas);
    secoes.push({ id: typeof x.id === "string" && x.id ? x.id : novoId(), tipo, visivel: x.visivel !== false, props, estilo, ...(pecas.length ? { pecas } : {}) } as Secao);
  }
  if (!secoes.some((s) => s.tipo === "planos")) secoes.splice(Math.min(1, secoes.length), 0, novaSecao("planos", d));
  return { modelo: 3, tema: temaSeguro(b.tema, padrao.tema), secoes };
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

