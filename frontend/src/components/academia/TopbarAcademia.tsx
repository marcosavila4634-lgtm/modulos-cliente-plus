import { useNavigate } from "@tanstack/react-router";
import { Bell, ChevronDown, CircleQuestionMark, Menu, Search } from "lucide-react";
import { MarcaCircular } from "./Marcas";

type Props = {
  nomeAcademia: string;
  notificacoes: number;
  demo: boolean;
  aoAlternarMenu: () => void;
};

export function TopbarAcademia({ nomeAcademia, notificacoes, demo, aoAlternarMenu }: Props) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-ac-line bg-ac-bg/85 px-4 backdrop-blur md:px-6">
      <button
        type="button"
        onClick={aoAlternarMenu}
        aria-label="Abrir ou recolher menu"
        className="rounded-lg p-2 text-slate-300 hover:bg-white/5 hover:text-white"
      >
        <Menu className="size-5" />
      </button>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const busca = new FormData(e.currentTarget).get("busca")?.toString().trim();
          navigate({ to: "/academia/alunos", search: busca ? { busca } : {} });
        }}
        className="hidden h-10 w-full max-w-[300px] items-center gap-2.5 rounded-xl border border-ac-line bg-ac-card px-3 text-sm focus-within:border-violet-500/60 sm:flex"
      >
        <Search className="size-4 text-ac-muted" />
        <input
          type="search"
          name="busca"
          placeholder="Buscar alunos (Enter)"
          className="w-full bg-transparent text-slate-200 outline-none placeholder:text-ac-muted"
        />
      </form>

      <div className="ml-auto flex items-center gap-2 md:gap-4">
        {demo && (
          <div className="hidden items-center gap-2 lg:flex">
            <span className="rounded-md bg-violet-600 px-2 py-0.5 text-[11px] font-bold text-white">DEMO</span>
            <span className="text-xs text-ac-muted">Dados demonstrativos</span>
          </div>
        )}

        <button
          type="button"
          aria-label="Notificações"
          className="relative rounded-lg p-2 text-slate-300 hover:bg-white/5 hover:text-white"
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
          aria-label="Ajuda"
          className="rounded-lg p-2 text-slate-300 hover:bg-white/5 hover:text-white"
        >
          <CircleQuestionMark className="size-5" />
        </button>

        <div className="mx-1 hidden h-6 w-px bg-ac-line md:block" />

        <button
          type="button"
          className="hidden items-center gap-1.5 text-sm font-medium text-slate-200 hover:text-white md:flex"
        >
          {nomeAcademia}
          <ChevronDown className="size-4 text-ac-muted" />
        </button>

        <MarcaCircular />
      </div>
    </header>
  );
}
