import { createFileRoute, Link, useBlocker, useRouter } from "@tanstack/react-router";
import { Building2, Check, Clock, Link2, SlidersHorizontal, UserRound } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Botao, Campo, classeInput, MensagemErro, mensagemDe } from "../../components/academia/formulario";
import { CabecalhoPagina, Card, TituloCard } from "../../components/academia/ui";
import { apiAcesso, type Configuracoes } from "../../lib/academia-acesso";
import { fmt } from "../../lib/academia-alunos";

export const Route = createFileRoute("/academia/configuracoes")({
  loader: apiAcesso.configuracoes,
  component: PaginaConfiguracoes,
});

// "12345678000190" -> "12.345.678/0001-90"
const cnpj = (c: string | null) =>
  c ? c.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : "";

function PaginaConfiguracoes() {
  const inicial = Route.useLoaderData();
  const router = useRouter();
  const formatar = (c: Configuracoes): Configuracoes => ({
    ...c,
    telefone: c.telefone ? fmt.telefone(c.telefone) : "",
    cnpj: cnpj(c.cnpj),
    email: c.email ?? "",
    endereco: c.endereco ?? "",
  });
  const [original, setOriginal] = useState(() => formatar(inicial));
  const [c, setC] = useState(original);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const mudou = JSON.stringify(c) !== JSON.stringify(original);

  useBlocker({
    shouldBlockFn: () => mudou && !window.confirm("Sair sem salvar as alterações?"),
    enableBeforeUnload: () => mudou,
  });

  const mudar = <K extends keyof Configuracoes>(k: K, v: Configuracoes[K]) => {
    setC((x) => ({ ...x, [k]: v }));
    setSalvo(false);
  };
  const mudarHorario = (dia: number, campos: Partial<Configuracoes["horarios"][number]>) =>
    mudar(
      "horarios",
      c.horarios.map((h) => (h.diaSemana === dia ? { ...h, ...campos } : h)),
    );

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      const novo = formatar(await apiAcesso.salvarConfiguracoes(c));
      setOriginal(novo);
      setC(novo);
      setSalvo(true);
      await router.invalidate();
    } catch (e) {
      setErro(mensagemDe(e));
    }
    setSalvando(false);
  }

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina titulo="Configurações" descricao="Dados da academia, horário de funcionamento e regras gerais." />

      <div className="grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <TituloCard icone={Building2} cor="text-violet-400">
            Dados da academia
          </TituloCard>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Nome da academia *" className="sm:col-span-2">
              <input className={classeInput} value={c.nomeAcademia} onChange={(e) => mudar("nomeAcademia", e.target.value)} />
            </Campo>
            <Campo rotulo="CNPJ">
              <input
                className={classeInput}
                inputMode="numeric"
                value={c.cnpj ?? ""}
                onChange={(e) => mudar("cnpj", e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </Campo>
            <Campo rotulo="Telefone">
              <input
                className={classeInput}
                inputMode="tel"
                value={c.telefone ?? ""}
                onChange={(e) => mudar("telefone", e.target.value)}
                placeholder="(11) 3333-4444"
              />
            </Campo>
            <Campo rotulo="E-mail" className="sm:col-span-2">
              <input className={classeInput} type="email" value={c.email ?? ""} onChange={(e) => mudar("email", e.target.value)} />
            </Campo>
            <Campo rotulo="Endereço" className="sm:col-span-2">
              <input className={classeInput} value={c.endereco ?? ""} onChange={(e) => mudar("endereco", e.target.value)} />
            </Campo>
          </div>
        </Card>

        <Card>
          <TituloCard icone={UserRound} cor="text-sky-400">
            Gestor e painel
          </TituloCard>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Nome do gestor *">
              <input className={classeInput} value={c.gestorNome} onChange={(e) => mudar("gestorNome", e.target.value)} />
            </Campo>
            <Campo rotulo="Cargo">
              <input className={classeInput} value={c.gestorCargo} onChange={(e) => mudar("gestorCargo", e.target.value)} />
            </Campo>
            <Campo rotulo="Frase do Dashboard" className="sm:col-span-2">
              <input
                className={classeInput}
                value={c.frase}
                onChange={(e) => mudar("frase", e.target.value)}
                placeholder="Ex.: Disciplina hoje, resultado sempre."
              />
            </Campo>
          </div>
          <p className="mt-4 text-xs text-ac-muted">O nome do gestor aparece na saudação do Dashboard e no menu.</p>
        </Card>

        <Card>
          <TituloCard icone={Clock} cor="text-emerald-400">
            Horário de funcionamento
          </TituloCard>
          <ul className="mt-4 flex flex-col gap-2">
            {c.horarios.map((h) => (
              <li key={h.diaSemana} className="flex flex-wrap items-center gap-3">
                <span className="w-20 text-sm text-slate-300">{h.dia}</span>
                <label className="flex items-center gap-1.5 text-xs text-ac-muted">
                  <input
                    type="checkbox"
                    checked={!h.fechado}
                    onChange={(e) =>
                      mudarHorario(h.diaSemana, {
                        fechado: !e.target.checked,
                        abre: h.abre ?? "08:00",
                        fecha: h.fecha ?? "18:00",
                      })
                    }
                    className="accent-fuchsia-500"
                  />
                  Abre
                </label>
                {h.fechado ? (
                  <span className="text-sm text-ac-muted">Fechado</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      className={`${classeInput} h-9 w-28`}
                      value={h.abre ?? ""}
                      onChange={(e) => mudarHorario(h.diaSemana, { abre: e.target.value })}
                    />
                    <span className="text-xs text-ac-muted">às</span>
                    <input
                      type="time"
                      className={`${classeInput} h-9 w-28`}
                      value={h.fecha ?? ""}
                      onChange={(e) => mudarHorario(h.diaSemana, { fecha: e.target.value })}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ac-muted">
            Usado pela catraca (bloqueio fora do horário) e nos Horários de pico.
          </p>
        </Card>

        <Card>
          <TituloCard icone={SlidersHorizontal} cor="text-fuchsia-400">
            Regras do dia a dia
          </TituloCard>
          <div className="mt-4 flex flex-col gap-4">
            <Numero
              rotulo="Capacidade da academia"
              sufixo="pessoas ao mesmo tempo"
              valor={c.capacidade}
              aoMudar={(v) => mudar("capacidade", v)}
            >
              Base do cálculo de ocupação nos Horários de pico.
            </Numero>
            <Numero
              rotulo="Validade padrão da ficha de treino"
              sufixo="semanas"
              valor={c.validadeFichaSemanas}
              aoMudar={(v) => mudar("validadeFichaSemanas", v)}
            >
              Ao montar uma ficha nova, a validade já vem preenchida com esse prazo.
            </Numero>
            <Numero
              rotulo="Reavaliação física a cada"
              sufixo="dias"
              valor={c.reavaliacaoDias}
              aoMudar={(v) => mudar("reavaliacaoDias", v)}
            >
              Depois desse prazo, o aluno aparece como “reavaliação pendente”.
            </Numero>
          </div>
        </Card>
      </div>

      <Card>
        <TituloCard icone={Link2} cor="text-pink-400">
          Integração com o Cliente Plus
        </TituloCard>
        <div className="mt-3 grid gap-3 text-sm text-slate-300 md:grid-cols-3">
          <Info titulo="Alunos, planos e mensalidades">
            São os clientes, planos e pagamentos do Cliente Plus. Os planos são cadastrados em Produtos/Planos.
          </Info>
          <Info titulo="Comissões de indicação">
            Toda mensalidade recebida aqui é um pagamento confirmado e gera comissão para quem indicou o aluno.
          </Info>
          <Info titulo="Regras de entrada">
            Bloqueio de inadimplentes, tolerância e catracas ficam em{" "}
            <Link to="/academia/controle-de-acesso" className="text-violet-300 hover:text-violet-200">
              Controle de acesso
            </Link>
            .
          </Info>
        </div>
      </Card>

      <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-end gap-3 border-t border-ac-line bg-ac-bg/90 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <div className="mr-auto">
          <MensagemErro texto={erro} />
        </div>
        {salvo && !mudou && (
          <span className="flex items-center gap-1 text-sm text-emerald-300">
            <Check className="size-4" /> Configurações salvas
          </span>
        )}
        {mudou && (
          <Botao
            onClick={() => {
              setC(original);
              setErro(null);
            }}
          >
            Desfazer
          </Botao>
        )}
        <Botao variante="primario" disabled={!mudou} carregando={salvando} onClick={salvar}>
          <Check className="size-4" />
          Salvar configurações
        </Botao>
      </div>
    </div>
  );
}

function Numero({
  rotulo,
  sufixo,
  valor,
  aoMudar,
  children,
}: {
  rotulo: string;
  sufixo: string;
  valor: number;
  aoMudar: (v: number) => void;
  children: ReactNode;
}) {
  return (
    <div>
      <Campo rotulo={rotulo}>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            className={`${classeInput} !w-28`}
            value={valor}
            onChange={(e) => aoMudar(Number(e.target.value))}
          />
          <span className="text-sm text-slate-300">{sufixo}</span>
        </div>
      </Campo>
      <p className="mt-1 text-xs text-ac-muted">{children}</p>
    </div>
  );
}

function Info({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-ac-line bg-ac-bg/40 p-3">
      <div className="text-[13px] font-semibold text-white">{titulo}</div>
      <p className="mt-1 text-xs leading-relaxed text-ac-muted">{children}</p>
    </div>
  );
}
