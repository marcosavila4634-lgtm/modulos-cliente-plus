import { createFileRoute } from "@tanstack/react-router";
import { CircleCheck, CircleX, LoaderCircle, MapPin } from "lucide-react";
import { useState, type FormEvent } from "react";
import { PontoModalidade } from "../components/artes-marciais/Faixa";
import { QrCode } from "../components/artes-marciais/QrCode";
import { apiPublicoLutas, type RespostaPresenca } from "../lib/artes-marciais";

// Presença pelo QR Code (Artes Marciais), sem login: o aluno digita o CPF ou o
// celular e escolhe a aula que está começando. ?cartaz=1 = página para
// imprimir e deixar na recepção.
export const Route = createFileRoute("/presenca/$codigo")({
  validateSearch: (s: Record<string, unknown>): { cartaz?: boolean } => ({
    cartaz: s.cartaz === 1 || s.cartaz === "1" || s.cartaz === true ? true : undefined,
  }),
  loader: ({ params }) => apiPublicoLutas.presenca(params.codigo),
  component: PaginaPresenca,
});

function PaginaPresenca() {
  const p = Route.useLoaderData();
  const { codigo } = Route.useParams();
  const { cartaz } = Route.useSearch();
  const [documento, setDocumento] = useState("");
  const [horarioId, setHorarioId] = useState(p.aulas.find((a) => a.status === "em_andamento")?.horarioId ?? p.aulas[0]?.horarioId ?? "");
  const [enviando, setEnviando] = useState(false);
  const [resposta, setResposta] = useState<RespostaPresenca | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  if (cartaz) {
    const link = location.href.replace(/\?.*$/, "");
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-6 bg-white p-8 text-center text-zinc-900">
        <div className="text-sm font-semibold tracking-[0.4em] text-red-700 uppercase">{p.academia}</div>
        <h1 className="font-display text-5xl font-bold">Marque sua presença</h1>
        <p className="max-w-md text-lg text-zinc-600">Aponte a câmera do celular, digite seu CPF e escolha a aula. A presença conta para a sua faixa!</p>
        <QrCode texto={link} tamanho={320} />
        <p className="text-sm text-zinc-500">{link}</p>
        <button type="button" onClick={() => window.print()} className="rounded-xl bg-red-600 px-5 py-2.5 font-semibold text-white print:hidden">
          Imprimir
        </button>
      </div>
    );
  }

  async function marcar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      setResposta(await apiPublicoLutas.marcarPresenca(codigo, documento, horarioId));
    } catch (x) {
      setErro(x instanceof Error ? x.message : "Não deu certo");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-red-950 via-bg to-bg px-4 py-8">
      <div className="mx-auto max-w-sm">
        <div className="text-center text-xs font-semibold tracking-[0.3em] text-red-400 uppercase">{p.academia}</div>
        <h1 className="mt-2 text-center font-display text-3xl font-bold">Presença</h1>

        {resposta ? (
          <div className="mt-8 rounded-3xl border border-line bg-surface p-6 text-center">
            {resposta.ok ? <CircleCheck className="mx-auto size-16 text-emerald-400" /> : <CircleX className="mx-auto size-16 text-red-400" />}
            <p className="mt-3 text-lg font-semibold">{resposta.mensagem}</p>
            {resposta.ok && resposta.faixa && (
              <p className="mt-2 text-sm text-muted">
                {resposta.aula} · faixa {resposta.faixa} · {resposta.aulasNaFaixa} aulas nesta faixa
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setResposta(null);
                setDocumento("");
              }}
              className="mt-6 w-full rounded-xl border border-line py-3 font-semibold"
            >
              Próximo aluno
            </button>
          </div>
        ) : p.aulas.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-line bg-surface p-6 text-center text-muted">
            Nenhuma aula aberta para presença agora. A presença abre 1 hora antes de cada aula.
          </p>
        ) : (
          <form onSubmit={marcar} className="mt-8 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              CPF ou celular
              <input
                autoFocus
                inputMode="numeric"
                className="h-14 rounded-2xl border border-line bg-surface px-4 text-center text-xl tracking-wider outline-none focus:border-red-500"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                placeholder="000.000.000-00"
              />
            </label>
            <div className="flex flex-col gap-2">
              <span className="text-sm">Aula</span>
              {p.aulas.map((a) => (
                <button
                  key={a.horarioId}
                  type="button"
                  onClick={() => setHorarioId(a.horarioId)}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left ${
                    horarioId === a.horarioId ? "border-red-500 bg-red-500/10" : "border-line bg-surface"
                  }`}
                >
                  <span className="font-display text-lg font-bold">{a.hora}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-medium">
                      {a.modalidade && <PontoModalidade cor={a.modalidade.cor} />}
                      {a.aula}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <MapPin className="size-3" />
                      {a.sala} · Prof. {a.professor ?? "—"}
                    </span>
                  </span>
                  {a.status === "em_andamento" && <span className="text-[10px] font-semibold text-emerald-400">AGORA</span>}
                </button>
              ))}
            </div>
            {erro && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{erro}</p>}
            <button
              type="submit"
              disabled={enviando || !documento || !horarioId}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-red-600 text-lg font-bold text-white disabled:opacity-50"
            >
              {enviando && <LoaderCircle className="size-5 animate-spin" />}
              Marcar presença
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
