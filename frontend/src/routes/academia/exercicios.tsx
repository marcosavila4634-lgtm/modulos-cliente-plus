import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Film, Image, Link2, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { MiniaturaExercicio } from "../../components/academia/MidiaExercicio";
import { ModalExercicio } from "../../components/academia/ModalExercicio";
import { Botao, classeInput } from "../../components/academia/formulario";
import { apiTreinos, grupos, rotuloGrupo, type Exercicio, type GrupoMuscular } from "../../lib/academia-treinos";

// Biblioteca de exercícios da academia.
export const Route = createFileRoute("/academia/exercicios")({
  loader: apiTreinos.exercicios,
  component: PaginaExercicios,
});

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function PaginaExercicios() {
  const exercicios = Route.useLoaderData();
  const router = useRouter();
  const [grupo, setGrupo] = useState<GrupoMuscular | "todos">("todos");
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<Exercicio | "novo" | null>(null);

  const lista = useMemo(() => {
    const termo = normalizar(busca.trim());
    return exercicios.filter(
      (e) =>
        (grupo === "todos" || e.grupoMuscular === grupo) &&
        (!termo || normalizar(e.nome).includes(termo) || normalizar(e.equipamento).includes(termo)),
    );
  }, [exercicios, grupo, busca]);

  const porGrupo = (g: GrupoMuscular) => exercicios.filter((e) => e.grupoMuscular === g).length;

  return (
    <div className="flex flex-col gap-5 py-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-poppins text-[28px] font-bold text-white">Exercícios</h1>
          <p className="mt-1 text-sm text-ac-muted">
            {exercicios.length} exercícios na biblioteca. Eles são usados para montar as fichas de treino.
          </p>
        </div>
        <Botao variante="primario" onClick={() => setEditando("novo")}>
          <Plus className="size-4" />
          Novo exercício
        </Botao>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={grupo}
          onChange={(e) => setGrupo(e.target.value as GrupoMuscular | "todos")}
          className={`${classeInput} !w-auto`}
        >
          <option value="todos">Todos os grupos ({exercicios.length})</option>
          {grupos.map((g) => (
            <option key={g} value={g}>
              {rotuloGrupo[g]} ({porGrupo(g)})
            </option>
          ))}
        </select>
        <label className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ac-muted" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar exercício ou aparelho"
            className={`${classeInput} pl-9`}
          />
        </label>
      </div>

      {lista.length === 0 ? (
        <p className="py-14 text-center text-sm text-ac-muted">Nenhum exercício encontrado.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setEditando(e)}
              className={`flex items-start gap-3 rounded-2xl border border-ac-line bg-gradient-to-b from-ac-card-2/70 to-ac-card p-3 text-left transition hover:border-violet-500/50 ${
                e.ativo ? "" : "opacity-50"
              }`}
            >
              <MiniaturaExercicio exercicio={e} className="size-16 rounded-xl" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-white">{e.nome}</div>
                <div className="mt-0.5 text-xs text-violet-300">{rotuloGrupo[e.grupoMuscular]}</div>
                <div className="truncate text-xs text-ac-muted">{e.equipamento || "—"}</div>
                <div className="mt-1.5 flex gap-2 text-ac-muted">
                  {e.imagemUrl && <Image className="size-3.5" aria-label="Tem imagem" />}
                  {e.videoUrl && <Film className="size-3.5" aria-label="Tem vídeo" />}
                  {e.videoLink && <Link2 className="size-3.5" aria-label="Tem link de vídeo" />}
                  {!e.ativo && <span className="text-[11px]">Inativo</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {editando && (
        <ModalExercicio
          exercicio={editando === "novo" ? undefined : editando}
          aoFechar={() => setEditando(null)}
          aoSalvar={async () => {
            await router.invalidate();
            setEditando(null);
          }}
        />
      )}
    </div>
  );
}
