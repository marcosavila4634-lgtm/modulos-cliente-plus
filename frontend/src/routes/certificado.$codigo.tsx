import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, Printer } from "lucide-react";
import { FaixaVisual } from "../components/artes-marciais/Faixa";
import { QrCode } from "../components/artes-marciais/QrCode";
import { apiPublicoLutas, faixaComGrau } from "../lib/artes-marciais";

// Certificado de graduação (Artes Marciais). Qualquer pessoa confere pelo
// código (o QR Code do certificado abre esta mesma página).
export const Route = createFileRoute("/certificado/$codigo")({
  loader: ({ params }) => apiPublicoLutas.certificado(params.codigo),
  component: PaginaCertificado,
});

const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function PaginaCertificado() {
  const c = Route.useLoaderData();
  const [a, m, d] = c.data.split("-").map(Number);
  const texto =
    c.tipo === "grau"
      ? `o ${c.grau}º grau na faixa ${c.faixa.nome}`
      : `a faixa ${faixaComGrau(c.faixa, c.grau)}`;

  return (
    <div className="min-h-full bg-zinc-900 px-4 py-6 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-4xl items-center justify-between gap-3 print:hidden">
        <span className="flex items-center gap-2 text-sm text-emerald-300">
          <BadgeCheck className="size-5" />
          Certificado verdadeiro, emitido por {c.academia}
        </span>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
        >
          <Printer className="size-4" />
          Imprimir
        </button>
      </div>

      <div className="relative mx-auto aspect-[1.414] max-w-4xl overflow-hidden rounded-md bg-[#fbf8f1] text-zinc-900 shadow-2xl print:max-w-none print:rounded-none print:shadow-none">
        <div className="absolute inset-3 border-[3px] border-double border-red-800/70" />
        <div className="absolute inset-y-0 left-0 w-3 bg-red-800" />
        <div className="relative flex h-full flex-col items-center justify-between px-[8%] py-[6%] text-center">
          <div>
            <div className="text-[clamp(10px,1.6vw,14px)] font-semibold tracking-[0.4em] text-red-800 uppercase">{c.academia}</div>
            <h1 className="mt-2 font-serif text-[clamp(26px,5vw,54px)] font-bold tracking-wide">Certificado de Graduação</h1>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-[clamp(12px,1.8vw,17px)] text-zinc-600">Certificamos que</p>
            <p className="mt-1 font-serif text-[clamp(22px,4.2vw,44px)] font-semibold text-zinc-900 italic">{c.aluno}</p>
            <p className="mt-2 max-w-[80%] text-[clamp(12px,1.8vw,17px)] text-zinc-700">
              cumpriu os requisitos técnicos, de disciplina e de conduta, e recebeu {texto} em <b>{c.modalidade}</b>
              {c.exame ? `, no ${c.exame.toLowerCase()}` : ""}.
            </p>
            <div className="mt-4 rounded-md bg-zinc-800/5 px-6 py-3">
              <FaixaVisual faixa={c.faixa} grau={c.grau} grausMaximos={c.grau > 0 ? Math.max(4, c.grau) : 0} largura={280} altura={34} />
            </div>
          </div>
          <div className="flex w-full items-end justify-between gap-4">
            <div className="text-left text-[clamp(10px,1.4vw,13px)] text-zinc-600">
              {d} de {meses[m - 1]} de {a}
            </div>
            <div className="flex flex-col items-center">
              <div className="h-px w-[clamp(120px,22vw,220px)] bg-zinc-500" />
              <div className="mt-1 text-[clamp(10px,1.4vw,13px)] font-semibold">{c.professor ?? "Professor responsável"}</div>
              <div className="text-[clamp(9px,1.2vw,11px)] text-zinc-500">Professor</div>
            </div>
            <div className="flex flex-col items-center">
              <QrCode texto={location.href} tamanho={72} className="!rounded-none" />
              <div className="mt-1 font-mono text-[10px] text-zinc-500">{c.codigo}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
