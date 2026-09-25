import { Check, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { grupos, rotuloGrupo, type Exercicio, type GrupoMuscular } from "../../lib/academia-treinos";
import { MiniaturaExercicio } from "./MidiaExercicio";
import { Botao, classeInput, Modal } from "./formulario";

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Escolher exercícios da biblioteca para um treino. Dá para adicionar vários
// sem fechar a janela.
export function ModalEscolherExercicio({
  exercicios,
  treino,
  aoAdicionar,
  aoFechar,
}: {
  exercicios: Exercicio[];
  treino: string;
  aoAdicionar: (e: Exercicio) => void;
  aoFechar: () => void;
}) {
  const [busca, setBusca] = useState("");
  const [grupo, setGrupo] = useState<GrupoMuscular | "todos">("todos");
  const [adicionados, setAdicionados] = useState<string[]>([]);

  const lista = useMemo(() => {
    const termo = normalizar(busca.trim());
    return exercicios.filter(
      (e) =>
        e.ativo &&
        (grupo === "todos" || e.grupoMuscular === grupo) &&
        (!termo || normalizar(e.nome).includes(termo) || normalizar(e.equipamento).includes(termo)),
    );
  }, [exercicios, busca, grupo]);

  return (
    <Modal titulo="Adicionar exercícios" subtitulo={treino} aoFechar={aoFechar} largura="max-w-2xl">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ac-muted" />
            <input
              autoFocus
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar exercício ou aparelho"
              className={`${classeInput} pl-9`}
            />
          </label>
          <select
            value={grupo}
            onChange={(e) => setGrupo(e.target.value as GrupoMuscular | "todos")}
            className={`${classeInput} !w-auto`}
          >
            <option value="todos">Todos os grupos</option>
            {grupos.map((g) => (
              <option key={g} value={g}>
                {rotuloGrupo[g]}
              </option>
            ))}
          </select>
        </div>

        <ul className="-mx-2 flex max-h-[50vh] flex-col overflow-y-auto">
          {lista.map((e) => {
            const vezes = adicionados.filter((id) => id === e.id).length;
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => {
                    aoAdicionar(e);
                    setAdicionados((a) => [...a, e.id]);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-white/5"
                >
                  <MiniaturaExercicio exercicio={e} className="size-10 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-white">{e.nome}</div>
                    <div className="truncate text-xs text-ac-muted">
                      {rotuloGrupo[e.grupoMuscular]} · {e.equipamento || "—"}
                    </div>
                  </div>
                  {vezes > 0 ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-300">
                      <Check className="size-4" />
                      Adicionado{vezes > 1 ? ` ${vezes}×` : ""}
                    </span>
                  ) : (
                    <Plus className="size-4 text-ac-muted" />
                  )}
                </button>
              </li>
            );
          })}
          {lista.length === 0 && <li className="py-8 text-center text-sm text-ac-muted">Nenhum exercício encontrado.</li>}
        </ul>

        <div className="flex items-center justify-between gap-3 border-t border-ac-line pt-3">
          <span className="text-xs text-ac-muted">
            {adicionados.length > 0 ? `${adicionados.length} adicionado(s)` : "Clique para adicionar"}
          </span>
          <Botao variante="primario" onClick={aoFechar}>
            Concluir
          </Botao>
        </div>
      </div>
    </Modal>
  );
}
