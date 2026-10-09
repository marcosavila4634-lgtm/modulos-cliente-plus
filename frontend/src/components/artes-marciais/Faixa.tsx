import type { RefFaixa } from "../../lib/artes-marciais";

// Desenho de uma faixa: cor principal, listra do meio (faixas kids / pontas)
// e a ponteira preta com os graus (listras brancas), como no Jiu-Jitsu.
export function FaixaVisual({
  faixa,
  grau = 0,
  grausMaximos = 0,
  largura = 88,
  altura = 14,
}: {
  faixa: Pick<RefFaixa, "cor" | "corPonta">;
  grau?: number;
  grausMaximos?: number;
  largura?: number;
  altura?: number;
}) {
  const preta = faixa.cor.toLowerCase() === "#111111";
  const ponteira = grausMaximos > 0 ? Math.round(largura * 0.3) : 0;
  const corPonteira = preta ? "#b91c1c" : "#111111";
  const listras = Math.min(grau, grausMaximos || grau);
  return (
    <svg
      width={largura}
      height={altura}
      viewBox={`0 0 ${largura} ${altura}`}
      className="shrink-0 overflow-visible"
      role="img"
      aria-hidden
    >
      <rect x="0" y="0" width={largura} height={altura} rx="2.5" fill={faixa.cor} stroke="rgba(255,255,255,0.18)" />
      {faixa.corPonta && (
        <rect x="0" y={altura * 0.36} width={largura - ponteira} height={altura * 0.28} fill={faixa.corPonta} />
      )}
      {ponteira > 0 && (
        <rect x={largura - ponteira - 6} y="0" width={ponteira} height={altura} fill={corPonteira} />
      )}
      {Array.from({ length: listras }).map((_, i) => (
        <rect
          key={i}
          x={largura - 10 - i * 5 - 2}
          y="1.5"
          width="2.4"
          height={altura - 3}
          fill="white"
          opacity="0.95"
        />
      ))}
    </svg>
  );
}

// Faixa pequena + nome ("Azul · 2 graus").
export function SeloFaixa({
  faixa,
  grau = 0,
  grausMaximos = 0,
  className = "",
}: {
  faixa: RefFaixa;
  grau?: number;
  grausMaximos?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 text-[12.5px] whitespace-nowrap text-slate-200 ${className}`}>
      <FaixaVisual faixa={faixa} grau={grau} grausMaximos={grausMaximos} largura={42} altura={9} />
      {faixa.nome}
      {grau > 0 && <span className="text-ac-muted">· {grau}º</span>}
    </span>
  );
}

// Ponto colorido da modalidade.
export function PontoModalidade({ cor, className = "size-2.5" }: { cor: string; className?: string }) {
  return <span className={`inline-block shrink-0 rounded-full ${className}`} style={{ background: cor }} />;
}
