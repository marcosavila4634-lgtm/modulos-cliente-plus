import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  LARGURA_CEL,
  LARGURA_PC,
  MAX_PECAS,
  icones,
  novoId,
  paraCelular,
  type Caixa,
  type DadosPagina,
  type IdIcone,
  type Modo,
  type PaginaConfig,
  type Peca,
  type Secao,
  type TipoSecao,
} from "../../lib/pagina";
import { PaginaPublica } from "./PaginaPublica";
import { arrumarNoCelular } from "./PecasEdicao";

// "Soltar tudo em peças livres": transforma uma seção pronta (capa, texto com
// foto, benefícios...) numa Tela livre com as MESMAS coisas no MESMO lugar, só
// que soltas: cada título, texto, foto, botão, cartão e ícone vira uma peça.
//
// Como: a seção é desenhada escondida, do jeito que aparece na página de
// verdade, uma vez na largura do computador e outra na do celular; cada
// elemento é medido e vira uma peça com a posição dos dois.
//
// Não entram as seções que mostram dados do cadastro (planos, aulas,
// horários, mapa) nem vídeo e perguntas: essas continuam como blocos.

export const podeSoltar: Partial<Record<TipoSecao, true>> = {
  capa: true,
  aviso: true,
  destaques: true,
  beneficios: true,
  comoFunciona: true,
  sobre: true,
  depoimentos: true,
  galeria: true,
  equipe: true,
  chamada: true,
  contato: true,
  rodape: true,
};

export type Soltura = { pecas: Peca[]; altura: number; alturaCel: number; fundo?: { imagem: string; escurecer: number }; ficouDeFora: number };

type Medida = { caixa: Caixa } & (
  | { tipo: "texto"; texto: string; tamanho: number; titulo: boolean; negrito: boolean; cor?: string; alinhar: "esquerda" | "centro" | "direita"; linha?: number }
  | { tipo: "imagem"; imagem: string; raio: number }
  | { tipo: "botao"; texto: string; alvo: string; simples: boolean }
  | { tipo: "forma"; forma: "retangulo" | "elipse"; cor?: string; raio: number; opacidade?: number }
  | { tipo: "icone"; icone: IdIcone; cor?: string }
);

// ---------- medir ----------

// "rgb(1, 2, 3)" / "rgba(1, 2, 3, 0.5)" → cor #rrggbb e transparência (0 a 1)
function cor(css: string): { hex: string; alfa: number } | null {
  const m = /rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\)/.exec(css);
  if (!m) return null;
  const alfa = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
  return { hex: `#${[m[1], m[2], m[3]].map((v) => Math.round(Number(v)).toString(16).padStart(2, "0")).join("")}`, alfa };
}

// ícones do catálogo pela classe que a biblioteca põe no <svg> ("lucide-dumbbell")
const iconePelaClasse = new Map<string, IdIcone>(
  (Object.keys(icones) as IdIcone[]).flatMap((id) => {
    const nome = (icones[id].icone as { displayName?: string }).displayName;
    return nome ? [[`lucide-${nome.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`, id] as [string, IdIcone]] : [];
  }),
);

function medir(raiz: HTMLElement, modo: Modo): { altura: number; itens: Medida[]; capa: boolean; ficouDeFora: number } {
  const pagina = raiz.firstElementChild as HTMLElement; // a página (PaginaPublica)
  const secao = pagina.firstElementChild as HTMLElement; // a única seção desenhada
  const rp = pagina.getBoundingClientRect();
  const rs = secao.getBoundingClientRect();
  const larguraTela = modo === "pc" ? Math.min(rp.width, LARGURA_PC) : rp.width;
  const u = larguraTela / (modo === "pc" ? LARGURA_PC : LARGURA_CEL);
  const esquerda = rp.left + (rp.width - larguraTela) / 2;
  const caixa = (r: DOMRect): Caixa => ({ x: Math.round((r.left - esquerda) / u), y: Math.round((r.top - rs.top) / u), l: Math.max(4, Math.round(r.width / u)), a: Math.max(4, Math.round(r.height / u)) });
  const cobreTudo = (r: DOMRect) => r.width * r.height >= rs.width * rs.height * 0.9;

  // cores "do tema" dentro da seção: peça com essas cores não guarda cor (continua seguindo o tema)
  const sonda = document.createElement("span");
  secao.append(sonda);
  const corDe = (variavel: string) => {
    sonda.style.color = `var(${variavel})`;
    return cor(getComputedStyle(sonda).color)?.hex;
  };
  const [corTitulo, corRealce] = [corDe("--pg-titulo"), corDe("--pg-realce")];
  const letraComum = getComputedStyle(pagina).fontFamily;
  sonda.remove();

  const itens: Medida[] = [];
  const usados = new Set<Element>(); // elementos que já viraram peça junto com o que têm dentro
  let capa = false;
  let ficouDeFora = 0;

  const texto = (el: HTMLElement, r: DOMRect) => {
    const e = getComputedStyle(el);
    const escrito = (el.textContent ?? "").trim();
    if (!escrito) return;
    const conteudo = e.textTransform === "uppercase" ? escrito.toUpperCase() : escrito;
    const c = cor(e.color);
    const linha = parseFloat(e.lineHeight) / parseFloat(e.fontSize);
    const alinhar = e.textAlign === "center" ? "centro" : e.textAlign === "right" || e.textAlign === "end" ? "direita" : "esquerda";
    const cx = caixa(r);
    itens.push({
      tipo: "texto",
      caixa: { ...cx, l: cx.l + 2 }, // folga para a linha não quebrar por um arredondamento
      texto: conteudo,
      tamanho: Math.max(8, Math.round(parseFloat(e.fontSize) / u)),
      titulo: e.fontFamily !== letraComum,
      negrito: Number(e.fontWeight) >= 600,
      // transparente = texto em degradê; igual ao tema = não guarda cor
      cor: !c || c.alfa < 0.1 ? corRealce : c.hex === corTitulo ? undefined : c.hex,
      alinhar,
      ...(Number.isFinite(linha) ? { linha: Math.round(linha * 100) / 100 } : {}),
    });
  };

  for (const el of secao.querySelectorAll<HTMLElement>("*")) {
    if ([...usados].some((x) => x.contains(el))) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const e = getComputedStyle(el);
    if (e.visibility === "hidden" || e.display === "none") continue;
    const marca = el.tagName.toLowerCase();

    if (marca === "img") {
      const src = el.getAttribute("src");
      if (cobreTudo(r)) capa = true; // foto de capa: vira o fundo da seção
      else if (src) itens.push({ tipo: "imagem", caixa: caixa(r), imagem: src, raio: Math.round(parseFloat(e.borderTopLeftRadius) / u) || 0 });
      continue;
    }
    if (marca === "svg") {
      usados.add(el);
      const id = [...el.classList].map((c) => iconePelaClasse.get(c)).find(Boolean);
      if (id) {
        const c = cor(e.color);
        itens.push({ tipo: "icone", caixa: caixa(r), icone: id, cor: c && c.hex !== corRealce ? c.hex : undefined });
      } else ficouDeFora++;
      continue;
    }
    if (marca === "a" || marca === "button") {
      usados.add(el);
      const conteudo = (el.textContent ?? "").trim();
      if (conteudo) itens.push({ tipo: "botao", caixa: caixa(r), texto: conteudo, alvo: el.getAttribute("href") ?? "#planos", simples: e.backgroundImage === "none" });
      else ficouDeFora++; // só um ícone (ex.: rede social)
      continue;
    }
    if (el.dataset.txt !== undefined) {
      usados.add(el);
      texto(el, r);
      continue;
    }
    // caixas com fundo ou contorno (cartões, bolinhas, selos) viram formas
    const fundo = cor(e.backgroundColor);
    const temDegrade = e.backgroundImage.includes("gradient");
    const borda = parseFloat(e.borderTopWidth) > 0 ? cor(e.borderTopColor) : null;
    if (((fundo && fundo.alfa > 0.02) || temDegrade || (borda && borda.alfa > 0.05 && parseFloat(e.borderLeftWidth) > 0)) && !cobreTudo(r)) {
      const raio = parseFloat(e.borderTopLeftRadius) || 0;
      const redonda = raio >= Math.min(r.width, r.height) / 2 - 1 && Math.abs(r.width - r.height) < 2;
      const pintura = fundo && fundo.alfa > 0.02 ? fundo : borda;
      itens.push({
        tipo: "forma",
        caixa: caixa(r),
        forma: redonda ? "elipse" : "retangulo",
        raio: Math.round(raio / u),
        // degradê = as cores da marca (padrão da forma)
        ...(temDegrade || !pintura ? {} : { cor: pintura.hex, ...(pintura.alfa < 0.98 ? { opacidade: Math.max(5, Math.round(pintura.alfa * 100)) } : {}) }),
      });
    }
    // texto escrito direto (ex.: nome da loja, "112 alunos"), fora dos campos que o dono edita
    const proprio = [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
    if (proprio && !el.querySelector("[data-txt], a, button, img")) {
      usados.add(el);
      texto(el, r);
    }
  }
  return { altura: Math.round(rs.height / u), itens, capa, ficouDeFora };
}

// ---------- juntar computador + celular ----------

function juntar(pc: ReturnType<typeof medir>, cel: ReturnType<typeof medir>, secao: Secao): Soltura {
  // as duas medições percorrem a mesma seção na mesma ordem; se algo não bater, o celular é calculado
  const iguais = pc.itens.length === cel.itens.length && pc.itens.every((m, i) => m.tipo === cel.itens[i].tipo);
  // formas atrás, depois fotos e ícones, textos e botões na frente
  const ordem = { forma: 0, imagem: 1, icone: 2, texto: 3, botao: 3 };
  let pecas = pc.itens
    .map((m, i): [Medida, Peca] => {
      const { caixa, ...resto } = m;
      const noCel = iguais ? cel.itens[i] : null;
      const base = { id: novoId(), pc: caixa, cel: noCel?.caixa ?? paraCelular(caixa) };
      if (resto.tipo === "texto") return [m, { ...base, ...resto, tamanhoCel: noCel?.tipo === "texto" ? noCel.tamanho : Math.max(12, Math.round(resto.tamanho * 0.7)) }];
      return [m, { ...base, ...resto } as Peca];
    })
    .sort(([a], [b]) => ordem[a.tipo] - ordem[b.tipo])
    .map(([, p]) => p);
  const sobrou = Math.max(0, pecas.length - MAX_PECAS);
  pecas = pecas.slice(0, MAX_PECAS);
  let alturaCel = cel.altura;
  if (!iguais) {
    const r = arrumarNoCelular(pecas);
    pecas = r.pecas;
    alturaCel = r.altura;
  }
  const fundo = secao.tipo === "capa" && pc.capa && secao.props.imagem ? { imagem: secao.props.imagem, escurecer: secao.props.escurecer } : null;
  return {
    pecas,
    altura: pc.altura,
    alturaCel,
    ...(fundo ? { fundo } : {}),
    ficouDeFora: pc.ficouDeFora + sobrou,
  };
}

// Desenha a seção escondida nas duas larguras, mede e avisa. Fica na tela só enquanto mede.
export function Soltador({ pagina, dados, secao, aoTerminar }: { pagina: PaginaConfig; dados: DadosPagina; secao: Secao; aoTerminar: (r: Soltura | null) => void }) {
  const pc = useRef<HTMLDivElement>(null);
  const cel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const fotos = [pc.current!, cel.current!].flatMap((r) => [...r.querySelectorAll("img")]);
        // as fotos precisam estar carregadas para os tamanhos saírem certos (espera no máximo 3 s)
        await Promise.race([Promise.all(fotos.map((f) => f.decode().catch(() => {}))), new Promise((r) => setTimeout(r, 3000))]);
        await document.fonts?.ready;
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        if (vivo) aoTerminar(juntar(medir(pc.current!, "pc"), medir(cel.current!, "cel"), secao));
      } catch {
        if (vivo) aoTerminar(null);
      }
    })();
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // sem as peças que a seção já tem (essas continuam como estão)
  const so: PaginaConfig = { ...pagina, secoes: [{ ...secao, visivel: true, pecas: [] } as Secao] };
  return createPortal(
    <div aria-hidden className="pointer-events-none fixed top-0 -left-[20000px] opacity-0">
      <div ref={pc} style={{ width: 1280 }}>
        <PaginaPublica pagina={so} dados={dados} aoEscolherPlano={() => {}} />
      </div>
      <div ref={cel} style={{ width: LARGURA_CEL }}>
        <PaginaPublica pagina={so} dados={dados} aoEscolherPlano={() => {}} />
      </div>
    </div>,
    document.body,
  );
}
