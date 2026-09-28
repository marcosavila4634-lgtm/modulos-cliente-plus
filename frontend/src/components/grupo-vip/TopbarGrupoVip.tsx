import { Link, useNavigate } from "@tanstack/react-router";
import {
  Banknote,
  Bell,
  Bot,
  ChevronRight,
  CircleAlert,
  CircleQuestionMark,
  ExternalLink,
  Headset,
  Menu,
  MessageCircle,
  Search,
  Send,
  UserMinus,
  UserPlus,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Alerta } from "../../lib/grupo-vip";
import { CentralAjuda } from "./Ajuda";

type Props = {
  nomeNegocio: string;
  iniciais: string;
  alertas: Alerta[];
  paginaVendas: string;
  aoAlternarMenu: () => void;
};

const iconeAlerta: Record<string, { icone: LucideIcon; cor: string }> = {
  robo: { icone: Bot, cor: "border-red-500/40 bg-red-500/10 text-red-300" },
  remover: { icone: UserMinus, cor: "border-red-500/40 bg-red-500/10 text-red-300" },
  adicionar: { icone: UserPlus, cor: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" },
  whatsapp: { icone: MessageCircle, cor: "border-green-500/40 bg-green-500/10 text-green-300" },
  atrasadas: { icone: Wallet, cor: "border-amber-500/40 bg-amber-500/10 text-amber-300" },
  publicacoes: { icone: Send, cor: "border-sky-500/40 bg-sky-500/10 text-sky-300" },
  suporte: { icone: Headset, cor: "border-violet-500/40 bg-violet-500/10 text-violet-300" },
  saques: { icone: Banknote, cor: "border-orange-500/40 bg-orange-500/10 text-orange-300" },
};

export function TopbarGrupoVip({ nomeNegocio, iniciais, alertas, paginaVendas, aoAlternarMenu }: Props) {
  const navigate = useNavigate();
  const [avisosAbertos, setAvisosAbertos] = useState(false);
  const [ajuda, setAjuda] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const total = alertas.reduce((s, a) => s + a.quantidade, 0);

  // Fecha a lista de avisos ao clicar fora dela.
  useEffect(() => {
    if (!avisosAbertos) return;
    const fora = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAvisosAbertos(false);
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [avisosAbertos]);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 bg-gv-bg/90 bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.28),transparent_40%)] px-4 backdrop-blur md:gap-4 md:px-6 print:hidden">
      <button
        type="button"
        onClick={aoAlternarMenu}
        aria-label="Abrir ou recolher menu"
        className="rounded-lg p-2 text-slate-300 hover:bg-white/5 hover:text-white"
      >
        <Menu className="size-6" />
      </button>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const busca = new FormData(e.currentTarget).get("busca")?.toString().trim();
          navigate({ to: "/grupo-vip/membros", search: busca ? { busca } : {} });
        }}
        className="hidden h-10 w-full max-w-[320px] items-center gap-2.5 rounded-xl border border-gv-line bg-gv-card px-3 text-sm focus-within:border-orange-500/60 sm:flex"
      >
        <Search className="size-4 text-gv-muted" />
        <input
          type="search"
          name="busca"
          placeholder="Buscar membros (Enter)"
          className="w-full bg-transparent text-slate-200 outline-none placeholder:text-gv-muted"
        />
      </form>

      <a
        href={paginaVendas}
        target="_blank"
        rel="noreferrer"
        className="ml-auto hidden h-10 items-center gap-2 rounded-xl border border-gv-line bg-gv-card px-3 text-sm font-medium text-slate-100 hover:border-orange-500/50 lg:flex"
      >
        <Send className="size-4 fill-orange-400/40 text-orange-400" />
        {nomeNegocio}
        <span className="text-xs font-normal text-gv-muted">· página de vendas</span>
        <ExternalLink className="size-3.5 text-gv-muted" />
      </a>

      <div className="ml-auto flex items-center gap-1.5 md:gap-3 lg:ml-2">
        <div ref={caixa} className="relative">
          <button
            type="button"
            aria-label="Avisos"
            aria-expanded={avisosAbertos}
            onClick={() => setAvisosAbertos((v) => !v)}
            className="relative rounded-lg p-2 text-slate-200 hover:bg-white/5 hover:text-white"
          >
            <Bell className="size-5" />
            {alertas.length > 0 && (
              <span className="absolute top-0.5 right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {total > 99 ? "99+" : total}
              </span>
            )}
          </button>
          {avisosAbertos && (
            <div className="absolute top-12 right-0 w-[350px] max-w-[calc(100vw-2rem)] rounded-2xl border border-gv-line bg-gv-card p-2 shadow-2xl">
              <div className="px-2 pt-1 pb-2 text-sm font-semibold text-white">Requer atenção</div>
              {alertas.length === 0 && <p className="px-2 pb-3 text-sm text-emerald-300">Tudo em dia por aqui.</p>}
              <ul className="flex flex-col">
                {alertas.map((a) => {
                  const { icone: Icone, cor } = iconeAlerta[a.chave] ?? { icone: CircleAlert, cor: "border-gv-line text-slate-300" };
                  return (
                    <li key={a.chave}>
                      <Link
                        to={a.link}
                        onClick={() => setAvisosAbertos(false)}
                        className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/[0.04]"
                      >
                        <span className={`grid size-9 shrink-0 place-items-center rounded-lg border ${cor}`}>
                          <Icone className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1 leading-snug">
                          <div className="text-[13px] font-medium text-white">{a.titulo}</div>
                          <div className="truncate text-[11.5px] text-gv-muted">{a.descricao}</div>
                        </div>
                        <ChevronRight className="size-4 shrink-0 text-gv-muted" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
        <button
          type="button"
          aria-label="Ajuda"
          onClick={() => setAjuda(true)}
          className="rounded-lg p-2 text-slate-200 hover:bg-white/5 hover:text-white"
        >
          <CircleQuestionMark className="size-5" />
        </button>
        <Link
          to="/grupo-vip/configuracoes"
          title="Configurações"
          className="ml-1 grid size-10 place-items-center rounded-full bg-black font-poppins text-sm font-semibold text-white ring-2 ring-orange-500/40"
        >
          {iniciais}
        </Link>
      </div>

      {/* portal: a barra do topo tem desfoque, que prenderia a janela dentro dela */}
      {ajuda && createPortal(<CentralAjuda aoFechar={() => setAjuda(false)} />, document.body)}
    </header>
  );
}

