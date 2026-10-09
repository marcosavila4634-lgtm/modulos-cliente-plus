// Grupos VIP no editor de páginas comum (lib/pagina.ts): o que a página de
// vendas (/g/<slug>) pode ter e a página padrão (igual à que existia antes do
// editor). Backend: grupovip/PaginaGrupoVip.java

import { AviaoPapel } from "../components/grupo-vip/Marcas";
import { SeloPlataforma } from "../components/grupo-vip/Selos";
import { novaSecao, novoItem, novoTema, periodo, type DadosPagina, type ModuloPagina, type PaginaConfig } from "./pagina";
import type { PaginaVendas } from "./grupo-vip-publico";

function normalizar(p: PaginaVendas): DadosPagina {
  return {
    nome: p.nome,
    logoPadrao: <AviaoPapel className="size-9" />,
    numero: { valor: p.membros, rotulo: "membros ativos" },
    convite: p.indicadoPor ? `${p.indicadoPor} te convidou para o grupo` : null,
    whatsapp: p.whatsappSuporte,
    mensagemWhatsapp: `Olá! Tenho uma dúvida sobre o ${p.nome}.`,
    planos: p.planos.map((pl) => ({
      id: pl.id,
      nome: pl.nome,
      descricao: pl.descricao,
      preco: pl.preco,
      periodo: periodo(pl.duracaoMeses),
      itens: pl.grupos.map((g) => ({ texto: g.nome, selo: <SeloPlataforma plataforma={g.plataforma} /> })),
    })),
  };
}

function padrao(p: PaginaVendas): PaginaConfig {
  const d = normalizar(p);
  return {
    modelo: 3,
    tema: novoTema("por-do-sol", "escuro", { fonte: "poppins" }),
    secoes: [
      novaSecao("capa", d, {
        titulo: `Entre para o ${p.nome}`,
        destaque: p.nome,
        texto: p.descricao,
        imagem: p.fotoCapa,
        selos: [novoItem({ icone: "raio" as const, texto: "Acesso liberado após o pagamento" }), novoItem({ icone: "escudo" as const, texto: "Cancele quando quiser" })],
      }),
      novaSecao("beneficios", d, { titulo: "", itens: p.beneficios.map((titulo) => novoItem({ icone: "check" as const, titulo, texto: "" })) }),
      novaSecao("planos", d),
      novaSecao("comoFunciona", d, {
        titulo: "",
        itens: [
          novoItem({ titulo: "Escolha e pague", texto: "Pague pelo Pix em segundos, direto no seu celular." }),
          novoItem({ titulo: "Receba o acesso", texto: "Você recebe os links dos grupos na sua área de membro e no WhatsApp/Telegram." }),
          novoItem({ titulo: "Indique e ganhe", texto: "Cada amigo que entrar pelo seu link rende comissão todo mês para você." }),
        ],
      }),
      novaSecao("contato", d),
    ],
  };
}

export const paginaGrupoVip: ModuloPagina<PaginaVendas> = {
  modulo: "grupo-vip",
  titulo: "Página de vendas",
  tipos: ["capa", "aviso", "destaques", "beneficios", "comoFunciona", "sobre", "video", "depoimentos", "galeria", "duvidas", "equipe", "chamada", "livre", "contato", "rodape"],
  normalizar,
  padrao,
  acento: ["#f59e0b", "#f97316"],
  ondeMudar: { planos: "/grupo-vip/grupos", whatsapp: "/grupo-vip/configuracoes" },
};
