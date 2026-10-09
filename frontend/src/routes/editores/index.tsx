import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, PenLine } from "lucide-react";
import { modelos } from "../../lib/pagina-modelos";

// Lista dos nichos com modelo pronto. Para criar outro: lib/pagina-modelos.ts
// (o modelo) e nichos/NichosResource.java (a loja de exemplo).
export const Route = createFileRoute("/editores/")({
  component: Inicio,
});

function Inicio() {
  return (
    <div className="py-8">
      <h1 className="font-display text-[28px] font-bold text-white">Modelos prontos por nicho</h1>
      <p className="mt-1 max-w-3xl text-sm text-slate-400">
        Cada nicho já vem com uma página montada: cores, seções, textos e fotos de exemplo. Abra o editor para mudar o que quiser; é o mesmo editor
        de todos os módulos, com arrastar, cores por seção e peças livres.
      </p>
      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {modelos.map((m) => (
          <div key={m.chave} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <img src={m.foto} alt="" className="aspect-[16/9] w-full object-cover" />
            <div className="p-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-8 rounded-full" style={{ background: `linear-gradient(90deg, ${m.acento[0]}, ${m.acento[1]})` }} />
                <h2 className="font-display text-lg font-semibold text-white">{m.nome}</h2>
              </div>
              <p className="mt-1.5 text-[13.5px] text-slate-400">{m.descricao}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/editores/$nicho"
                  params={{ nicho: m.chave }}
                  className="bg-brand-gradient inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-white hover:brightness-110"
                >
                  <PenLine className="size-4" /> Abrir o editor
                </Link>
                <Link
                  to="/n/$nicho"
                  params={{ nicho: m.chave }}
                  target="_blank"
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/10 px-4 text-sm font-semibold text-slate-200 hover:border-white/25"
                >
                  <ExternalLink className="size-4" /> Ver a página
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
