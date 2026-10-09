import { createFileRoute, Link } from "@tanstack/react-router";
import { Baby, ExternalLink, MessageCircle, Pencil, Plus, Search, UserPlus, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { SeletorAluno } from "../../components/academia/SeletorAluno";
import { AvatarAluno } from "../../components/academia/Selos";
import { Botao, Campo, classeInput, MensagemErro, mensagemDe, Modal } from "../../components/academia/formulario";
import { CabecalhoPagina, Card, CardNumero, Vazio } from "../../components/academia/ui";
import { SeloFaixa } from "../../components/artes-marciais/Faixa";
import { apiAlunos, fmt, type AlunoResumo } from "../../lib/academia-alunos";
import {
  apiLutas,
  linkWhatsapp,
  type PainelResponsaveis,
  type RefAluno,
  type ResponsavelJson,
} from "../../lib/artes-marciais";

// Kids e responsáveis (Artes Marciais): quem acompanha e paga cada aluno
// menor. O responsável tem uma área própria com todos os filhos.
export const Route = createFileRoute("/academia/responsaveis")({
  loader: async () => {
    const [painel, alunos] = await Promise.all([apiLutas.responsaveis(), apiAlunos.listar()]);
    return { painel, alunos: alunos.alunos };
  },
  component: PaginaResponsaveis,
});

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function PaginaResponsaveis() {
  const inicial = Route.useLoaderData();
  const [p, setP] = useState<PainelResponsaveis>(inicial.painel);
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<ResponsavelJson | { novoPara: RefAluno | null } | null>(null);
  const [vinculando, setVinculando] = useState<ResponsavelJson | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const filhos = p.responsaveis.reduce((s, r) => s + r.dependentes.length, 0);

  const lista = useMemo(() => {
    const termo = normalizar(busca.trim());
    if (!termo) return p.responsaveis;
    return p.responsaveis.filter(
      (r) => normalizar(r.nome).includes(termo) || r.dependentes.some((d) => normalizar(d.aluno.nome).includes(termo)),
    );
  }, [p, busca]);

  async function acao(f: () => Promise<PainelResponsaveis>) {
    setErro(null);
    try {
      setP(await f());
    } catch (x) {
      setErro(mensagemDe(x));
    }
  }

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina
        titulo="Kids e responsáveis"
        descricao="Quem acompanha e paga cada aluno menor. Os avisos dos kids vão para o responsável, e ele tem uma área com a faixa, a presença e as mensalidades de todos os filhos."
      >
        <Botao variante="primario" onClick={() => setEditando({ novoPara: null })}>
          <Plus className="size-4" />
          Novo responsável
        </Botao>
      </CabecalhoPagina>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <CardNumero icone={Baby} cor="bg-pink-500/15 text-pink-300" rotulo="Responsáveis">
          <span className="font-poppins text-[26px] font-bold text-white">{p.responsaveis.length}</span>
        </CardNumero>
        <CardNumero icone={UserPlus} cor="bg-sky-500/15 text-sky-300" rotulo="Kids acompanhados">
          <span className="font-poppins text-[26px] font-bold text-white">{filhos}</span>
        </CardNumero>
        <CardNumero icone={X} cor="bg-red-500/15 text-red-300" rotulo="Kids sem responsável" className="col-span-2 xl:col-span-1">
          <span className="font-poppins text-[26px] font-bold text-white">{p.kidsSemResponsavel.length}</span>
        </CardNumero>
      </div>
      <MensagemErro texto={erro} />

      {p.kidsSemResponsavel.length > 0 && (
        <Card className="border-red-500/30">
          <div className="text-sm font-semibold text-white">Kids sem responsável cadastrado</div>
          <p className="text-xs text-ac-muted">Toque no aluno para cadastrar quem acompanha.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {p.kidsSemResponsavel.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setEditando({ novoPara: k })}
                className="flex items-center gap-2 rounded-xl border border-ac-line bg-ac-bg/40 px-3 py-1.5 text-sm text-slate-200 hover:border-red-500/50"
              >
                <AvatarAluno nome={k.nome} />
                {k.nome}
                <span className="text-xs text-ac-muted">{k.idade} anos</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      <Card className="!p-0">
        <div className="flex items-center justify-between gap-3 border-b border-ac-line p-4">
          <span className="text-sm font-semibold text-white">{lista.length} responsáveis</span>
          <label className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ac-muted" />
            <input className={`${classeInput} !w-64 pl-9`} placeholder="Buscar responsável ou filho" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </label>
        </div>
        {lista.length === 0 ? (
          <Vazio icone={Baby}>Ninguém encontrado.</Vazio>
        ) : (
          <ul className="divide-y divide-ac-line/70">
            {lista.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start gap-4 px-4 py-3">
                <div className="min-w-[220px] flex-1">
                  <div className="font-medium text-white">{r.nome}</div>
                  <div className="text-xs text-ac-muted">
                    {fmt.telefone(r.telefone)}
                    {r.email && ` · ${r.email}`}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs">
                    <a href={`/responsavel/${r.codigo}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-red-400 hover:text-red-300">
                      <ExternalLink className="size-3.5" />
                      Área do responsável
                    </a>
                    {r.telefone && (
                      <a
                        href={linkWhatsapp(
                          r.telefone,
                          `Olá, ${r.nome.split(" ")[0]}! Este é o seu acesso para acompanhar a faixa, a presença e as mensalidades: ${location.origin}/responsavel/${r.codigo}`,
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                      >
                        <MessageCircle className="size-3.5" />
                        Mandar o link
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex min-w-[260px] flex-[2] flex-col gap-1.5">
                  {r.dependentes.map((d) => (
                    <div key={d.aluno.id} className="flex items-center gap-3 rounded-xl bg-ac-bg/40 px-3 py-1.5">
                      <Link to="/academia/alunos/$id" params={{ id: d.aluno.id }} className="min-w-0 flex-1 truncate text-sm text-white hover:underline">
                        {d.aluno.nome}
                        <span className="ml-2 text-xs text-ac-muted">
                          {d.aluno.idade} anos · {d.parentesco}
                        </span>
                      </Link>
                      {d.faixa && <SeloFaixa faixa={d.faixa} />}
                      <button
                        type="button"
                        aria-label={`Desligar ${d.aluno.nome}`}
                        onClick={() =>
                          confirm(`Tirar ${d.aluno.nome} deste responsável?`) && acao(() => apiLutas.removerDependente(r.id, d.aluno.id))
                        }
                        className="rounded p-1 text-ac-muted hover:text-red-300"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setVinculando(r)} className="w-fit text-xs font-semibold text-red-400 hover:text-red-300">
                    + filho
                  </button>
                </div>
                <button type="button" aria-label={`Editar ${r.nome}`} onClick={() => setEditando(r)} className="rounded-lg p-2 text-ac-muted hover:bg-white/5 hover:text-white">
                  <Pencil className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {editando && (
        <ModalResponsavel
          responsavel={"id" in editando ? editando : null}
          filho={"novoPara" in editando ? editando.novoPara : null}
          alunos={inicial.alunos}
          aoFechar={() => setEditando(null)}
          aoSalvar={(x) => {
            setP(x);
            setEditando(null);
          }}
        />
      )}
      {vinculando && (
        <ModalVincular
          responsavel={vinculando}
          alunos={inicial.alunos}
          aoFechar={() => setVinculando(null)}
          aoSalvar={(x) => {
            setP(x);
            setVinculando(null);
          }}
        />
      )}
    </div>
  );
}

function ModalResponsavel({
  responsavel: r,
  filho,
  alunos,
  aoFechar,
  aoSalvar,
}: {
  responsavel: ResponsavelJson | null;
  filho: RefAluno | null;
  alunos: AlunoResumo[];
  aoFechar: () => void;
  aoSalvar: (p: PainelResponsaveis) => void;
}) {
  const [nome, setNome] = useState(r?.nome ?? "");
  const [telefone, setTelefone] = useState(r?.telefone ?? "");
  const [email, setEmail] = useState(r?.email ?? "");
  const [cpf, setCpf] = useState(r?.cpf ?? "");
  const [alunoId, setAlunoId] = useState<string | null>(filho?.id ?? null);
  const [parentesco, setParentesco] = useState("mãe");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      aoSalvar(
        r
          ? await apiLutas.salvarResponsavel(r.id, { nome, telefone, email, cpf })
          : await apiLutas.criarResponsavel({ nome, telefone, email, cpf, alunoId, parentesco }),
      );
    } catch (x) {
      setErro(mensagemDe(x));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={r ? "Editar responsável" : "Novo responsável"} aoFechar={aoFechar}>
      <form onSubmit={salvar} className="flex flex-col gap-4">
        <Campo rotulo="Nome">
          <input className={classeInput} value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
        </Campo>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="WhatsApp (com DDD)">
            <input className={classeInput} inputMode="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
          </Campo>
          <Campo rotulo="CPF (opcional)">
            <input className={classeInput} inputMode="numeric" value={cpf} onChange={(e) => setCpf(e.target.value)} />
          </Campo>
        </div>
        <Campo rotulo="E-mail (opcional)">
          <input type="email" className={classeInput} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Campo>
        {!r && (
          <>
            {filho ? (
              <div className="rounded-xl border border-ac-line bg-ac-bg/40 px-3 py-2 text-sm text-slate-200">Filho: {filho.nome}</div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-slate-300">Filho (opcional)</span>
                <SeletorAluno alunos={alunos} valor={alunoId} aoMudar={setAlunoId} />
              </div>
            )}
            {alunoId && <Parentesco valor={parentesco} aoMudar={setParentesco} />}
          </>
        )}
        <MensagemErro texto={erro} />
        <div className="flex flex-wrap justify-between gap-2">
          {r ? (
            <Botao
              variante="perigo"
              onClick={async () => {
                if (!confirm(`Excluir ${r.nome}? Os filhos continuam como alunos.`)) return;
                try {
                  aoSalvar(await apiLutas.excluirResponsavel(r.id));
                } catch (x) {
                  setErro(mensagemDe(x));
                }
              }}
            >
              Excluir
            </Botao>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Botao onClick={aoFechar}>Cancelar</Botao>
            <Botao type="submit" variante="primario" carregando={salvando}>
              Salvar
            </Botao>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function Parentesco({ valor, aoMudar }: { valor: string; aoMudar: (v: string) => void }) {
  return (
    <Campo rotulo="Parentesco">
      <select className={classeInput} value={valor} onChange={(e) => aoMudar(e.target.value)}>
        {["mãe", "pai", "avó", "avô", "tia", "tio", "responsável"].map((x) => (
          <option key={x} value={x}>
            {x}
          </option>
        ))}
      </select>
    </Campo>
  );
}

function ModalVincular({
  responsavel,
  alunos,
  aoFechar,
  aoSalvar,
}: {
  responsavel: ResponsavelJson;
  alunos: AlunoResumo[];
  aoFechar: () => void;
  aoSalvar: (p: PainelResponsaveis) => void;
}) {
  const [alunoId, setAlunoId] = useState<string | null>(null);
  const [parentesco, setParentesco] = useState("mãe");
  const [erro, setErro] = useState<string | null>(null);
  return (
    <Modal titulo="Adicionar filho" subtitulo={responsavel.nome} aoFechar={aoFechar}>
      <div className="flex flex-col gap-4">
        <SeletorAluno alunos={alunos} valor={alunoId} aoMudar={setAlunoId} autoFocus />
        <Parentesco valor={parentesco} aoMudar={setParentesco} />
        <MensagemErro texto={erro} />
        <div className="flex justify-end gap-2">
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao
            variante="primario"
            disabled={!alunoId}
            onClick={async () => {
              try {
                aoSalvar(await apiLutas.adicionarDependente(responsavel.id, alunoId!, parentesco));
              } catch (x) {
                setErro(mensagemDe(x));
              }
            }}
          >
            Adicionar
          </Botao>
        </div>
      </div>
    </Modal>
  );
}
