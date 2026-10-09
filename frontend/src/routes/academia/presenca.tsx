import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { CircleCheck, Copy, ExternalLink, MapPin, Printer, QrCode as IconeQr, RefreshCw, Trophy, UserCheck } from "lucide-react";
import { useState } from "react";
import { AvatarAluno } from "../../components/academia/Selos";
import { Botao, mensagemDe } from "../../components/academia/formulario";
import { CabecalhoPagina, Card, CardNumero, TituloCard, Vazio } from "../../components/academia/ui";
import { PontoModalidade, SeloFaixa } from "../../components/artes-marciais/Faixa";
import { QrCode } from "../../components/artes-marciais/QrCode";
import { apiLutas, hojeIso, type AulaDeHoje } from "../../lib/artes-marciais";

// Presença (Artes Marciais): aulas de hoje com a chamada, o QR Code de
// presença (o aluno aponta o celular, digita o CPF e escolhe a aula) e o
// ranking de frequência do mês.
export const Route = createFileRoute("/academia/presenca")({
  loader: async () => {
    const [painel, config] = await Promise.all([apiLutas.presenca(), apiLutas.config()]);
    return { painel, config };
  },
  component: PaginaPresenca,
});

const estilo = {
  em_andamento: { rotulo: "Em andamento", cor: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" },
  proxima: { rotulo: "Próxima", cor: "border-sky-500/40 bg-sky-500/10 text-sky-300" },
  agendada: { rotulo: "Agendada", cor: "border-amber-500/40 bg-amber-500/10 text-amber-300" },
  concluida: { rotulo: "Concluída", cor: "border-ac-line text-ac-muted" },
} as const;

function PaginaPresenca() {
  const { painel, config } = Route.useLoaderData();
  const router = useRouter();
  const [link, setLink] = useState(painel.linkPresenca);
  const [copiado, setCopiado] = useState(false);
  const agora = painel.aulas.find((a) => a.status === "em_andamento") ?? painel.aulas.find((a) => a.status === "proxima");

  async function novoQr() {
    if (!confirm("Gerar um QR Code novo? O antigo (impresso na recepção) para de funcionar.")) return;
    try {
      const c = await apiLutas.novoQr();
      setLink(c.linkPresenca);
    } catch (x) {
      alert(mensagemDe(x));
    }
  }

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina
        titulo="Presença / Check-in"
        descricao="A presença conta para a faixa. O aluno marca pelo QR Code da recepção, ou o professor faz a chamada na aula."
      >
        <Link
          to="/academia/check-in"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-ac-line bg-ac-card-2 px-4 text-sm font-semibold text-slate-200 hover:text-white"
        >
          <UserCheck className="size-4" />
          Check-in na recepção
        </Link>
        <Link
          to="/academia/controle-de-acesso"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-ac-line bg-ac-card-2 px-4 text-sm font-semibold text-slate-200 hover:text-white"
        >
          Regras de entrada
        </Link>
      </CabecalhoPagina>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <CardNumero icone={CircleCheck} cor="bg-emerald-500/15 text-emerald-300" rotulo="Presenças nas aulas hoje">
          <span className="font-poppins text-[26px] font-bold text-white">{painel.presencasHoje}</span>
        </CardNumero>
        <CardNumero icone={IconeQr} cor="bg-red-500/15 text-red-300" rotulo="Aulas hoje">
          <span className="font-poppins text-[26px] font-bold text-white">{painel.aulas.length}</span>
        </CardNumero>
        <CardNumero icone={Trophy} cor="bg-amber-500/15 text-amber-300" rotulo="Mais assíduo do mês" className="col-span-2 xl:col-span-1">
          <span className="truncate font-poppins text-[18px] font-bold text-white">{painel.rankingMes[0]?.aluno.nome ?? "—"}</span>
          {painel.rankingMes[0] && <span className="text-xs text-ac-muted">{painel.rankingMes[0].aulas} aulas</span>}
        </CardNumero>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] [&>*]:min-w-0">
        <Card className="!p-0">
          <div className="p-4">
            <TituloCard icone={CircleCheck} cor="text-red-500">
              Aulas de hoje
            </TituloCard>
            <p className="mt-1 text-xs text-ac-muted">Toque na aula para fazer a chamada (presente / faltou) e incluir alunos avulsos.</p>
          </div>
          {painel.aulas.length === 0 ? (
            <Vazio icone={CircleCheck}>Nenhuma aula hoje.</Vazio>
          ) : (
            <ul className="divide-y divide-ac-line/70 border-t border-ac-line">
              {painel.aulas.map((a: AulaDeHoje) => {
                const s = estilo[a.status];
                const pct = a.ocupados ? Math.round((a.presentes * 100) / a.ocupados) : 0;
                return (
                  <li key={a.horarioId}>
                    <Link
                      to="/academia/aulas-e-turmas/$horarioId"
                      params={{ horarioId: a.horarioId }}
                      search={{ data: hojeIso() }}
                      className={`flex flex-wrap items-center gap-4 px-4 py-3 hover:bg-white/[0.02] ${a === agora ? "bg-red-500/[0.04]" : ""}`}
                    >
                      <div className="w-14 text-center">
                        <div className="font-poppins text-[15px] font-semibold text-white">{a.hora}</div>
                        <div className="text-[10.5px] text-ac-muted">até {a.fim}</div>
                      </div>
                      <div className="min-w-[180px] flex-1">
                        <div className="flex items-center gap-2 font-medium text-white">
                          <PontoModalidade cor={a.modalidade?.cor ?? "#71717a"} />
                          {a.aula}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-ac-muted">
                          Prof. {a.professor ?? "—"}
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3" />
                            {a.sala}
                          </span>
                        </div>
                      </div>
                      <span className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${s.cor}`}>{s.rotulo}</span>
                      <div className="w-36">
                        <div className="flex justify-between text-xs text-slate-300">
                          <span>
                            <b className="text-white">{a.presentes}</b> presentes
                          </span>
                          <span className="text-ac-muted">
                            {a.ocupados}/{a.capacidade}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ac-line">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, pct)}%` }} />
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <TituloCard icone={IconeQr} cor="text-red-500">
              QR Code de presença
            </TituloCard>
            <p className="mt-1 text-xs text-ac-muted">
              Imprima e deixe na recepção (ou mostre na TV). O aluno aponta a câmera, digita o CPF ou o celular e escolhe a aula.
              Quem está bloqueado (atraso, sem matrícula) é avisado para falar com a recepção.
            </p>
            <div className="mt-4 flex justify-center">
              <QrCode texto={link} tamanho={200} />
            </div>
            <div className="mt-3 truncate rounded-lg bg-ac-bg/60 px-3 py-2 text-center text-xs text-slate-300">{link}</div>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Botao
                className="!h-9"
                onClick={() => {
                  navigator.clipboard?.writeText(link);
                  setCopiado(true);
                  setTimeout(() => setCopiado(false), 1500);
                }}
              >
                <Copy className="size-4" />
                {copiado ? "Copiado" : "Copiar"}
              </Botao>
              <a
                href={`/presenca/${config.codigoPresenca}?cartaz=1`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-ac-line bg-ac-card-2 px-3 text-sm font-semibold text-slate-200 hover:text-white"
              >
                <Printer className="size-4" />
                Cartaz
              </a>
              <a
                href={link.replace(/^https?:\/\/[^/]+/, "")}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-ac-line bg-ac-card-2 px-3 text-sm font-semibold text-slate-200 hover:text-white"
              >
                <ExternalLink className="size-4" />
                Testar
              </a>
              <Botao className="!h-9" onClick={novoQr} title="Gerar outro código">
                <RefreshCw className="size-4" />
              </Botao>
            </div>
            <p className="mt-3 text-center text-[11px] text-ac-muted">Para testar: CPF 123.456.789-00 (aluno de exemplo).</p>
          </Card>

          <Card>
            <TituloCard
              icone={Trophy}
              cor="text-amber-300"
              acao={
                <button type="button" className="text-xs text-ac-muted hover:text-white" onClick={() => router.invalidate()}>
                  Atualizar
                </button>
              }
            >
              Ranking do mês
            </TituloCard>
            {painel.rankingMes.length === 0 ? (
              <p className="mt-4 text-sm text-ac-muted">Nenhuma aula no mês ainda.</p>
            ) : (
              <ol className="mt-3 flex flex-col gap-2">
                {painel.rankingMes.slice(0, 10).map((l, i) => (
                  <li key={l.aluno.id} className="flex items-center gap-3">
                    <span className={`w-6 text-center text-sm font-bold ${i < 3 ? "text-amber-300" : "text-ac-muted"}`}>{i + 1}</span>
                    <AvatarAluno nome={l.aluno.nome} />
                    <div className="min-w-0 flex-1">
                      <Link to="/academia/alunos/$id" params={{ id: l.aluno.id }} className="block truncate text-sm text-white hover:underline">
                        {l.aluno.nome}
                      </Link>
                      <SeloFaixa faixa={l.faixa} className="!text-[11px]" />
                    </div>
                    <span className="text-sm font-semibold text-white">{l.aulas}</span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
