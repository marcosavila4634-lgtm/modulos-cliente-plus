import { CircleAlert, LoaderCircle, X } from "lucide-react";
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";

// Peças de formulário do módulo Academia: janela (modal), campo, botões e erro.

export const classeInput =
  "h-10 w-full rounded-xl border border-ac-line bg-ac-bg/60 px-3 text-sm text-slate-100 outline-none [color-scheme:dark] placeholder:text-ac-muted/70 focus:border-violet-500/70";

export function Modal({
  titulo,
  subtitulo,
  aoFechar,
  children,
  largura = "max-w-lg",
}: {
  titulo: string;
  subtitulo?: string;
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
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-[2px]" onClick={aoFechar} />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${largura} rounded-2xl border border-ac-line bg-ac-card p-6 shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-poppins text-lg font-semibold text-white">{titulo}</h2>
            {subtitulo && <p className="mt-0.5 text-sm text-ac-muted">{subtitulo}</p>}
          </div>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="-mt-1 -mr-2 rounded-lg p-2 text-ac-muted hover:bg-white/5 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

export function Campo({ rotulo, children, className = "" }: { rotulo: string; children: ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-medium text-slate-300">{rotulo}</span>
      {children}
    </label>
  );
}

const variantes = {
  primario:
    "bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 text-white shadow-[0_6px_20px_-8px_rgba(217,70,239,0.7)] hover:brightness-110",
  secundario: "border border-ac-line bg-ac-card-2 text-slate-200 hover:border-slate-600 hover:text-white",
  sucesso: "bg-emerald-600 text-white hover:bg-emerald-500",
  perigo: "border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20",
};

export function Botao({
  variante = "secundario",
  carregando = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: keyof typeof variantes; carregando?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled || carregando}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-60 ${variantes[variante]} ${className}`}
      {...props}
    >
      {carregando && <LoaderCircle className="size-4 animate-spin" />}
      {children}
    </button>
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
          ligado ? "bg-gradient-to-r from-violet-600 to-fuchsia-500" : "bg-ac-line"
        }`}
      >
        <span className={`size-5 rounded-full bg-white shadow transition ${ligado ? "translate-x-5" : ""}`} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-white">{titulo}</span>
        {descricao && <span className="mt-0.5 block text-xs text-ac-muted">{descricao}</span>}
      </span>
    </button>
  );
}
