import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  Cake,
  CalendarCheck,
  Dumbbell,
  ExternalLink,
  FilePlus,
  HandCoins,
  IdCard,
  Mail,
  Pencil,
  Phone,
  ReceiptText,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { ModalAluno, ModalMatricular } from "../../../components/academia/ModaisAluno";
import { ModalMontarFicha } from "../../../components/academia/ModalMontarFicha";
import { ModalReceber } from "../../../components/academia/ModalReceber";
import { AvatarAluno, SeloFicha, SeloSituacao } from "../../../components/academia/Selos";
import { TabelaCobrancas } from "../../../components/academia/TabelaCobrancas";
import { Botao, MensagemErro, mensagemDe, Modal } from "../../../components/academia/formulario";
import { Card, TituloCard } from "../../../components/academia/ui";
import { apiAlunos, fmt, periodicidade, prazo, type Cobranca } from "../../../lib/academia-alunos";
import { apiTreinos } from "../../../lib/academia-treinos";

export const Route = createFileRoute("/academia/alunos/$id")({
  loader: async ({ params }) => {
    const [aluno, planos, treinos] = await Promise.all([
      apiAlunos.buscar(params.id),
      apiAlunos.planos(),
      apiTreinos.painel(),
    ]);
    return { aluno, planos, modelos: treinos.modelos };
  },
  component: FichaAluno,
});

type Janela = "editar" | "matricular" | "cancelar" | "ficha" | { receber: Cobranca } | null;

function idade(nascimento: string) {
  const [a, m, d] = nascimento.split("-").map(Number);
  const hoje = new Date();
  let anos = hoje.getFullYear() - a;
  if (hoje.getMonth() + 1 < m || (hoje.getMonth() + 1 === m && hoje.getDate() < d)) anos--;
  return anos;
}

function FichaAluno() {
  const { aluno, planos, modelos } = Route.useLoaderData();
  const router = useRouter();
  const [janela, setJanela] = useState<Janela>(null);

  const fechar = () => setJanela(null);
  const recarregar = async () => {
    await router.invalidate();
    setJanela(null);
  };

  const m = aluno.matricula;
  const proxima = aluno.cobrancas
    .filter((c) => c.status === "pendente" || c.status === "atrasada")
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento))[0];
  const whatsapp = aluno.telefone ? `https://wa.me/55${aluno.telefone}` : null;

  return (
    <div className="flex flex-col gap-5 py-4">
      <Link
        to="/academia/alunos"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-ac-muted hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Alunos
      </Link>

      <Card className="flex flex-wrap items-center gap-5">
        <AvatarAluno nome={aluno.nome} grande />
        <div className="min-w-48 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="font-poppins text-2xl font-bold text-white">{aluno.nome}</h1>
            <SeloSituacao situacao={aluno.situacao} />
          </div>
          <p className="mt-1 text-sm text-ac-muted">Aluno desde {fmt.data(aluno.alunoDesde)}</p>
        </div>
        <Botao onClick={() => setJanela("editar")}>
          <Pencil className="size-4" />
          Editar dados
        </Botao>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] [&>*]:min-w-0">
        <Card>
          <TituloCard icone={IdCard} cor="text-sky-400">
            Dados do aluno
          </TituloCard>
          <dl className="mt-4 flex flex-col gap-3.5">
            <Dado icone={Phone} rotulo="Telefone">
              {fmt.telefone(aluno.telefone)}
              {whatsapp && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 text-xs font-medium text-emerald-400 hover:text-emerald-300"
                >
                  WhatsApp
                </a>
              )}
            </Dado>
            <Dado icone={Mail} rotulo="E-mail">
              {aluno.email ?? "—"}
            </Dado>
            <Dado icone={IdCard} rotulo="CPF">
              {fmt.cpf(aluno.cpf)}
            </Dado>
            <Dado icone={Cake} rotulo="Nascimento">
              {aluno.dataNascimento
                ? `${fmt.data(aluno.dataNascimento)} (${idade(aluno.dataNascimento)} anos)`
                : "—"}
            </Dado>
          </dl>
        </Card>

        <Card>
          <TituloCard icone={CalendarCheck} cor="text-violet-400">
            Matrícula
          </TituloCard>
          {m ? (
            <>
              <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <div className="font-poppins text-xl font-bold text-white">{m.plano.nome}</div>
                  <div className="text-xs text-ac-muted">{m.plano.descricao}</div>
                </div>
                <div className="text-right">
                  <span className="font-poppins text-xl font-bold text-white">{fmt.moeda(m.valor)}</span>
                  <span className="ml-1 text-xs text-ac-muted">{periodicidade(m.plano.duracaoMeses)}</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Info rotulo="Início">{fmt.data(m.inicio)}</Info>
                <Info rotulo="Próximo vencimento">
                  {m.proximoVencimento ? (
                    <>
                      {fmt.data(m.proximoVencimento)}
                      <div
                        className={`text-[11px] font-normal ${aluno.situacao === "em_atraso" ? "text-red-400" : "text-ac-muted"}`}
                      >
                        {prazo(m.proximoVencimento)}
                      </div>
                    </>
                  ) : (
                    "—"
                  )}
                </Info>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {proxima && (
                  <Botao variante="sucesso" onClick={() => setJanela({ receber: proxima })}>
                    <HandCoins className="size-4" />
                    Receber mensalidade
                  </Botao>
                )}
                <Botao variante="perigo" onClick={() => setJanela("cancelar")}>
                  <X className="size-4" />
                  Cancelar matrícula
                </Botao>
              </div>
            </>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-ac-line p-6 text-center">
              <Wallet className="mx-auto size-7 text-ac-muted" />
              <p className="mt-2 text-sm text-slate-300">Este aluno não tem matrícula ativa.</p>
              <Botao variante="primario" className="mt-4" onClick={() => setJanela("matricular")}>
                <FilePlus className="size-4" />
                Matricular
              </Botao>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <TituloCard icone={Dumbbell} cor="text-fuchsia-400">
          Treino
        </TituloCard>
        {aluno.ficha ? (
          <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-poppins text-lg font-bold text-white">{aluno.ficha.nome}</span>
                <SeloFicha situacao={aluno.ficha.situacao} />
              </div>
              <div className="mt-0.5 text-xs text-ac-muted">
                Treinos {aluno.ficha.divisoes} · Professor: {aluno.ficha.professor ?? "—"} · Validade{" "}
                {fmt.data(aluno.ficha.validade)}
              </div>
            </div>
            <div className="ml-auto flex flex-wrap gap-3">
              <Link
                to="/academia/treinos/$fichaId"
                params={{ fichaId: aluno.ficha.id }}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-ac-line bg-ac-card-2 px-4 text-sm font-semibold text-slate-200 hover:border-slate-600 hover:text-white"
              >
                <Pencil className="size-4" />
                Abrir ficha
              </Link>
              <Botao onClick={() => setJanela("ficha")}>
                <FilePlus className="size-4" />
                Montar nova ficha
              </Botao>
              <a
                href={`/cliente/${aluno.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-1.5 px-1 text-sm text-sky-400 hover:text-sky-300"
              >
                <ExternalLink className="size-4" />
                Ver como o aluno vê
              </a>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-ac-line p-4">
            <span className="text-sm text-slate-300">Este aluno ainda não tem ficha de treino.</span>
            <Botao variante="primario" onClick={() => setJanela("ficha")}>
              <FilePlus className="size-4" />
              Montar ficha
            </Botao>
          </div>
        )}
      </Card>

      <Card>
        <TituloCard icone={ReceiptText} cor="text-emerald-400">
          Mensalidades
        </TituloCard>
        <div className="mt-3">
          <TabelaCobrancas
            cobrancas={aluno.cobrancas}
            aoReceber={(c) => setJanela({ receber: c })}
            vazio="Nenhuma mensalidade ainda. Elas aparecem aqui depois da matrícula."
          />
        </div>
      </Card>

      {janela === "editar" && <ModalAluno aluno={aluno} aoFechar={fechar} aoSalvar={recarregar} />}
      {janela === "matricular" && (
        <ModalMatricular aluno={aluno} planos={planos} aoFechar={fechar} aoSalvar={recarregar} />
      )}
      {janela === "ficha" && (
        <ModalMontarFicha
          aluno={{ id: aluno.id, nome: aluno.nome }}
          temFichaAtual={!!aluno.ficha}
          modelos={modelos}
          aoFechar={fechar}
        />
      )}
      {janela === "cancelar" &&<ModalCancelar alunoId={aluno.id} aoFechar={fechar} aoCancelar={recarregar} />}
      {janela && typeof janela === "object" && (
        <ModalReceber cobranca={janela.receber} aoFechar={fechar} aoReceber={recarregar} />
      )}
    </div>
  );
}

function Dado({ icone: Icone, rotulo, children }: { icone: LucideIcon; rotulo: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-ac-card-2 text-ac-muted">
        <Icone className="size-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] text-ac-muted">{rotulo}</dt>
        <dd className="truncate text-sm text-slate-100">{children}</dd>
      </div>
    </div>
  );
}

function Info({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-ac-line bg-ac-bg/40 px-3 py-2.5">
      <div className="text-[11px] text-ac-muted">{rotulo}</div>
      <div className="mt-0.5 text-sm font-semibold text-white">{children}</div>
    </div>
  );
}

function ModalCancelar({
  alunoId,
  aoCancelar,
  aoFechar,
}: {
  alunoId: string;
  aoCancelar: () => void;
  aoFechar: () => void;
}) {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function confirmar() {
    setSalvando(true);
    setErro(null);
    try {
      await apiAlunos.cancelarMatricula(alunoId);
      aoCancelar();
    } catch (e) {
      setErro(mensagemDe(e));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo="Cancelar matrícula?" aoFechar={aoFechar}>
      <p className="text-sm text-slate-300">
        As mensalidades em aberto serão canceladas e o aluno fica sem matrícula. As mensalidades já pagas continuam
        no histórico. Depois é possível matricular de novo.
      </p>
      <div className="mt-4">
        <MensagemErro texto={erro} />
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <Botao onClick={aoFechar}>Voltar</Botao>
        <Botao variante="perigo" carregando={salvando} onClick={confirmar}>
          Sim, cancelar matrícula
        </Botao>
      </div>
    </Modal>
  );
}
