import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Eye, FileText, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { useState } from "react";
import { Botao, Campo, classeInput, MensagemErro, Modal, mensagemDe, useAcao } from "../../components/grupo-vip/formulario";
import { CabecalhoPagina, Card, Vazio } from "../../components/grupo-vip/ui";
import { apiConteudos, corCategoria, type Categoria, type CorCategoria } from "../../lib/grupo-vip-conteudos";

const cores: CorCategoria[] = ["orange", "sky", "violet", "emerald", "rose", "amber"];
const bolinha: Record<CorCategoria, string> = {
  orange: "bg-orange-500",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
  amber: "bg-amber-400",
};

// Categorias organizam os conteúdos (e a biblioteca da área do membro).
export const Route = createFileRoute("/grupo-vip/categorias")({
  loader: () => apiConteudos.categorias(),
  component: PaginaCategorias,
});

function PaginaCategorias() {
  const router = useRouter();
  const [lista, setLista] = useState<Categoria[]>(Route.useLoaderData());
  const [editando, setEditando] = useState<Categoria | "nova" | null>(null);
  const { carregando, erro, executar } = useAcao();

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina titulo="Categorias" descricao="Organize os conteúdos. Na área do membro, a biblioteca aparece separada por categoria.">
        <Botao variante="primario" onClick={() => setEditando("nova")}>
          <Plus className="size-4" /> Nova categoria
        </Botao>
      </CabecalhoPagina>
      <MensagemErro texto={erro} />
      {lista.length === 0 ? (
        <Card>
          <Vazio icone={Tags}>Nenhuma categoria.</Vazio>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((c) => (
            <Card key={c.id} className="flex items-center gap-3">
              <span className={`size-3 shrink-0 rounded-full ${bolinha[c.cor]}`} />
              <div className="min-w-0 flex-1">
                <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${corCategoria[c.cor]}`}>{c.nome}</span>
                <div className="mt-1.5 flex gap-3 text-[12px] text-gv-muted">
                  <span className="inline-flex items-center gap-1">
                    <FileText className="size-3.5" /> {c.conteudos} conteúdos
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="size-3.5" /> {c.visualizacoes} visualizações
                  </span>
                </div>
              </div>
              <button type="button" aria-label="Editar" onClick={() => setEditando(c)} className="rounded-lg p-2 text-gv-muted hover:bg-white/5 hover:text-white">
                <Pencil className="size-4" />
              </button>
              <Botao
                pequeno
                variante="perigo"
                carregando={carregando === c.id}
                onClick={() =>
                  executar(c.id, async () => {
                    if (!confirm(`Excluir a categoria ${c.nome}? Os conteúdos continuam, sem categoria.`)) return;
                    setLista(await apiConteudos.excluirCategoria(c.id));
                    router.invalidate();
                  })
                }
              >
                <Trash2 className="size-3.5" />
              </Botao>
            </Card>
          ))}
        </div>
      )}
      {editando && (
        <ModalCategoria
          categoria={editando === "nova" ? null : editando}
          aoFechar={() => setEditando(null)}
          aoSalvar={(nova) => {
            setLista(nova);
            setEditando(null);
          }}
        />
      )}
    </div>
  );
}

function ModalCategoria({
  categoria,
  aoFechar,
  aoSalvar,
}: {
  categoria: Categoria | null;
  aoFechar: () => void;
  aoSalvar: (l: Categoria[]) => void;
}) {
  const [nome, setNome] = useState(categoria?.nome ?? "");
  const [cor, setCor] = useState<CorCategoria>(categoria?.cor ?? "orange");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  return (
    <Modal titulo={categoria ? "Editar categoria" : "Nova categoria"} aoFechar={aoFechar} largura="max-w-md">
      <Campo rotulo="Nome">
        <input autoFocus className={classeInput} value={nome} onChange={(e) => setNome(e.target.value)} />
      </Campo>
      <div className="mt-4 flex gap-2">
        {cores.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={c}
            onClick={() => setCor(c)}
            className={`size-8 rounded-full ${bolinha[c]} ${cor === c ? "ring-2 ring-white ring-offset-2 ring-offset-gv-card" : ""}`}
          />
        ))}
      </div>
      <div className="mt-4">
        <MensagemErro texto={erro} />
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Botao onClick={aoFechar}>Cancelar</Botao>
        <Botao
          variante="primario"
          carregando={salvando}
          onClick={async () => {
            setSalvando(true);
            setErro(null);
            try {
              aoSalvar(categoria ? await apiConteudos.atualizarCategoria(categoria.id, nome, cor) : await apiConteudos.criarCategoria(nome, cor));
            } catch (e) {
              setErro(mensagemDe(e));
            } finally {
              setSalvando(false);
            }
          }}
        >
          Salvar
        </Botao>
      </div>
    </Modal>
  );
}
