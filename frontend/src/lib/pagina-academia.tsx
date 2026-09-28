// Academia no editor de páginas comum (lib/pagina.ts): o que a página pública
// (/a/<slug>) pode ter e a página padrão.
// Contrato com o backend: backend/src/main/java/br/com/clienteplus/modulos/academia/PaginaAcademia.java

import { AvatarAcademia } from "../components/academia/Marcas";
import { http } from "./http";
import { novaSecao, periodo, type DadosPagina, type ModuloPagina, type PaginaConfig } from "./pagina";

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
    versao: 1,
    tema: { fundo: "marinho", cor1: "#7c3aed", cor2: "#ec4899", fonte: "outfit", cantos: "redondos" },
    secoes: [
      novaSecao("topo", d, {
        titulo: `Treine na ${a.nome}`,
        destaque: a.nome,
        texto: "Musculação, aulas coletivas e professores acompanhando o seu treino. Escolha o seu plano e comece hoje.",
        capa: "/academia/hero.jpg",
        escurecer: 55,
        selos: [
          { icone: "haltere", texto: "Equipamentos modernos" },
          { icone: "pessoas", texto: "Professores no salão" },
        ],
      }),
      novaSecao("beneficios", d, {
        titulo: "Por que treinar aqui",
        itens: [
          { icone: "haltere", texto: "Musculação completa" },
          { icone: "pessoas", texto: "Aulas coletivas todos os dias" },
          { icone: "grafico", texto: "Avaliação física e acompanhamento" },
          { icone: "alvo", texto: "Treino montado para o seu objetivo" },
          { icone: "relogio", texto: "Horários que cabem na sua rotina" },
          { icone: "conversa", texto: "Atendimento pelo WhatsApp" },
        ],
      }),
      novaSecao("planos", d, { titulo: "Planos", botao: "Quero este plano" }),
      novaSecao("aulas", d, { texto: "Venha fazer uma aula experimental." }),
      ...(d.equipe?.length ? [novaSecao("equipe", d)] : []),
      novaSecao("horarios", d),
      novaSecao("localizacao", d),
      novaSecao("perguntas", d, {
        itens: [
          { pergunta: "Como faço a matrícula?", resposta: "Escolha o plano aqui na página e fale com a gente pelo WhatsApp, ou venha até a recepção." },
          { pergunta: "Posso fazer uma aula experimental?", resposta: "Pode! Chame no WhatsApp e agende o melhor horário para você." },
          { pergunta: "Preciso fazer avaliação física?", resposta: "Recomendamos. Com ela, o professor monta o treino certo para o seu objetivo." },
        ],
      }),
      novaSecao("contato", d, { texto: "Fale com a gente no WhatsApp" }),
    ],
  };
}

export const paginaAcademia: ModuloPagina<PaginaAcademiaDados> = {
  modulo: "academia",
  titulo: "Página da academia",
  tipos: ["aviso", "beneficios", "passos", "texto", "video", "depoimentos", "imagens", "perguntas", "equipe", "aulas", "horarios", "localizacao", "chamada", "contato"],
  normalizar,
  padrao,
  acento: ["#7c3aed", "#ec4899"],
  ondeMudar: { endereco: "/academia/configuracoes", planos: null, whatsapp: "/academia/configuracoes" },
};
