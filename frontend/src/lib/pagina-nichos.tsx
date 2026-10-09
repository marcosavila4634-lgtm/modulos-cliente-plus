// Editores de página por NICHO (barbearia, salão de beleza, terapeutas):
// o mesmo editor de todos os módulos (components/pagina), nascendo com o
// modelo pronto do nicho (lib/pagina-modelos.ts). Ficam numa área separada do
// laboratório (/editores), fora dos módulos, para irem sozinhos ao sistema
// principal.
//
// Backend: backend/src/main/java/br/com/clienteplus/modulos/nichos/PaginaDeNicho.java
// (loja de exemplo de cada nicho; no sistema principal é a loja de verdade).

import { http } from "./http";
import { periodo, type DadosPagina, type ModuloPagina, type TipoSecao } from "./pagina";
import { modelos, type ModeloPagina } from "./pagina-modelos";

export type NichoDados = {
  nicho: string;
  nome: string;
  whatsapp: string | null;
  endereco: string | null;
  clientes: number;
  rotuloClientes: string; // "clientes no clube"
  planos: { id: string; nome: string; descricao: string; preco: number; duracaoMeses: number; itens: string[] }[];
  horarios: { dia: string; texto: string }[];
  equipe: { nome: string; cargo: string }[];
  pagina: unknown | null; // página publicada (null = o modelo do nicho)
};

export const buscarPaginaDoNicho = (nicho: string) => http.get<NichoDados>(`/nichos/${encodeURIComponent(nicho)}/publico`);

function normalizar(a: NichoDados): DadosPagina {
  const hoje = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][new Date().getDay()];
  return {
    nome: a.nome,
    numero: { valor: a.clientes, rotulo: a.rotuloClientes },
    whatsapp: a.whatsapp,
    mensagemWhatsapp: `Olá! Vim pela página da ${a.nome}.`,
    endereco: a.endereco,
    planos: a.planos.map((p) => ({ id: p.id, nome: p.nome, descricao: p.descricao, preco: p.preco, periodo: periodo(p.duracaoMeses), itens: p.itens.map((texto) => ({ texto })) })),
    horarios: a.horarios.map((h) => ({ ...h, hoje: h.dia === hoje })),
    equipe: a.equipe,
  };
}

// seções que o dono pode adicionar (as de dados só de módulos, como aulas, ficam de fora)
const tipos: TipoSecao[] = ["capa", "aviso", "destaques", "beneficios", "comoFunciona", "sobre", "video", "depoimentos", "galeria", "duvidas", "equipe", "horarios", "localizacao", "chamada", "livre", "contato", "rodape"];

function adaptador(m: ModeloPagina): ModuloPagina<NichoDados> {
  return {
    modulo: `nicho-${m.chave}`,
    titulo: `Página · ${m.nome}`,
    tipos,
    normalizar,
    padrao: (a) => m.criar(normalizar(a)),
    acento: m.acento,
    ondeMudar: { planos: null, whatsapp: "/editores" },
    modelos,
  };
}

export const nichos: Record<string, ModuloPagina<NichoDados>> = Object.fromEntries(modelos.map((m) => [m.chave, adaptador(m)]));
