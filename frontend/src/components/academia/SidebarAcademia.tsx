import { Link } from "@tanstack/react-router";
import { ChevronDown, ExternalLink, TrendingUp } from "lucide-react";
import { AvatarAcademia, LogoGestaoPlus } from "./Marcas";
import { menuAcademia } from "./menu";

const item =
  "flex items-center gap-3 rounded-xl px-3 py-[7px] text-[13.5px] text-slate-300 transition-colors hover:bg-white/5 hover:text-white";
const ativo =
  "!bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 !text-white font-semibold shadow-[0_6px_20px_-6px_rgba(217,70,239,0.6)]";

type Props = {
  nomeAcademia: string;
  gestor: { nome: string; cargo: string };
  recolhida: boolean;
  aoNavegar?: () => void;
};

export function SidebarAcademia({ nomeAcademia, gestor, recolhida, aoNavegar }: Props) {
  return (
    <aside
      className={`flex h-full flex-col border-r border-ac-line bg-ac-side transition-[width] duration-200 ${
        recolhida ? "w-[76px]" : "w-[240px]"
      }`}
    >
      <div className={`flex h-16 items-center ${recolhida ? "justify-center" : "px-5"}`}>
        <LogoGestaoPlus compacto={recolhida} />
      </div>

      <button
        type="button"
        className={`mx-3 mt-1 flex items-center gap-3 rounded-xl border border-ac-line bg-ac-card px-3 py-2.5 text-left hover:bg-ac-card-2 ${
          recolhida ? "justify-center px-0" : ""
        }`}
      >
        <AvatarAcademia />
        {!recolhida && (
          <>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-[13px] font-semibold text-white">{nomeAcademia}</div>
              <div className="text-[11px] text-ac-muted">Painel do gestor</div>
            </div>
            <ChevronDown className="size-4 text-ac-muted" />
          </>
        )}
      </button>

      <nav className="mt-3 flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-3">
        {menuAcademia.map(({ secao, rotulo, icone: Icone }) => {
          const conteudo = (
            <>
              <Icone className="size-[18px] shrink-0" />
              {!recolhida && <span className="truncate">{rotulo}</span>}
            </>
          );
          const classe = `${item} ${recolhida ? "justify-center px-0" : ""}`;
          return secao === null ? (
            <Link
              key={rotulo}
              to="/academia"
              title={rotulo}
              onClick={aoNavegar}
              className={classe}
              activeOptions={{ exact: true }}
              activeProps={{ className: ativo }}
            >
              {conteudo}
            </Link>
          ) : (
            <Link
              key={rotulo}
              to="/academia/$secao"
              params={{ secao }}
              title={rotulo}
              onClick={aoNavegar}
              className={classe}
              activeProps={{ className: ativo }}
            >
              {conteudo}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ac-line p-3">
        <Link
          to="/"
          title="Cliente Plus"
          className={`flex items-center gap-3 rounded-xl border border-fuchsia-500/40 bg-gradient-to-r from-violet-500/10 to-pink-500/10 px-3 py-2.5 hover:border-fuchsia-400/70 ${
            recolhida ? "justify-center px-0" : ""
          }`}
        >
          <TrendingUp className="size-5 shrink-0 text-fuchsia-400" />
          {!recolhida && (
            <>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="text-[13px] font-semibold text-white">Cliente Plus</div>
                <div className="text-[11px] text-ac-muted">Impulsione seu crescimento</div>
              </div>
              <ExternalLink className="size-4 text-ac-muted" />
            </>
          )}
        </Link>

        <button
          type="button"
          className={`mt-3 flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left hover:bg-white/5 ${
            recolhida ? "justify-center px-0" : ""
          }`}
        >
          <img src="/academia/avatar.jpg" alt="" className="size-9 shrink-0 rounded-full object-cover" />
          {!recolhida && (
            <>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="text-[13px] font-semibold text-white">{gestor.nome}</div>
                <div className="text-[11px] text-ac-muted">{gestor.cargo}</div>
              </div>
              <ChevronDown className="size-4 text-ac-muted" />
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
