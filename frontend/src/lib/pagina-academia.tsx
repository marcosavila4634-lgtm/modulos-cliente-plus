// Academia no editor de páginas comum (lib/pagina.ts): o que a página pública
// (/a/<slug>) pode ter e a página padrão.
// Contrato com o backend: backend/src/main/java/br/com/clienteplus/modulos/academia/PaginaAcademia.java

import { AvatarAcademia } from "../components/academia/Marcas";
import { http } from "./http";
import { novaSecao, novoItem, novoTema, periodo, type DadosPagina, type ModuloPagina, type PaginaConfig } from "./pagina";

export type PaginaAcademiaDados = {
  nome: string;
  slug: string;
  whatsapp: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  alunos: number;
  planos: { id: string; nome: string; descricao: string; preco: number; duracaoMeses: number }[];
  horarios: { dia: string; abre: string | null; fecha: string | null; fechado: boolean }[];
  aulas: {
    nome: string;
    descricao: string;
    professor: string | null;
    duracaoMinutos: number;
    cor: string | null;
    horarios: { diaSemana: number; dia: string; hora: string }[];
  }[];
  equipe: { nome: string; especialidade: string | null }[];
  pagina: unknown | null;
};

export const buscarPaginaAcademia = (slug: string) => http.get<PaginaAcademiaDados>(`/academia/publico/${encodeURIComponent(slug)}`);

// cores das aulas (CorAula em lib/academia-agenda.ts)
const cores: Record<string, string> = {
  violeta: "#8b5cf6",
  azul: "#3b82f6",
  verde: "#10b981",
  laranja: "#f97316",
  rosa: "#ec4899",
  ciano: "#06b6d4",
};

function normalizar(a: PaginaAcademiaDados): DadosPagina {
  const hoje = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][new Date().getDay()];
  return {
    nome: a.nome,
    logoPadrao: <AvatarAcademia className="size-10" />,
    numero: { valor: a.alunos, rotulo: "alunos treinando" },
    whatsapp: a.whatsapp,
    mensagemWhatsapp: `Olá! Quero saber mais sobre a ${a.nome}.`,
    endereco: a.endereco,
    planos: a.planos.map((p) => ({ id: p.id, nome: p.nome, descricao: p.descricao, preco: p.preco, periodo: periodo(p.duracaoMeses), itens: [] })),
    horarios: a.horarios.map((h) => ({
      dia: h.dia,
      texto: h.fechado || !h.abre || !h.fecha ? "Fechado" : `${h.abre.slice(0, 5)} às ${h.fecha.slice(0, 5)}`,
      hoje: h.dia === hoje,
    })),
    aulas: a.aulas.map((x) => ({
      nome: x.nome,
      descricao: x.descricao ?? "",
      professor: x.professor,
      cor: x.cor ? (cores[x.cor] ?? (x.cor.startsWith("#") ? x.cor : null)) : null,
      horarios: x.horarios.map((h) => ({ dia: h.dia, hora: h.hora.slice(0, 5) })),
    })),
    equipe: a.equipe.map((p) => ({ nome: p.nome, cargo: p.especialidade ?? "" })),
  };
}

function padrao(a: PaginaAcademiaDados): PaginaConfig {
  const d = normalizar(a);
  return {
    modelo: 3,
    tema: novoTema("cliente-plus", "escuro", { fonte: "outfit" }),
    secoes: [
      novaSecao("capa", d, {
        titulo: `Treine na ${a.nome}`,
        destaque: a.nome,
        texto: "Musculação, aulas coletivas e professores acompanhando o seu treino. Escolha o seu plano e comece hoje.",
        imagem: "/academia/hero.jpg",
        escurecer: 55,
        selos: [novoItem({ icone: "haltere" as const, texto: "Equipamentos modernos" }), novoItem({ icone: "pessoas" as const, texto: "Professores no salão" })],
      }),
      novaSecao("beneficios", d, {
        titulo: "Por que treinar aqui",
        itens: (
          [
            ["haltere", "Musculação completa"],
            ["pessoas", "Aulas coletivas todos os dias"],
            ["grafico", "Avaliação física e acompanhamento"],
            ["alvo", "Treino montado para o seu objetivo"],
            ["relogio", "Horários que cabem na sua rotina"],
            ["conversa", "Atendimento pelo WhatsApp"],
          ] as const
        ).map(([icone, titulo]) => novoItem({ icone, titulo, texto: "" })),
      }),
      novaSecao("planos", d, { titulo: "Planos", botao: "Quero este plano" }),
      novaSecao("aulas", d, { texto: "Venha fazer uma aula experimental." }),
      ...(d.equipe?.length ? [novaSecao("equipe", d)] : []),
      novaSecao("horarios", d),
      novaSecao("localizacao", d),
      novaSecao("duvidas", d, {
        itens: [
          novoItem({ titulo: "Como faço a matrícula?", texto: "Escolha o plano aqui na página e fale com a gente pelo WhatsApp, ou venha até a recepção." }),
          novoItem({ titulo: "Posso fazer uma aula experimental?", texto: "Pode! Chame no WhatsApp e agende o melhor horário para você." }),
          novoItem({ titulo: "Preciso fazer avaliação física?", texto: "Recomendamos. Com ela, o professor monta o treino certo para o seu objetivo." }),
        ],
      }),
      novaSecao("contato", d, { texto: "Fale com a gente no WhatsApp" }),
      novaSecao("rodape", d),
    ],
  };
}

export const paginaAcademia: ModuloPagina<PaginaAcademiaDados> = {
  modulo: "academia",
  titulo: "Página da academia",
  tipos: ["capa", "aviso", "destaques", "beneficios", "comoFunciona", "sobre", "video", "depoimentos", "galeria", "duvidas", "equipe", "aulas", "horarios", "localizacao", "chamada", "livre", "contato", "rodape"],
  normalizar,
  padrao,
  acento: ["#7c3aed", "#ec4899"],
  ondeMudar: { planos: null, whatsapp: "/academia/configuracoes" },
};
