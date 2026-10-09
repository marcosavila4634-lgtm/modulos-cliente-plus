import { Link } from "@tanstack/react-router";
import { Award, Baby, ExternalLink, IdCard, Lock, Medal, Plus, Swords, Trophy, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { apiTreinos } from "../../lib/academia-treinos";
import {
  apiLutas,
  data,
  faixaComGrau,
  rotuloResultado,
  rotuloSituacao,
  type FichaLutas,
  type ModalidadeJson,
  type Progresso,
} from "../../lib/artes-marciais";
import { Botao, MensagemErro, mensagemDe } from "../academia/formulario";
import { Card, TituloCard } from "../academia/ui";
import { FaixaVisual, PontoModalidade } from "./Faixa";
import { BarraProgresso, ModalGraduar, ModalNovaModalidade } from "./ModaisGraduacao";

const medalha = { ouro: "🥇", prata: "🥈", bronze: "🥉", participou: "🎽" } as const;

// Parte de luta da ficha do aluno (Artes Marciais): faixa em cada modalidade,
// progresso, histórico de graduações, campeonatos, filiação, responsável e
// conquistas.
export function FichaLutasAluno({ alunoId }: { alunoId: string }) {
  const [ficha, setFicha] = useState<FichaLutas | null>(null);
  const [modalidades, setModalidades] = useState<ModalidadeJson[]>([]);
  const [professores, setProfessores] = useState<{ id: string; nome: string }[]>([]);
  const [graduando, setGraduando] = useState<Progresso | null>(null);
  const [adicionando, setAdicionando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(() => {
    apiLutas.ficha(alunoId).then(setFicha).catch((x) => setErro(mensagemDe(x)));
  }, [alunoId]);

  useEffect(() => {
    carregar();
    apiLutas.modalidades().then(setModalidades);
    apiTreinos.profissionais().then((l) => setProfessores(l.filter((p) => p.ativo)));
  }, [carregar]);

  if (!ficha) {
    return (
      <Card>
        <MensagemErro texto={erro} />
        {!erro && <p className="text-sm text-ac-muted">Carregando faixas...</p>}
      </Card>
    );
  }

  const medalhas = ficha.eventos.filter((e) => e.resultado && e.resultado !== "participou");
  return (
    <>
      <Card>
        <TituloCard
          icone={Swords}
          cor="text-red-500"
          acao={
            <div className="flex flex-wrap gap-2">
              <a
                href={`/aluno/${alunoId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1.5 px-1 text-sm text-red-400 hover:text-red-300"
              >
                <ExternalLink className="size-4" />
                Ver como o aluno vê
              </a>
              <Botao className="!h-9" onClick={() => setAdicionando(true)}>
                <Plus className="size-4" />
                Modalidade
              </Botao>
            </div>
          }
        >
          Modalidades e faixas
          <span className="ml-2 text-xs font-normal text-ac-muted">{ficha.aulasTotal} aulas no total</span>
        </TituloCard>
        <MensagemErro texto={erro} />
        {ficha.modalidades.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-ac-line p-4 text-sm text-slate-300">
            O aluno ainda não está em nenhuma modalidade. Toque em "+ Modalidade" e escolha a faixa que ele tem.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {ficha.modalidades.map((p) => (
              <div key={p.id} className="rounded-2xl border border-ac-line bg-ac-bg/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-semibold text-white">
                    <PontoModalidade cor={p.modalidade.cor} />
                    {p.modalidade.nome}
                  </span>
                  <span className="text-[11px] text-ac-muted">desde {data(p.inicio)}</span>
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <FaixaVisual faixa={p.faixa} grau={p.grau} grausMaximos={p.grausMaximos} largura={150} altura={20} />
                  <div className="leading-tight">
                    <div className="font-poppins text-lg font-bold text-white">{p.faixa.nome}</div>
                    <div className="text-xs text-ac-muted">
                      {p.grau > 0 ? `${p.grau}º grau · ` : ""}desde {data(p.faixaDesde)}
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <BarraProgresso p={p} />
                </div>
                {p.requisitos.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px]">
                    {p.requisitos.map((r) => (
                      <li key={r.rotulo} className={r.ok ? "text-emerald-300" : "text-slate-400"}>
                        {r.rotulo}: {r.atual}/{r.meta}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-[11.5px] font-semibold text-amber-300">
                    {p.situacao.startsWith("apto") ? rotuloSituacao[p.situacao] : ""}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm(`Tirar ${ficha.nome} de ${p.modalidade.nome}? O histórico fica guardado.`)) return;
                        try {
                          setFicha(await apiLutas.sairDaModalidade(alunoId, p.id));
                        } catch (x) {
                          setErro(mensagemDe(x));
                        }
                      }}
                      className="rounded-lg px-2 py-1.5 text-xs text-ac-muted hover:text-red-300"
                    >
                      <X className="inline size-3.5" /> Sair
                    </button>
                    <button
                      type="button"
                      onClick={() => setGraduando(p)}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500"
                    >
                      Graduar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] [&>*]:min-w-0">
        <Card>
          <TituloCard icone={Award} cor="text-amber-300">
            Histórico de graduações
          </TituloCard>
          {ficha.historico.length === 0 ? (
            <p className="mt-4 text-sm text-ac-muted">Nenhuma graduação ainda.</p>
          ) : (
            <ol className="mt-4 flex flex-col gap-2.5 border-l border-ac-line pl-4">
              {ficha.historico.map((g) => (
                <li key={g.id} className="relative flex flex-wrap items-center gap-3">
                  <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-ac-card bg-red-500" />
                  <FaixaVisual faixa={g.faixa} grau={g.grau} grausMaximos={g.grau > 0 ? Math.max(4, g.grau) : 0} largura={52} altura={10} />
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="text-sm text-white">
                      {g.tipo === "inicial" ? "Início: " : g.tipo === "grau" ? "Grau: " : "Faixa: "}
                      {faixaComGrau(g.faixa, g.grau)}
                      <span className="ml-1.5 text-xs text-ac-muted">{g.modalidade.nome}</span>
                    </div>
                    <div className="text-[11px] text-ac-muted">
                      {data(g.data)}
                      {g.professor && ` · Prof. ${g.professor}`}
                      {g.exame && ` · ${g.exame}`}
                    </div>
                  </div>
                  {g.tipo !== "inicial" && (
                    <a href={`/certificado/${g.codigo}`} target="_blank" rel="noreferrer" className="text-xs text-red-400 hover:text-red-300">
                      Certificado
                    </a>
                  )}
                </li>
              ))}
            </ol>
          )}
        </Card>

        <div className="flex flex-col gap-5">
          <Card>
            <TituloCard icone={Trophy} cor="text-amber-300">
              Campeonatos e eventos
            </TituloCard>
            {ficha.eventos.length === 0 ? (
              <p className="mt-3 text-sm text-ac-muted">Nenhuma inscrição.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {ficha.eventos.slice(0, 6).map((e) => (
                  <li key={e.id} className="flex items-center gap-3 text-sm">
                    <span className="w-6 text-center text-base">{e.resultado ? medalha[e.resultado] : "📅"}</span>
                    <Link to="/academia/eventos/$id" params={{ id: e.eventoId }} className="min-w-0 flex-1 truncate text-white hover:underline">
                      {e.evento}
                    </Link>
                    <span className="text-xs text-ac-muted">
                      {e.resultado ? rotuloResultado[e.resultado] : data(e.data)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {medalhas.length > 0 && (
              <div className="mt-3 flex items-center gap-2 border-t border-ac-line pt-3 text-xs text-slate-300">
                <Medal className="size-4 text-amber-300" />
                {medalhas.length} {medalhas.length === 1 ? "medalha" : "medalhas"}
              </div>
            )}
          </Card>

          <Card>
            <TituloCard icone={IdCard} cor="text-sky-300">
              Filiação e responsável
            </TituloCard>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              {ficha.filiacoes.length === 0 ? (
                <span className="text-ac-muted">Sem filiação a federação.</span>
              ) : (
                ficha.filiacoes.map((f) => (
                  <div key={f.id} className="flex justify-between gap-3">
                    <span className="text-white">
                      {f.entidade} {f.numero && <span className="text-ac-muted">nº {f.numero}</span>}
                    </span>
                    <span className={f.situacao === "valida" ? "text-emerald-300" : f.situacao === "vencida" ? "text-red-300" : "text-amber-300"}>
                      até {data(f.validade)}
                    </span>
                  </div>
                ))
              )}
              {ficha.idade != null && ficha.idade < 18 && (
                <div className="mt-1 flex items-center gap-2 border-t border-ac-line pt-2">
                  <Baby className="size-4 text-pink-300" />
                  {ficha.responsavel ? (
                    <span className="text-slate-200">
                      {ficha.responsavel.nome} <span className="text-ac-muted">({ficha.responsavel.parentesco})</span>
                    </span>
                  ) : (
                    <Link to="/academia/responsaveis" className="text-amber-300 hover:underline">
                      Sem responsável: cadastrar
                    </Link>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <TituloCard icone={Medal} cor="text-amber-300">
          Conquistas
        </TituloCard>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {ficha.conquistas.map((c) => (
            <div
              key={c.id}
              title={c.descricao}
              className={`rounded-xl border px-3 py-2.5 text-center ${
                c.conquistada ? "border-amber-500/40 bg-amber-500/10" : "border-ac-line opacity-45"
              }`}
            >
              <div className="text-xl">{c.conquistada ? "🏅" : <Lock className="mx-auto size-5 text-ac-muted" />}</div>
              <div className="mt-1 text-[12px] font-semibold text-white">{c.titulo}</div>
              <div className="text-[10.5px] text-ac-muted">{c.quando ? data(c.quando) : c.descricao}</div>
            </div>
          ))}
        </div>
      </Card>

      {graduando && (
        <ModalGraduar
          progresso={graduando}
          modalidades={modalidades}
          professores={professores}
          aoFechar={() => setGraduando(null)}
          aoGraduar={carregar}
        />
      )}
      {adicionando && (
        <ModalNovaModalidade
          alunoId={alunoId}
          modalidades={modalidades}
          jaTreina={ficha.modalidades.map((p) => p.modalidade.id)}
          aoFechar={() => setAdicionando(false)}
          aoSalvar={() => {
            setAdicionando(false);
            carregar();
          }}
        />
      )}
    </>
  );
}
