import { createFileRoute, notFound } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { menuAcademia } from "../../components/academia/menu";

export const Route = createFileRoute("/academia/$secao")({
  loader: ({ params }) => {
    const item = menuAcademia.find((i) => i.secao === params.secao);
    if (!item) throw notFound();
    return item.rotulo;
  },
  component: SecaoEmConstrucao,
});

function SecaoEmConstrucao() {
  const rotulo = Route.useLoaderData();
  return (
    <div className="py-6">
      <h1 className="font-poppins text-[28px] font-bold text-white">{rotulo}</h1>
      <div className="mt-6 rounded-2xl border border-dashed border-ac-line bg-ac-card p-12 text-center">
        <Construction className="mx-auto size-9 text-violet-400" />
        <h2 className="mt-3 font-poppins text-lg font-semibold text-white">Tela em construção</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ac-muted">
          Esta parte do módulo Academia ainda vai ser criada.
        </p>
      </div>
    </div>
  );
}
