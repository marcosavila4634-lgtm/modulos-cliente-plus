import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, FlaskConical, Megaphone, MessageCircle, Wallet } from "lucide-react";
import { FaixaVisual, PontoModalidade } from "../components/artes-marciais/Faixa";
import { textoProximo } from "../components/artes-marciais/ModaisGraduacao";
import { apiPublicoLutas, data, faixaComGrau, linkWhatsapp, moeda } from "../lib/artes-marciais";

// SIMULAÇÃO da área do responsável (Artes Marciais): todos os filhos, com a
// faixa, o progresso, a presença do mês e as cobranças em aberto. No Cliente
// Plus o responsável entra logado; aqui o código do link identifica.
export const Route = createFileRoute("/responsavel/$codigo")({
  loader: ({ params }) => apiPublicoLutas.responsavel(params.codigo),
  component: AreaResponsavel,
});

const corCobranca = { paga: "text-emerald-400", pendente: "text-sky-300", atrasada: "text-red-400", cancelada: "text-muted" } as const;

function AreaResponsavel() {
  const r = Route.useLoaderData();
  const total = r.filhos.flatMap((f) => f.cobrancas).reduce((s, c) => s + c.valor, 0);
  return (
    <div className="min-h-full bg-bg">
      <div className="bg-red-950/60 px-4 py-1.5 text-center text-[11px] text-red-200">
        <FlaskConical className="mr-1 inline size-3" />
        Laboratório: simulação da área do responsável no Cliente Plus
      </div>
      <div className="mx-auto flex max-w-md flex-col gap-4 px-4 pb-10">
        <header className="-mx-4 rounded-b-3xl bg-gradient-to-br from-red-700 via-red-800 to-black px-5 pt-5 pb-6 text-white">
          <div className="flex items-center justify-between">
            <span className="font-display text-lg font-bold">Cliente Plus</span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">{r.academia}</span>
          </div>
          <p className="mt-5 text-sm text-white/80">Olá,</p>
          <h1 className="font-display text-2xl font-bold">{r.nome.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-white/80">
            {r.filhos.length === 1 ? "Acompanhe o treino do seu filho" : `Acompanhe o treino dos seus ${r.filhos.length} filhos`}
          </p>
        </header>

        {total > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <Wallet className="size-6 text-amber-300" />
            <div className="flex-1">
              <div className="text-sm font-semibold">Em aberto: {moeda(total)}</div>
              <div className="text-xs text-muted">Pague pelo app ou na recepção.</div>
            </div>
          </div>
        )}

        {r.filhos.map(({ ficha, presencasMes, cobrancas }) => (
          <section key={ficha.alunoId} className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">{ficha.nome}</h2>
              <span className="text-xs text-muted">{ficha.idade} anos</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted">
              <CalendarCheck className="size-4 text-emerald-400" />
              {presencasMes} {presencasMes === 1 ? "aula" : "aulas"} neste mês · {ficha.aulasTotal} no total
            </div>
            {ficha.modalidades.map((p) => (
              <div key={p.id} className="mt-4 rounded-xl border border-line p-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <PontoModalidade cor={p.modalidade.cor} />
                  {p.modalidade.nome}
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <FaixaVisual faixa={p.faixa} grau={p.grau} grausMaximos={p.grausMaximos} largura={120} altura={17} />
                  <span className="text-sm">{faixaComGrau(p.faixa, p.grau)}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-red-600" style={{ width: `${p.percentual}%` }} />
                </div>
                <div className="mt-1 text-xs text-muted">{textoProximo(p)}</div>
              </div>
            ))}
            {ficha.historico.filter((g) => g.tipo !== "inicial").slice(0, 2).map((g) => (
              <a key={g.id} href={`/certificado/${g.codigo}`} className="mt-2 block text-xs text-red-400">
                Certificado: {g.tipo === "grau" ? `${g.grau}º grau` : `faixa ${g.faixa.nome}`} ({data(g.data)})
              </a>
            ))}
            {cobrancas.length > 0 && (
              <ul className="mt-4 flex flex-col gap-1.5 border-t border-line pt-3 text-sm">
                {cobrancas.map((c) => (
                  <li key={c.id} className="flex justify-between gap-3">
                    <span className="min-w-0 truncate">{c.descricao}</span>
                    <span className={corCobranca[c.situacao]}>
                      {moeda(c.valor)} · {data(c.vencimento)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {r.avisos.length > 0 && (
          <section className="rounded-2xl border border-line bg-surface p-4">
            <h2 className="flex items-center gap-2 font-semibold">
              <Megaphone className="size-4 text-red-400" />
              Avisos da academia
            </h2>
            {r.avisos.map((a) => (
              <div key={a.id} className="mt-3 border-t border-line pt-3 first:border-0 first:pt-0">
                <div className="text-sm font-medium">{a.titulo}</div>
                <p className="text-xs text-muted">{a.texto}</p>
              </div>
            ))}
          </section>
        )}

        {r.whatsapp && (
          <a
            href={linkWhatsapp(r.whatsapp, `Olá! Sou ${r.nome}, responsável. Tenho uma dúvida.`)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 font-semibold text-white"
          >
            <MessageCircle className="size-5" />
            Falar com a academia
          </a>
        )}
      </div>
    </div>
  );
}
