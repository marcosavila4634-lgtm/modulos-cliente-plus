import { createFileRoute } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  CalendarDays,
  ChevronRight,
  FlaskConical,
  Gift,
  LayoutGrid,
  Lock,
  Megaphone,
  MessageCircle,
  Shirt,
  Trophy,
  Video,
} from "lucide-react";
import { useState } from "react";
import { AbaAulasAluno } from "../components/academia/AbaAulasAluno";
import { AbaBeneficiosAluno } from "../components/academia/AbaBeneficiosAluno";
import { FaixaVisual, PontoModalidade } from "../components/artes-marciais/Faixa";
import { textoProximo } from "../components/artes-marciais/ModaisGraduacao";
import { apiAgenda } from "../lib/academia-agenda";
import { apiFinanceiro } from "../lib/academia-financeiro";
import {
  apiPublicoLutas,
  data,
  dataCurta,
  diasAte,
  faixaComGrau,
  linkWhatsapp,
  moeda,
  rotuloResultado,
  rotuloTipoEvento,
  type AreaAluno,
  type EventoResumo,
} from "../lib/artes-marciais";

// SIMULAÇÃO da área do cliente do Cliente Plus para o aluno do Artes
// Marciais: faixa e progresso, aulas, eventos, currículo e mural. No Cliente
// Plus o aluno entra logado; aqui ele é escolhido pelo endereço.
type Aba = "faixa" | "aulas" | "eventos" | "estudar" | "mais";

export const Route = createFileRoute("/aluno/$alunoId")({
  validateSearch: (s: Record<string, unknown>): { aba?: Aba } => ({
    aba: ["faixa", "aulas", "eventos", "estudar", "mais"].includes(s.aba as string) ? (s.aba as Aba) : undefined,
  }),
  loader: async ({ params }) => {
    const [area, aulas, beneficios] = await Promise.all([
      apiPublicoLutas.aluno(params.alunoId),
      apiAgenda.aulasDoAluno(params.alunoId),
      apiFinanceiro.beneficiosDoAluno(params.alunoId),
    ]);
    return { area, aulas, beneficios };
  },
  component: AreaDoAluno,
});

function AreaDoAluno() {
  const inicial = Route.useLoaderData();
  const { alunoId } = Route.useParams();
  const [area, setArea] = useState<AreaAluno>(inicial.area);
  const [aba, setAba] = useState<Aba>(Route.useSearch().aba ?? "faixa");
  const f = area.ficha;
  const principal = f.modalidades[0];

  return (
    <div className="min-h-full bg-bg">
      <div className="bg-red-950/60 px-4 py-1.5 text-center text-[11px] text-red-200">
        <FlaskConical className="mr-1 inline size-3" />
        Laboratório: simulação da área do aluno no Cliente Plus
      </div>
      <div className="mx-auto flex max-w-md flex-col pb-24">
        <header className="relative overflow-hidden rounded-b-3xl bg-gradient-to-br from-red-700 via-red-800 to-black px-5 pt-5 pb-6 text-white">
          <img src="/artes-marciais/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-15 grayscale" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-bold">Cliente Plus</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">{area.academia}</span>
            </div>
            <p className="mt-5 text-sm text-white/80">Oss,</p>
            <h1 className="font-display text-2xl font-bold">{f.nome.split(" ")[0]}!</h1>
            {principal && (
              <div className="mt-3 flex items-center gap-3">
                <FaixaVisual faixa={principal.faixa} grau={principal.grau} grausMaximos={principal.grausMaximos} largura={120} altura={17} />
                <span className="text-sm font-semibold">{faixaComGrau(principal.faixa, principal.grau)}</span>
              </div>
            )}
            <div className="mt-3 text-xs text-white/75">{f.aulasTotal} aulas treinadas</div>
          </div>
        </header>

        <main className="flex flex-col gap-4 px-4 pt-5">
          {aba === "faixa" && <MinhaFaixa area={area} />}
          {aba === "aulas" && <AbaAulasAluno alunoId={alunoId} aulas={inicial.aulas} />}
          {aba === "eventos" && <Eventos area={area} alunoId={alunoId} aoMudar={setArea} />}
          {aba === "estudar" && <Estudar area={area} />}
          {aba === "mais" && <Mais area={area} alunoId={alunoId} beneficios={inicial.beneficios} />}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 border-t border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {(
            [
              ["faixa", "Minha faixa", Award],
              ["aulas", "Aulas", CalendarDays],
              ["eventos", "Eventos", Trophy],
              ["estudar", "Estudar", BookOpen],
              ["mais", "Mais", LayoutGrid],
            ] as const
          ).map(([valor, rotulo, Icone]) => (
            <button
              key={valor}
              type="button"
              onClick={() => setAba(valor)}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${aba === valor ? "text-red-400" : "text-muted"}`}
            >
              <Icone className="size-5" />
              {rotulo}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

const caixa = "rounded-2xl border border-line bg-surface p-4";

function MinhaFaixa({ area }: { area: AreaAluno }) {
  const f = area.ficha;
  return (
    <>
      {area.avisos[0] && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-red-300">
            <Megaphone className="size-4" />
            Aviso
          </div>
          <div className="mt-1 font-semibold">{area.avisos[0].titulo}</div>
          <p className="mt-0.5 line-clamp-3 text-sm text-fg/80">{area.avisos[0].texto}</p>
        </div>
      )}
      {f.modalidades.length === 0 && (
        <div className={`${caixa} text-center text-sm text-muted`}>Você ainda não está em nenhuma modalidade. Fale com a recepção.</div>
      )}
      {f.modalidades.map((p) => (
        <section key={p.id} className={caixa}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-semibold">
              <PontoModalidade cor={p.modalidade.cor} />
              {p.modalidade.nome}
            </span>
            <span className="text-xs text-muted">desde {data(p.inicio)}</span>
          </div>
          <div className="mt-4 flex justify-center">
            <FaixaVisual faixa={p.faixa} grau={p.grau} grausMaximos={p.grausMaximos} largura={260} altura={32} />
          </div>
          <div className="mt-2 text-center font-display text-xl font-bold">{faixaComGrau(p.faixa, p.grau)}</div>
          <div className="text-center text-xs text-muted">
            desde {data(p.faixaDesde)} · {p.aulasNaFaixa} aulas nesta faixa
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs">
              <span className="font-medium">{textoProximo(p)}</span>
              <span className="text-muted">{p.percentual}%</span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-line">
              <div
                className={`h-full rounded-full ${p.situacao.startsWith("apto") ? "bg-emerald-500" : "bg-gradient-to-r from-red-700 to-red-500"}`}
                style={{ width: `${p.percentual}%` }}
              />
            </div>
          </div>
          {p.requisitos.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1 text-xs">
              {p.requisitos.map((r) => (
                <li key={r.rotulo} className="flex justify-between">
                  <span className="text-muted">{r.rotulo}</span>
                  <span className={r.ok ? "text-emerald-400" : ""}>
                    {r.atual} de {r.meta} {r.ok && "✓"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {p.situacao.startsWith("apto") && (
            <p className="mt-3 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
              Você cumpriu os requisitos! O professor avisa quando for a graduação. Oss!
            </p>
          )}
        </section>
      ))}

      <section className={caixa}>
        <h2 className="font-semibold">Conquistas</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {f.conquistas.map((c) => (
            <div key={c.id} className={`rounded-xl border px-2 py-2.5 text-center ${c.conquistada ? "border-amber-500/40 bg-amber-500/10" : "border-line opacity-50"}`}>
              <div className="text-lg">{c.conquistada ? "🏅" : <Lock className="mx-auto size-4 text-muted" />}</div>
              <div className="mt-1 text-[11px] leading-tight font-semibold">{c.titulo}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={caixa}>
        <h2 className="font-semibold">Minhas graduações</h2>
        <ol className="mt-3 flex flex-col gap-2.5">
          {f.historico.map((g) => (
            <li key={g.id} className="flex items-center gap-3">
              <FaixaVisual faixa={g.faixa} grau={g.grau} grausMaximos={g.grau > 0 ? Math.max(4, g.grau) : 0} largura={50} altura={10} />
              <div className="min-w-0 flex-1 text-sm">
                {g.tipo === "grau" ? `${g.grau}º grau` : g.tipo === "faixa" ? `Faixa ${g.faixa.nome}` : `Começou: ${g.faixa.nome}`}
                <span className="block text-[11px] text-muted">
                  {g.modalidade.nome} · {data(g.data)}
                </span>
              </div>
              {g.tipo !== "inicial" && (
                <a href={`/certificado/${g.codigo}`} className="text-xs text-red-400">
                  Certificado
                </a>
              )}
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

function Eventos({ area, alunoId, aoMudar }: { area: AreaAluno; alunoId: string; aoMudar: (a: AreaAluno) => void }) {
  const inscrito = new Set(area.ficha.eventos.filter((e) => e.status === "inscrito").map((e) => e.eventoId));
  const [escolhido, setEscolhido] = useState<EventoResumo | null>(null);
  const [peso, setPeso] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const minhas = area.ficha.eventos;

  async function inscrever() {
    if (!escolhido) return;
    setEnviando(true);
    setErro(null);
    try {
      aoMudar(await apiPublicoLutas.inscrever(alunoId, escolhido.id, "", peso ? Number(peso.replace(",", ".")) : null));
      setEscolhido(null);
      setPeso("");
    } catch (x) {
      setErro(x instanceof Error ? x.message : "Não deu certo");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <h2 className="font-display text-lg font-semibold">Inscrições abertas</h2>
      {area.eventos.length === 0 && <div className={`${caixa} text-sm text-muted`}>Nenhum evento com inscrição aberta agora.</div>}
      {area.eventos.map((e) => (
        <section key={e.id} className={caixa}>
          <div className="text-[11px] font-semibold tracking-wide text-red-400 uppercase">
            {rotuloTipoEvento[e.tipo]} · {dataCurta(e.data)} · em {diasAte(e.data)} dias
          </div>
          <div className="mt-0.5 font-semibold">{e.nome}</div>
          <div className="text-xs text-muted">{e.local}</div>
          {e.descricao && <p className="mt-2 text-sm text-fg/80">{e.descricao}</p>}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm font-semibold">{e.valorInscricao > 0 ? moeda(e.valorInscricao) : "Gratuito"}</span>
            {inscrito.has(e.id) ? (
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">Inscrito ✓</span>
            ) : (
              <button type="button" onClick={() => setEscolhido(e)} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                Quero participar
              </button>
            )}
          </div>
          {escolhido?.id === e.id && (
            <div className="mt-3 flex flex-col gap-2 rounded-xl border border-line p-3">
              {e.tipo === "campeonato" && (
                <label className="flex flex-col gap-1 text-xs">
                  Seu peso (kg), para a categoria
                  <input className="h-10 rounded-lg border border-line bg-bg px-3 text-sm" inputMode="decimal" value={peso} onChange={(x) => setPeso(x.target.value)} />
                </label>
              )}
              {e.valorInscricao > 0 && (
                <p className="text-xs text-muted">A inscrição de {moeda(e.valorInscricao)} fica nas suas cobranças para pagar.</p>
              )}
              {erro && <p className="text-xs text-red-400">{erro}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setEscolhido(null)} className="flex-1 rounded-lg border border-line py-2 text-sm">
                  Voltar
                </button>
                <button type="button" onClick={inscrever} disabled={enviando} className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white">
                  Confirmar
                </button>
              </div>
            </div>
          )}
        </section>
      ))}

      <h2 className="mt-2 font-display text-lg font-semibold">Minhas participações</h2>
      {minhas.length === 0 && <div className={`${caixa} text-sm text-muted`}>Nenhuma ainda.</div>}
      {minhas.map((i) => (
        <div key={i.id} className={`${caixa} flex items-center gap-3 !py-3`}>
          <span className="text-2xl">{i.resultado ? { ouro: "🥇", prata: "🥈", bronze: "🥉", participou: "🎽" }[i.resultado] : "📅"}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{i.evento}</div>
            <div className="text-xs text-muted">
              {data(i.data)}
              {i.categoria && ` · ${i.categoria}`}
            </div>
          </div>
          <span className="text-xs text-muted">
            {i.resultado ? rotuloResultado[i.resultado] : i.cobranca && i.cobranca.situacao !== "paga" ? "a pagar" : "inscrito"}
          </span>
        </div>
      ))}
    </>
  );
}

function Estudar({ area }: { area: AreaAluno }) {
  const f = area.ficha;
  const [abertos, setAbertos] = useState<Record<string, boolean>>({});
  return (
    <>
      <p className="text-sm text-muted">O que estudar para a próxima graduação em cada modalidade.</p>
      {f.modalidades.map((p) => {
        const alvo = p.proximo?.tipo === "faixa" ? p.proximo.faixa.id : p.faixa.id;
        const tecnicas = area.curriculo.filter((t) => t.modalidadeId === p.modalidade.id && (t.faixaId === p.faixa.id || t.faixaId === alvo));
        return (
          <section key={p.id} className={caixa}>
            <div className="flex items-center gap-2 font-semibold">
              <PontoModalidade cor={p.modalidade.cor} />
              {p.modalidade.nome} · faixa {p.faixa.nome}
            </div>
            {tecnicas.length === 0 ? (
              <p className="mt-2 text-sm text-muted">O professor ainda não cadastrou o currículo desta faixa.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {tecnicas.map((t) => (
                  <li key={t.id} className="rounded-xl border border-line px-3 py-2">
                    <button type="button" onClick={() => setAbertos({ ...abertos, [t.id]: !abertos[t.id] })} className="flex w-full items-center gap-2 text-left">
                      <div className="min-w-0 flex-1">
                        <div className="text-[10.5px] font-semibold text-red-400 uppercase">{t.categoria || "Técnica"}</div>
                        <div className="text-sm font-medium">{t.nome}</div>
                      </div>
                      <ChevronRight className={`size-4 text-muted transition ${abertos[t.id] ? "rotate-90" : ""}`} />
                    </button>
                    {abertos[t.id] && (
                      <div className="mt-1 text-xs text-fg/75">
                        {t.descricao || "Sem detalhes."}
                        {t.videoUrl && (
                          <a href={t.videoUrl} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 text-red-400">
                            <Video className="size-3.5" />
                            Ver vídeo
                          </a>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </>
  );
}

function Mais({
  area,
  alunoId,
  beneficios,
}: {
  area: AreaAluno;
  alunoId: string;
  beneficios: Parameters<typeof AbaBeneficiosAluno>[0]["dados"];
}) {
  const [secao, setSecao] = useState<"avisos" | "loja" | "ranking" | "beneficios">("avisos");
  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        {(
          [
            ["avisos", "Mural", Megaphone],
            ["loja", "Loja", Shirt],
            ["ranking", "Ranking", Trophy],
            ["beneficios", "Benefícios", Gift],
          ] as const
        ).map(([v, r, Icone]) => (
          <button
            key={v}
            type="button"
            onClick={() => setSecao(v)}
            className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-[11px] ${secao === v ? "border-red-500/60 bg-red-500/10" : "border-line"}`}
          >
            <Icone className="size-5" />
            {r}
          </button>
        ))}
      </div>

      {secao === "avisos" &&
        (area.avisos.length === 0 ? (
          <div className={`${caixa} text-sm text-muted`}>Nenhum aviso.</div>
        ) : (
          area.avisos.map((a) => (
            <section key={a.id} className={caixa}>
              <div className="text-xs text-muted">{data(a.quando)}</div>
              <div className="font-semibold">{a.titulo}</div>
              <p className="mt-1 text-sm whitespace-pre-line text-fg/80">{a.texto}</p>
            </section>
          ))
        ))}

      {secao === "loja" && (
        <div className="grid grid-cols-2 gap-3">
          {area.loja.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
              {p.foto ? <img src={p.foto} alt="" className="h-28 w-full object-cover" /> : <div className="grid h-28 place-items-center text-muted"><Shirt /></div>}
              <div className="p-3">
                <div className="line-clamp-2 text-sm font-medium">{p.nome}</div>
                <div className="mt-1 text-sm font-bold">{moeda(p.preco)}</div>
                <div className="text-[11px] text-muted">{p.tamanhos.filter((t) => t.estoque > 0).map((t) => t.tamanho).join(", ") || "Sem estoque"}</div>
                {area.whatsapp && (
                  <a
                    href={linkWhatsapp(area.whatsapp, `Olá! Quero comprar: ${p.nome}. Qual tamanho tem?`)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 flex items-center justify-center gap-1 rounded-lg bg-emerald-600 py-1.5 text-xs font-semibold text-white"
                  >
                    <MessageCircle className="size-3.5" />
                    Pedir
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {secao === "ranking" && (
        <section className={caixa}>
          <h2 className="font-semibold">Mais presentes no mês</h2>
          <ol className="mt-3 flex flex-col gap-2">
            {area.ranking.map((l, i) => (
              <li key={l.aluno.id} className={`flex items-center gap-3 rounded-lg px-2 py-1 ${l.aluno.id === alunoId ? "bg-red-500/10" : ""}`}>
                <span className="w-5 text-center text-sm font-bold text-amber-300">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm">{l.aluno.nome}</span>
                <span className="text-sm font-semibold">{l.aulas}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {secao === "beneficios" && <AbaBeneficiosAluno alunoId={alunoId} dados={beneficios} />}
    </>
  );
}
