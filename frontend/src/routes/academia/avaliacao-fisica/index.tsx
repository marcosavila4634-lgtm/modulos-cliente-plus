import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CalendarCheck, CalendarClock, ChevronRight, ClipboardList, FilePlus, Search, UserX } from "lucide-react";
import { useMemo, useState } from "react";
import { SeletorAluno } from "../../../components/academia/SeletorAluno";
import { AvatarAluno } from "../../../components/academia/Selos";
import { Botao, Campo, classeInput, Modal } from "../../../components/academia/formulario";
import { Abas, CabecalhoPagina, Card, CardNumero, TituloCard, Vazio } from "../../../components/academia/ui";
import { apiAlunos, fmt } from "../../../lib/academia-alunos";
import {
  apiAvaliacoes,
  corImc,
  num,
  rotuloImc,
  rotuloSituacaoAvaliacao,
  type SituacaoAvaliacao,
} from "../../../lib/academia-avaliacoes";

type Filtro = "todos" | SituacaoAvaliacao;
type Busca = { filtro?: Filtro; nova?: boolean };

// Avaliações físicas: quem está com a reavaliação vencida, quem nunca fez e as
// avaliações mais recentes.
export const Route = createFileRoute("/academia/avaliacao-fisica/")({
  validateSearch: (s: Record<string, unknown>): Busca => ({
    filtro: ["todos", "sem_avaliacao", "pendente", "em_dia"].includes(s.filtro as string) ? (s.filtro as Filtro) : undefined,
    nova: s.nova === true || s.nova === "true" ? true : undefined,
  }),
  loader: async () => {
    const [painel, alunos] = await Promise.all([apiAvaliacoes.painel(), apiAlunos.listar()]);
    return { painel, alunos: alunos.alunos };
  },
  component: PaginaAvaliacoes,
});

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const coresSituacao: Record<SituacaoAvaliacao, string> = {
  sem_avaliacao: "bg-slate-500/20 text-slate-300",
  pendente: "bg-amber-500/15 text-amber-300",
  em_dia: "bg-emerald-500/15 text-emerald-300",
};

function PaginaAvaliacoes() {
  const { painel, alunos } = Route.useLoaderData();
  const inicial = Route.useSearch();
  const navigate = useNavigate();
  const { contagem } = painel;
  const [filtro, setFiltro] = useState<Filtro>(inicial.filtro ?? (contagem.pendentes > 0 ? "pendente" : "todos"));
  const [busca, setBusca] = useState("");
  const [nova, setNova] = useState(!!inicial.nova);

  const lista = useMemo(() => {
    const termo = normalizar(busca.trim());
    return painel.alunos.filter(
      (a) => (filtro === "todos" || a.situacao === filtro) && (!termo || normalizar(a.nome).includes(termo)),
    );
  }, [painel, filtro, busca]);

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina
        titulo="Avaliação física"
        descricao={`Peso, medidas e % de gordura dos alunos. Reavaliação a cada ${painel.reavaliacaoDias} dias.`}
      >
        <Botao variante="primario" onClick={() => setNova(true)}>
          <FilePlus className="size-4" />
          Nova avaliação
        </Botao>
      </CabecalhoPagina>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <CardNumero icone={ClipboardList} cor="bg-violet-500/20 text-violet-300" rotulo="Avaliações no mês">
          <span className="font-poppins text-[26px] font-bold text-white">{contagem.noMes}</span>
        </CardNumero>
        <CardNumero icone={CalendarClock} cor="bg-amber-500/15 text-amber-300" rotulo="Reavaliação pendente">
          <span className="font-poppins text-[26px] font-bold text-white">{contagem.pendentes}</span>
          <span className="text-xs text-ac-muted">passaram de {painel.reavaliacaoDias} dias</span>
        </CardNumero>
        <CardNumero icone={UserX} cor="bg-slate-500/20 text-slate-300" rotulo="Nunca avaliados">
          <span className="font-poppins text-[26px] font-bold text-white">{contagem.semAvaliacao}</span>
          <span className="text-xs text-ac-muted">alunos ativos</span>
        </CardNumero>
        <CardNumero icone={CalendarCheck} cor="bg-emerald-500/15 text-emerald-300" rotulo="Em dia">
          <span className="font-poppins text-[26px] font-bold text-white">{contagem.emDia}</span>
          <span className="text-xs text-ac-muted">de {contagem.todos} alunos ativos</span>
        </CardNumero>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] [&>*]:min-w-0">
        <Card className="!p-0">
          <div className="flex flex-wrap items-center gap-3 border-b border-ac-line p-4">
            <Abas
              abas={[
                { valor: "pendente", rotulo: "Pendentes", quantidade: contagem.pendentes },
                { valor: "sem_avaliacao", rotulo: "Sem avaliação", quantidade: contagem.semAvaliacao },
                { valor: "em_dia", rotulo: "Em dia", quantidade: contagem.emDia },
                { valor: "todos", rotulo: "Todos", quantidade: contagem.todos },
              ]}
              valor={filtro}
              aoMudar={setFiltro}
            />
            <label className="relative ml-auto w-full sm:w-60">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ac-muted" />
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar aluno"
                className={`${classeInput} pl-9`}
              />
            </label>
          </div>
          {lista.length === 0 ? (
            <Vazio icone={ClipboardList}>Nenhum aluno por aqui.</Vazio>
          ) : (
            <div className="max-h-[640px] overflow-auto">
              <table className="w-full min-w-[640px] text-left text-[13px]">
                <thead className="sticky top-0 bg-ac-card">
                  <tr className="border-b border-ac-line text-[11.5px] tracking-wide text-ac-muted uppercase">
                    <th className="py-2.5 pr-3 pl-5 font-medium">Aluno</th>
                    <th className="py-2.5 pr-3 font-medium">Última</th>
                    <th className="py-2.5 pr-3 font-medium">Próxima</th>
                    <th className="py-2.5 pr-3 font-medium">Peso</th>
                    <th className="py-2.5 pr-3 font-medium">% gordura</th>
                    <th className="py-2.5 pr-3 font-medium">Situação</th>
                    <th className="py-2.5 pr-5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-ac-line/70">
                  {lista.map((a) => (
                    <tr
                      key={a.alunoId}
                      onClick={() => navigate({ to: "/academia/avaliacao-fisica/$alunoId", params: { alunoId: a.alunoId } })}
                      className="cursor-pointer hover:bg-white/[0.03]"
                    >
                      <td className="py-2.5 pr-3 pl-5">
                        <div className="flex items-center gap-2.5">
                          <AvatarAluno nome={a.nome} />
                          <span className="font-medium text-slate-100">{a.nome}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 text-slate-300">{fmt.data(a.ultima)}</td>
                      <td className={`py-2.5 pr-3 ${a.situacao === "pendente" ? "text-amber-300" : "text-slate-300"}`}>
                        {fmt.data(a.proxima)}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-200">{a.peso !== null ? `${num(a.peso)} kg` : "—"}</td>
                      <td className="py-2.5 pr-3 text-slate-200">{a.gorduraPct !== null ? `${num(a.gorduraPct)}%` : "—"}</td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold whitespace-nowrap ${coresSituacao[a.situacao]}`}
                        >
                          {rotuloSituacaoAvaliacao[a.situacao]}
                        </span>
                      </td>
                      <td className="py-2.5 pr-5 text-right">
                        {a.situacao !== "em_dia" ? (
                          <Link
                            to="/academia/avaliacao-fisica/nova"
                            search={{ aluno: a.alunoId }}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded-lg bg-violet-600/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500"
                          >
                            Avaliar
                          </Link>
                        ) : (
                          <ChevronRight className="ml-auto size-4 text-ac-muted" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="h-fit">
          <TituloCard icone={ClipboardList} cor="text-violet-400">
            Avaliações recentes
          </TituloCard>
          <ul className="mt-3 divide-y divide-ac-line">
            {painel.recentes.map((a) => (
              <li key={a.id}>
                <Link
                  to="/academia/avaliacao-fisica/$alunoId"
                  params={{ alunoId: a.aluno.id }}
                  className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-white/[0.03]"
                >
                  <AvatarAluno nome={a.aluno.nome} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-white">{a.aluno.nome}</div>
                    <div className="truncate text-[11.5px] text-ac-muted">
                      {num(a.peso)} kg · IMC {num(a.imc)}{" "}
                      <span className={corImc[a.classificacaoImc]}>({rotuloImc[a.classificacaoImc].toLowerCase()})</span>
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] text-ac-muted">{fmt.data(a.data).slice(0, 5)}</span>
                </Link>
              </li>
            ))}
          </ul>
          {painel.recentes.length === 0 && <p className="mt-4 text-sm text-ac-muted">Nenhuma avaliação ainda.</p>}
        </Card>
      </div>

      {nova && (
        <ModalEscolherAluno
          alunos={alunos}
          aoFechar={() => {
            setNova(false);
            if (inicial.nova) navigate({ to: "/academia/avaliacao-fisica", search: {}, replace: true });
          }}
          aoEscolher={(id) => navigate({ to: "/academia/avaliacao-fisica/nova", search: { aluno: id } })}
        />
      )}
    </div>
  );
}

function ModalEscolherAluno({
  alunos,
  aoEscolher,
  aoFechar,
}: {
  alunos: Parameters<typeof SeletorAluno>[0]["alunos"];
  aoEscolher: (id: string) => void;
  aoFechar: () => void;
}) {
  const [id, setId] = useState<string | null>(null);
  return (
    <Modal titulo="Nova avaliação física" aoFechar={aoFechar}>
      <div className="flex flex-col gap-4">
        <Campo rotulo="Aluno">
          <SeletorAluno alunos={alunos} valor={id} aoMudar={setId} autoFocus />
        </Campo>
        <div className="flex justify-end gap-3">
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="primario" disabled={!id} onClick={() => id && aoEscolher(id)}>
            Continuar
          </Botao>
        </div>
      </div>
    </Modal>
  );
}
