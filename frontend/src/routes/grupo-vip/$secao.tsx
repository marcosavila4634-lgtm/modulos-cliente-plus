import { createFileRoute, notFound } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { rotuloDaSecao } from "../../components/grupo-vip/menu";

export const Route = createFileRoute("/grupo-vip/$secao")({
  loader: ({ params }) => {
    const rotulo = rotuloDaSecao(params.secao);
    if (!rotulo) throw notFound();
    return rotulo;
  },
  component: SecaoEmConstrucao,
});

function SecaoEmConstrucao() {
  const rotulo = Route.useLoaderData();
  return (
    <div className="py-6">
      <h1 className="font-poppins text-[28px] font-bold text-white">{rotulo}</h1>
      <div className="mt-6 rounded-2xl border border-dashed border-gv-line bg-gv-card p-12 text-center">
        <Construction className="mx-auto size-9 text-orange-400" />
        <h2 className="mt-3 font-poppins text-lg font-semibold text-white">Tela em construção</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-gv-muted">
          Esta parte do módulo Grupos VIP ainda vai ser criada.
        </p>
      </div>
    </div>
  );
}
