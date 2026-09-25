import { createFileRoute, useRouter } from "@tanstack/react-router";
import { BadgeCheck, Check, Mail, Pencil, Phone, Plus, Users } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AvatarAluno } from "../../components/academia/Selos";
import { Botao, Campo, classeInput, MensagemErro, mensagemDe, Modal } from "../../components/academia/formulario";
import { Card } from "../../components/academia/ui";
import { fmt } from "../../lib/academia-alunos";
import { apiTreinos, type DadosProfissional, type Profissional } from "../../lib/academia-treinos";

// Professores e demais profissionais. Cada ficha de treino tem um professor.
export const Route = createFileRoute("/academia/profissionais")({
  loader: apiTreinos.profissionais,
  component: PaginaProfissionais,
});

function PaginaProfissionais() {
  const profissionais = Route.useLoaderData();
  const router = useRouter();
  const [editando, setEditando] = useState<Profissional | "novo" | null>(null);

  return (
    <div className="flex flex-col gap-5 py-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-poppins text-[28px] font-bold text-white">Profissionais</h1>
          <p className="mt-1 text-sm text-ac-muted">Professores responsáveis pelas fichas de treino dos alunos.</p>
        </div>
        <Botao variante="primario" onClick={() => setEditando("novo")}>
          <Plus className="size-4" />
          Novo profissional
        </Botao>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {profissionais.map((p) => (
          <Card key={p.id} className={p.ativo ? "" : "opacity-55"}>
            <div className="flex items-start gap-3">
              <AvatarAluno nome={p.nome} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-white">{p.nome}</div>
                <div className="truncate text-xs text-violet-300">{p.especialidade || "Professor"}</div>
              </div>
              <button
                type="button"
                onClick={() => setEditando(p)}
                aria-label={`Editar ${p.nome}`}
                className="rounded-lg p-2 text-ac-muted hover:bg-white/5 hover:text-white"
              >
                <Pencil className="size-4" />
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-2 text-[13px] text-slate-300">
              <span className="flex items-center gap-2">
                <Phone className="size-3.5 text-ac-muted" />
                {fmt.telefone(p.telefone)}
              </span>
              <span className="flex min-w-0 items-center gap-2">
                <Mail className="size-3.5 shrink-0 text-ac-muted" />
                <span className="truncate">{p.email ?? "—"}</span>
              </span>
              <span className="flex items-center gap-2">
                <BadgeCheck className="size-3.5 text-ac-muted" />
                {p.registro ?? "—"}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-ac-line pt-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Users className="size-3.5 text-ac-muted" />
                {p.alunos} {p.alunos === 1 ? "aluno" : "alunos"} com ficha
              </span>
              {!p.ativo && <span className="text-ac-muted">Inativo</span>}
            </div>
          </Card>
        ))}
      </div>

      {editando && (
        <ModalProfissional
          profissional={editando === "novo" ? undefined : editando}
          aoFechar={() => setEditando(null)}
          aoSalvar={async () => {
            await router.invalidate();
            setEditando(null);
          }}
        />
      )}
    </div>
  );
}

function ModalProfissional({
  profissional,
  aoSalvar,
  aoFechar,
}: {
  profissional?: Profissional;
  aoSalvar: () => void;
  aoFechar: () => void;
}) {
  const [dados, setDados] = useState<DadosProfissional>({
    nome: profissional?.nome ?? "",
    especialidade: profissional?.especialidade ?? "",
    telefone: profissional?.telefone ? fmt.telefone(profissional.telefone) : "",
    email: profissional?.email ?? "",
    registro: profissional?.registro ?? "",
    ativo: profissional?.ativo ?? true,
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const mudar = <K extends keyof DadosProfissional>(campo: K, valor: DadosProfissional[K]) =>
    setDados((d) => ({ ...d, [campo]: valor }));

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      if (profissional) await apiTreinos.atualizarProfissional(profissional.id, dados);
      else await apiTreinos.cadastrarProfissional(dados);
      aoSalvar();
    } catch (e) {
      setErro(mensagemDe(e));
      setSalvando(false);
    }
  }

  return (
    <Modal titulo={profissional ? "Editar profissional" : "Novo profissional"} aoFechar={aoFechar}>
      <form onSubmit={salvar} className="flex flex-col gap-4">
        <Campo rotulo="Nome completo *">
          <input autoFocus className={classeInput} value={dados.nome} onChange={(e) => mudar("nome", e.target.value)} />
        </Campo>
        <Campo rotulo="Especialidade">
          <input
            className={classeInput}
            value={dados.especialidade}
            onChange={(e) => mudar("especialidade", e.target.value)}
            placeholder="Ex.: Musculação e hipertrofia"
          />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Telefone">
            <input
              className={classeInput}
              inputMode="tel"
              value={dados.telefone ?? ""}
              onChange={(e) => mudar("telefone", e.target.value)}
              placeholder="(11) 98765-4321"
            />
          </Campo>
          <Campo rotulo="Registro (CREF)">
            <input
              className={classeInput}
              value={dados.registro ?? ""}
              onChange={(e) => mudar("registro", e.target.value)}
              placeholder="CREF 000000-G/SP"
            />
          </Campo>
        </div>
        <Campo rotulo="E-mail">
          <input
            className={classeInput}
            type="email"
            value={dados.email ?? ""}
            onChange={(e) => mudar("email", e.target.value)}
          />
        </Campo>
        {profissional && (
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={dados.ativo ?? true}
              onChange={(e) => mudar("ativo", e.target.checked)}
              className="accent-fuchsia-500"
            />
            Ativo (desmarque se o profissional saiu da academia)
          </label>
        )}
        <MensagemErro texto={erro} />
        <div className="flex justify-end gap-3 pt-1">
          <Botao onClick={aoFechar}>Cancelar</Botao>
          <Botao type="submit" variante="primario" carregando={salvando}>
            <Check className="size-4" />
            {profissional ? "Salvar alterações" : "Cadastrar"}
          </Botao>
        </div>
      </form>
    </Modal>
  );
}
