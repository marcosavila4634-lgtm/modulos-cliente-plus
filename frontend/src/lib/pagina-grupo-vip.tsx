// Grupos VIP no editor de páginas comum (lib/pagina.ts): o que a página de
// vendas (/g/<slug>) pode ter e a página padrão (igual à que existia antes do
// editor). Backend: grupovip/PaginaGrupoVip.java

import { AviaoPapel } from "../components/grupo-vip/Marcas";
import { SeloPlataforma } from "../components/grupo-vip/Selos";
import { novaSecao, periodo, type DadosPagina, type ModuloPagina, type PaginaConfig } from "./pagina";
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
    versao: 1,
    tema: { fundo: "marinho", cor1: "#f59e0b", cor2: "#f97316", fonte: "poppins", cantos: "redondos" },
    secoes: [
      novaSecao("topo", d, {
        titulo: `Entre para o ${p.nome}`,
        destaque: p.nome,
        texto: p.descricao,
        capa: p.fotoCapa,
        selos: [
          { icone: "raio", texto: "Acesso liberado após o pagamento" },
          { icone: "escudo", texto: "Cancele quando quiser" },
        ],
      }),
      novaSecao("beneficios", d, { titulo: "", itens: p.beneficios.map((texto) => ({ icone: "check" as const, texto })) }),
      novaSecao("planos", d),
      novaSecao("passos", d, {
        titulo: "",
        itens: [
          { titulo: "Escolha e pague", texto: "Pague pelo Pix em segundos, direto no seu celular." },
          { titulo: "Receba o acesso", texto: "Você recebe os links dos grupos na sua área de membro e no WhatsApp/Telegram." },
          { titulo: "Indique e ganhe", texto: "Cada amigo que entrar pelo seu link rende comissão todo mês para você." },
        ],
      }),
      novaSecao("contato", d, { rodape: "" }),
    ],
  };
}

export const paginaGrupoVip: ModuloPagina<PaginaVendas> = {
  modulo: "grupo-vip",
  titulo: "Página de vendas",
  tipos: ["aviso", "beneficios", "passos", "texto", "video", "depoimentos", "imagens", "perguntas", "equipe", "chamada", "contato"],
  normalizar,
  padrao,
  acento: ["#f59e0b", "#f97316"],
  ondeMudar: { endereco: "/grupo-vip/configuracoes", planos: "/grupo-vip/grupos", whatsapp: "/grupo-vip/configuracoes" },
};
