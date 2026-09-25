import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { AlunoResumo } from "../../lib/academia-alunos";
import { AvatarAluno, SeloSituacao } from "./Selos";
import { classeInput } from "./formulario";

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Campo para escolher um aluno digitando o nome.
export function SeletorAluno({
  alunos,
  valor,
  aoMudar,
  autoFocus = false,
  placeholder = "Digite o nome do aluno",
}: {
  alunos: Pick<AlunoResumo, "id" | "nome" | "situacao" | "plano">[];
  valor: string | null;
  aoMudar: (id: string | null) => void;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const [busca, setBusca] = useState("");
  const escolhido = alunos.find((a) => a.id === valor) ?? null;

  const lista = useMemo(() => {
    const termo = normalizar(busca.trim());
    if (!termo) return [];
    return alunos.filter((a) => normalizar(a.nome).includes(termo)).slice(0, 6);
  }, [alunos, busca]);

  if (escolhido) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-violet-500/50 bg-violet-500/5 px-3 py-2">
        <AvatarAluno nome={escolhido.nome} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-white">{escolhido.nome}</div>
          <div className="truncate text-[11.5px] text-ac-muted">{escolhido.plano ?? "Sem matrícula"}</div>
        </div>
        <button
          type="button"
          onClick={() => {
            aoMudar(null);
            setBusca("");
          }}
          aria-label="Trocar aluno"
          className="rounded-lg p-1.5 text-ac-muted hover:bg-white/5 hover:text-white"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <label className="relative block">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ac-muted" />
        <input
          autoFocus={autoFocus}
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && lista[0]) {
              e.preventDefault();
              aoMudar(lista[0].id);
            }
          }}
          placeholder={placeholder}
          className={`${classeInput} pl-9`}
        />
      </label>
      {lista.length > 0 && (
        <ul className="mt-1.5 flex flex-col gap-1 rounded-xl border border-ac-line bg-ac-bg/60 p-1.5">
          {lista.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => aoMudar(a.id)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-white/5"
              >
                <AvatarAluno nome={a.nome} />
                <span className="min-w-0 flex-1 truncate text-sm text-slate-100">{a.nome}</span>
                <SeloSituacao situacao={a.situacao} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {busca.trim() && lista.length === 0 && <p className="mt-2 text-xs text-ac-muted">Nenhum aluno encontrado.</p>}
    </div>
  );
}
