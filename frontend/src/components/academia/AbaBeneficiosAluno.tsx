import { useRouter } from "@tanstack/react-router";
import { Check, Copy, Gift, Lock } from "lucide-react";
import { useState } from "react";
import { apiFinanceiro, regraBeneficio, type BeneficiosDoAluno } from "../../lib/academia-financeiro";

// Área do cliente (simulada): benefícios do aluno, com o progresso dos que
// ainda faltam e o botão de resgatar.
export function AbaBeneficiosAluno({ alunoId, dados }: { alunoId: string; dados: BeneficiosDoAluno }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  async function resgatar(beneficioId: string) {
    setOcupado(beneficioId);
    setErro(null);
    try {
      await apiFinanceiro.resgatarComoAluno(alunoId, beneficioId);
      await router.invalidate();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível resgatar");
    }
    setOcupado(null);
  }

  return (
    <main className="flex flex-col gap-4 px-4 pt-5">
      <div>
        <h2 className="font-display text-lg font-semibold">Meus benefícios</h2>
        <p className="text-sm text-muted">Vantagens por indicar amigos, treinar e ser da {dados.academia}.</p>
      </div>
      {erro && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{erro}</p>}
      {dados.beneficios.length === 0 && (
        <div className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-muted">
          Nenhum benefício no momento.
        </div>
      )}
      <ul className="flex flex-col gap-3">
        {dados.beneficios.map(({ beneficio: b, situacao, progresso, atual, meta }) => {
          const bloqueado = situacao === "bloqueado";
          const parceiro = b.tipo === "parceiro";
          return (
            <li
              key={b.id}
              className={`rounded-2xl border p-4 ${
                situacao === "disponivel" ? "border-fuchsia-500/50 bg-fuchsia-500/10" : "border-line bg-surface"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                    bloqueado ? "bg-white/5 text-muted" : "bg-brand-gradient text-white"
                  }`}
                >
                  {bloqueado ? <Lock className="size-5" /> : <Gift className="size-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{b.recompensa}</div>
                  <div className="text-xs text-muted">
                    {b.titulo} · {regraBeneficio(b)}
                  </div>
                </div>
              </div>
              {b.descricao && <p className="mt-2 text-sm text-muted">{b.descricao}</p>}

              {meta !== null && bloqueado && (
                <div className="mt-3">
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="bg-brand-gradient h-full rounded-full" style={{ width: `${Math.round((atual * 100) / meta)}%` }} />
                  </div>
                  <div className="mt-1 flex justify-between text-[11px] text-muted">
                    <span>{progresso}</span>
                    <span>
                      {atual}/{meta}
                    </span>
                  </div>
                </div>
              )}
              {meta === null && bloqueado && progresso && <p className="mt-2 text-xs text-muted">{progresso}</p>}

              {parceiro && b.codigo && !bloqueado && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(b.codigo);
                    setCopiado(b.id);
                  }}
                  className="mt-3 flex w-full items-center justify-between rounded-xl border border-dashed border-fuchsia-400/60 px-3 py-2 text-sm"
                >
                  <span>
                    Cupom <b className="font-display tracking-wider">{b.codigo}</b> na {b.parceiro}
                  </span>
                  {copiado === b.id ? <Check className="size-4 text-emerald-300" /> : <Copy className="size-4 text-muted" />}
                </button>
              )}

              {situacao === "disponivel" && !parceiro && (
                <button
                  type="button"
                  disabled={ocupado !== null}
                  onClick={() => resgatar(b.id)}
                  className="bg-brand-gradient mt-3 w-full rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Resgatar
                </button>
              )}
              {situacao === "resgatado" && (
                <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-emerald-300">
                  <Check className="size-4" /> Resgatado! Retire na recepção.
                </p>
              )}
              {situacao === "entregue" && !parceiro && (
                <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
                  <Check className="size-4" /> Você já recebeu este benefício.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
