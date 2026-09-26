import { useRouter } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useState } from "react";
import { apiAgenda, corAula, diaCurto, horaDe, type AulasDoAluno } from "../../lib/academia-agenda";

// Área do cliente (simulada): aulas coletivas dos próximos dias. O aluno
// reserva ou cancela a vaga; na turma fixa, pode avisar que não vai.
export function AbaAulasAluno({ alunoId, aulas }: { alunoId: string; aulas: AulasDoAluno }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const dias = [...new Set(aulas.aulas.map((a) => a.aula.data))];

  async function mudar(horarioId: string, data: string, reservar: boolean) {
    setOcupado(horarioId + data);
    setErro(null);
    try {
      if (reservar) await apiAgenda.reservarComoAluno(alunoId, horarioId, data);
      else await apiAgenda.cancelarComoAluno(alunoId, horarioId, data);
      await router.invalidate();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível");
    }
    setOcupado(null);
  }

  return (
    <main className="flex flex-col gap-4 px-4 pt-5">
      <div>
        <h2 className="font-display text-lg font-semibold">Aulas da semana</h2>
        <p className="text-sm text-muted">Reserve sua vaga nas aulas coletivas.</p>
      </div>
      {erro && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{erro}</p>}
      {dias.length === 0 && (
        <div className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-muted">
          Nenhuma aula nos próximos dias.
        </div>
      )}
      {dias.map((dia) => (
        <section key={dia}>
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">{diaCurto(dia)}</h3>
          <ul className="flex flex-col gap-2">
            {aulas.aulas
              .filter((a) => a.aula.data === dia)
              .map(({ aula: a, minhaSituacao, podeReservar, motivo }) => {
                const cor = corAula[a.cor];
                const vagas = Math.max(0, a.capacidade - a.ocupados);
                const vou = minhaSituacao === "fixo" || minhaSituacao === "reservado";
                return (
                  <li
                    key={a.horarioId + a.data}
                    className={`flex items-center gap-3 rounded-2xl border p-3 ${
                      vou ? `${cor.borda} ${cor.fundo}` : "border-line bg-surface"
                    }`}
                  >
                    <div className="w-12 text-center">
                      <div className="font-display text-base font-bold">{a.hora}</div>
                      <div className="text-[10px] text-muted">até {horaDe(a.fim)}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`truncate font-semibold ${cor.texto}`}>{a.nome}</div>
                      <div className="truncate text-xs text-muted">
                        {a.professor?.nome.split(" ")[0] ?? ""} · {a.sala}
                      </div>
                      <div className={`text-xs ${vagas === 0 ? "text-red-300" : "text-muted"}`}>
                        {vagas === 0 ? "Lotada" : `${vagas} ${vagas === 1 ? "vaga" : "vagas"}`}
                      </div>
                    </div>
                    {vou ? (
                      <div className="flex flex-col items-end gap-1">
                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-300">
                          <Check className="size-3.5" />
                          {minhaSituacao === "fixo" ? "Turma fixa" : "Reservado"}
                        </span>
                        <button
                          type="button"
                          disabled={ocupado !== null}
                          onClick={() => mudar(a.horarioId, a.data, false)}
                          className="text-[11px] text-muted underline"
                        >
                          {minhaSituacao === "fixo" ? "Não vou" : "Cancelar"}
                        </button>
                      </div>
                    ) : minhaSituacao ? (
                      <span className="text-xs text-muted">{minhaSituacao === "presente" ? "Presente" : "Faltou"}</span>
                    ) : (
                      <button
                        type="button"
                        disabled={!podeReservar || ocupado !== null}
                        onClick={() => mudar(a.horarioId, a.data, true)}
                        className="bg-brand-gradient rounded-xl px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                      >
                        {motivo ?? "Reservar"}
                      </button>
                    )}
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </main>
  );
}
