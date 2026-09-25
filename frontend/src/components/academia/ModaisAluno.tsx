import { Check } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  apiAlunos,
  fmt,
  hojeIso,
  periodicidade,
  type AlunoDetalhe,
  type DadosAluno,
  type Plano,
} from "../../lib/academia-alunos";
import { Botao, Campo, classeInput, MensagemErro, mensagemDe, Modal } from "./formulario";

// Máscaras enquanto digita: "(11) 98765-4321" e "123.456.789-01".
function mascaraTelefone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function mascaraCpf(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

// Cadastro (aluno ausente) ou edição (aluno presente). No cadastro dá para já
// escolher o plano e matricular no mesmo passo.
export function ModalAluno({
  aluno,
  planos = [],
  aoSalvar,
  aoFechar,
}: {
  aluno?: AlunoDetalhe;
  planos?: Plano[];
  aoSalvar: (aluno: AlunoDetalhe) => void;
  aoFechar: () => void;
}) {
  const [dados, setDados] = useState<DadosAluno>({
    nome: aluno?.nome ?? "",
    email: aluno?.email ?? "",
    telefone: aluno?.telefone ? mascaraTelefone(aluno.telefone) : "",
    cpf: aluno?.cpf ? mascaraCpf(aluno.cpf) : "",
    dataNascimento: aluno?.dataNascimento ?? null,
  });
  const [planoId, setPlanoId] = useState("");
  const [inicio, setInicio] = useState(hojeIso());
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const mudar = (campo: keyof DadosAluno, valor: string) =>
    setDados((d) => ({ ...d, [campo]: campo === "dataNascimento" ? valor || null : valor }));

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      let salvo = aluno ? await apiAlunos.atualizar(aluno.id, dados) : await apiAlunos.cadastrar(dados);
      if (!aluno && planoId) salvo = await apiAlunos.matricular(salvo.id, planoId, inicio);
      aoSalvar(salvo);
    } catch (e) {
      setErro(mensagemDe(e));
      setSalvando(false);
    }
  }

  return (
    <Modal
      titulo={aluno ? "Editar aluno" : "Novo aluno"}
      subtitulo={aluno ? aluno.nome : "Cadastre o aluno e, se quiser, já faça a matrícula."}
      aoFechar={aoFechar}
      largura="max-w-xl"
    >
      <form onSubmit={salvar} className="flex flex-col gap-4">
        <Campo rotulo="Nome completo *">
          <input
            autoFocus
            className={classeInput}
            value={dados.nome}
            onChange={(e) => mudar("nome", e.target.value)}
            placeholder="Ex.: Maria da Silva"
          />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Telefone (WhatsApp)">
            <input
              className={classeInput}
              inputMode="tel"
              value={dados.telefone ?? ""}
              onChange={(e) => mudar("telefone", mascaraTelefone(e.target.value))}
              placeholder="(11) 98765-4321"
            />
          </Campo>
          <Campo rotulo="E-mail">
            <input
              className={classeInput}
              type="email"
              value={dados.email ?? ""}
              onChange={(e) => mudar("email", e.target.value)}
              placeholder="nome@email.com"
            />
          </Campo>
          <Campo rotulo="CPF">
            <input
              className={classeInput}
              inputMode="numeric"
              value={dados.cpf ?? ""}
              onChange={(e) => mudar("cpf", mascaraCpf(e.target.value))}
              placeholder="000.000.000-00"
            />
          </Campo>
          <Campo rotulo="Data de nascimento">
            <input
              className={classeInput}
              type="date"
              max={hojeIso()}
              value={dados.dataNascimento ?? ""}
              onChange={(e) => mudar("dataNascimento", e.target.value)}
            />
          </Campo>
        </div>

        {!aluno && planos.length > 0 && (
          <div
            className={`grid gap-4 rounded-xl border border-ac-line bg-ac-bg/40 p-4 ${planoId ? "sm:grid-cols-[1fr_170px]" : ""}`}
          >
            <Campo rotulo="Matricular agora no plano">
              <select className={classeInput} value={planoId} onChange={(e) => setPlanoId(e.target.value)}>
                <option value="">Não matricular agora</option>
                {planos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} — {fmt.moeda(p.preco)} {periodicidade(p.duracaoMeses)}
                  </option>
                ))}
              </select>
            </Campo>
            {planoId && (
              <Campo rotulo="Início">
                <input
                  className={classeInput}
                  type="date"
                  value={inicio}
                  onChange={(e) => setInicio(e.target.value)}
                />
              </Campo>
            )}
          </div>
        )}

        <MensagemErro texto={erro} />

        <div className="flex justify-end gap-3 pt-1">
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao type="submit" variante="primario" carregando={salvando}>
            <Check className="size-4" />
            {aluno ? "Salvar alterações" : "Cadastrar aluno"}
          </Botao>
        </div>
      </form>
    </Modal>
  );
}

export function ModalMatricular({
  aluno,
  planos,
  aoSalvar,
  aoFechar,
}: {
  aluno: AlunoDetalhe;
  planos: Plano[];
  aoSalvar: (aluno: AlunoDetalhe) => void;
  aoFechar: () => void;
}) {
  const [planoId, setPlanoId] = useState(planos[0]?.id ?? "");
  const [inicio, setInicio] = useState(hojeIso());
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      aoSalvar(await apiAlunos.matricular(aluno.id, planoId, inicio));
    } catch (e) {
      setErro(mensagemDe(e));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo="Nova matrícula" subtitulo={aluno.nome} aoFechar={aoFechar}>
      <form onSubmit={salvar} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-slate-300">Plano</span>
          {planos.map((p) => (
            <label
              key={p.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                planoId === p.id
                  ? "border-violet-500/70 bg-violet-500/10"
                  : "border-ac-line bg-ac-bg/40 hover:border-slate-600"
              }`}
            >
              <input
                type="radio"
                name="plano"
                value={p.id}
                checked={planoId === p.id}
                onChange={() => setPlanoId(p.id)}
                className="accent-fuchsia-500"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white">{p.nome}</div>
                <div className="truncate text-xs text-ac-muted">{p.descricao}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-white">{fmt.moeda(p.preco)}</div>
                <div className="text-[11px] text-ac-muted">{periodicidade(p.duracaoMeses)}</div>
              </div>
            </label>
          ))}
        </div>

        <Campo rotulo="Início (vencimento da 1ª mensalidade)">
          <input className={classeInput} type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </Campo>

        <MensagemErro texto={erro} />

        <div className="flex justify-end gap-3 pt-1">
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao type="submit" variante="primario" carregando={salvando} disabled={!planoId}>
            <Check className="size-4" />
            Matricular
          </Botao>
        </div>
      </form>
    </Modal>
  );
}
