import { Bell, ChevronDown, CircleQuestionMark, Menu, MessageCircleMore, Search, Send } from "lucide-react";

type Props = {
  grupoAtual: string;
  iniciais: string;
  notificacoes: number;
  aoAlternarMenu: () => void;
};

export function TopbarGrupoVip({ grupoAtual, iniciais, notificacoes, aoAlternarMenu }: Props) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 bg-gv-bg/90 bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.28),transparent_40%)] px-4 backdrop-blur md:px-6">
      <button
        type="button"
        onClick={aoAlternarMenu}
        aria-label="Abrir ou recolher menu"
        className="rounded-lg p-2 text-slate-300 hover:bg-white/5 hover:text-white"
      >
        <Menu className="size-6" />
      </button>

      <label className="hidden h-10 w-full max-w-[320px] items-center gap-2.5 rounded-xl border border-gv-line bg-gv-card px-3 text-sm focus-within:border-orange-500/60 sm:flex">
        <Search className="size-4 text-gv-muted" />
        <input
          type="search"
          placeholder="Buscar membros, conteúdos, grupos..."
          className="w-full bg-transparent text-slate-200 outline-none placeholder:text-gv-muted"
        />
      </label>

      <button
        type="button"
        className="ml-auto hidden h-10 min-w-[190px] items-center gap-2.5 rounded-xl border border-gv-line bg-gv-card px-3 text-sm font-medium text-slate-100 hover:border-orange-500/50 lg:flex"
      >
        <Send className="size-4 fill-orange-400/40 text-orange-400" />
        <span className="flex-1 text-left">{grupoAtual}</span>
        <ChevronDown className="size-4 text-gv-muted" />
      </button>

      <div className="ml-auto flex items-center gap-1.5 lg:ml-4 md:gap-3">
        <button
          type="button"
          aria-label="Notificações"
          className="relative rounded-lg p-2 text-slate-200 hover:bg-white/5 hover:text-white"
        >
          <Bell className="size-5" />
          {notificacoes > 0 && (
            <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {notificacoes}
            </span>
          )}
        </button>
        <button
          type="button"
          aria-label="Mensagens"
          className="rounded-lg p-2 text-slate-200 hover:bg-white/5 hover:text-white"
        >
          <MessageCircleMore className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Ajuda"
          className="rounded-lg p-2 text-slate-200 hover:bg-white/5 hover:text-white"
        >
          <CircleQuestionMark className="size-5" />
        </button>
        <div className="ml-2 grid size-10 place-items-center rounded-full bg-black font-poppins text-sm font-semibold text-white ring-2 ring-orange-500/40">
          {iniciais}
        </div>
      </div>
    </header>
  );
}
