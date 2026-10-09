import { ImageUp } from "lucide-react";
import type { CSSProperties } from "react";
import { alturaSozinha, enderecoSeguro, icones, type Caixa, type Modo, type Peca } from "../../lib/pagina";
import { Txt, useEditando } from "./Texto";

// Peças livres de uma seção (lib/pagina.ts): textos, fotos, botões, formas e
// ícones soltos por cima do conteúdo. Aqui é só o desenho; arrastar e esticar
// ficam em PecasEdicao.tsx (usado só pelo editor).
//
// As medidas são em unidades de desenho. --u é o tamanho de uma unidade na
// tela: a página do celular tem 390 unidades de largura e a do computador
// 1200 (centralizada). Cada peça leva as duas posições em variáveis CSS e a
// largura da página escolhe qual vale (@3xl = 768px).

// área onde as peças ficam (a tela do celular ou a faixa central do computador)
export const classeCamada =
  "absolute inset-y-0 left-1/2 w-full -translate-x-1/2 [--u:calc(100cqw/390)] @3xl:w-[min(100cqw,1200px)] @3xl:[--u:calc(min(100cqw,1200px)/1200)]";

const posicao =
  "absolute top-[calc(var(--yc)*var(--u))] left-[calc(var(--xc)*var(--u))] w-[calc(var(--lc)*var(--u))] @3xl:top-[calc(var(--yp)*var(--u))] @3xl:left-[calc(var(--xp)*var(--u))] @3xl:w-[calc(var(--lp)*var(--u))]";
const altura = "h-[calc(var(--ac)*var(--u))] @3xl:h-[calc(var(--ap)*var(--u))]";

export const classePeca = (p: Peca) => `${posicao} ${alturaSozinha(p) ? "" : altura}`;

// `aoVivo` troca a caixa de um dos modos enquanto a peça é arrastada no editor.
export function varsPeca(p: Peca, aoVivo?: { modo: Modo; caixa: Caixa }): CSSProperties {
  const pc = aoVivo?.modo === "pc" ? aoVivo.caixa : p.pc;
  const cel = aoVivo?.modo === "cel" ? aoVivo.caixa : p.cel;
  return {
    "--xp": pc.x,
    "--yp": pc.y,
    "--lp": pc.l,
    "--ap": pc.a,
    "--xc": cel.x,
    "--yc": cel.y,
    "--lc": cel.l,
    "--ac": cel.a,
    ...(p.tipo === "texto" ? { "--tp": p.tamanho, "--tc": p.tamanhoCel } : {}),
    opacity: p.opacidade !== undefined && p.opacidade < 100 ? p.opacidade / 100 : undefined,
  } as CSSProperties;
}

export function CamadaPecas({ pecas }: { pecas: Peca[] }) {
  return (
    <div className={`pointer-events-none ${classeCamada}`}>
      {pecas.map((p) => (
        <div key={p.id} className={`pointer-events-auto ${classePeca(p)}`} style={varsPeca(p)}>
          <PecaVisual p={p} />
        </div>
      ))}
    </div>
  );
}

const alinhamentos = { esquerda: "left", centro: "center", direita: "right" } as const;

export function PecaVisual({ p }: { p: Peca }) {
  const editando = useEditando();
  switch (p.tipo) {
    case "texto":
      return (
        <Txt
          c={`pecas/${p.id}/texto`}
          v={p.texto}
          como="div"
          linhas
          className={`block min-h-[1em] text-[length:calc(var(--tc)*var(--u))] leading-[1.15] wrap-break-word text-(--pg-titulo) @3xl:text-[length:calc(var(--tp)*var(--u))] ${
            p.titulo ? "[font-family:var(--pg-fonte)]" : ""
          } ${p.negrito ? "font-bold" : "font-normal"}`}
          estilo={{ color: p.cor, textAlign: alinhamentos[p.alinhar] ?? "center", lineHeight: p.linha }}
        />
      );
    case "imagem": {
      const src = enderecoSeguro(p.imagem);
      const raio = { borderRadius: `calc(${p.raio}*var(--u))` };
      if (src) return <img src={src} alt="" draggable={false} className={`size-full ${p.inteira ? "object-contain" : "object-cover"}`} style={raio} />;
      // sem foto: só o editor mostra o lugar reservado
      return editando ? (
        <div className="grid size-full place-items-center border border-dashed border-(--pg-linha) bg-(--pg-card) font-sans text-[length:calc(13*var(--u))] text-(--pg-suave)" style={raio}>
          <span className="flex flex-col items-center gap-1">
            <ImageUp className="size-[calc(22*var(--u))]" /> Escolha a foto ao lado
          </span>
        </div>
      ) : null;
    }
    case "botao": {
      const href = enderecoSeguro(p.alvo) ?? "#planos";
      return (
        <a
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          className={`flex w-full items-center justify-center rounded-(--pg-raio-botao) px-[calc(18*var(--u))] py-[calc(13*var(--u))] text-center text-[length:calc(16*var(--u))] leading-tight font-semibold transition hover:brightness-110 ${
            p.simples
              ? "border border-(--pg-linha) bg-(--pg-card) text-(--pg-titulo)"
              : "bg-linear-to-r from-(--pg-cor1) to-(--pg-cor2) text-(--pg-sobre) shadow-[0_10px_30px_-12px_var(--pg-sombra)]"
          }`}
        >
          <Txt c={`pecas/${p.id}/texto`} v={p.texto} />
        </a>
      );
    }
    case "forma":
      return (
        <div
          className="size-full"
          style={{
            background: p.cor ? (p.cor2 ? `linear-gradient(135deg, ${p.cor}, ${p.cor2})` : p.cor) : "linear-gradient(135deg, var(--pg-cor1), var(--pg-cor2))",
            borderRadius: p.forma === "elipse" ? "50%" : `calc(${p.raio}*var(--u))`,
          }}
        />
      );
    case "icone": {
      const I = (icones[p.icone] ?? icones.estrela).icone;
      return <I className="size-full text-(--pg-realce)" style={{ color: p.cor }} />;
    }
  }
}
