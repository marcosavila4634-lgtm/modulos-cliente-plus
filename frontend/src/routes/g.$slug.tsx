import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, Check, Gift, LoaderCircle, Lock, MessageCircle, ShieldCheck, Sparkles, Users, Zap } from "lucide-react";
import { useState } from "react";
import { AviaoPapel } from "../components/grupo-vip/Marcas";
import { SeloPlataforma } from "../components/grupo-vip/Selos";
import { formatar, linkWhatsapp, periodicidade } from "../lib/grupo-vip";
import { apiPublico, type PaginaVendas, type PedidoCheckout, type PlanoPublico } from "../lib/grupo-vip-publico";

type Busca = { ref?: string };

// Página de vendas pública do grupo VIP: planos, benefícios e checkout.
// No projeto principal: página pública do Cliente Plus (/loja/:slug) com o
// pagamento pelo gateway do Cliente Plus.
export const Route = createFileRoute("/g/$slug")({
  validateSearch: (s: Record<string, unknown>): Busca => ({
    ref: typeof s.ref === "string" && s.ref ? s.ref : undefined,
  }),
  loaderDeps: ({ search }) => ({ ref: search.ref }),
  loader: ({ params, deps }) => apiPublico.pagina(params.slug, deps.ref),
  component: PaginaVendasGrupo,
});

const input =
  "h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-[15px] text-white outline-none placeholder:text-slate-500 focus:border-orange-400/70";

function PaginaVendasGrupo() {
  const p = Route.useLoaderData();
  const { slug } = Route.useParams();
  const { ref } = Route.useSearch();
  const [plano, setPlano] = useState<PlanoPublico | null>(null);

  return (
    <div className="min-h-full bg-gv-bg text-slate-100">
      {/* Topo */}
      <header className="relative overflow-hidden">
        {p.fotoCapa && <img src={p.fotoCapa} alt="" className="absolute inset-0 size-full object-cover opacity-35" />}
        <div className="absolute inset-0 bg-gradient-to-b from-gv-bg/40 via-gv-bg/80 to-gv-bg" />
        <div className="relative mx-auto max-w-5xl px-4 pt-8 pb-10 sm:pt-12">
          <div className="flex items-center gap-2.5">
            <AviaoPapel className="size-9" />
            <span className="font-poppins text-lg font-bold text-white">{p.nome}</span>
          </div>
          {p.indicadoPor && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-500/10 px-3 py-1 text-[13px] text-orange-200">
              <Gift className="size-4" /> {p.indicadoPor} te convidou para o grupo
            </div>
          )}
          <h1 className="mt-4 max-w-3xl font-poppins text-[32px] leading-tight font-bold text-white sm:text-[44px]">
            Entre para o <span className="text-orange-400">{p.nome}</span>
          </h1>
          {p.descricao && <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-slate-300">{p.descricao}</p>}
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-slate-300">
            {p.membros > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-4 text-orange-300" /> {p.membros} membros ativos
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Zap className="size-4 text-orange-300" /> Acesso liberado após o pagamento
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-orange-300" /> Cancele quando quiser
            </span>
          </div>
          <a href="#planos" className="mt-7 inline-flex h-12 items-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 font-semibold text-slate-950 shadow-[0_10px_30px_-10px_rgba(249,115,22,0.9)]">
            Ver planos
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16">
        {p.beneficios.length > 0 && (
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {p.beneficios.map((b) => (
              <div key={b} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-orange-500/15">
                  <Check className="size-4 text-orange-300" />
                </span>
                <span className="text-[15px] text-slate-200">{b}</span>
              </div>
            ))}
          </section>
        )}

        <section id="planos" className="mt-12 scroll-mt-4">
          <h2 className="font-poppins text-2xl font-bold text-white">Escolha seu plano</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {p.planos.map((pl, i) => {
              const destaque = p.planos.length > 1 && i === Math.min(1, p.planos.length - 1);
              return (
                <div
                  key={pl.id}
                  className={`relative flex flex-col rounded-3xl border p-5 ${
                    destaque ? "border-orange-400/60 bg-gradient-to-b from-orange-500/10 to-transparent" : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  {destaque && (
                    <span className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full bg-orange-500 px-3 py-0.5 text-[12px] font-bold text-slate-950">
                      <Sparkles className="size-3.5" /> Mais escolhido
                    </span>
                  )}
                  <div className="font-poppins text-lg font-semibold text-white">{pl.nome}</div>
                  {pl.descricao && <p className="mt-1 text-[13.5px] text-slate-400">{pl.descricao}</p>}
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="font-poppins text-3xl font-bold text-white">{formatar.moeda(pl.preco)}</span>
                    <span className="text-sm text-slate-400">{periodicidade(pl.duracaoMeses)}</span>
                  </div>
                  <ul className="mt-4 flex flex-1 flex-col gap-2">
                    {pl.grupos.map((g) => (
                      <li key={g.id} className="flex items-center gap-2 text-[14px] text-slate-200">
                        <Check className="size-4 shrink-0 text-emerald-400" />
                        <span className="flex-1">{g.nome}</span>
                        <SeloPlataforma plataforma={g.plataforma} />
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setPlano(pl)}
                    className={`mt-5 h-12 rounded-xl font-semibold transition ${
                      destaque
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:brightness-110"
                        : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                    }`}
                  >
                    Quero este plano
                  </button>
                </div>
              );
            })}
            {p.planos.length === 0 && <p className="text-slate-400">Nenhum plano à venda no momento.</p>}
          </div>
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            ["1. Escolha e pague", "Pague pelo Pix em segundos, direto no seu celular."],
            ["2. Receba o acesso", "Você recebe os links dos grupos na sua área de membro e no WhatsApp/Telegram."],
            ["3. Indique e ganhe", "Cada amigo que entrar pelo seu link rende comissão todo mês para você."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="font-semibold text-white">{t}</div>
              <p className="mt-1 text-[14px] text-slate-400">{d}</p>
            </div>
          ))}
        </section>

        {p.whatsappSuporte && (
          <div className="mt-10 text-center">
            <a
              href={linkWhatsapp(p.whatsappSuporte, `Olá! Tenho uma dúvida sobre o ${p.nome}.`) ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-[14px] text-green-300 hover:underline"
            >
              <MessageCircle className="size-4" /> Dúvidas? Fale com a gente no WhatsApp
            </a>
          </div>
        )}
      </main>

      {plano && <Checkout pagina={p} slug={slug} plano={plano} refCodigo={ref ?? null} aoFechar={() => setPlano(null)} />}
    </div>
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
        <div className="relative w-full max-w-md rounded-t-3xl border border-white/10 bg-[#0b111e] p-5 shadow-2xl sm:rounded-3xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[13px] text-slate-400">{pagina.nome}</div>
              <div className="font-poppins text-xl font-bold text-white">{plano.nome}</div>
            </div>
            <div className="text-right">
              {desconto ? (
                <>
                  <div className="text-[13px] text-slate-500 line-through">{formatar.moeda(plano.preco)}</div>
                  <div className="font-poppins text-xl font-bold text-emerald-300">{formatar.moeda(desconto.valorFinal)}</div>
                </>
              ) : (
                <div className="font-poppins text-xl font-bold text-white">{formatar.moeda(plano.preco)}</div>
              )}
              <div className="text-[12px] text-slate-400">{periodicidade(plano.duracaoMeses)}</div>
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
                className="h-11 shrink-0 rounded-xl border border-white/15 px-4 text-sm font-semibold text-white disabled:opacity-40"
              >
                Aplicar
              </button>
            </div>
            {erroCupom && <p className="text-[13px] text-red-300">{erroCupom}</p>}
            {desconto && (
              <p className="flex items-center gap-1.5 text-[13px] text-emerald-300">
                <BadgeCheck className="size-4" /> Cupom {desconto.codigo}: {formatar.moeda(desconto.desconto)} de desconto no 1º pagamento
              </p>
            )}
            {pagina.indicadoPor && <p className="text-[12.5px] text-orange-200">Indicação de {pagina.indicadoPor}</p>}
          </div>
          {erro && <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] text-red-200">{erro}</p>}
          <button
            type="button"
            onClick={assinar}
            disabled={enviando || !f.nome.trim() || !f.telefone.trim()}
            className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-[16px] font-bold text-slate-950 disabled:opacity-50"
          >
            {enviando ? <LoaderCircle className="size-5 animate-spin" /> : <Lock className="size-4" />} Continuar para o pagamento
          </button>
          <p className="mt-3 text-center text-[12px] text-slate-500">
            Na próxima tela você paga pelo Pix. Seus dados ficam só com {pagina.nome}.
          </p>
        </div>
      </div>
    </div>
  );
}
