import { Link } from "@tanstack/react-router";
import { CircleCheck, CircleX, History, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { apiAcesso, hora, rotuloMotivo, type ResultadoAcesso } from "../../lib/academia-acesso";
import { Botao, Campo, classeInput, MensagemErro, mensagemDe, Modal } from "./formulario";

// Resposta de uma tentativa de entrada: liberado (verde), repetido (azul) ou
// bloqueado (vermelho). Na recepção, um bloqueio pode ser liberado mesmo assim.
export function ModalResultadoAcesso({
  resultado,
  podeLiberar,
  aoFechar,
  aoLiberar,
}: {
  resultado: ResultadoAcesso;
  podeLiberar: boolean;
  aoFechar: () => void;
  aoLiberar?: (r: ResultadoAcesso) => void;
}) {
  const [liberando, setLiberando] = useState(false);
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const bloqueado = resultado.resultado === "bloqueado";
  const repetido = resultado.resultado === "repetido";
  const Icone = bloqueado ? CircleX : repetido ? History : CircleCheck;
  const cor = bloqueado
    ? "border-red-500/40 bg-red-500/10 text-red-300"
    : repetido
      ? "border-sky-500/40 bg-sky-500/10 text-sky-300"
      : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  const titulo = bloqueado ? "Entrada bloqueada" : repetido ? "Já registrado" : "Entrada liberada";

  async function liberar() {
    setSalvando(true);
    setErro(null);
    try {
      const r = await apiAcesso.registrarCheckin(resultado.alunoId, true, observacao);
      aoLiberar?.(r);
    } catch (e) {
      setErro(mensagemDe(e));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={titulo} aoFechar={aoFechar} largura="max-w-md">
      <div className={`flex flex-col items-center rounded-2xl border px-4 py-6 text-center ${cor}`}>
        <Icone className="size-14" strokeWidth={1.75} />
        <div className="mt-3 font-poppins text-xl font-bold text-white">{resultado.aluno}</div>
        <div className="text-xs text-slate-300">{resultado.plano ?? "Sem plano ativo"}</div>
        <p className="mt-3 text-sm font-medium">{resultado.mensagem}</p>
        {resultado.acesso && !bloqueado && (
          <p className="mt-1 text-xs text-slate-400">Registrado às {hora(resultado.acesso.momento)}</p>
        )}
      </div>

      {bloqueado && podeLiberar && !liberando && (
        <div className="mt-4 flex flex-col gap-3">
          {resultado.motivo === "inadimplente" && (
            <p className="text-sm text-slate-300">
              Receba a mensalidade na ficha do aluno para liberar a entrada automaticamente.
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-3">
            <Link
              to="/academia/alunos/$id"
              params={{ id: resultado.alunoId }}
              className="inline-flex h-10 items-center rounded-xl border border-ac-line bg-ac-card-2 px-4 text-sm font-semibold text-slate-200 hover:text-white"
            >
              {resultado.motivo === "inadimplente" ? "Receber mensalidade" : "Ver aluno"}
            </Link>
            {resultado.motivo !== "sem_matricula" && (
              <Botao variante="perigo" onClick={() => setLiberando(true)}>
                <ShieldAlert className="size-4" />
                Liberar mesmo assim
              </Botao>
            )}
          </div>
        </div>
      )}

      {liberando && (
        <div className="mt-4 flex flex-col gap-3">
          <p className="text-sm text-slate-300">
            A entrada fica marcada como <b className="text-white">liberação manual</b> ({rotuloMotivo[resultado.motivo!]}).
          </p>
          <Campo rotulo="Observação (opcional)">
            <input
              autoFocus
              className={classeInput}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex.: vai pagar amanhã"
            />
          </Campo>
          <MensagemErro texto={erro} />
          <div className="flex justify-end gap-3">
            <Botao onClick={() => setLiberando(false)}>Voltar</Botao>
            <Botao variante="primario" carregando={salvando} onClick={liberar}>
              Confirmar liberação
            </Botao>
          </div>
        </div>
      )}

      {(!bloqueado || !podeLiberar) && (
        <div className="mt-5 flex justify-end">
          <Botao variante="primario" autoFocus onClick={aoFechar}>
            OK
          </Botao>
        </div>
      )}
    </Modal>
  );
}

const baseSelo = "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold whitespace-nowrap";

export function SeloAcesso({ resultado, manual }: { resultado: "liberado" | "bloqueado"; manual: boolean }) {
  if (resultado === "bloqueado") return <span className={`${baseSelo} bg-red-500/15 text-red-300`}>Bloqueado</span>;
  if (manual) return <span className={`${baseSelo} bg-amber-500/15 text-amber-300`}>Liberado na recepção</span>;
  return <span className={`${baseSelo} bg-emerald-500/15 text-emerald-300`}>Liberado</span>;
}
