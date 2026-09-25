import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  Check,
  Clock,
  Copy,
  Cpu,
  DoorOpen,
  FingerprintPattern,
  History,
  Lock,
  LockOpen,
  Pencil,
  Plus,
  ScanFace,
  ShieldCheck,
  ShieldX,
  TestTube,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { ModalResultadoAcesso, SeloAcesso } from "../../components/academia/ResultadoAcesso";
import { SeletorAluno } from "../../components/academia/SeletorAluno";
import { AvatarAluno } from "../../components/academia/Selos";
import {
  Botao,
  Campo,
  classeInput,
  Interruptor,
  MensagemErro,
  mensagemDe,
  Modal,
} from "../../components/academia/formulario";
import { Abas, CabecalhoPagina, Card, TituloCard, Vazio } from "../../components/academia/ui";
import {
  apiAcesso,
  diaHora,
  rotuloMeio,
  rotuloMotivo,
  rotuloTipoDispositivo,
  type Acesso,
  type DadosDispositivo,
  type Dispositivo,
  type Regras,
  type ResultadoAcesso,
  type TipoDispositivo,
} from "../../lib/academia-acesso";
import { apiAlunos, fmt, type AlunoResumo } from "../../lib/academia-alunos";

// Regras de entrada, alunos bloqueados, catracas/leitores e histórico.
export const Route = createFileRoute("/academia/controle-de-acesso")({
  loader: async () => {
    const [painel, alunos] = await Promise.all([apiAcesso.painel(), apiAlunos.listar()]);
    return { painel, alunos: alunos.alunos };
  },
  component: PaginaControleAcesso,
});

type Janela = "bloquear" | "novo_dispositivo" | { editar: Dispositivo } | { testar: Dispositivo } | null;

function PaginaControleAcesso() {
  const { painel, alunos } = Route.useLoaderData();
  const router = useRouter();
  const [janela, setJanela] = useState<Janela>(null);
  const recarregar = async () => {
    await router.invalidate();
    setJanela(null);
  };

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina
        titulo="Controle de acesso"
        descricao="Quem pode entrar, catracas e leitores, e o registro de todas as entradas."
      >
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
            painel.abertoAgora ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-500/20 text-slate-300"
          }`}
        >
          <span className="size-2 rounded-full bg-current" />
          {painel.abertoAgora ? "Academia aberta agora" : "Academia fechada agora"}
        </span>
      </CabecalhoPagina>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] [&>*]:min-w-0">
        <CardRegras regras={painel.regras} aoSalvar={() => router.invalidate()} />

        <Card>
          <TituloCard
            icone={Clock}
            cor="text-sky-400"
            acao={
              <Link to="/academia/configuracoes" className="text-xs font-medium text-violet-300 hover:text-violet-200">
                Alterar
              </Link>
            }
          >
            Horário de funcionamento
          </TituloCard>
          <ul className="mt-4 divide-y divide-ac-line/70 text-sm">
            {painel.horarios.map((h) => (
              <li key={h.diaSemana} className="flex items-center justify-between py-2">
                <span className="text-slate-300">{h.dia}</span>
                <span className={h.fechado ? "text-ac-muted" : "font-medium text-white"}>
                  {h.fechado ? "Fechado" : `${h.abre} às ${h.fecha}`}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="!p-0">
        <div className="p-5 pb-3">
          <TituloCard
            icone={ShieldX}
            cor="text-red-400"
            acao={
              <Botao onClick={() => setJanela("bloquear")}>
                <Lock className="size-4" />
                Bloquear aluno
              </Botao>
            }
          >
            Alunos bloqueados agora
            <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-300">{painel.bloqueados.length}</span>
          </TituloCard>
        </div>
        {painel.bloqueados.length === 0 ? (
          <Vazio icone={ShieldCheck}>Nenhum aluno bloqueado.</Vazio>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead>
                <tr className="border-y border-ac-line text-[11.5px] tracking-wide text-ac-muted uppercase">
                  <th className="py-2.5 pr-3 pl-5 font-medium">Aluno</th>
                  <th className="py-2.5 pr-3 font-medium">Motivo</th>
                  <th className="py-2.5 pr-3 font-medium">Bloqueado desde</th>
                  <th className="py-2.5 pr-5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ac-line/70">
                {painel.bloqueados.map((b) => (
                  <tr key={b.alunoId}>
                    <td className="py-2.5 pr-3 pl-5">
                      <Link
                        to="/academia/alunos/$id"
                        params={{ id: b.alunoId }}
                        className="flex items-center gap-2.5 font-medium text-slate-100 hover:text-violet-300"
                      >
                        <AvatarAluno nome={b.nome} />
                        {b.nome}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="font-medium text-red-300">{rotuloMotivo[b.motivo]}</div>
                      <div className="text-[11.5px] text-ac-muted">{b.detalhe}</div>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-300">{fmt.data(b.desde)}</td>
                    <td className="py-2.5 pr-5 text-right">
                      {b.manual && b.bloqueioId ? (
                        <BotaoDesbloquear bloqueioId={b.bloqueioId} aoDesbloquear={() => router.invalidate()} />
                      ) : (
                        <Link
                          to="/academia/alunos/$id"
                          params={{ id: b.alunoId }}
                          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                        >
                          Receber mensalidade
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <TituloCard
          icone={Cpu}
          cor="text-violet-400"
          acao={
            <Botao onClick={() => setJanela("novo_dispositivo")}>
              <Plus className="size-4" />
              Adicionar dispositivo
            </Botao>
          }
        >
          Catracas e leitores
        </TituloCard>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {painel.dispositivos.map((d) => (
            <CardDispositivo
              key={d.id}
              dispositivo={d}
              aoEditar={() => setJanela({ editar: d })}
              aoTestar={() => setJanela({ testar: d })}
            />
          ))}
          {painel.dispositivos.length === 0 && (
            <p className="text-sm text-ac-muted">Nenhum dispositivo. O check-in pode ser feito pela recepção.</p>
          )}
        </div>
        <details className="mt-4 rounded-xl border border-ac-line bg-ac-bg/40 px-4 py-3 text-xs text-ac-muted">
          <summary className="cursor-pointer text-sm font-medium text-slate-200">Como ligar uma catraca de verdade</summary>
          <p className="mt-2 leading-relaxed">
            O programa da catraca (ou o técnico que instala) chama o endereço{" "}
            <code className="rounded bg-ac-card-2 px-1.5 py-0.5 text-violet-200">POST /api/academia/acesso/dispositivos/entrada</code>{" "}
            enviando o <b>token</b> do dispositivo e o <b>CPF</b> do aluno (ou o código do QR code). A resposta diz se a
            catraca deve abrir: <b>liberado</b> ou <b>repetido</b> = abrir; <b>bloqueado</b> = não abrir e mostrar o
            motivo. Use “Testar entrada” para ver exatamente o que a catraca recebe.
          </p>
        </details>
      </Card>

      <Historico historico={painel.historico} />

      {janela === "bloquear" && <ModalBloquear alunos={alunos} aoFechar={() => setJanela(null)} aoSalvar={recarregar} />}
      {janela === "novo_dispositivo" && <ModalDispositivo aoFechar={() => setJanela(null)} aoSalvar={recarregar} />}
      {janela && typeof janela === "object" && "editar" in janela && (
        <ModalDispositivo dispositivo={janela.editar} aoFechar={() => setJanela(null)} aoSalvar={recarregar} />
      )}
      {janela && typeof janela === "object" && "testar" in janela && (
        <ModalTestar
          dispositivo={janela.testar}
          alunos={alunos}
          aoFechar={async () => {
            await router.invalidate();
            setJanela(null);
          }}
        />
      )}
    </div>
  );
}

// ---------- Regras ----------

function CardRegras({ regras, aoSalvar }: { regras: Regras; aoSalvar: () => void }) {
  const [r, setR] = useState(regras);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const mudou = JSON.stringify(r) !== JSON.stringify(regras);
  const mudar = <K extends keyof Regras>(k: K, v: Regras[K]) => {
    setR((x) => ({ ...x, [k]: v }));
    setSalvo(false);
  };

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      await apiAcesso.salvarRegras(r);
      setSalvo(true);
      aoSalvar();
    } catch (e) {
      setErro(mensagemDe(e));
    }
    setSalvando(false);
  }

  return (
    <Card>
      <TituloCard icone={DoorOpen} cor="text-emerald-400">
        Regras de entrada
      </TituloCard>
      <div className="mt-4 flex flex-col gap-4">
        <Interruptor
          ligado={r.bloquearInadimplentes}
          aoMudar={(v) => mudar("bloquearInadimplentes", v)}
          titulo="Bloquear quem está com a mensalidade atrasada"
          descricao="Depois da tolerância abaixo, a catraca não abre até o pagamento."
        />
        {r.bloquearInadimplentes && (
          <Campo rotulo="Tolerância (dias depois do vencimento)" className="ml-14 max-w-72">
            <input
              type="number"
              min={0}
              max={60}
              className={classeInput}
              value={r.toleranciaAtrasoDias}
              onChange={(e) => mudar("toleranciaAtrasoDias", Number(e.target.value))}
            />
          </Campo>
        )}
        <Interruptor
          ligado={r.bloquearForaDoHorario}
          aoMudar={(v) => mudar("bloquearForaDoHorario", v)}
          titulo="Bloquear fora do horário de funcionamento"
        />
        <Campo rotulo="Entrada repetida não conta de novo por (minutos)" className="max-w-72">
          <input
            type="number"
            min={0}
            max={720}
            className={classeInput}
            value={r.intervaloCheckinMinutos}
            onChange={(e) => mudar("intervaloCheckinMinutos", Number(e.target.value))}
          />
        </Campo>
        <p className="text-xs text-ac-muted">Alunos sem matrícula ativa e bloqueados pela academia nunca entram.</p>
        <MensagemErro texto={erro} />
        <div className="flex items-center justify-end gap-3">
          {salvo && !mudou && (
            <span className="flex items-center gap-1 text-xs text-emerald-300">
              <Check className="size-3.5" /> Salvo
            </span>
          )}
          <Botao variante="primario" disabled={!mudou} carregando={salvando} onClick={salvar}>
            Salvar regras
          </Botao>
        </div>
      </div>
    </Card>
  );
}

function BotaoDesbloquear({ bloqueioId, aoDesbloquear }: { bloqueioId: string; aoDesbloquear: () => void }) {
  const [salvando, setSalvando] = useState(false);
  return (
    <button
      type="button"
      disabled={salvando}
      onClick={async () => {
        setSalvando(true);
        await apiAcesso.desbloquear(bloqueioId).catch(() => null);
        aoDesbloquear();
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-ac-line px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-emerald-500/50 hover:text-emerald-300 disabled:opacity-60"
    >
      <LockOpen className="size-3.5" />
      Desbloquear
    </button>
  );
}

function ModalBloquear({
  alunos,
  aoSalvar,
  aoFechar,
}: {
  alunos: AlunoResumo[];
  aoSalvar: () => void;
  aoFechar: () => void;
}) {
  const [alunoId, setAlunoId] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!alunoId) return setErro("Escolha o aluno");
    setSalvando(true);
    setErro(null);
    try {
      await apiAcesso.bloquear(alunoId, motivo);
      aoSalvar();
    } catch (e) {
      setErro(mensagemDe(e));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo="Bloquear aluno" subtitulo="O aluno não entra até ser desbloqueado." aoFechar={aoFechar}>
      <form onSubmit={salvar} className="flex flex-col gap-4">
        <Campo rotulo="Aluno *">
          <SeletorAluno alunos={alunos} valor={alunoId} aoMudar={setAlunoId} autoFocus />
        </Campo>
        <Campo rotulo="Motivo *">
          <input
            className={classeInput}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex.: atestado médico pendente"
          />
        </Campo>
        <MensagemErro texto={erro} />
        <div className="flex justify-end gap-3">
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao type="submit" variante="perigo" carregando={salvando}>
            <Lock className="size-4" />
            Bloquear
          </Botao>
        </div>
      </form>
    </Modal>
  );
}

// ---------- Dispositivos ----------

const iconeTipo: Record<TipoDispositivo, LucideIcon> = {
  catraca: DoorOpen,
  leitor_facial: ScanFace,
  leitor_biometrico: FingerprintPattern,
  totem_qr: Cpu,
};

function online(d: Dispositivo) {
  return !!d.ultimoContato && Date.now() - new Date(d.ultimoContato).getTime() < 15 * 60_000;
}

function CardDispositivo({
  dispositivo: d,
  aoEditar,
  aoTestar,
}: {
  dispositivo: Dispositivo;
  aoEditar: () => void;
  aoTestar: () => void;
}) {
  const [copiado, setCopiado] = useState(false);
  const Icone = iconeTipo[d.tipo];
  const status = !d.ativo
    ? { texto: "Desativado", cor: "text-slate-400" }
    : !d.ultimoContato
      ? { texto: "Aguardando conexão", cor: "text-amber-300" }
      : online(d)
        ? { texto: "Conectado", cor: "text-emerald-300" }
        : { texto: `Sem sinal desde ${diaHora(d.ultimoContato)}`, cor: "text-red-300" };

  return (
    <div className={`rounded-2xl border border-ac-line bg-ac-bg/40 p-4 ${d.ativo ? "" : "opacity-60"}`}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-300">
          <Icone className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-white">{d.nome}</div>
          <div className="truncate text-xs text-ac-muted">
            {rotuloTipoDispositivo[d.tipo]}
            {d.fabricante && ` · ${d.fabricante}`}
          </div>
        </div>
        <button
          type="button"
          onClick={aoEditar}
          aria-label={`Editar ${d.nome}`}
          className="rounded-lg p-2 text-ac-muted hover:bg-white/5 hover:text-white"
        >
          <Pencil className="size-4" />
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className={`flex items-center gap-1.5 font-medium ${status.cor}`}>
          <span className="size-1.5 rounded-full bg-current" />
          {status.texto}
        </span>
        <span className="text-slate-300">{d.acessosHoje} entradas hoje</span>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-ac-card-2 px-2.5 py-1.5">
        <span className="text-[11px] text-ac-muted">Token</span>
        <code className="min-w-0 flex-1 truncate text-[11px] text-slate-300">{d.token}</code>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(d.token);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 1500);
          }}
          aria-label="Copiar token"
          className="text-ac-muted hover:text-white"
        >
          {copiado ? <Check className="size-3.5 text-emerald-300" /> : <Copy className="size-3.5" />}
        </button>
      </div>
      <Botao className="mt-3 w-full" disabled={!d.ativo} onClick={aoTestar}>
        <TestTube className="size-4" />
        Testar entrada
      </Botao>
    </div>
  );
}

function ModalDispositivo({
  dispositivo,
  aoSalvar,
  aoFechar,
}: {
  dispositivo?: Dispositivo;
  aoSalvar: () => void;
  aoFechar: () => void;
}) {
  const [d, setD] = useState<DadosDispositivo>({
    nome: dispositivo?.nome ?? "",
    tipo: dispositivo?.tipo ?? "catraca",
    fabricante: dispositivo?.fabricante ?? "",
    identificador: dispositivo?.identificador ?? "",
    ativo: dispositivo?.ativo ?? true,
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      if (dispositivo) await apiAcesso.atualizarDispositivo(dispositivo.id, d);
      else await apiAcesso.cadastrarDispositivo(d);
      aoSalvar();
    } catch (e) {
      setErro(mensagemDe(e));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={dispositivo ? "Editar dispositivo" : "Adicionar dispositivo"} aoFechar={aoFechar}>
      <form onSubmit={salvar} className="flex flex-col gap-4">
        <Campo rotulo="Nome *">
          <input
            autoFocus
            className={classeInput}
            value={d.nome}
            onChange={(e) => setD({ ...d, nome: e.target.value })}
            placeholder="Ex.: Catraca da entrada"
          />
        </Campo>
        <Campo rotulo="Tipo *">
          <select
            className={classeInput}
            value={d.tipo}
            onChange={(e) => setD({ ...d, tipo: e.target.value as TipoDispositivo })}
          >
            {(Object.keys(rotuloTipoDispositivo) as TipoDispositivo[]).map((t) => (
              <option key={t} value={t}>
                {rotuloTipoDispositivo[t]}
              </option>
            ))}
          </select>
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Fabricante">
            <input
              className={classeInput}
              value={d.fabricante}
              onChange={(e) => setD({ ...d, fabricante: e.target.value })}
              placeholder="Ex.: Henry, Control iD, Topdata"
            />
          </Campo>
          <Campo rotulo="Número de série ou IP">
            <input
              className={classeInput}
              value={d.identificador}
              onChange={(e) => setD({ ...d, identificador: e.target.value })}
            />
          </Campo>
        </div>
        {dispositivo && (
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={d.ativo ?? true}
              onChange={(e) => setD({ ...d, ativo: e.target.checked })}
              className="accent-fuchsia-500"
            />
            Ativo (desmarque para parar de aceitar entradas deste dispositivo)
          </label>
        )}
        {!dispositivo && (
          <p className="text-xs text-ac-muted">
            Depois de salvar, o dispositivo recebe um token. Ele é usado para ligar a catraca ao sistema.
          </p>
        )}
        <MensagemErro texto={erro} />
        <div className="flex justify-end gap-3">
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao type="submit" variante="primario" carregando={salvando}>
            <Check className="size-4" />
            Salvar
          </Botao>
        </div>
      </form>
    </Modal>
  );
}

// Simula a catraca: manda o CPF (ou o aluno escolhido) com o token.
function ModalTestar({
  dispositivo,
  alunos,
  aoFechar,
}: {
  dispositivo: Dispositivo;
  alunos: AlunoResumo[];
  aoFechar: () => void;
}) {
  const [modo, setModo] = useState<"aluno" | "cpf">("aluno");
  const [alunoId, setAlunoId] = useState<string | null>(null);
  const [cpf, setCpf] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoAcesso | null>(null);

  async function testar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      setResultado(
        await apiAcesso.entradaDispositivo(
          dispositivo.token,
          modo === "cpf" ? { documento: cpf } : { alunoId: alunoId ?? undefined },
        ),
      );
    } catch (e) {
      setErro(mensagemDe(e));
    }
    setEnviando(false);
  }

  if (resultado) {
    return <ModalResultadoAcesso resultado={resultado} podeLiberar={false} aoFechar={aoFechar} />;
  }

  return (
    <Modal titulo="Testar entrada" subtitulo={`Simula um aluno passando em “${dispositivo.nome}”`} aoFechar={aoFechar}>
      <form onSubmit={testar} className="flex flex-col gap-4">
        <Abas
          abas={[
            { valor: "aluno", rotulo: "Escolher aluno" },
            { valor: "cpf", rotulo: "Digitar CPF" },
          ]}
          valor={modo}
          aoMudar={setModo}
        />
        {modo === "aluno" ? (
          <SeletorAluno alunos={alunos} valor={alunoId} aoMudar={setAlunoId} autoFocus />
        ) : (
          <Campo rotulo="CPF do aluno">
            <input
              autoFocus
              inputMode="numeric"
              className={classeInput}
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="000.000.000-00"
            />
          </Campo>
        )}
        <p className="text-xs text-ac-muted">
          O teste registra uma entrada de verdade no histórico, igual a catraca faria.
        </p>
        <MensagemErro texto={erro} />
        <div className="flex justify-end gap-3">
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao type="submit" variante="primario" carregando={enviando} disabled={modo === "aluno" && !alunoId}>
            Passar na catraca
          </Botao>
        </div>
      </form>
    </Modal>
  );
}

// ---------- Histórico ----------

type FiltroHistorico = "todos" | "liberados" | "bloqueados" | "manuais";

function Historico({ historico }: { historico: Acesso[] }) {
  const [filtro, setFiltro] = useState<FiltroHistorico>("todos");
  const lista = useMemo(
    () =>
      historico.filter((a) =>
        filtro === "todos"
          ? true
          : filtro === "liberados"
            ? a.resultado === "liberado"
            : filtro === "bloqueados"
              ? a.resultado === "bloqueado"
              : a.liberadoManual,
      ),
    [historico, filtro],
  );

  return (
    <Card className="!p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
        <TituloCard icone={History} cor="text-sky-400">
          Últimas entradas
        </TituloCard>
        <Abas
          abas={[
            { valor: "todos", rotulo: "Todas" },
            { valor: "liberados", rotulo: "Liberadas" },
            { valor: "bloqueados", rotulo: "Bloqueadas", quantidade: historico.filter((a) => a.resultado === "bloqueado").length },
            { valor: "manuais", rotulo: "Liberadas na recepção", quantidade: historico.filter((a) => a.liberadoManual).length },
          ]}
          valor={filtro}
          aoMudar={setFiltro}
        />
      </div>
      {lista.length === 0 ? (
        <Vazio icone={History}>Nenhuma entrada por aqui.</Vazio>
      ) : (
        <div className="max-h-[480px] overflow-auto">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead className="sticky top-0 bg-ac-card">
              <tr className="border-y border-ac-line text-[11.5px] tracking-wide text-ac-muted uppercase">
                <th className="py-2.5 pr-3 pl-5 font-medium">Quando</th>
                <th className="py-2.5 pr-3 font-medium">Aluno</th>
                <th className="py-2.5 pr-3 font-medium">Por onde</th>
                <th className="py-2.5 pr-5 font-medium">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ac-line/70">
              {lista.map((a) => (
                <tr key={a.id}>
                  <td className="py-2.5 pr-3 pl-5 whitespace-nowrap text-slate-200">{diaHora(a.momento)}</td>
                  <td className="py-2.5 pr-3">
                    <Link
                      to="/academia/alunos/$id"
                      params={{ id: a.alunoId }}
                      className="font-medium text-slate-100 hover:text-violet-300"
                    >
                      {a.aluno}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-3 text-slate-300">{a.dispositivo ?? rotuloMeio[a.meio]}</td>
                  <td className="py-2.5 pr-5">
                    <SeloAcesso resultado={a.resultado} manual={a.liberadoManual} />
                    {a.motivo && <span className="ml-2 text-[11px] text-ac-muted">{rotuloMotivo[a.motivo]}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
