import { Link, useBlocker, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Calculator, Check, HeartPulse, Ruler, Scale, Stethoscope } from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  apiAvaliacoes,
  calcularImc,
  camposDobras,
  camposMedidas,
  classificarImc,
  corImc,
  num,
  pollock7,
  rotuloImc,
  rotuloMetodo,
  type DadosAvaliacao,
  type Dobras,
  type Medidas,
  type MetodoGordura,
} from "../../lib/academia-avaliacoes";
import type { Profissional } from "../../lib/academia-treinos";
import { AvatarAluno } from "./Selos";
import { Botao, Campo, classeInput, MensagemErro, mensagemDe } from "./formulario";
import { Card, TituloCard } from "./ui";

// "72,5" -> 72.5; vazio -> null
function lerNumero(t: string): number | null {
  const limpo = t.replace(/\s/g, "").replace(",", ".");
  if (!limpo) return null;
  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
}

const mostrar = (v: number | null) => (v === null ? "" : String(v).replace(".", ","));

// Campo numérico que aceita vírgula (72,5).
function CampoNumero({
  rotulo,
  valor,
  aoMudar,
  unidade,
  placeholder,
}: {
  rotulo: string;
  valor: number | null;
  aoMudar: (v: number | null) => void;
  unidade?: string;
  placeholder?: string;
}) {
  const [texto, setTexto] = useState(mostrar(valor));
  return (
    <Campo rotulo={rotulo}>
      <div className="relative">
        <input
          inputMode="decimal"
          className={`${classeInput} ${unidade ? "pr-11" : ""}`}
          value={texto}
          placeholder={placeholder}
          onChange={(e) => {
            setTexto(e.target.value);
            aoMudar(lerNumero(e.target.value));
          }}
        />
        {unidade && (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-ac-muted">
            {unidade}
          </span>
        )}
      </div>
    </Campo>
  );
}

export function FormAvaliacao({
  aluno,
  inicial,
  avaliacaoId,
  profissionais,
  idadeCalculada,
}: {
  aluno: { id: string; nome: string };
  inicial: DadosAvaliacao;
  avaliacaoId?: string;
  profissionais: Profissional[];
  // idade pela data de nascimento (null = não cadastrada: pede a idade)
  idadeCalculada: number | null;
}) {
  const navigate = useNavigate();
  const [d, setD] = useState(inicial);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const alterado = !salvo && JSON.stringify(d) !== JSON.stringify(inicial);

  useBlocker({
    shouldBlockFn: () => alterado && !window.confirm("Sair sem salvar a avaliação?"),
    enableBeforeUnload: () => alterado,
  });

  const mudar = <K extends keyof DadosAvaliacao>(k: K, v: DadosAvaliacao[K]) => setD((x) => ({ ...x, [k]: v }));
  const mudarDobra = (k: keyof Dobras, v: number | null) => setD((x) => ({ ...x, dobras: { ...x.dobras, [k]: v } }));
  const mudarMedida = (k: keyof Medidas, v: number | null) =>
    setD((x) => ({ ...x, medidas: { ...x.medidas, [k]: v } }));

  const idade = idadeCalculada ?? d.idade;
  const imc = calcularImc(d.peso, d.alturaCm);
  const gordura =
    d.metodoGordura === "dobras_pollock7"
      ? pollock7(d.dobras, d.sexo, idade)
      : d.metodoGordura === "bioimpedancia"
        ? d.gorduraPct
        : null;
  const massaGorda = gordura !== null && d.peso ? Math.round(d.peso * gordura) / 100 : null;
  const massaMagra = massaGorda !== null && d.peso ? Math.round((d.peso - massaGorda) * 10) / 10 : null;

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      const dados = { ...d, idade };
      if (avaliacaoId) await apiAvaliacoes.atualizar(avaliacaoId, dados);
      else await apiAvaliacoes.cadastrar(dados);
      setSalvo(true);
      setTimeout(() => navigate({ to: "/academia/avaliacao-fisica/$alunoId", params: { alunoId: aluno.id } }));
    } catch (e) {
      setErro(mensagemDe(e));
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 py-4">
      <Link
        to="/academia/avaliacao-fisica/$alunoId"
        params={{ alunoId: aluno.id }}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-ac-muted hover:text-white"
      >
        <ArrowLeft className="size-4" />
        Avaliações de {aluno.nome.split(" ")[0]}
      </Link>

      <div className="flex flex-wrap items-center gap-4">
        <AvatarAluno nome={aluno.nome} grande />
        <div>
          <h1 className="font-poppins text-2xl font-bold text-white">
            {avaliacaoId ? "Editar avaliação" : "Nova avaliação física"}
          </h1>
          <p className="text-sm text-ac-muted">{aluno.nome}</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] [&>*]:min-w-0">
        <div className="flex flex-col gap-5">
          <Card>
            <TituloCard icone={Stethoscope} cor="text-sky-400">
              Dados da avaliação
            </TituloCard>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Campo rotulo="Data *">
                <input type="date" className={classeInput} value={d.data} onChange={(e) => mudar("data", e.target.value)} />
              </Campo>
              <Campo rotulo="Avaliador">
                <select
                  className={classeInput}
                  value={d.profissionalId ?? ""}
                  onChange={(e) => mudar("profissionalId", e.target.value || null)}
                >
                  <option value="">—</option>
                  {profissionais
                    .filter((p) => p.ativo || p.id === d.profissionalId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                </select>
              </Campo>
              <Campo rotulo="Sexo * (usado nos cálculos)">
                <div className="grid grid-cols-2 gap-2">
                  {(["F", "M"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => mudar("sexo", s)}
                      className={`h-10 rounded-xl border text-sm font-medium transition ${
                        d.sexo === s
                          ? "border-violet-500 bg-violet-600/25 text-white"
                          : "border-ac-line text-slate-300 hover:border-slate-600"
                      }`}
                    >
                      {s === "F" ? "Feminino" : "Masculino"}
                    </button>
                  ))}
                </div>
              </Campo>
              {idadeCalculada !== null ? (
                <Campo rotulo="Idade">
                  <div className={`${classeInput} flex items-center text-slate-300`}>{idadeCalculada} anos</div>
                </Campo>
              ) : (
                <CampoNumero rotulo="Idade *" unidade="anos" valor={d.idade} aoMudar={(v) => mudar("idade", v)} />
              )}
            </div>
          </Card>

          <Card>
            <TituloCard icone={Scale} cor="text-violet-400">
              Composição corporal
            </TituloCard>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <CampoNumero rotulo="Peso *" unidade="kg" placeholder="72,5" valor={d.peso} aoMudar={(v) => mudar("peso", v)} />
              <CampoNumero
                rotulo="Altura *"
                unidade="cm"
                placeholder="175"
                valor={d.alturaCm}
                aoMudar={(v) => mudar("alturaCm", v)}
              />
            </div>

            <div className="mt-5 text-xs font-medium text-slate-300">% de gordura</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {(Object.keys(rotuloMetodo) as MetodoGordura[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => mudar("metodoGordura", m)}
                  className={`h-10 rounded-xl border px-3 text-sm font-medium transition ${
                    d.metodoGordura === m
                      ? "border-violet-500 bg-violet-600/25 text-white"
                      : "border-ac-line text-slate-300 hover:border-slate-600"
                  }`}
                >
                  {rotuloMetodo[m]}
                </button>
              ))}
            </div>

            {d.metodoGordura === "bioimpedancia" && (
              <div className="mt-4 max-w-56">
                <CampoNumero
                  rotulo="% de gordura medido *"
                  unidade="%"
                  valor={d.gorduraPct}
                  aoMudar={(v) => mudar("gorduraPct", v)}
                />
              </div>
            )}
            {d.metodoGordura === "dobras_pollock7" && (
              <>
                <p className="mt-3 text-xs text-ac-muted">
                  Dobras cutâneas em milímetros, medidas com adipômetro no lado direito do corpo.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {camposDobras.map((c) => (
                    <CampoNumero
                      key={c.campo}
                      rotulo={c.rotulo}
                      unidade="mm"
                      valor={d.dobras[c.campo]}
                      aoMudar={(v) => mudarDobra(c.campo, v)}
                    />
                  ))}
                </div>
                {!d.sexo || !idade ? (
                  <p className="mt-3 text-xs text-amber-300">Informe o sexo e a idade para calcular.</p>
                ) : null}
              </>
            )}
          </Card>

          <Card>
            <TituloCard icone={Ruler} cor="text-emerald-400">
              Medidas (circunferências)
            </TituloCard>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {camposMedidas.map((c) => (
                <CampoNumero
                  key={c.campo}
                  rotulo={c.rotulo}
                  unidade="cm"
                  valor={d.medidas[c.campo]}
                  aoMudar={(v) => mudarMedida(c.campo, v)}
                />
              ))}
            </div>
          </Card>

          <Card>
            <TituloCard icone={HeartPulse} cor="text-red-400">
              Saúde e objetivo
            </TituloCard>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <CampoNumero
                rotulo="Pressão (máxima)"
                unidade="mmHg"
                placeholder="120"
                valor={d.pressaoSistolica}
                aoMudar={(v) => mudar("pressaoSistolica", v)}
              />
              <CampoNumero
                rotulo="Pressão (mínima)"
                unidade="mmHg"
                placeholder="80"
                valor={d.pressaoDiastolica}
                aoMudar={(v) => mudar("pressaoDiastolica", v)}
              />
              <CampoNumero
                rotulo="Frequência cardíaca em repouso"
                unidade="bpm"
                valor={d.fcRepouso}
                aoMudar={(v) => mudar("fcRepouso", v)}
              />
            </div>
            <div className="mt-4 grid gap-4">
              <Campo rotulo="Objetivo">
                <input
                  className={classeInput}
                  value={d.objetivo}
                  onChange={(e) => mudar("objetivo", e.target.value)}
                  placeholder="Ex.: emagrecimento, ganho de massa, condicionamento"
                />
              </Campo>
              <Campo rotulo="Restrições, lesões, doenças ou medicamentos">
                <textarea
                  rows={2}
                  className={`${classeInput} h-auto py-2`}
                  value={d.restricoes}
                  onChange={(e) => mudar("restricoes", e.target.value)}
                  placeholder="O professor vê isso ao montar a ficha de treino"
                />
              </Campo>
              <Campo rotulo="Observações">
                <textarea
                  rows={3}
                  className={`${classeInput} h-auto py-2`}
                  value={d.observacoes}
                  onChange={(e) => mudar("observacoes", e.target.value)}
                />
              </Campo>
            </div>
          </Card>
        </div>

        <div className="xl:sticky xl:top-20 xl:h-fit">
          <Card>
            <TituloCard icone={Calculator} cor="text-fuchsia-400">
              Resultado
            </TituloCard>
            <dl className="mt-4 flex flex-col gap-3">
              <Resultado rotulo="IMC">
                {imc !== null ? (
                  <>
                    {num(imc)}
                    <span className={`ml-2 text-xs font-medium ${corImc[classificarImc(imc)]}`}>
                      {rotuloImc[classificarImc(imc)]}
                    </span>
                  </>
                ) : (
                  "—"
                )}
              </Resultado>
              <Resultado rotulo="% de gordura">{gordura !== null ? `${num(gordura)}%` : "—"}</Resultado>
              <Resultado rotulo="Massa gorda">{massaGorda !== null ? `${num(massaGorda)} kg` : "—"}</Resultado>
              <Resultado rotulo="Massa magra">{massaMagra !== null ? `${num(massaMagra)} kg` : "—"}</Resultado>
              <Resultado rotulo="Relação cintura/quadril">
                {d.medidas.cintura && d.medidas.quadril ? num(d.medidas.cintura / d.medidas.quadril, 2) : "—"}
              </Resultado>
            </dl>
            <div className="mt-5 flex flex-col gap-3">
              <MensagemErro texto={erro} />
              <Botao variante="primario" carregando={salvando} onClick={salvar}>
                <Check className="size-4" />
                {avaliacaoId ? "Salvar alterações" : "Salvar avaliação"}
              </Botao>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Resultado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-ac-line/70 pb-2.5">
      <dt className="text-[13px] text-ac-muted">{rotulo}</dt>
      <dd className="text-right font-poppins text-lg font-bold text-white">{children}</dd>
    </div>
  );
}
