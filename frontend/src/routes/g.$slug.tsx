import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, LoaderCircle, Lock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PaginaPublica } from "../components/pagina/PaginaPublica";
import { formatar, periodicidade } from "../lib/grupo-vip";
import { apiPublico, type PaginaVendas, type PedidoCheckout, type PlanoPublico } from "../lib/grupo-vip-publico";
import { completar } from "../lib/pagina";
import { paginaGrupoVip } from "../lib/pagina-grupo-vip";

type Busca = { ref?: string };

// Página de vendas pública do grupo VIP: planos, benefícios e checkout.
// Aparência e textos vêm do editor de páginas (Grupos VIP > Página de vendas;
// components/pagina). No projeto principal: página pública do Cliente Plus
// (/loja/:slug) com o pagamento pelo gateway do Cliente Plus.
export const Route = createFileRoute("/g/$slug")({
  validateSearch: (s: Record<string, unknown>): Busca => ({
    ref: typeof s.ref === "string" && s.ref ? s.ref : undefined,
  }),
  loaderDeps: ({ search }) => ({ ref: search.ref }),
  loader: ({ params, deps }) => apiPublico.pagina(params.slug, deps.ref),
  component: PaginaVendasGrupo,
});

const input =
  "h-11 w-full rounded-(--pg-raio-botao) border border-(--pg-linha) bg-(--pg-card) px-3.5 text-[15px] text-(--pg-titulo) outline-none placeholder:text-(--pg-suave) focus:border-(--pg-cor2)";

function PaginaVendasGrupo() {
  const p = Route.useLoaderData();
  const { slug } = Route.useParams();
  const { ref } = Route.useSearch();
  const [plano, setPlano] = useState<PlanoPublico | null>(null);
  const dados = useMemo(() => paginaGrupoVip.normalizar(p), [p]);
  const pagina = useMemo(() => completar(p.pagina, dados, paginaGrupoVip.padrao(p)), [p, dados]);

  useEffect(() => {
    document.title = p.nome;
  }, [p.nome]);

  return (
    <PaginaPublica pagina={pagina} dados={dados} aoEscolherPlano={(pl) => setPlano(p.planos.find((x) => x.id === pl.id) ?? null)}>
      {plano && <Checkout pagina={p} slug={slug} plano={plano} refCodigo={ref ?? null} aoFechar={() => setPlano(null)} />}
    </PaginaPublica>
  );
}

function Checkout({
  pagina,
  slug,
  plano,
  refCodigo,
  aoFechar,
}: {
  pagina: PaginaVendas;
  slug: string;
  plano: PlanoPublico;
  refCodigo: string | null;
  aoFechar: () => void;
}) {
  const navigate = useNavigate();
  const [f, setF] = useState<PedidoCheckout>({
    planoId: plano.id,
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    telegramUsuario: "",
    cupom: "",
    ref: refCodigo,
  });
  const [desconto, setDesconto] = useState<{ codigo: string; desconto: number; valorFinal: number } | null>(null);
  const [erroCupom, setErroCupom] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const temTelegram = plano.grupos.some((g) => g.plataforma === "telegram");
  const muda = (campo: keyof PedidoCheckout) => (e: { target: { value: string } }) => setF((v) => ({ ...v, [campo]: e.target.value }));

  async function aplicarCupom() {
    setErroCupom(null);
    try {
      setDesconto(await apiPublico.cupom(slug, f.cupom, plano.id));
    } catch (e) {
      setDesconto(null);
      setErroCupom(e instanceof Error ? e.message : "Cupom inválido");
    }
  }

  async function assinar() {
    setEnviando(true);
    setErro(null);
    try {
      const r = await apiPublico.checkout(slug, { ...f, cupom: desconto ? f.cupom : "" });
      navigate({ to: "/membro/$codigo", params: { codigo: r.codigo }, search: { bemvindo: true } });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível concluir. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={aoFechar} />
      <div className="flex min-h-full items-end justify-center sm:items-center sm:p-4">
        <div className="relative w-full max-w-md rounded-t-(--pg-raio) border border-(--pg-linha) bg-(--pg-fundo) p-5 text-(--pg-texto) shadow-2xl sm:rounded-(--pg-raio)">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[13px] text-(--pg-suave)">{pagina.nome}</div>
              <div className="text-xl font-bold text-(--pg-titulo) [font-family:var(--pg-fonte)]">{plano.nome}</div>
            </div>
            <div className="text-right">
              {desconto ? (
                <>
                  <div className="text-[13px] text-(--pg-suave) line-through">{formatar.moeda(plano.preco)}</div>
                  <div className="text-xl font-bold text-emerald-500 [font-family:var(--pg-fonte)]">{formatar.moeda(desconto.valorFinal)}</div>
                </>
              ) : (
                <div className="text-xl font-bold text-(--pg-titulo) [font-family:var(--pg-fonte)]">{formatar.moeda(plano.preco)}</div>
              )}
              <div className="text-[12px] text-(--pg-suave)">{periodicidade(plano.duracaoMeses)}</div>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3">
            <input className={input} placeholder="Nome completo" autoComplete="name" value={f.nome} onChange={muda("nome")} />
            <input className={input} placeholder="WhatsApp com DDD" inputMode="tel" autoComplete="tel" value={f.telefone} onChange={muda("telefone")} />
            <input className={input} placeholder="E-mail" type="email" autoComplete="email" value={f.email} onChange={muda("email")} />
            {temTelegram && (
              <input className={input} placeholder="Seu @ no Telegram (opcional)" value={f.telegramUsuario} onChange={muda("telegramUsuario")} />
            )}
            <div className="flex gap-2">
              <input
                className={`${input} uppercase`}
                placeholder="Cupom de desconto"
                value={f.cupom}
                onChange={(e) => {
                  setDesconto(null);
                  setF((v) => ({ ...v, cupom: e.target.value }));
                }}
              />
              <button
                type="button"
                disabled={!f.cupom.trim()}
                onClick={aplicarCupom}
                className="h-11 shrink-0 rounded-(--pg-raio-botao) border border-(--pg-linha) px-4 text-sm font-semibold text-(--pg-titulo) disabled:opacity-40"
              >
                Aplicar
              </button>
            </div>
            {erroCupom && <p className="text-[13px] text-red-400">{erroCupom}</p>}
            {desconto && (
              <p className="flex items-center gap-1.5 text-[13px] text-emerald-500">
                <BadgeCheck className="size-4" /> Cupom {desconto.codigo}: {formatar.moeda(desconto.desconto)} de desconto no 1º pagamento
              </p>
            )}
            {pagina.indicadoPor && <p className="text-[12.5px] text-(--pg-realce)">Indicação de {pagina.indicadoPor}</p>}
          </div>
          {erro && <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] text-red-400">{erro}</p>}
          <button
            type="button"
            onClick={assinar}
            disabled={enviando || !f.nome.trim() || !f.telefone.trim()}
            className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-(--pg-raio-botao) bg-linear-to-r from-(--pg-cor1) to-(--pg-cor2) py-3.5 text-[16px] font-bold text-(--pg-sobre) disabled:opacity-50"
          >
            {enviando ? <LoaderCircle className="size-5 animate-spin" /> : <Lock className="size-4" />} Continuar para o pagamento
          </button>
          <p className="mt-3 text-center text-[12px] text-(--pg-suave)">
            Na próxima tela você paga pelo Pix. Seus dados ficam só com {pagina.nome}.
          </p>
        </div>
      </div>
    </div>
  );
}
