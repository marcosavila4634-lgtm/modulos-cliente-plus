import { createFileRoute } from "@tanstack/react-router";
import QRCode from "qrcode";
import {
  BadgeCheck,
  Bot,
  CalendarDays,
  Check,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  FlaskConical,
  Gift,
  Headset,
  Home,
  LoaderCircle,
  MessageCircle,
  Network,
  Send,
  TriangleAlert,
  Video,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { AviaoPapel } from "../components/grupo-vip/Marcas";
import { SeloPlataforma, SeloSituacao } from "../components/grupo-vip/Selos";
import { copiar, formatar, linkWhatsapp, periodicidade, prazo, rotuloForma } from "../lib/grupo-vip";
import { apiPublico, type AreaMembro, type CobrancaArea } from "../lib/grupo-vip-publico";

type Aba = "inicio" | "pagamentos" | "conteudos" | "lives" | "indicacoes" | "suporte";
type Busca = { aba?: Aba; bemvindo?: boolean };
const abas: Aba[] = ["inicio", "pagamentos", "conteudos", "lives", "indicacoes", "suporte"];

// Área do membro: o cliente entra pelo link (com o código dele) e vê os
// grupos, paga pelo Pix, acessa os conteúdos, as lives, as indicações e o
// suporte. No projeto principal: abas na área do cliente do Cliente Plus (com login).
export const Route = createFileRoute("/membro/$codigo")({
  validateSearch: (s: Record<string, unknown>): Busca => ({
    aba: abas.includes(s.aba as Aba) ? (s.aba as Aba) : undefined,
    bemvindo: s.bemvindo === true || s.bemvindo === "true" ? true : undefined,
  }),
  loader: ({ params }) => apiPublico.area(params.codigo),
  component: AreaDoMembro,
});

const botao =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-[14.5px] font-semibold transition disabled:opacity-50";
const laranja = `${botao} bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:brightness-110`;
const neutro = `${botao} border border-white/12 bg-white/[0.05] text-white hover:bg-white/10`;
const campo =
  "h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-[15px] text-white outline-none placeholder:text-slate-500 focus:border-orange-400/70";

function AreaDoMembro() {
  const { codigo } = Route.useParams();
  const busca = Route.useSearch();
  const [a, setA] = useState<AreaMembro>(Route.useLoaderData());
  const pendente = a.cobrancas.find((c) => c.status === "pendente" || c.status === "atrasada");
  const [aba, setAba] = useState<Aba>(
    busca.aba ?? (busca.bemvindo && a.situacao === "aguardando_pagamento" ? "pagamentos" : "inicio"),
  );
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState<string | null>(null);
  const primeiro = a.nome.split(" ")[0];

  async function agir(chave: string, acao: () => Promise<AreaMembro | void>) {
    setCarregando(chave);
    setErro(null);
    try {
      const nova = await acao();
      if (nova) setA(nova);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Algo deu errado. Tente de novo.");
    } finally {
      setCarregando(null);
    }
  }

  const itens: { aba: Aba; rotulo: string; icone: LucideIcon; alerta?: boolean }[] = [
    { aba: "inicio", rotulo: "Início", icone: Home },
    {
      aba: "pagamentos",
      rotulo: "Pagamentos",
      icone: Wallet,
      alerta: !!pendente && ["aguardando_pagamento", "vencendo", "atrasado", "bloqueado"].includes(a.situacao),
    },
    { aba: "conteudos", rotulo: "Conteúdos", icone: FileText },
    { aba: "lives", rotulo: "Lives", icone: Video },
    { aba: "indicacoes", rotulo: "Indique e ganhe", icone: Network },
    { aba: "suporte", rotulo: "Suporte", icone: Headset },
  ];

  return (
    <div className="min-h-full bg-gv-bg pb-24 text-slate-100 md:pb-10">
      <div className="bg-violet-950/60 px-4 py-1.5 text-center text-[11px] text-violet-200">
        Área do membro (simulação da área do cliente do Cliente Plus)
      </div>
      <header className="border-b border-white/5 bg-gradient-to-b from-[#0b1426] to-gv-bg">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4">
          <AviaoPapel className="size-9 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[12px] text-slate-400">{a.negocio}</div>
            <div className="truncate font-poppins text-lg font-bold text-white">Olá, {primeiro}!</div>
          </div>
          <SeloSituacao situacao={a.situacao} />
        </div>
        <nav className="mx-auto hidden max-w-4xl gap-1 px-4 md:flex">
          {itens.map((i) => (
            <button
              key={i.aba}
              type="button"
              onClick={() => setAba(i.aba)}
              className={`relative flex items-center gap-2 border-b-2 px-3 py-2.5 text-[14px] ${
                aba === i.aba ? "border-orange-400 text-white" : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              <i.icone className="size-4" /> {i.rotulo}
              {i.alerta && <span className="size-2 rounded-full bg-red-500" />}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pt-4">
        {busca.bemvindo && a.situacao === "aguardando_pagamento" && aba === "pagamentos" && (
          <Aviso cor="orange" icone={BadgeCheck}>
            Cadastro feito! Falta só pagar. Assim que o pagamento for confirmado, os links dos grupos aparecem em Início.
          </Aviso>
        )}
        {erro && (
          <Aviso cor="red" icone={TriangleAlert}>
            {erro}
          </Aviso>
        )}

        {aba === "inicio" && <Inicio a={a} codigo={codigo} pendente={pendente} irPara={setAba} agir={agir} carregando={carregando} />}
        {aba === "pagamentos" && <Pagamentos a={a} codigo={codigo} agir={agir} carregando={carregando} />}
        {aba === "conteudos" && <Conteudos a={a} codigo={codigo} />}
        {aba === "lives" && <Lives a={a} />}
        {aba === "indicacoes" && <Indicacoes a={a} codigo={codigo} agir={agir} carregando={carregando} />}
        {aba === "suporte" && <Suporte a={a} codigo={codigo} agir={agir} carregando={carregando} />}

        {a.whatsappSuporte && (
          <a
            href={linkWhatsapp(a.whatsappSuporte, `Olá! Sou ${a.nome}, membro do ${a.negocio}.`) ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="mx-auto mt-4 inline-flex items-center gap-2 text-[13px] text-green-300 hover:underline"
          >
            <MessageCircle className="size-4" /> Falar com a equipe no WhatsApp
          </a>
        )}
      </main>

      {/* Menu do celular */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-white/10 bg-[#070c17]/95 backdrop-blur md:hidden">
        {itens.map((i) => (
          <button
            key={i.aba}
            type="button"
            onClick={() => setAba(i.aba)}
            className={`relative flex flex-col items-center gap-0.5 py-2 text-[10px] ${aba === i.aba ? "text-orange-300" : "text-slate-400"}`}
          >
            <i.icone className="size-5" />
            <span className="truncate">{i.rotulo.split(" ")[0]}</span>
            {i.alerta && <span className="absolute top-1.5 right-[30%] size-2 rounded-full bg-red-500" />}
          </button>
        ))}
      </nav>
    </div>
  );
}

type Agir = (chave: string, acao: () => Promise<AreaMembro | void>) => Promise<void>;

function Bloco({ titulo, icone: Icone, children, acao }: { titulo: string; icone: LucideIcon; children: ReactNode; acao?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-poppins text-[16px] font-semibold text-white">
          <Icone className="size-[18px] text-orange-300" /> {titulo}
        </h2>
        {acao}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Aviso({ cor, icone: Icone, children }: { cor: "orange" | "red" | "emerald" | "sky"; icone: LucideIcon; children: ReactNode }) {
  const cores = {
    orange: "border-orange-400/40 bg-orange-500/10 text-orange-100",
    red: "border-red-500/40 bg-red-500/10 text-red-100",
    emerald: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
    sky: "border-sky-500/40 bg-sky-500/10 text-sky-100",
  };
  return (
    <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-[14px] leading-relaxed ${cores[cor]}`}>
      <Icone className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

// ---------- Início ----------

function Inicio({
  a,
  codigo,
  pendente,
  irPara,
  agir,
  carregando,
}: {
  a: AreaMembro;
  codigo: string;
  pendente: CobrancaArea | undefined;
  irPara: (aba: Aba) => void;
  agir: Agir;
  carregando: string | null;
}) {
  const temAcesso = ["em_dia", "vencendo", "atrasado", "cancelando"].includes(a.situacao);
  return (
    <>
      {a.situacao === "aguardando_pagamento" && pendente && (
        <Aviso cor="orange" icone={Wallet}>
          Falta pagar {formatar.moeda(pendente.valor)} para liberar seus grupos.
          <button type="button" onClick={() => irPara("pagamentos")} className={`${laranja} mt-3 w-full sm:w-auto`}>
            Pagar agora
          </button>
        </Aviso>
      )}
      {(a.situacao === "atrasado" || a.situacao === "vencendo") && pendente && (
        <Aviso cor={a.situacao === "atrasado" ? "red" : "sky"} icone={Clock}>
          {a.situacao === "atrasado"
            ? `Sua mensalidade venceu há ${a.diasAtraso} dia(s). Você tem até ${a.toleranciaDias} dias de atraso antes de sair dos grupos.`
            : `Sua mensalidade ${prazo(pendente.vencimento)}.`}
          <button type="button" onClick={() => irPara("pagamentos")} className={`${laranja} mt-3 w-full sm:w-auto`}>
            Pagar {formatar.moeda(pendente.valor)}
          </button>
        </Aviso>
      )}
      {a.situacao === "bloqueado" && (
        <Aviso cor="red" icone={TriangleAlert}>
          Seu acesso aos grupos está suspenso.{" "}
          {pendente ? "Regularize o pagamento para voltar." : "Fale com a equipe pelo Suporte."}
          {pendente && (
            <button type="button" onClick={() => irPara("pagamentos")} className={`${laranja} mt-3 w-full sm:w-auto`}>
              Pagar {formatar.moeda(pendente.valor)}
            </button>
          )}
        </Aviso>
      )}
      {a.situacao === "cancelando" && (
        <Aviso cor="sky" icone={CalendarDays}>
          Você cancelou a assinatura. Seu acesso continua até {formatar.data(a.pagoAte)}.
        </Aviso>
      )}

      <Bloco titulo="Meus grupos" icone={Send}>
        {a.grupos.length === 0 ? (
          <p className="text-[14px] text-slate-400">
            {temAcesso ? "Nenhum grupo no seu plano." : "Os grupos aparecem aqui quando o pagamento for confirmado."}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {a.grupos.map((g) => (
              <li key={g.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-white">{g.nome}</span>
                  <SeloPlataforma plataforma={g.plataforma} />
                  {g.status === "no_grupo" && (
                    <span className="inline-flex items-center gap-1 text-[12.5px] text-emerald-300">
                      <Check className="size-3.5" /> você está no grupo
                    </span>
                  )}
                </div>
                {g.descricao && <p className="mt-1 text-[13px] text-slate-400">{g.descricao}</p>}
                {g.status !== "no_grupo" && temAcesso && (
                  <div className="mt-3">
                    {g.link ? (
                      <a href={g.link} target="_blank" rel="noreferrer" className={`${laranja} w-full sm:w-auto`}>
                        <ExternalLink className="size-4" /> Entrar no grupo
                      </a>
                    ) : g.modo === "automatico" ? (
                      <button
                        type="button"
                        disabled={carregando === `link:${g.id}`}
                        onClick={() => agir(`link:${g.id}`, () => apiPublico.gerarLink(codigo, g.id))}
                        className={`${laranja} w-full sm:w-auto`}
                      >
                        {carregando === `link:${g.id}` ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />} Gerar meu link de entrada
                      </button>
                    ) : (
                      <p className="text-[13px] text-slate-300">A equipe vai te adicionar pelo seu WhatsApp em breve.</p>
                    )}
                    {g.modo === "automatico" && g.link && (
                      <p className="mt-2 text-[12px] text-slate-400">Toque em "Pedir para entrar": a entrada é aprovada na hora. O link é só seu.</p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Bloco>

      {a.telegram.roboAtivo && a.telegram.linkRobo && (
        <Bloco titulo="Telegram" icone={Bot}>
          {a.telegram.conectado ? (
            <p className="flex items-center gap-2 text-[14px] text-emerald-300">
              <Check className="size-4" /> Seu Telegram está conectado{a.telegram.usuario ? ` (@${a.telegram.usuario})` : ""}. Você recebe os links e avisos por lá.
            </p>
          ) : (
            <>
              <p className="text-[14px] text-slate-300">Conecte seu Telegram para receber seus links de entrada e os avisos na hora.</p>
              <ol className="mt-3 flex flex-col gap-1.5 text-[13px] text-slate-400">
                <li>
                  <b className="text-slate-200">1.</b> Toque em <b className="text-slate-200">Conectar Telegram</b>.
                </li>
                <li>
                  <b className="text-slate-200">2.</b> O Telegram abre na conversa com o nosso robô: toque em{" "}
                  <b className="text-slate-200">Iniciar</b> (ou "Start").
                </li>
                <li>
                  <b className="text-slate-200">3.</b> Pronto: o robô te manda os links dos grupos e um menu com tudo o que você pode fazer.
                </li>
              </ol>
              <a href={a.telegram.linkRobo} target="_blank" rel="noreferrer" className={`${botao} mt-3 w-full bg-sky-500 text-white sm:w-auto`}>
                <Send className="size-4" /> Conectar Telegram
              </a>
              <p className="mt-2 text-[12px] text-slate-500">
                Ainda não tem Telegram?{" "}
                <a href="https://telegram.org/apps" target="_blank" rel="noreferrer" className="text-sky-300 underline">
                  Baixe grátis aqui
                </a>{" "}
                e depois volte nesta página.
              </p>
            </>
          )}
        </Bloco>
      )}

      <Bloco titulo="Minha assinatura" icone={Wallet}>
        {a.plano ? (
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-white">{a.plano.nome}</div>
              <div className="text-[13px] text-slate-400">
                {formatar.moeda(a.plano.preco)} {periodicidade(a.plano.duracaoMeses)}
                {a.proximoVencimento && ` · próximo vencimento ${formatar.data(a.proximoVencimento)}`}
                {a.situacao === "cancelando" && ` · acesso até ${formatar.data(a.pagoAte)}`}
              </div>
            </div>
            {a.assinaturaStatus === "ativa" && a.situacao !== "aguardando_pagamento" && (
              <button
                type="button"
                className="text-[13px] text-slate-400 underline hover:text-red-300"
                onClick={() => {
                  if (confirm("Cancelar sua assinatura? Você continua nos grupos até o fim do período pago.")) {
                    agir("cancelar", () => apiPublico.cancelar(codigo));
                  }
                }}
              >
                Cancelar assinatura
              </button>
            )}
          </div>
        ) : (
          <EscolherPlano a={a} codigo={codigo} agir={agir} carregando={carregando} />
        )}
        {a.situacao === "aguardando_pagamento" && a.planos.length > 1 && (
          <details className="mt-3 text-[13px] text-slate-400">
            <summary className="cursor-pointer">Trocar de plano antes de pagar</summary>
            <div className="mt-2">
              <EscolherPlano a={a} codigo={codigo} agir={agir} carregando={carregando} />
            </div>
          </details>
        )}
      </Bloco>
    </>
  );
}

function EscolherPlano({ a, codigo, agir, carregando }: { a: AreaMembro; codigo: string; agir: Agir; carregando: string | null }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {a.planos.map((p) => (
        <button
          key={p.id}
          type="button"
          disabled={carregando === `assinar:${p.id}`}
          onClick={() => agir(`assinar:${p.id}`, () => apiPublico.assinar(codigo, p.id))}
          className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left hover:border-orange-400/60"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-white">{p.nome}</span>
            <span className="text-orange-300">{formatar.moeda(p.preco)}</span>
          </div>
          <div className="text-[12.5px] text-slate-400">{p.grupos.map((g) => g.nome).join(", ")}</div>
        </button>
      ))}
    </div>
  );
}

// ---------- Pagamentos (Pix) ----------

function QrPix({ texto }: { texto: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    QRCode.toDataURL(texto, { margin: 1, width: 240, errorCorrectionLevel: "M" })
      .then(setSrc)
      .catch(() => setSrc(null));
  }, [texto]);
  return src ? <img src={src} alt="QR Code do Pix" className="size-[200px] rounded-xl bg-white p-2" /> : <div className="size-[200px] rounded-xl bg-white/10" />;
}

function BotaoCopiarGrande({ texto, rotulo }: { texto: string; rotulo: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copiar(texto)) {
          setOk(true);
          setTimeout(() => setOk(false), 2000);
        }
      }}
      className={`${laranja} w-full`}
    >
      {ok ? <Check className="size-4" /> : <Copy className="size-4" />} {ok ? "Copiado!" : rotulo}
    </button>
  );
}

function Pagamentos({ a, codigo, agir, carregando }: { a: AreaMembro; codigo: string; agir: Agir; carregando: string | null }) {
  const abertas = a.cobrancas.filter((c) => c.status === "pendente" || c.status === "atrasada");
  const pagas = a.cobrancas.filter((c) => c.status === "paga");
  return (
    <>
      {abertas.map((c) => (
        <Bloco key={c.id} titulo={c.status === "atrasada" ? "Pagamento atrasado" : "Pagamento em aberto"} icone={Wallet}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {c.pix && <QrPix texto={c.pix.copiaECola} />}
            <div className="min-w-0 flex-1">
              <div className="text-[13px] text-slate-400">
                {c.descricao} · vence {formatar.data(c.vencimento)} ({prazo(c.vencimento)})
              </div>
              <div className="font-poppins text-3xl font-bold text-white">{formatar.moeda(c.valor)}</div>
              {c.pix ? (
                <>
                  <p className="mt-2 text-[13px] text-slate-300">
                    Abra o app do seu banco, escolha <b>Pix › Ler QR Code</b> ou <b>Pix copia e cola</b>. Recebedor: {c.pix.recebedor}.
                  </p>
                  <div className="mt-3">
                    <BotaoCopiarGrande texto={c.pix.copiaECola} rotulo="Copiar código Pix" />
                  </div>
                  <p className="mt-2 text-[12px] text-slate-500">
                    Depois de pagar, a equipe confirma o recebimento e seus grupos são liberados. Se demorar, fale com o suporte.
                  </p>
                </>
              ) : (
                <p className="mt-2 text-[13px] text-slate-300">
                  {a.whatsappSuporte ? "Fale com a equipe para receber a forma de pagamento." : "A equipe vai entrar em contato para o pagamento."}
                </p>
              )}
              <div className="mt-4 rounded-xl border border-dashed border-violet-400/40 bg-violet-500/[0.07] p-3">
                <div className="flex items-center gap-2 text-[12.5px] font-semibold text-violet-200">
                  <FlaskConical className="size-4" /> Só no laboratório
                </div>
                <p className="mt-1 text-[12px] text-violet-200/80">
                  Simula o banco avisando que o Pix caiu (no Cliente Plus isso vem do gateway de pagamento).
                </p>
                <button
                  type="button"
                  disabled={carregando === `pagar:${c.id}`}
                  onClick={() => agir(`pagar:${c.id}`, () => apiPublico.simularPagamento(codigo, c.id))}
                  className={`${neutro} mt-2 h-9 text-[13px]`}
                >
                  {carregando === `pagar:${c.id}` ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />} Simular pagamento confirmado
                </button>
              </div>
            </div>
          </div>
        </Bloco>
      ))}
      {abertas.length === 0 && (
        <Aviso cor="emerald" icone={BadgeCheck}>
          Nenhum pagamento em aberto. Obrigado!
        </Aviso>
      )}
      <Bloco titulo="Histórico" icone={Clock}>
        {pagas.length === 0 ? (
          <p className="text-[14px] text-slate-400">Nenhum pagamento ainda.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {pagas.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-[14px]">
                <div>
                  <div className="text-slate-200">{c.descricao}</div>
                  <div className="text-[12px] text-slate-500">
                    Pago {formatar.data(c.pagoEm)} · {c.formaPagamento ? rotuloForma[c.formaPagamento] : "cortesia"}
                  </div>
                </div>
                <span className="font-semibold text-white">{formatar.moeda(c.valor)}</span>
              </li>
            ))}
          </ul>
        )}
      </Bloco>
    </>
  );
}

// ---------- Conteúdos ----------

function Conteudos({ a, codigo }: { a: AreaMembro; codigo: string }) {
  const [aberto, setAberto] = useState<AreaMembro["conteudos"][number] | null>(null);
  const [vistos, setVistos] = useState<Set<string>>(() => new Set(a.conteudos.filter((c) => c.visto).map((c) => c.id)));
  const categorias = [...new Set(a.conteudos.map((c) => c.categoria ?? "Outros"))];

  if (a.conteudos.length === 0) {
    return (
      <Aviso cor="sky" icone={FileText}>
        {["em_dia", "vencendo", "atrasado", "cancelando"].includes(a.situacao)
          ? "Ainda não há conteúdos na biblioteca."
          : "A biblioteca de conteúdos fica disponível para quem tem a assinatura ativa."}
      </Aviso>
    );
  }

  function abrir(c: AreaMembro["conteudos"][number]) {
    setAberto(c);
    setVistos((v) => new Set(v).add(c.id));
    apiPublico.ver(codigo, c.id).catch(() => undefined);
  }

  return (
    <>
      {categorias.map((cat) => (
        <Bloco key={cat} titulo={cat} icone={FileText}>
          <ul className="grid gap-2 sm:grid-cols-2">
            {a.conteudos
              .filter((c) => (c.categoria ?? "Outros") === cat)
              .map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => abrir(c)} className="flex w-full gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left hover:border-orange-400/50">
                    {c.midiaUrl && c.midiaTipo === "imagem" ? (
                      <img src={c.midiaUrl} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-orange-500/10">
                        {c.midiaTipo === "video" ? <Video className="size-6 text-orange-300" /> : <FileText className="size-6 text-orange-300" />}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-white">{c.titulo}</div>
                      <div className="text-[12px] text-slate-500">
                        {formatar.data(c.publicadoEm)}
                        {!vistos.has(c.id) && <span className="ml-2 rounded-full bg-orange-500 px-1.5 text-[10px] font-bold text-slate-950">NOVO</span>}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
          </ul>
        </Bloco>
      ))}
      {aberto && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/80" onClick={() => setAberto(null)} />
          <div className="flex min-h-full items-end justify-center sm:items-center sm:p-4">
            <div className="relative w-full max-w-2xl rounded-t-3xl border border-white/10 bg-[#0b111e] p-5 sm:rounded-3xl">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-poppins text-xl font-bold text-white">{aberto.titulo}</h3>
                <button type="button" aria-label="Fechar" onClick={() => setAberto(null)} className="text-slate-400 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>
              {aberto.midiaUrl &&
                (aberto.midiaTipo === "video" ? (
                  <video src={aberto.midiaUrl} controls className="mt-3 w-full rounded-xl bg-black" />
                ) : (
                  <img src={aberto.midiaUrl} alt="" className="mt-3 w-full rounded-xl" />
                ))}
              {aberto.texto && <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line text-slate-200">{aberto.texto}</p>}
              {aberto.link && (
                <a href={aberto.link} target="_blank" rel="noreferrer" className={`${laranja} mt-4 w-full`}>
                  <ExternalLink className="size-4" /> Abrir material
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ---------- Lives ----------

function Lives({ a }: { a: AreaMembro }) {
  if (a.lives.length === 0) {
    return (
      <Aviso cor="sky" icone={Video}>
        Nenhuma live agendada.
      </Aviso>
    );
  }
  return (
    <Bloco titulo="Lives e eventos" icone={Video}>
      <ul className="flex flex-col gap-3">
        {a.lives.map((l) => (
          <li key={l.id} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            {l.foto ? (
              <img src={l.foto} alt="" className="size-16 shrink-0 rounded-lg object-cover" />
            ) : (
              <span className="grid size-16 shrink-0 place-items-center rounded-lg bg-orange-500/10">
                <Video className="size-6 text-orange-300" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-white">{l.titulo}</span>
                {l.status === "ao_vivo" && <span className="rounded bg-red-600 px-1.5 py-0.5 text-[11px] font-bold text-white">AO VIVO</span>}
                {l.status === "encerrado" && <span className="text-[12px] text-slate-500">encerrada</span>}
              </div>
              <div className="text-[13px] text-slate-400">
                {formatar.diaHora(l.comecaEm)} · {l.duracaoMinutos} min
              </div>
              {l.descricao && <p className="mt-1 text-[13px] text-slate-300">{l.descricao}</p>}
              {l.link && l.status !== "encerrado" && (
                <a href={l.link} target="_blank" rel="noreferrer" className={`${l.status === "ao_vivo" ? laranja : neutro} mt-2 h-9 text-[13px]`}>
                  <ExternalLink className="size-4" /> {l.status === "ao_vivo" ? "Assistir agora" : "Link da live"}
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Bloco>
  );
}

// ---------- Indicações ----------

function Indicacoes({ a, codigo, agir, carregando }: { a: AreaMembro; codigo: string; agir: Agir; carregando: string | null }) {
  const i = a.indicacao;
  const [valor, setValor] = useState("");
  const [chave, setChave] = useState("");
  const mensagem = `Estou no ${a.negocio} e recomendo! Entre pelo meu link: ${i.link}`;
  return (
    <>
      <Bloco titulo="Indique e ganhe" icone={Gift}>
        <p className="text-[14px] text-slate-300">
          Cada pessoa que entrar pelo seu link rende <b className="text-orange-300">{i.percentuais[0]}%</b> de cada pagamento dela
          para você, todo mês, enquanto ela continuar no grupo. E ainda {i.percentuais[1]}% de quem ela indicar.
        </p>
        <div className="mt-3 flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
          <span className="truncate text-[13px] text-slate-300">{i.link}</span>
          <div className="grid grid-cols-2 gap-2">
            <BotaoCopiarGrande texto={i.link} rotulo="Copiar link" />
            <a href={`https://wa.me/?text=${encodeURIComponent(mensagem)}`} target="_blank" rel="noreferrer" className={`${botao} bg-[#25D366] text-slate-950`}>
              <MessageCircle className="size-4" /> Enviar
            </a>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["Disponível", i.disponivel, "text-emerald-300"],
            ["Em análise", i.emAnalise, "text-amber-300"],
            ["Já sacado", i.sacado, "text-slate-200"],
            ["Total ganho", i.ganho, "text-white"],
          ].map(([rot, v, cor]) => (
            <div key={rot as string} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <div className="text-[11.5px] text-slate-500">{rot as string}</div>
              <div className={`font-poppins text-lg font-bold ${cor as string}`}>{formatar.moeda(v as number)}</div>
            </div>
          ))}
        </div>
      </Bloco>

      <Bloco titulo="Pedir saque" icone={Wallet}>
        <div className="grid gap-2 sm:grid-cols-[140px_1fr_auto]">
          <input className={campo} inputMode="decimal" placeholder="Valor (R$)" value={valor} onChange={(e) => setValor(e.target.value)} />
          <input className={campo} placeholder="Sua chave Pix" value={chave} onChange={(e) => setChave(e.target.value)} />
          <button
            type="button"
            className={laranja}
            disabled={carregando === "sacar" || !valor || !chave}
            onClick={() =>
              agir("sacar", async () => {
                const n = Number(valor.replace(/\./g, "").replace(",", "."));
                const r = await apiPublico.sacar(codigo, n, chave);
                setValor("");
                return r;
              })
            }
          >
            Pedir saque
          </button>
        </div>
        <p className="mt-2 text-[12px] text-slate-500">Mínimo de R$ 10,00. A equipe paga pelo Pix.</p>
        {i.saques.length > 0 && (
          <ul className="mt-3 divide-y divide-white/5">
            {i.saques.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2 text-[13.5px]">
                <span className="text-slate-300">
                  {formatar.data(s.data)}
                  {s.motivo && <span className="block text-[12px] text-red-300">{s.motivo}</span>}
                </span>
                <span className="text-right">
                  <span className="font-semibold text-white">{formatar.moeda(s.valor)}</span>
                  <span
                    className={`block text-[11.5px] ${s.status === "pago" ? "text-emerald-300" : s.status === "recusado" ? "text-red-300" : "text-amber-300"}`}
                  >
                    {s.status === "pago" ? "pago" : s.status === "recusado" ? "recusado" : "em análise"}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Bloco>

      <Bloco titulo={`Suas indicações (${i.indicados.length})`} icone={Network}>
        {i.indicados.length === 0 ? (
          <p className="text-[14px] text-slate-400">Ninguém entrou pelo seu link ainda. Compartilhe!</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {i.indicados.map((p, n) => (
              <li
                key={p.nome + n}
                className={`rounded-full px-3 py-1 text-[13px] ${p.ativo ? "bg-emerald-500/15 text-emerald-200" : "bg-white/5 text-slate-400"}`}
              >
                {p.nome} {p.ativo ? "· ativo" : "· inativo"}
              </li>
            ))}
          </ul>
        )}
        {i.comissoes.length > 0 && (
          <ul className="mt-4 divide-y divide-white/5">
            {i.comissoes.map((c, n) => (
              <li key={n} className="flex items-center justify-between py-2 text-[13.5px]">
                <span className="text-slate-300">
                  {formatar.data(c.data)} · pagamento de {c.de} <span className="text-slate-500">(nível {c.nivel})</span>
                </span>
                <span className="font-semibold text-emerald-300">+{formatar.moeda(c.valor)}</span>
              </li>
            ))}
          </ul>
        )}
      </Bloco>
    </>
  );
}

// ---------- Suporte ----------

function Suporte({ a, codigo, agir, carregando }: { a: AreaMembro; codigo: string; agir: Agir; carregando: string | null }) {
  const [assunto, setAssunto] = useState("");
  const [texto, setTexto] = useState("");
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  return (
    <>
      <Bloco titulo="Falar com a equipe" icone={Headset}>
        <div className="flex flex-col gap-2">
          <input className={campo} placeholder="Assunto" value={assunto} onChange={(e) => setAssunto(e.target.value)} />
          <textarea
            className={`${campo} h-auto py-2.5`}
            rows={4}
            placeholder="Escreva sua mensagem"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <button
            type="button"
            className={`${laranja} sm:w-fit`}
            disabled={carregando === "chamado" || !assunto.trim() || !texto.trim()}
            onClick={() =>
              agir("chamado", async () => {
                const r = await apiPublico.abrirChamado(codigo, assunto, texto);
                setAssunto("");
                setTexto("");
                return r;
              })
            }
          >
            <Send className="size-4" /> Enviar
          </button>
        </div>
      </Bloco>
      {a.chamados.map((c) => (
        <Bloco
          key={c.id}
          titulo={c.assunto}
          icone={MessageCircle}
          acao={
            <span
              className={`text-[12px] ${c.status === "respondido" ? "text-emerald-300" : c.status === "resolvido" ? "text-slate-500" : "text-amber-300"}`}
            >
              {c.status === "respondido" ? "respondido" : c.status === "resolvido" ? "resolvido" : "aguardando a equipe"}
            </span>
          }
        >
          <ul className="flex flex-col gap-2">
            {c.mensagens.map((m) => (
              <li key={m.id} className={`flex ${m.autor === "membro" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[14px] whitespace-pre-line ${
                    m.autor === "membro" ? "rounded-br-sm bg-orange-500/20 text-orange-50" : "rounded-bl-sm bg-white/[0.06] text-slate-100"
                  }`}
                >
                  {m.texto}
                  <div className="mt-1 text-right text-[10.5px] opacity-60">
                    {m.autor === "membro" ? "Você" : "Equipe"} · {formatar.diaHora(m.createdAt)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {c.status !== "resolvido" && (
            <div className="mt-3 flex gap-2">
              <input
                className={campo}
                placeholder="Responder..."
                value={respostas[c.id] ?? ""}
                onChange={(e) => setRespostas((r) => ({ ...r, [c.id]: e.target.value }))}
              />
              <button
                type="button"
                aria-label="Enviar"
                className={laranja}
                disabled={carregando === `resp:${c.id}` || !(respostas[c.id] ?? "").trim()}
                onClick={() =>
                  agir(`resp:${c.id}`, async () => {
                    const r = await apiPublico.responderChamado(codigo, c.id, respostas[c.id]);
                    setRespostas((x) => ({ ...x, [c.id]: "" }));
                    return r;
                  })
                }
              >
                <Send className="size-4" />
              </button>
            </div>
          )}
        </Bloco>
      ))}
    </>
  );
}
