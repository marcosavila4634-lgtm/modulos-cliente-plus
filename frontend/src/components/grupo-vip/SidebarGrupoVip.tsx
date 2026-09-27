import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Crown } from "lucide-react";
import { useState } from "react";
import { LogoGrupoVip, TracoLaranja } from "./Marcas";
import { menuGrupoVip } from "./menu";

const item =
  "flex items-center gap-3 rounded-xl px-3 py-[9px] text-[13.5px] text-slate-300 transition-colors hover:bg-white/5 hover:text-white";
const ativo =
  "!bg-gradient-to-r from-amber-500 to-orange-600 !text-white font-semibold shadow-[0_6px_20px_-6px_rgba(249,115,22,0.7)]";

type Props = {
  gestor: { nome: string; cargo: string };
  recolhida: boolean;
  aoNavegar?: () => void;
};

export function SidebarGrupoVip({ gestor, recolhida, aoNavegar }: Props) {
  const caminho = useRouterState({ select: (s) => s.location.pathname });
  const [financeiroAberto, setFinanceiroAberto] = useState(false);

  return (
    <aside
      className={`flex h-full flex-col border-r border-gv-line bg-gv-side transition-[width] duration-200 ${
        recolhida ? "w-[76px]" : "w-[232px]"
      }`}
    >
      <div className={`flex h-[84px] items-center ${recolhida ? "justify-center" : "px-4"}`}>
        <LogoGrupoVip compacto={recolhida} />
      </div>

      <nav className="mt-2 flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-3">
        {menuGrupoVip.map(({ secao, rotulo, icone: Icone, filhos }) => {
          const classe = `${item} ${recolhida ? "justify-center px-0" : ""}`;
          const conteudo = (
            <>
              <Icone className="size-[18px] shrink-0" />
              {!recolhida && <span className="flex-1 truncate">{rotulo}</span>}
            </>
          );

          if (secao === null) {
            return (
              <Link
                key={rotulo}
                to="/grupo-vip"
                title={rotulo}
                onClick={aoNavegar}
                className={classe}
                activeOptions={{ exact: true }}
                activeProps={{ className: ativo }}
              >
                {conteudo}
              </Link>
            );
          }

          if (filhos) {
            const filhoAtivo = filhos.some((f) => caminho.endsWith(`/${f.secao}`));
            const aberto = financeiroAberto || filhoAtivo;
            return (
              <div key={rotulo}>
                <button
                  type="button"
                  title={rotulo}
                  onClick={() => setFinanceiroAberto((v) => !v)}
                  className={`${classe} w-full text-left ${filhoAtivo ? "text-white" : ""}`}
                >
                  {conteudo}
                  {!recolhida && (
                    <ChevronDown className={`size-4 transition-transform ${aberto ? "rotate-180" : ""}`} />
                  )}
                </button>
                {aberto && !recolhida && (
                  <div className="mt-0.5 ml-[21px] flex flex-col gap-0.5 border-l border-gv-line pl-3">
                    {filhos.map((f) => (
                      <Link
                        key={f.secao}
                        to="/grupo-vip/$secao"
                        params={{ secao: f.secao }}
                        onClick={aoNavegar}
                        className="rounded-lg px-3 py-1.5 text-[13px] text-slate-400 hover:bg-white/5 hover:text-white"
                        activeProps={{ className: "!text-orange-400 font-medium" }}
                      >
                        {f.rotulo}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={rotulo}
              to="/grupo-vip/$secao"
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

      <div className="px-3 pb-3">
        <Link
          to="/"
          title="Cliente Plus"
          className={`flex items-center gap-3 rounded-2xl border border-violet-500/40 bg-gradient-to-br from-violet-700/60 via-fuchsia-900/40 to-violet-950/60 px-3 py-3 hover:border-violet-400/70 ${
            recolhida ? "justify-center px-0" : ""
          }`}
        >
          <Crown className="size-7 shrink-0 fill-amber-400/30 text-amber-400" />
          {!recolhida && (
            <div className="min-w-0 leading-tight">
              <div className="font-poppins text-[15px] font-semibold text-white">Cliente Plus</div>
              <div className="mt-0.5 text-[10.5px] text-slate-300">
                Transforme seu conhecimento em uma comunidade lucrativa.
              </div>
            </div>
          )}
        </Link>

        <Link
          to="/grupo-vip/configuracoes"
          onClick={aoNavegar}
          className={`mt-3 flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-white/5 ${
            recolhida ? "justify-center px-0" : ""
          }`}
        >
          <img src="/grupo-vip/avatar.jpg" alt="" className="size-10 shrink-0 rounded-full object-cover" />
          {!recolhida && (
            <>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="text-[13.5px] font-semibold text-white">{gestor.nome}</div>
                <div className="text-[11px] text-gv-muted">{gestor.cargo}</div>
              </div>
              <ChevronDown className="size-4 -rotate-90 text-gv-muted" />
            </>
          )}
        </Link>

        {!recolhida && (
          <div className="relative mt-4 mb-2 -rotate-[8deg] px-3 font-script [@media(max-height:900px)]:hidden text-[26px] leading-[0.95] text-slate-100">
            Conhecimento
            <br />
            <span className="pl-6">conecta</span>
            <br />
            <span className="pl-10">pessoas!</span>
            <TracoLaranja className="mt-1 ml-10 h-3 w-28" />
          </div>
        )}
      </div>
    </aside>
  );
}
