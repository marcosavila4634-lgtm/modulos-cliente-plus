import { Link } from "@tanstack/react-router";
import { HandCoins } from "lucide-react";
import { fmt, prazo, rotuloForma, type Cobranca } from "../../lib/academia-alunos";
import { AvatarAluno, SeloCobranca } from "./Selos";

// Lista de mensalidades. Com "mostrarAluno", mostra o aluno de cada linha
// (tela de Faturamento); sem, é o histórico de um aluno (ficha do aluno).
export function TabelaCobrancas({
  cobrancas,
  mostrarAluno = false,
  aoReceber,
  vazio = "Nenhuma mensalidade por aqui.",
}: {
  cobrancas: Cobranca[];
  mostrarAluno?: boolean;
  aoReceber: (c: Cobranca) => void;
  vazio?: string;
}) {
  if (cobrancas.length === 0) {
    return <p className="py-10 text-center text-sm text-ac-muted">{vazio}</p>;
  }

  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-[13px]">
        <thead>
          <tr className="border-b border-ac-line text-[11.5px] tracking-wide text-ac-muted uppercase">
            {mostrarAluno && <th className="py-2.5 pr-3 pl-5 font-medium">Aluno</th>}
            <th className={`py-2.5 pr-3 font-medium ${mostrarAluno ? "" : "pl-5"}`}>Plano</th>
            <th className="py-2.5 pr-3 font-medium">Vencimento</th>
            <th className="py-2.5 pr-3 font-medium">Valor</th>
            <th className="py-2.5 pr-3 font-medium">Situação</th>
            <th className="py-2.5 pr-3 font-medium">Pagamento</th>
            <th className="py-2.5 pr-5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-ac-line/70">
          {cobrancas.map((c) => {
            const emAberto = c.status === "pendente" || c.status === "atrasada";
            return (
              <tr key={c.id} className="hover:bg-white/[0.02]">
                {mostrarAluno && (
                  <td className="py-2.5 pr-3 pl-5">
                    <Link
                      to="/academia/alunos/$id"
                      params={{ id: c.alunoId }}
                      className="flex items-center gap-2.5 font-medium text-slate-100 hover:text-violet-300"
                    >
                      <AvatarAluno nome={c.aluno} />
                      {c.aluno}
                    </Link>
                  </td>
                )}
                <td className={`py-2.5 pr-3 text-slate-300 ${mostrarAluno ? "" : "pl-5"}`}>{c.plano}</td>
                <td className="py-2.5 pr-3">
                  <div className="text-slate-200">{fmt.data(c.vencimento)}</div>
                  {emAberto && (
                    <div className={`text-[11px] ${c.status === "atrasada" ? "text-red-400" : "text-ac-muted"}`}>
                      {prazo(c.vencimento)}
                    </div>
                  )}
                </td>
                <td className="py-2.5 pr-3 font-semibold text-white">{fmt.moeda(c.valor)}</td>
                <td className="py-2.5 pr-3">
                  <SeloCobranca status={c.status} />
                </td>
                <td className="py-2.5 pr-3 text-slate-300">
                  {c.pagoEm ? (
                    <>
                      <div>{fmt.data(c.pagoEm)}</div>
                      <div className="text-[11px] text-ac-muted">
                        {c.formaPagamento ? rotuloForma[c.formaPagamento] : ""}
                      </div>
                    </>
                  ) : (
                    <span className="text-ac-muted">—</span>
                  )}
                </td>
                <td className="py-2.5 pr-5 text-right">
                  {emAberto && (
                    <button
                      type="button"
                      onClick={() => aoReceber(c)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                    >
                      <HandCoins className="size-3.5" />
                      Receber
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
