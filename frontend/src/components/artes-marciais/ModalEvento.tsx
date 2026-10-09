import { useState, type FormEvent } from "react";
import { apiLutas, hojeIso, type DadosEvento, type EventoResumo, type TipoEvento } from "../../lib/artes-marciais";
import { Botao, Campo, classeInput, Interruptor, MensagemErro, mensagemDe, Modal } from "../academia/formulario";

// Criar ou editar um evento (campeonato, seminário, aulão...).
export function ModalEvento({
  modalidades,
  evento,
  aoFechar,
  aoSalvar,
}: {
  modalidades: { id: string; nome: string }[];
  evento?: EventoResumo;
  aoFechar: () => void;
  aoSalvar: (id: string) => void;
}) {
  const [d, setD] = useState<DadosEvento>({
    tipo: evento?.tipo ?? "campeonato",
    nome: evento?.nome ?? "",
    descricao: evento?.descricao ?? "",
    modalidadeId: evento ? (evento.modalidade?.id ?? null) : (modalidades[0]?.id ?? null),
    data: evento?.data ?? hojeIso(),
    hora: evento?.hora?.slice(0, 5) ?? "09:00",
    local: evento?.local ?? "",
    organizador: evento?.organizador ?? "",
    valorInscricao: evento?.valorInscricao ?? 0,
    vagas: evento?.vagas ?? null,
    inscricoesAte: evento?.inscricoesAte ?? null,
    participaIndicacoes: evento?.participaIndicacoes ?? false,
    abertoNoApp: evento?.abertoNoApp ?? true,
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const mudar = <K extends keyof DadosEvento>(k: K, v: DadosEvento[K]) => setD((x) => ({ ...x, [k]: v }));

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const r = evento ? await apiLutas.salvarEvento(evento.id, d) : await apiLutas.criarEvento(d);
      aoSalvar(r.evento.id);
    } catch (x) {
      setErro(mensagemDe(x));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={evento ? "Editar evento" : "Novo evento"} aoFechar={aoFechar} largura="max-w-xl">
      <form onSubmit={salvar} className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Tipo">
            <select className={classeInput} value={d.tipo} onChange={(e) => mudar("tipo", e.target.value as TipoEvento)}>
              <option value="campeonato">Campeonato</option>
              <option value="seminario">Seminário</option>
              <option value="aulao">Aulão</option>
              <option value="confraternizacao">Confraternização</option>
              <option value="outro">Outro</option>
            </select>
          </Campo>
          <Campo rotulo="Modalidade">
            <select
              className={classeInput}
              value={d.modalidadeId ?? ""}
              onChange={(e) => mudar("modalidadeId", e.target.value || null)}
            >
              <option value="">Todas</option>
              {modalidades.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </Campo>
        </div>
        <Campo rotulo="Nome">
          <input className={classeInput} value={d.nome} onChange={(e) => mudar("nome", e.target.value)} placeholder="Ex.: Copa Dojo Centro" />
        </Campo>
        <div className="grid gap-3 sm:grid-cols-3">
          <Campo rotulo="Data">
            <input type="date" className={classeInput} value={d.data} onChange={(e) => mudar("data", e.target.value)} />
          </Campo>
          <Campo rotulo="Horário">
            <input type="time" className={classeInput} value={d.hora} onChange={(e) => mudar("hora", e.target.value)} />
          </Campo>
          <Campo rotulo="Inscrições até">
            <input
              type="date"
              className={classeInput}
              value={d.inscricoesAte ?? ""}
              onChange={(e) => mudar("inscricoesAte", e.target.value || null)}
            />
          </Campo>
        </div>
        <Campo rotulo="Local">
          <input className={classeInput} value={d.local} onChange={(e) => mudar("local", e.target.value)} />
        </Campo>
        <Campo rotulo="Organização (vazio = a própria academia)">
          <input className={classeInput} value={d.organizador} onChange={(e) => mudar("organizador", e.target.value)} placeholder="Ex.: Federação Paulista de Jiu-Jitsu" />
        </Campo>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Valor da inscrição (R$, 0 = grátis)">
            <input
              type="number"
              min={0}
              step="0.01"
              className={classeInput}
              value={d.valorInscricao}
              onChange={(e) => mudar("valorInscricao", Number(e.target.value))}
            />
          </Campo>
          <Campo rotulo="Vagas (vazio = sem limite)">
            <input
              type="number"
              min={1}
              className={classeInput}
              value={d.vagas ?? ""}
              onChange={(e) => mudar("vagas", e.target.value ? Number(e.target.value) : null)}
            />
          </Campo>
        </div>
        <Campo rotulo="Descrição (aparece para o aluno)">
          <textarea
            rows={3}
            className={`${classeInput} h-auto py-2`}
            value={d.descricao}
            onChange={(e) => mudar("descricao", e.target.value)}
          />
        </Campo>
        <Interruptor
          ligado={d.abertoNoApp}
          aoMudar={(v) => mudar("abertoNoApp", v)}
          titulo="Aluno se inscreve pela área do aluno"
          descricao="A cobrança da inscrição aparece para ele pagar."
        />
        <Interruptor
          ligado={d.participaIndicacoes}
          aoMudar={(v) => mudar("participaIndicacoes", v)}
          titulo="Inscrição gera comissão de indicação"
          descricao="Quando paga, entra no motor de comissões do Cliente Plus."
        />
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
