import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Search, UserPlus, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AvatarAluno, SeloSituacao } from "../../../components/academia/Selos";
import { ModalAluno } from "../../../components/academia/ModaisAluno";
import { Botao, classeInput } from "../../../components/academia/formulario";
import { Card } from "../../../components/academia/ui";
import { apiAlunos, fmt, prazo, type Situacao } from "../../../lib/academia-alunos";

type Filtro = "todos" | Situacao;

type Busca = { busca?: string; filtro?: Filtro; novo?: boolean };

const filtros: { filtro: Filtro; rotulo: string; chave: "todos" | "ativo" | "emAtraso" | "semMatricula" }[] = [
  { filtro: "todos", rotulo: "Todos", chave: "todos" },
  { filtro: "ativo", rotulo: "Ativos", chave: "ativo" },
  { filtro: "em_atraso", rotulo: "Em atraso", chave: "emAtraso" },
  { filtro: "sem_matricula", rotulo: "Sem matrícula", chave: "semMatricula" },
];

// Alunos da academia = clientes do lojista no Cliente Plus.
export const Route = createFileRoute("/academia/alunos/")({
  validateSearch: (s: Record<string, unknown>): Busca => ({
    busca: typeof s.busca === "string" && s.busca ? s.busca : undefined,
    filtro: filtros.some((f) => f.filtro === s.filtro) ? (s.filtro as Filtro) : undefined,
    novo: s.novo === true || s.novo === "true" ? true : undefined,
  }),
  loader: async () => {
    const [lista, planos] = await Promise.all([apiAlunos.listar(), apiAlunos.planos()]);
    return { lista, planos };
  },
  component: PaginaAlunos,
});

// Compara sem acentos e sem maiúsculas: "joao" encontra "João".
const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function PaginaAlunos() {
  const { lista, planos } = Route.useLoaderData();
  const inicial = Route.useSearch();
  const navigate = useNavigate();

  const [busca, setBusca] = useState(inicial.busca ?? "");
  const [filtro, setFiltro] = useState<Filtro>(inicial.filtro ?? "todos");
  const [novoAberto, setNovoAberto] = useState(!!inicial.novo);

  // Busca feita pela barra do topo com esta tela já aberta.
  useEffect(() => {
    if (inicial.busca !== undefined) setBusca(inicial.busca);
  }, [inicial.busca]);

  const alunos = useMemo(() => {
    const termo = normalizar(busca.trim());
    const digitos = busca.replace(/\D/g, "");
    return lista.alunos.filter(
      (a) =>
        (filtro === "todos" || a.situacao === filtro) &&
        (!termo ||
          normalizar(a.nome).includes(termo) ||
          normalizar(a.email ?? "").includes(termo) ||
          (digitos.length >= 3 && (a.telefone ?? "").includes(digitos))),
    );
  }, [lista, busca, filtro]);

  const fecharNovo = () => {
    setNovoAberto(false);
    if (inicial.novo) navigate({ to: "/academia/alunos", search: {}, replace: true });
  };

  return (
    <div className="flex flex-col gap-5 py-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-poppins text-[28px] font-bold text-white">Alunos</h1>
          <p className="mt-1 text-sm text-ac-muted">
            {lista.contagem.todos} alunos cadastrados · {lista.contagem.ativo} ativos
          </p>
        </div>
        <Botao variante="primario" onClick={() => setNovoAberto(true)}>
          <UserPlus className="size-4" />
          Novo aluno
        </Botao>
      </div>

      <Card className="!p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-ac-line p-4">
          <div className="flex flex-wrap gap-1.5">
            {filtros.map((f) => (
              <button
                key={f.filtro}
                type="button"
                onClick={() => setFiltro(f.filtro)}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
                  filtro === f.filtro
                    ? "bg-violet-600/25 text-white ring-1 ring-violet-500/60"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                {f.rotulo}
                <span className="ml-1.5 text-xs text-ac-muted">{lista.contagem[f.chave]}</span>
              </button>
            ))}
          </div>
          <label className="relative ml-auto w-full sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ac-muted" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, e-mail ou telefone"
              className={`${classeInput} pl-9`}
            />
          </label>
        </div>

        {alunos.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <Users className="mx-auto size-8 text-ac-muted" />
            <p className="mt-2 text-sm text-ac-muted">Nenhum aluno encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-ac-line text-[11.5px] tracking-wide text-ac-muted uppercase">
                  <th className="py-2.5 pr-3 pl-5 font-medium">Aluno</th>
                  <th className="py-2.5 pr-3 font-medium">Telefone</th>
                  <th className="py-2.5 pr-3 font-medium">Plano</th>
                  <th className="py-2.5 pr-3 font-medium">Próximo vencimento</th>
                  <th className="py-2.5 pr-3 font-medium">Situação</th>
                  <th className="py-2.5 pr-5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ac-line/70">
                {alunos.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => navigate({ to: "/academia/alunos/$id", params: { id: a.id } })}
                    className="cursor-pointer hover:bg-white/[0.03]"
                  >
                    <td className="py-3 pr-3 pl-5">
                      <div className="flex items-center gap-3">
                        <AvatarAluno nome={a.nome} />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-slate-100">{a.nome}</div>
                          <div className="truncate text-[11.5px] text-ac-muted">{a.email ?? "sem e-mail"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-3 whitespace-nowrap text-slate-300">{fmt.telefone(a.telefone)}</td>
                    <td className="py-3 pr-3 text-slate-300">{a.plano ?? <span className="text-ac-muted">—</span>}</td>
                    <td className="py-3 pr-3">
                      {a.proximoVencimento ? (
                        <>
                          <div className="text-slate-200">{fmt.data(a.proximoVencimento)}</div>
                          <div
                            className={`text-[11px] ${a.situacao === "em_atraso" ? "text-red-400" : "text-ac-muted"}`}
                          >
                            {prazo(a.proximoVencimento)}
                          </div>
                        </>
                      ) : (
                        <span className="text-ac-muted">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      <SeloSituacao situacao={a.situacao} />
                    </td>
                    <td className="py-3 pr-5 text-right">
                      <ChevronRight className="ml-auto size-4 text-ac-muted" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {novoAberto && (
        <ModalAluno
          planos={planos}
          aoFechar={fecharNovo}
          aoSalvar={(aluno) => navigate({ to: "/academia/alunos/$id", params: { id: aluno.id } })}
        />
      )}
    </div>
  );
}
