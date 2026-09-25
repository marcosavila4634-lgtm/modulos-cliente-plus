import { Banknote, Check, CreditCard, FileText, QrCode, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { apiAlunos, fmt, rotuloForma, type Cobranca, type FormaPagamento } from "../../lib/academia-alunos";
import { Botao, MensagemErro, mensagemDe, Modal } from "./formulario";

const formas: { forma: FormaPagamento; icone: LucideIcon }[] = [
  { forma: "pix", icone: QrCode },
  { forma: "dinheiro", icone: Banknote },
  { forma: "cartao_credito", icone: CreditCard },
  { forma: "cartao_debito", icone: CreditCard },
  { forma: "boleto", icone: FileText },
];

// Registra o pagamento de uma mensalidade. Pagamento confirmado aqui é o que
// gera as comissões de indicação no Cliente Plus.
export function ModalReceber({
  cobranca,
  aoReceber,
  aoFechar,
}: {
  cobranca: Cobranca;
  aoReceber: () => void;
  aoFechar: () => void;
}) {
  const [forma, setForma] = useState<FormaPagamento>("pix");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function confirmar() {
    setSalvando(true);
    setErro(null);
    try {
      await apiAlunos.receber(cobranca.id, forma);
      aoReceber();
    } catch (e) {
      setErro(mensagemDe(e));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo="Receber mensalidade" subtitulo={cobranca.aluno} aoFechar={aoFechar}>
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-3 rounded-xl border border-ac-line bg-ac-bg/40 p-4 text-center">
          <div>
            <div className="text-[11px] text-ac-muted">Plano</div>
            <div className="mt-0.5 text-sm font-semibold text-white">{cobranca.plano}</div>
          </div>
          <div>
            <div className="text-[11px] text-ac-muted">Vencimento</div>
            <div className="mt-0.5 text-sm font-semibold text-white">{fmt.data(cobranca.vencimento)}</div>
          </div>
          <div>
            <div className="text-[11px] text-ac-muted">Valor</div>
            <div className="mt-0.5 font-poppins text-base font-bold text-emerald-300">{fmt.moeda(cobranca.valor)}</div>
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-slate-300">Forma de pagamento</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {formas.map(({ forma: f, icone: Icone }) => (
              <button
                key={f}
                type="button"
                onClick={() => setForma(f)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-[13px] transition ${
                  forma === f
                    ? "border-emerald-500/70 bg-emerald-500/10 text-white"
                    : "border-ac-line bg-ac-bg/40 text-slate-300 hover:border-slate-600"
                }`}
              >
                <Icone className="size-4 shrink-0" />
                {rotuloForma[f]}
              </button>
            ))}
          </div>
        </div>

        <MensagemErro texto={erro} />

        <div className="flex justify-end gap-3">
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao variante="sucesso" carregando={salvando} onClick={confirmar}>
            <Check className="size-4" />
            Confirmar pagamento
          </Botao>
        </div>
      </div>
    </Modal>
  );
}
