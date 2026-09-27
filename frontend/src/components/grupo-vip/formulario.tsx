import { Check, CircleAlert, Copy, LoaderCircle, X } from "lucide-react";
import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { copiar } from "../../lib/grupo-vip";

// Peças de formulário do módulo Grupos VIP: janela (modal), campo, botões e erro.

export const classeInput =
  "h-10 w-full rounded-xl border border-gv-line bg-gv-bg/70 px-3 text-sm text-slate-100 outline-none [color-scheme:dark] placeholder:text-gv-muted/70 focus:border-orange-500/70";

export const classeTexto =
  "w-full rounded-xl border border-gv-line bg-gv-bg/70 px-3 py-2.5 text-sm leading-relaxed text-slate-100 outline-none placeholder:text-gv-muted/70 focus:border-orange-500/70";

export function Modal({
  titulo,
  subtitulo,
  aoFechar,
  children,
  largura = "max-w-lg",
}: {
  titulo: string;
  subtitulo?: ReactNode;
  aoFechar: () => void;
  children: ReactNode;
  largura?: string;
}) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && aoFechar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [aoFechar]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px]" onClick={aoFechar} />
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          className={`relative w-full ${largura} rounded-2xl border border-gv-line bg-gv-card p-5 shadow-2xl sm:p-6`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-poppins text-lg font-semibold text-white">{titulo}</h2>
              {subtitulo && <p className="mt-0.5 text-sm text-gv-muted">{subtitulo}</p>}
            </div>
            <button
              type="button"
              onClick={aoFechar}
              aria-label="Fechar"
              className="-mt-1 -mr-2 rounded-lg p-2 text-gv-muted hover:bg-white/5 hover:text-white"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Campo({
  rotulo,
  dica,
  children,
  className = "",
}: {
  rotulo: string;
  dica?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-medium text-slate-300">{rotulo}</span>
      {children}
      {dica && <span className="text-[11.5px] leading-snug text-gv-muted">{dica}</span>}
    </label>
  );
}

const variantes = {
  primario:
    "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-[0_6px_20px_-8px_rgba(249,115,22,0.8)] hover:brightness-110",
  secundario: "border border-gv-line bg-gv-card-2 text-slate-200 hover:border-slate-600 hover:text-white",
  sucesso: "bg-emerald-600 text-white hover:bg-emerald-500",
  perigo: "border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20",
  whatsapp: "bg-[#25D366] text-slate-950 hover:brightness-110",
  telegram: "bg-sky-500 text-white hover:bg-sky-400",
};

export type VarianteBotao = keyof typeof variantes;

export const classeBotao = (variante: VarianteBotao = "secundario", pequeno = false) =>
  `inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-60 ${
    pequeno ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm"
  } ${variantes[variante]}`;

export function Botao({
  variante = "secundario",
  pequeno = false,
  carregando = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: VarianteBotao; pequeno?: boolean; carregando?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled || carregando}
      className={`${classeBotao(variante, pequeno)} ${className}`}
      {...props}
    >
      {carregando && <LoaderCircle className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

// Botão que copia um texto e mostra "Copiado!".
export function BotaoCopiar({
  texto,
  rotulo = "Copiar",
  variante = "secundario",
  pequeno = true,
}: {
  texto: string;
  rotulo?: string;
  variante?: VarianteBotao;
  pequeno?: boolean;
}) {
  const [ok, setOk] = useState(false);
  return (
    <Botao
      variante={variante}
      pequeno={pequeno}
      onClick={async () => {
        if (await copiar(texto)) {
          setOk(true);
          setTimeout(() => setOk(false), 1800);
        }
      }}
    >
      {ok ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {ok ? "Copiado!" : rotulo}
    </Botao>
  );
}

export function MensagemErro({ texto }: { texto: string | null }) {
  if (!texto) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      {texto}
    </div>
  );
}

export function mensagemDe(erro: unknown) {
  return erro instanceof Error ? erro.message : "Algo deu errado. Tente de novo.";
}

// Chave liga/desliga com título e explicação.
export function Interruptor({
  ligado,
  aoMudar,
  titulo,
  descricao,
}: {
  ligado: boolean;
  aoMudar: (v: boolean) => void;
  titulo: string;
  descricao?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      onClick={() => aoMudar(!ligado)}
      className="flex w-full items-start gap-3 text-left"
    >
      <span
        className={`mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition ${
          ligado ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gv-line"
        }`}
      >
        <span className={`size-5 rounded-full bg-white shadow transition ${ligado ? "translate-x-5" : ""}`} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-white">{titulo}</span>
        {descricao && <span className="mt-0.5 block text-xs text-gv-muted">{descricao}</span>}
      </span>
    </button>
  );
}

// Executa uma ação da API com "carregando" e mensagem de erro.
export function useAcao() {
  const [carregando, setCarregando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  async function executar<T>(chave: string, acao: () => Promise<T>): Promise<T | undefined> {
    setCarregando(chave);
    setErro(null);
    try {
      return await acao();
    } catch (e) {
      setErro(mensagemDe(e));
      return undefined;
    } finally {
      setCarregando(null);
    }
  }
  return { carregando, erro, setErro, executar };
}
