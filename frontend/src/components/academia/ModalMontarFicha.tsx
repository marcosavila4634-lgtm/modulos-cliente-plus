import { useNavigate } from "@tanstack/react-router";
import { FilePlus, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { apiTreinos, type PainelTreinos } from "../../lib/academia-treinos";
import { Botao, MensagemErro, mensagemDe, Modal } from "./formulario";

// Montar a ficha de treino de um aluno: a partir de um modelo ou do zero.
// Depois de criada, abre o editor para ajustar.
export function ModalMontarFicha({
  aluno,
  temFichaAtual,
  modelos,
  aoFechar,
}: {
  aluno: { id: string; nome: string };
  temFichaAtual: boolean;
  modelos: PainelTreinos["modelos"];
  aoFechar: () => void;
}) {
  const navigate = useNavigate();
  const [modeloId, setModeloId] = useState<string>(modelos[0]?.id ?? "");
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function criar() {
    setCriando(true);
    setErro(null);
    try {
      const ficha = await apiTreinos.criarFicha({ alunoId: aluno.id, modeloId: modeloId || undefined });
      navigate({ to: "/academia/treinos/$fichaId", params: { fichaId: ficha.id } });
    } catch (e) {
      setErro(mensagemDe(e));
      setCriando(false);
    }
  }

  const opcao = (id: string, titulo: string, detalhe: string) => (
    <label
      key={id || "zero"}
      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
        modeloId === id ? "border-violet-500/70 bg-violet-500/10" : "border-ac-line bg-ac-bg/40 hover:border-slate-600"
      }`}
    >
      <input
        type="radio"
        name="modelo"
        checked={modeloId === id}
        onChange={() => setModeloId(id)}
        className="accent-fuchsia-500"
      />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-white">{titulo}</div>
        <div className="truncate text-xs text-ac-muted">{detalhe}</div>
      </div>
    </label>
  );

  return (
    <Modal titulo="Montar ficha de treino" subtitulo={aluno.nome} aoFechar={aoFechar}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-slate-300">Começar a partir de</span>
          {modelos.map((m) =>
            opcao(m.id, m.nome, `${m.objetivo || "Sem objetivo"} · Treinos ${m.divisoes} · ${m.exercicios} exercícios`),
          )}
          {opcao("", "Começar do zero", "Ficha em branco para montar exercício por exercício")}
        </div>

        {temFichaAtual && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-200">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />A ficha atual do aluno será encerrada e ficará no
            histórico.
          </div>
        )}

        <MensagemErro texto={erro} />

        <div className="flex justify-end gap-3">
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="primario" carregando={criando} onClick={criar}>
            <FilePlus className="size-4" />
            Montar e editar
          </Botao>
        </div>
      </div>
    </Modal>
  );
}
