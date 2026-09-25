import { Check } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  apiTreinos,
  grupos,
  rotuloGrupo,
  type DadosExercicio,
  type Exercicio,
} from "../../lib/academia-treinos";
import { CampoArquivo } from "./CampoArquivo";
import { Botao, Campo, classeInput, MensagemErro, mensagemDe, Modal } from "./formulario";

// Cadastro e edição de um exercício da biblioteca: texto, imagem, vídeo
// enviado e/ou link de vídeo.
export function ModalExercicio({
  exercicio,
  aoSalvar,
  aoFechar,
}: {
  exercicio?: Exercicio;
  aoSalvar: (e: Exercicio) => void;
  aoFechar: () => void;
}) {
  const [dados, setDados] = useState<DadosExercicio>({
    nome: exercicio?.nome ?? "",
    grupoMuscular: exercicio?.grupoMuscular ?? "peito",
    equipamento: exercicio?.equipamento ?? "",
    instrucoes: exercicio?.instrucoes ?? "",
    imagemUrl: exercicio?.imagemUrl ?? null,
    videoUrl: exercicio?.videoUrl ?? null,
    videoLink: exercicio?.videoLink ?? null,
    ativo: exercicio?.ativo ?? true,
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const mudar = <K extends keyof DadosExercicio>(campo: K, valor: DadosExercicio[K]) =>
    setDados((d) => ({ ...d, [campo]: valor }));

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      aoSalvar(
        exercicio
          ? await apiTreinos.atualizarExercicio(exercicio.id, dados)
          : await apiTreinos.cadastrarExercicio(dados),
      );
    } catch (e) {
      setErro(mensagemDe(e));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={exercicio ? "Editar exercício" : "Novo exercício"} aoFechar={aoFechar} largura="max-w-2xl">
      <form onSubmit={salvar} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
          <Campo rotulo="Nome *">
            <input
              autoFocus
              className={classeInput}
              value={dados.nome}
              onChange={(e) => mudar("nome", e.target.value)}
              placeholder="Ex.: Supino reto com barra"
            />
          </Campo>
          <Campo rotulo="Grupo muscular *">
            <select
              className={classeInput}
              value={dados.grupoMuscular}
              onChange={(e) => mudar("grupoMuscular", e.target.value as DadosExercicio["grupoMuscular"])}
            >
              {grupos.map((g) => (
                <option key={g} value={g}>
                  {rotuloGrupo[g]}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <Campo rotulo="Equipamento">
          <input
            className={classeInput}
            value={dados.equipamento}
            onChange={(e) => mudar("equipamento", e.target.value)}
            placeholder="Ex.: Barra e banco reto"
          />
        </Campo>

        <Campo rotulo="Como fazer (aparece para o aluno)">
          <textarea
            rows={3}
            className={`${classeInput} h-auto py-2.5`}
            value={dados.instrucoes}
            onChange={(e) => mudar("instrucoes", e.target.value)}
            placeholder="Explique a execução correta, cuidados e dicas."
          />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-300">Imagem</span>
            <CampoArquivo tipo="imagem" url={dados.imagemUrl} aoMudar={(u) => mudar("imagemUrl", u)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-slate-300">Vídeo</span>
            <CampoArquivo tipo="video" url={dados.videoUrl} aoMudar={(u) => mudar("videoUrl", u)} />
          </div>
        </div>

        <Campo rotulo="Link de vídeo (YouTube, Vimeo...)">
          <input
            className={classeInput}
            type="url"
            value={dados.videoLink ?? ""}
            onChange={(e) => mudar("videoLink", e.target.value || null)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </Campo>

        {exercicio && (
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={dados.ativo}
              onChange={(e) => mudar("ativo", e.target.checked)}
              className="accent-fuchsia-500"
            />
            Ativo (desmarque para esconder da lista ao montar fichas)
          </label>
        )}

        <MensagemErro texto={erro} />

        <div className="flex justify-end gap-3 pt-1">
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao type="submit" variante="primario" carregando={salvando}>
            <Check className="size-4" />
            {exercicio ? "Salvar alterações" : "Cadastrar exercício"}
          </Botao>
        </div>
      </form>
    </Modal>
  );
}
