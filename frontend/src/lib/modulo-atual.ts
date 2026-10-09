// O painel do módulo Artes Marciais é o painel da Academia com as partes de
// luta. As telas ficam em routes/academia/*, mas abrem em /artes-marciais/*:
// o roteador troca o começo do endereço (rewrite em main.tsx) e cada chamada
// à API leva o cabeçalho X-Modulo, que faz o backend usar a loja do dojo
// (backend: academia/LojaAcademia.java).

export type ModuloPainel = "academia" | "artes-marciais";

let atual: ModuloPainel = "academia";

export function definirModulo(m: ModuloPainel) {
  atual = m;
  if (typeof document !== "undefined") document.documentElement.dataset.modulo = m;
}

export const moduloAtual = () => atual;
export const ehArtesMarciais = () => atual === "artes-marciais";

// Cabeçalho para as chamadas à API.
export function cabecalhoModulo(): Record<string, string> {
  return atual === "artes-marciais" ? { "X-Modulo": "artes-marciais" } : {};
}

const PREFIXO = "/artes-marciais";

function comPrefixo(caminho: string, prefixo: string) {
  return caminho === prefixo || caminho.startsWith(prefixo + "/");
}

// Endereço do navegador -> rota interna (/artes-marciais/x -> /academia/x).
export function entrada(url: URL): URL | undefined {
  if (comPrefixo(url.pathname, PREFIXO)) {
    definirModulo("artes-marciais");
    const nova = new URL(url);
    nova.pathname = "/academia" + url.pathname.slice(PREFIXO.length);
    return nova;
  }
  // páginas do aluno, do responsável, da presença e do certificado do dojo
  if (/^\/(aluno|responsavel|presenca|certificado)\//.test(url.pathname)) definirModulo("artes-marciais");
  else if (comPrefixo(url.pathname, "/academia") || /^\/(cliente|a)\//.test(url.pathname)) definirModulo("academia");
  return undefined;
}

// Rota interna -> endereço do navegador (dentro do dojo, /academia/x vira
// /artes-marciais/x).
export function saida(url: URL): URL | undefined {
  if (atual !== "artes-marciais" || !comPrefixo(url.pathname, "/academia")) return undefined;
  const nova = new URL(url);
  nova.pathname = PREFIXO + url.pathname.slice("/academia".length);
  return nova;
}

// Nome e textos que mudam entre os dois módulos.
export function textosModulo() {
  return atual === "artes-marciais"
    ? { produto: "Gestão Plus Artes Marciais", sufixo: "ARTES MARCIAIS", local: "academia", raiz: PREFIXO }
    : { produto: "Gestão Plus Academia", sufixo: "ACADEMIA", local: "academia", raiz: "/academia" };
}
