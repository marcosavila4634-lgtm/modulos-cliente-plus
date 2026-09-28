import { useLocation, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, ChevronRight, CircleHelp, Clock, Lightbulb, Rocket, Search, TriangleAlert, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  apiPrimeirosPassos,
  categorias,
  guia,
  guias,
  type IdGuia,
  type PrimeiroPasso,
} from "../../lib/grupo-vip-guias";
import { Botao, Modal } from "./formulario";

// Ajuda do módulo: o "Como fazer?" de cada tela, a janela com o passo a
// passo, a Central de ajuda (botão "?" do topo) e os Primeiros passos do
// Dashboard. Os textos ficam em lib/grupo-vip-guias.tsx.

// Link discreto que abre o passo a passo.
export function BotaoGuia({ id, rotulo = "Como fazer?", className = "" }: { id: IdGuia; rotulo?: string; className?: string }) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={`inline-flex items-center gap-1 text-[12px] font-medium text-gv-muted transition hover:text-orange-300 print:hidden ${className}`}
      >
        <CircleHelp className="size-3.5" />
        {rotulo}
      </button>
      {/* portal: o botão pode estar dentro de um texto (<p>) */}
      {aberto && createPortal(<JanelaGuia id={id} aoFechar={() => setAberto(false)} />, document.body)}
    </>
  );
}

export function JanelaGuia({ id, aoFechar }: { id: IdGuia; aoFechar: () => void }) {
  const g = guia(id);
  return (
    <Modal titulo={g.titulo} subtitulo={g.resumo} aoFechar={aoFechar} largura="max-w-2xl">
      <ConteudoGuia id={id} aoFechar={aoFechar} />
    </Modal>
  );
}

// Passo a passo (usado na janela e dentro da Central de ajuda).
function ConteudoGuia({ id, aoFechar }: { id: IdGuia; aoFechar: () => void }) {
  const g = guia(id);
  const navigate = useNavigate();
  const local = useLocation();
  const [caminho, consulta] = (g.tela?.para ?? "").split("?");
  const naMesmaTela = local.pathname === caminho;

  return (
    <div className="flex flex-col gap-4">
      {g.tempo && (
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11.5px] text-gv-muted">
          <Clock className="size-3.5" /> leva uns {g.tempo}
        </span>
      )}
      <ol className="flex flex-col gap-3">
        {g.passos.map((passo, i) => (
          <li key={i} className="flex gap-3 text-[13.5px] leading-relaxed text-slate-200">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-300">{i + 1}</span>
            <span className="min-w-0">{passo}</span>
          </li>
        ))}
      </ol>
      {g.pronto && (
        <div className="flex gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.07] px-3 py-2.5 text-[13px] text-slate-200">
          <Check className="mt-0.5 size-4 shrink-0 text-emerald-300" />
          <span>
            <b className="text-emerald-300">Deu certo quando: </b>
            {g.pronto}
          </span>
        </div>
      )}
      {g.dicas?.map((d, i) => (
        <div key={i} className="flex gap-2.5 rounded-xl border border-sky-500/25 bg-sky-500/[0.06] px-3 py-2.5 text-[13px] text-slate-300">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-sky-300" />
          <span>{d}</span>
        </div>
      ))}
      {g.problemas && g.problemas.length > 0 && (
        <div>
          <div className="mb-1.5 text-xs font-semibold tracking-wide text-gv-muted uppercase">Deu algum problema?</div>
          <div className="flex flex-col gap-1.5">
            {g.problemas.map(([pergunta, resposta]) => (
              <details key={pergunta} className="group rounded-xl border border-gv-line bg-gv-bg/40 px-3 py-2 text-[13px]">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-slate-200">
                  <TriangleAlert className="size-3.5 shrink-0 text-amber-300" />
                  <span className="flex-1">{pergunta}</span>
                  <ChevronRight className="size-4 text-gv-muted transition group-open:rotate-90" />
                </summary>
                <p className="mt-1.5 pl-5.5 text-gv-muted">{resposta}</p>
              </details>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap justify-end gap-2 pt-1">
        {g.tela && !naMesmaTela && (
          <Botao
            onClick={() => {
              aoFechar();
              navigate({ to: caminho, search: consulta ? Object.fromEntries(new URLSearchParams(consulta)) : undefined });
            }}
          >
            {g.tela.rotulo} <ArrowRight className="size-4" />
          </Botao>
        )}
        <Botao variante="primario" onClick={aoFechar}>
          Entendi
        </Botao>
      </div>
    </div>
  );
}

// ---------- Central de ajuda (botão "?" do topo) ----------

const visaoGeral: [string, string][] = [
  ["Página de vendas", "Divulgue o link: a pessoa escolhe o plano, paga pelo Pix e recebe o acesso."],
  ["Controle de acesso", "Mostra quem pagou e precisa entrar, e quem não pagou e precisa sair. No Telegram, o robô faz sozinho."],
  ["Membros", "Ficha de cada membro: pagamentos, grupos, permissões, mensagens e indicações."],
  ["Automação", "Mensagens automáticas (lembrete, atraso, boas-vindas...) e a caixa de saída do WhatsApp."],
  ["Conteúdos, lives e anúncios", "Publique nos grupos, agende, avise sobre as lives e mande recados para um público."],
  ["Biblioteca", "Livros ou outros materiais enviados em massa e o robô bibliotecário no privado do Telegram."],
  ["Financeiro", "Receitas do mês, assinaturas, comissões de indicação e pedidos de saque."],
];

const semAcento = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();

export function CentralAjuda({ aoFechar }: { aoFechar: () => void }) {
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState<IdGuia | null>(null);
  const lista = useMemo(() => {
    const termos = semAcento(busca).split(/\s+/).filter(Boolean);
    return (Object.keys(guias) as IdGuia[]).filter((id) => {
      const g = guia(id);
      const texto = semAcento(`${g.titulo} ${g.resumo} ${g.categoria} ${g.busca ?? ""}`);
      return termos.every((t) => texto.includes(t));
    });
  }, [busca]);

  if (aberto) {
    const g = guia(aberto);
    return (
      <Modal titulo={g.titulo} subtitulo={g.resumo} aoFechar={aoFechar} largura="max-w-2xl">
        <button
          type="button"
          onClick={() => setAberto(null)}
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-gv-muted hover:text-white"
        >
          <ArrowLeft className="size-4" /> Todos os assuntos
        </button>
        <ConteudoGuia id={aberto} aoFechar={aoFechar} />
      </Modal>
    );
  }

  return (
    <Modal titulo="Central de ajuda" subtitulo="Passo a passo de tudo o que precisa configurar ou fazer." aoFechar={aoFechar} largura="max-w-2xl">
      <label className="relative block">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gv-muted" />
        <input
          autoFocus
          className="h-10 w-full rounded-xl border border-gv-line bg-gv-bg/70 pr-3 pl-9 text-sm text-slate-100 outline-none placeholder:text-gv-muted/70 focus:border-orange-500/70"
          placeholder="O que você quer fazer? Ex.: pix, robô, link do whatsapp"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </label>

      <div className="mt-4 flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-1">
        {categorias.map((cat) => {
          const daCategoria = lista.filter((id) => guia(id).categoria === cat);
          if (daCategoria.length === 0) return null;
          return (
            <div key={cat}>
              <div className="mb-1.5 text-xs font-semibold tracking-wide text-gv-muted uppercase">{cat}</div>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {daCategoria.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAberto(id)}
                    className="flex items-start gap-2 rounded-xl border border-gv-line bg-gv-bg/40 px-3 py-2 text-left transition hover:border-orange-500/50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold text-white">{guia(id).titulo}</span>
                      <span className="block text-[11.5px] leading-snug text-gv-muted">{guia(id).resumo}</span>
                    </span>
                    <ChevronRight className="mt-0.5 size-4 shrink-0 text-gv-muted" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {lista.length === 0 && <p className="py-6 text-center text-sm text-gv-muted">Nada encontrado. Tente outra palavra.</p>}

        {!busca && (
          <details className="group rounded-xl border border-gv-line bg-gv-bg/40 px-3 py-2">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-[13px] font-semibold text-white">
              <span className="flex-1">O que tem em cada tela</span>
              <ChevronRight className="size-4 text-gv-muted transition group-open:rotate-90" />
            </summary>
            <ul className="mt-2 flex flex-col gap-2">
              {visaoGeral.map(([titulo, texto]) => (
                <li key={titulo} className="text-[12.5px]">
                  <b className="text-slate-200">{titulo}:</b> <span className="text-gv-muted">{texto}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gv-line pt-3">
        <button
          type="button"
          onClick={() => {
            mostrarPrimeirosPassos();
            aoFechar();
          }}
          className="inline-flex items-center gap-1.5 text-[12.5px] text-gv-muted hover:text-orange-300"
        >
          <Rocket className="size-3.5" /> Mostrar os primeiros passos no Dashboard
        </button>
        <span className="text-[11.5px] text-gv-muted">Todo pagamento confirmado entra no Cliente Plus e gera as comissões de indicação.</span>
      </div>
    </Modal>
  );
}

// ---------- Primeiros passos (Dashboard) ----------

const CHAVE_OCULTO = "gv-primeiros-passos-oculto";
const EVENTO = "gv-primeiros-passos";

function lerOculto() {
  try {
    return localStorage.getItem(CHAVE_OCULTO) === "1";
  } catch {
    return false;
  }
}

function gravarOculto(oculto: boolean) {
  try {
    if (oculto) localStorage.setItem(CHAVE_OCULTO, "1");
    else localStorage.removeItem(CHAVE_OCULTO);
  } catch {
    // navegador sem armazenamento: só não lembra
  }
}

export function mostrarPrimeirosPassos() {
  gravarOculto(false);
  window.dispatchEvent(new Event(EVENTO));
}

// Some sozinho quando tudo o que é obrigatório estiver feito (ou se o dono esconder).
export function PrimeirosPassos() {
  const [passos, setPassos] = useState<PrimeiroPasso[] | null>(null);
  const [oculto, setOculto] = useState(lerOculto);
  const [guiaAberto, setGuiaAberto] = useState<IdGuia | null>(null);
  const [forcado, setForcado] = useState(false);
  const [verFeitos, setVerFeitos] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    apiPrimeirosPassos.listar().then(setPassos).catch(() => setPassos([]));
    const mostrar = () => {
      setOculto(false);
      setForcado(true);
    };
    window.addEventListener(EVENTO, mostrar);
    return () => window.removeEventListener(EVENTO, mostrar);
  }, []);

  if (!passos || passos.length === 0 || oculto) return null;
  const obrigatorios = passos.filter((p) => !p.opcional);
  const feitos = obrigatorios.filter((p) => p.feito).length;
  if (feitos === obrigatorios.length && !forcado) return null;
  const pct = Math.round((feitos / obrigatorios.length) * 100);
  const proximo = passos.find((p) => !p.feito && !p.opcional);

  return (
    <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/[0.09] to-transparent p-4">
      <div className="flex flex-wrap items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange-500/20 text-orange-300">
          <Rocket className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-poppins text-[15px] font-semibold text-white">Primeiros passos</div>
          <div className="text-[12.5px] text-gv-muted">
            {feitos === obrigatorios.length
              ? "Tudo configurado! 🎉"
              : `${feitos} de ${obrigatorios.length} feitos. Cada passo tem um "Como fazer" com o passo a passo.`}
          </div>
          <div className="mt-2 h-1.5 max-w-sm overflow-hidden rounded-full bg-gv-bg">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            gravarOculto(true);
            setOculto(true);
          }}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] text-gv-muted hover:bg-white/5 hover:text-white"
          title="Dá para mostrar de novo pela Central de ajuda (?)"
        >
          <X className="size-3.5" /> Esconder
        </button>
      </div>

      <ul className="mt-3 grid gap-2 md:grid-cols-2">
        {passos.map((p, i) => {
          if (p.feito && !verFeitos) return null;
          const eOProximo = p.id === proximo?.id;
          return (
            <li
              key={p.id}
              className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 ${
                p.feito ? "border-gv-line/50 opacity-60" : eOProximo ? "border-orange-500/50 bg-gv-card/80" : "border-gv-line bg-gv-card/50"
              }`}
            >
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                  p.feito ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-slate-300"
                }`}
              >
                {p.feito ? <Check className="size-3.5" /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className={`text-[13px] font-semibold ${p.feito ? "text-slate-300 line-through decoration-slate-500" : "text-white"}`}>
                  {p.titulo}
                  {p.opcional && <span className="ml-1.5 text-[10.5px] font-normal text-gv-muted no-underline">(opcional)</span>}
                </div>
                {!p.feito && (
                  <>
                    <div className="text-[12px] leading-snug text-gv-muted">{p.descricao}</div>
                    <div className="mt-1.5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setGuiaAberto(p.guia)}
                        className="inline-flex items-center gap-1 text-[12px] font-medium text-orange-300 hover:text-orange-200"
                      >
                        <CircleHelp className="size-3.5" /> Como fazer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const [caminho, consulta] = p.para.split("?");
                          navigate({ to: caminho, search: consulta ? Object.fromEntries(new URLSearchParams(consulta)) : undefined });
                        }}
                        className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-300 hover:text-white"
                      >
                        Ir para a tela <ArrowRight className="size-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {passos.some((p) => p.feito) && (
        <button
          type="button"
          onClick={() => setVerFeitos((v) => !v)}
          className="mt-2 inline-flex items-center gap-1 text-[12px] text-gv-muted hover:text-white"
        >
          <Check className="size-3.5 text-emerald-300" />
          {verFeitos ? "Esconder os que já estão feitos" : `Mostrar os feitos (${passos.filter((p) => p.feito).length})`}
        </button>
      )}
      {guiaAberto && <JanelaGuia id={guiaAberto} aoFechar={() => setGuiaAberto(null)} />}
    </div>
  );
}
