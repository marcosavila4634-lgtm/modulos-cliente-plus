// Cores da página pública: combinações prontas (como no Delivery Plus) e a
// "personalizada", em que o dono troca cor por cor. A página guarda as cores
// já resolvidas em tema.cores, então desenhar não depende desta lista.

export type Tom = "escuro" | "claro";

// Todas no formato #rrggbb.
export type Cores = {
  cor1: string; // começo do degradê (botões e destaques)
  cor2: string; // fim do degradê
  sobre: string; // texto por cima do degradê
  fundo: string; // fundo da página
  fundoAlt: string; // fundo das seções "alternadas"
  cartao: string; // fundo dos cartões
  borda: string; // linhas e contornos
  titulo: string;
  texto: string;
  suave: string; // texto secundário
};

export type Combinacao = { chave: string; nome: string; descricao: string; cor1: string; cor2: string };

export const MINHA = "minha"; // tema.combinacao quando o dono editou as cores

export const combinacoes: Combinacao[] = [
  { chave: "cliente-plus", nome: "Cliente Plus", descricao: "Roxo com rosa", cor1: "#7c3aed", cor2: "#ec4899" },
  { chave: "por-do-sol", nome: "Pôr do sol", descricao: "Amarelo com laranja", cor1: "#f59e0b", cor2: "#f97316" },
  { chave: "quente", nome: "Quente", descricao: "Laranja com vermelho", cor1: "#f97316", cor2: "#ef4444" },
  { chave: "oceano", nome: "Oceano", descricao: "Azul-claro com azul", cor1: "#38bdf8", cor2: "#2563eb" },
  { chave: "floresta", nome: "Floresta", descricao: "Verde-claro com verde", cor1: "#34d399", cor2: "#059669" },
  { chave: "uva", nome: "Uva", descricao: "Lilás com roxo", cor1: "#c084fc", cor2: "#7c3aed" },
  { chave: "doceria", nome: "Doceria", descricao: "Rosa-claro com rosa", cor1: "#f9a8d4", cor2: "#db2777" },
  { chave: "vinho", nome: "Vinho", descricao: "Vermelho com bordô", cor1: "#f43f5e", cor2: "#9f1239" },
  { chave: "dourado", nome: "Dourado", descricao: "Amarelo com ouro", cor1: "#fde047", cor2: "#ca8a04" },
  { chave: "tropical", nome: "Tropical", descricao: "Verde-água com turquesa", cor1: "#5eead4", cor2: "#0891b2" },
  { chave: "marinho", nome: "Marinho", descricao: "Azul com azul-marinho", cor1: "#60a5fa", cor2: "#1e40af" },
  { chave: "limao", nome: "Limão", descricao: "Verde-limão", cor1: "#bef264", cor2: "#65a30d" },
  { chave: "indigo", nome: "Índigo", descricao: "Lilás com azul-violeta", cor1: "#a5b4fc", cor2: "#4f46e5" },
  { chave: "pitaya", nome: "Pitaya", descricao: "Rosa com magenta", cor1: "#f0abfc", cor2: "#a21caf" },
  { chave: "cafe", nome: "Café", descricao: "Caramelo com marrom", cor1: "#e3b77e", cor2: "#92400e" },
  { chave: "terracota", nome: "Terracota", descricao: "Areia com tom de barro", cor1: "#f6c79a", cor2: "#b4532a" },
  { chave: "petroleo", nome: "Petróleo", descricao: "Verde-água com azul-petróleo", cor1: "#5eead4", cor2: "#155e75" },
  { chave: "ameixa", nome: "Ameixa", descricao: "Pêssego com roxo-escuro", cor1: "#fdba8c", cor2: "#9d3468" },
  { chave: "camaleao", nome: "Camaleão", descricao: "Amarelo com verde-água", cor1: "#fcd34d", cor2: "#0e9f8a" },
  { chave: "grafite", nome: "Grafite", descricao: "Prata com cinza", cor1: "#e4e4e7", cor2: "#71717a" },
];

// ---------- contas com cores ----------

const HEX = /^#[0-9a-f]{6}$/i;
export const ehCor = (v: unknown): v is string => typeof v === "string" && HEX.test(v);

export function rgb(hex: string): [number, number, number] {
  const h = ehCor(hex) ? hex : "#888888";
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

// Mistura duas cores (t = 0 fica a primeira, 1 fica a segunda).
export function mistura(a: string, b: string, t: number): string {
  const x = rgb(a);
  const y = rgb(b);
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

export const rgba = (hex: string, alfa: number) => `rgba(${rgb(hex).join(",")},${alfa})`;

export function luminancia(hex: string) {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Contraste entre duas cores (1 a 21): abaixo de 3 o texto fica difícil de ler.
export function contraste(a: string, b: string) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

export const ehEscura = (hex: string) => luminancia(hex) < 0.32;

// Texto que dá leitura por cima de uma cor (ou de um degradê).
export const sobreACor = (cor1: string, cor2 = cor1) => ((luminancia(cor1) + luminancia(cor2)) / 2 > 0.3 ? "#0b0f19" : "#ffffff");

// ---------- cores de uma combinação ----------

// As duas cores de destaque dão o resto: fundos, cartões, bordas e textos.
export function coresDa(c: { cor1: string; cor2: string }, tom: Tom): Cores {
  const sobre = sobreACor(c.cor1, c.cor2);
  if (tom === "claro") {
    const fundo = mistura("#ffffff", c.cor2, 0.035);
    return {
      cor1: c.cor1,
      cor2: c.cor2,
      sobre,
      fundo,
      fundoAlt: mistura("#ffffff", c.cor2, 0.09),
      cartao: "#ffffff",
      borda: mistura(fundo, "#0f172a", 0.13),
      titulo: mistura("#0b0f19", c.cor2, 0.12),
      texto: "#334155",
      suave: "#64748b",
    };
  }
  const fundo = mistura("#05070c", c.cor2, 0.05);
  return {
    cor1: c.cor1,
    cor2: c.cor2,
    sobre,
    fundo,
    fundoAlt: mistura(fundo, "#ffffff", 0.035),
    cartao: mistura(fundo, "#ffffff", 0.055),
    borda: mistura(fundo, "#ffffff", 0.13),
    titulo: "#ffffff",
    texto: mistura("#ffffff", fundo, 0.2),
    suave: mistura("#ffffff", fundo, 0.42),
  };
}

export const combinacao = (chave: string | null | undefined) => combinacoes.find((c) => c.chave === chave) ?? null;

// As cores que o dono troca em "Editar a minha" (na ordem em que aparecem).
export const camposCores: [keyof Cores, string, string][] = [
  ["cor1", "Cor principal", "Começo do degradê dos botões e destaques"],
  ["cor2", "Segunda cor", "Fim do degradê, ícones e detalhes"],
  ["sobre", "Texto dos botões", "Texto por cima das cores de destaque"],
  ["fundo", "Fundo da página", "Atrás de tudo"],
  ["fundoAlt", "Fundo alternado", "Seções com o fundo \"Alternado\""],
  ["cartao", "Cartões", "Fundo dos cartões (planos, benefícios, depoimentos)"],
  ["borda", "Bordas", "Linhas e contornos"],
  ["titulo", "Títulos", "Títulos e textos em destaque"],
  ["texto", "Texto", "Textos comuns"],
  ["suave", "Texto secundário", "Legendas e explicações menores"],
];

// Avisos de leitura difícil (texto que some no fundo).
export function avisosDeLeitura(c: Cores): Partial<Record<keyof Cores, string>> {
  const avisos: Partial<Record<keyof Cores, string>> = {};
  const fraco = (a: string, b: string, minimo = 3) => contraste(a, b) < minimo;
  if (fraco(c.sobre, c.cor1) && fraco(c.sobre, c.cor2)) avisos.sobre = "Difícil de ler em cima dos botões.";
  if (fraco(c.titulo, c.fundo)) avisos.titulo = "Os títulos somem no fundo da página.";
  if (fraco(c.texto, c.fundo)) avisos.texto = "O texto some no fundo da página.";
  if (fraco(c.suave, c.fundo, 2.2)) avisos.suave = "O texto secundário some no fundo da página.";
  if (fraco(c.texto, c.cartao)) avisos.cartao = "O texto some dentro dos cartões.";
  return avisos;
}

// Confere cores salvas: o que faltar ou vier estragado fica com a cor de `base`.
export function coresSeguras(bruto: unknown, base: Cores): Cores {
  const b = (bruto && typeof bruto === "object" ? bruto : {}) as Record<string, unknown>;
  const saida = { ...base };
  for (const k of Object.keys(base) as (keyof Cores)[]) if (ehCor(b[k])) saida[k] = (b[k] as string).toLowerCase();
  return saida;
}
