import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { CircleCheck, Clock, LogIn, Radio, Search, ShieldX, UsersRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ModalResultadoAcesso, SeloAcesso } from "../../components/academia/ResultadoAcesso";
import { AvatarAluno, SeloSituacao } from "../../components/academia/Selos";
import { classeInput } from "../../components/academia/formulario";
import { Card, CardNumero, TituloCard, Variacao } from "../../components/academia/ui";
import { apiAcesso, hora, rotuloMeio, rotuloMotivo, type ResultadoAcesso } from "../../lib/academia-acesso";
import { apiAlunos, fmt, hojeIso } from "../../lib/academia-alunos";

type Busca = { data?: string };

// Check-in feito pela recepção. As entradas pela catraca e pelos leitores
// aparecem na mesma lista.
export const Route = createFileRoute("/academia/check-in")({
  validateSearch: (s: Record<string, unknown>): Busca => ({
    data: typeof s.data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.data) ? s.data : undefined,
  }),
  loaderDeps: ({ search }) => ({ data: search.data }),
  loader: async ({ deps }) => {
    const [painel, alunos] = await Promise.all([apiAcesso.checkins(deps.data), apiAlunos.listar()]);
    return { painel, alunos: alunos.alunos };
  },
  component: PaginaCheckin,
});

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function PaginaCheckin() {
  const { painel, alunos } = Route.useLoaderData();
  const router = useRouter();
  const navigate = useNavigate();
  const [busca, setBusca] = useState("");
  const [registrando, setRegistrando] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoAcesso | null>(null);
  const campo = useRef<HTMLInputElement>(null);
  const { resumo } = painel;

  // Atualiza sozinho a cada 30 segundos (entradas pela catraca).
  useEffect(() => {
    if (!painel.ehHoje) return;
    const t = setInterval(() => router.invalidate(), 30_000);
    return () => clearInterval(t);
  }, [painel.ehHoje, router]);

  const encontrados = useMemo(() => {
    const termo = normalizar(busca.trim());
    const digitos = busca.replace(/\D/g, "");
    if (!termo) return [];
    return alunos
      .filter(
        (a) =>
          normalizar(a.nome).includes(termo) || (digitos.length >= 4 && (a.telefone ?? "").includes(digitos)),
      )
      .slice(0, 8);
  }, [alunos, busca]);

  async function registrar(alunoId: string) {
    setRegistrando(alunoId);
    try {
      setResultado(await apiAcesso.registrarCheckin(alunoId));
    } catch (e) {
      setResultado({
        resultado: "bloqueado",
        motivo: null,
        mensagem: e instanceof Error ? e.message : "Não foi possível registrar",
        alunoId,
        aluno: alunos.find((a) => a.id === alunoId)?.nome ?? "",
        plano: null,
        acesso: null,
      });
    }
    setRegistrando(null);
  }

  async function fecharResultado() {
    const r = resultado;
    setResultado(null);
    setBusca("");
    campo.current?.focus();
    if (r?.resultado === "liberado") await router.invalidate();
  }

  const dataTexto = painel.ehHoje ? "hoje" : fmt.data(painel.data);

  return (
    <div className="flex flex-col gap-5 py-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-poppins text-[28px] font-bold text-white">Check-in</h1>
          <p className="mt-1 text-sm text-ac-muted">
            Registre a entrada dos alunos. Quem está em atraso ou sem matrícula é avisado na hora.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={painel.data}
            max={hojeIso()}
            onChange={(e) =>
              navigate({ to: "/academia/check-in", search: e.target.value === hojeIso() ? {} : { data: e.target.value } })
            }
            className={`${classeInput} w-44`}
          />
          {!painel.ehHoje && (
            <Link
              to="/academia/check-in"
              className="inline-flex h-10 items-center rounded-xl border border-ac-line bg-ac-card-2 px-4 text-sm font-semibold text-slate-200 hover:text-white"
            >
              Hoje
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <CardNumero icone={Radio} cor="bg-emerald-500/15 text-emerald-300" rotulo={`Check-ins ${dataTexto}`}>
          <span className="font-poppins text-[26px] font-bold text-white">{resumo.hoje}</span>
          <Variacao valor={resumo.variacao} />
          <div className="w-full text-[11.5px] text-ac-muted">vs. mesmo dia da semana passada</div>
        </CardNumero>
        <CardNumero icone={UsersRound} cor="bg-violet-500/20 text-violet-300" rotulo="Na academia agora">
          <span className="font-poppins text-[26px] font-bold text-white">{painel.ehHoje ? resumo.agora : "—"}</span>
          <div className="w-full text-[11.5px] text-ac-muted">entraram nos últimos 90 min</div>
        </CardNumero>
        <CardNumero icone={ShieldX} cor="bg-red-500/15 text-red-300" rotulo="Barrados na catraca">
          <span className="font-poppins text-[26px] font-bold text-white">{resumo.bloqueadosHoje}</span>
          <div className="w-full text-[11.5px] text-ac-muted">
            {resumo.liberacoesManuaisHoje} liberados pela recepção
          </div>
        </CardNumero>
        <CardNumero icone={Clock} cor="bg-sky-500/15 text-sky-300" rotulo="Último check-in">
          <span className="font-poppins text-[22px] font-bold text-white">{resumo.ultimo ?? "—"}</span>
        </CardNumero>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] [&>*]:min-w-0">
        <Card className="h-fit">
          <TituloCard icone={LogIn} cor="text-emerald-400">
            Registrar entrada
          </TituloCard>
          <label className="relative mt-4 block">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ac-muted" />
            <input
              ref={campo}
              autoFocus
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && encontrados[0]) registrar(encontrados[0].id);
              }}
              placeholder="Nome ou telefone do aluno"
              className={`${classeInput} h-12 pl-9 text-base`}
            />
          </label>
          <p className="mt-2 text-[11.5px] text-ac-muted">Digite e aperte Enter para registrar o primeiro da lista.</p>
          <ul className="mt-3 flex flex-col gap-1.5">
            {encontrados.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  disabled={registrando !== null}
                  onClick={() => registrar(a.id)}
                  className="flex w-full items-center gap-3 rounded-xl border border-ac-line bg-ac-bg/40 px-3 py-2 text-left transition hover:border-emerald-500/50 hover:bg-emerald-500/5 disabled:opacity-60"
                >
                  <AvatarAluno nome={a.nome} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white">{a.nome}</div>
                    <div className="truncate text-[11.5px] text-ac-muted">{a.plano ?? "Sem matrícula"}</div>
                  </div>
                  <SeloSituacao situacao={a.situacao} />
                </button>
              </li>
            ))}
            {busca.trim() && encontrados.length === 0 && (
              <li className="py-4 text-center text-sm text-ac-muted">Nenhum aluno encontrado.</li>
            )}
          </ul>
        </Card>

        <Card className="!p-0">
          <div className="p-5 pb-3">
            <TituloCard icone={CircleCheck} cor="text-violet-400">
              Entradas de {dataTexto}
            </TituloCard>
          </div>
          {painel.acessos.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-ac-muted">Nenhuma entrada registrada.</p>
          ) : (
            <div className="max-h-[560px] overflow-auto">
              <table className="w-full min-w-[560px] text-left text-[13px]">
                <thead className="sticky top-0 bg-ac-card">
                  <tr className="border-b border-ac-line text-[11.5px] tracking-wide text-ac-muted uppercase">
                    <th className="py-2.5 pr-3 pl-5 font-medium">Hora</th>
                    <th className="py-2.5 pr-3 font-medium">Aluno</th>
                    <th className="py-2.5 pr-3 font-medium">Por onde</th>
                    <th className="py-2.5 pr-5 font-medium">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ac-line/70">
                  {painel.acessos.map((a) => (
                    <tr key={a.id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 pr-3 pl-5 font-semibold text-white">{hora(a.momento)}</td>
                      <td className="py-2.5 pr-3">
                        <Link
                          to="/academia/alunos/$id"
                          params={{ id: a.alunoId }}
                          className="flex items-center gap-2.5 font-medium text-slate-100 hover:text-violet-300"
                        >
                          <AvatarAluno nome={a.aluno} />
                          <span className="truncate">{a.aluno}</span>
                        </Link>
                      </td>
                      <td className="py-2.5 pr-3 text-slate-300">{a.dispositivo ?? rotuloMeio[a.meio]}</td>
                      <td className="py-2.5 pr-5">
                        <SeloAcesso resultado={a.resultado} manual={a.liberadoManual} />
                        {(a.resultado === "bloqueado" || a.liberadoManual) && a.motivo && (
                          <div className="mt-0.5 text-[11px] text-ac-muted">
                            {rotuloMotivo[a.motivo]}
                            {a.observacao && ` · ${a.observacao}`}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {resultado && (
        <ModalResultadoAcesso
          resultado={resultado}
          podeLiberar
          aoFechar={fecharResultado}
          aoLiberar={async (r) => {
            setResultado(r);
            await router.invalidate();
          }}
        />
      )}
    </div>
  );
}
