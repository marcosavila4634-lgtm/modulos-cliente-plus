import { useState, type FormEvent } from "react";
import { apiLutas, hojeIso, type DadosExame, type ExameResumo } from "../../lib/artes-marciais";
import { Botao, Campo, classeInput, MensagemErro, mensagemDe, Modal } from "../academia/formulario";

// Criar ou editar um exame de faixa.
export function ModalExame({
  modalidades,
  exame,
  aoFechar,
  aoSalvar,
}: {
  modalidades: { id: string; nome: string }[];
  exame?: ExameResumo;
  aoFechar: () => void;
  aoSalvar: (id: string) => void;
}) {
  const [d, setD] = useState<DadosExame>({
    modalidadeId: exame?.modalidade.id ?? modalidades[0]?.id ?? "",
    titulo: exame?.titulo ?? "",
    data: exame?.data ?? hojeIso(),
    hora: exame?.hora?.slice(0, 5) ?? "10:00",
    local: exame?.local ?? "",
    banca: exame?.banca ?? "",
    observacao: "",
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const r = exame ? await apiLutas.salvarExame(exame.id, d) : await apiLutas.criarExame(d);
      aoSalvar(r.exame.id);
    } catch (x) {
      setErro(mensagemDe(x));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={exame ? "Editar exame" : "Novo exame de faixa"} aoFechar={aoFechar}>
      <form onSubmit={salvar} className="flex flex-col gap-4">
        {!exame && (
          <Campo rotulo="Modalidade">
            <select className={classeInput} value={d.modalidadeId} onChange={(e) => setD({ ...d, modalidadeId: e.target.value })}>
              {modalidades.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </Campo>
        )}
        <Campo rotulo="Título (opcional)">
          <input className={classeInput} value={d.titulo} placeholder="Exame de faixa - ..." onChange={(e) => setD({ ...d, titulo: e.target.value })} />
        </Campo>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Data">
            <input type="date" className={classeInput} value={d.data} onChange={(e) => setD({ ...d, data: e.target.value })} />
          </Campo>
          <Campo rotulo="Horário">
            <input type="time" className={classeInput} value={d.hora} onChange={(e) => setD({ ...d, hora: e.target.value })} />
          </Campo>
        </div>
        <Campo rotulo="Local">
          <input className={classeInput} value={d.local} placeholder="Tatame 1" onChange={(e) => setD({ ...d, local: e.target.value })} />
        </Campo>
        <Campo rotulo="Banca (quem avalia)">
          <input className={classeInput} value={d.banca} onChange={(e) => setD({ ...d, banca: e.target.value })} />
        </Campo>
        <Campo rotulo="Recado para os alunos (opcional)">
          <input className={classeInput} value={d.observacao} placeholder="Ex.: kimono limpo e faixa atual" onChange={(e) => setD({ ...d, observacao: e.target.value })} />
        </Campo>
        <MensagemErro texto={erro} />
        <div className="flex justify-end gap-2">
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao type="submit" variante="primario" carregando={salvando}>
            Salvar
          </Botao>
        </div>
      </form>
    </Modal>
  );
}
