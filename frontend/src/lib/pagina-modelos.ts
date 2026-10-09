// Modelos de página prontos por NICHO (barbearia, salão de beleza,
// terapeutas...). Cada modelo monta uma página inteira (cores, seções,
// textos e fotos de exemplo) com o nome e os dados da loja; depois o dono
// muda o que quiser no editor (components/pagina/EditorPagina.tsx).
//
// Para criar um nicho novo: escrever uma função como as daqui, pôr as fotos em
// frontend/public/modelos/ e acrescentar em `modelos`. No sistema principal,
// o nicho da loja escolhe o modelo com que a página nasce.
//
// Fotos: Unsplash (licença livre), em frontend/public/modelos/.

import { novaSecao, novoItem, novoTema, type DadosPagina, type IdIcone, type PaginaConfig } from "./pagina";

export type ModeloPagina = {
  chave: string;
  nome: string; // "Barbearia"
  descricao: string;
  foto: string; // miniatura na galeria de modelos
  acento: [string, string]; // cores dos botões do editor
  criar: (d: DadosPagina) => PaginaConfig;
};

const foto = (nome: string) => `/modelos/${nome}.jpg`;
const itens = <T extends object>(lista: T[]) => lista.map((x) => novoItem(x));
const beneficios = (lista: [IdIcone, string, string][]) => lista.map(([icone, titulo, texto]) => novoItem({ icone, titulo, texto }));
const perguntas = (lista: [string, string][]) => lista.map(([titulo, texto]) => novoItem({ titulo, texto }));
const depoimentos = (lista: [string, string, string][]) => lista.map(([autor, detalhe, texto]) => novoItem({ autor, detalhe, texto, foto: null, estrelas: 5 }));
const fotos = (lista: [string, string][]) => lista.map(([nome, titulo]) => novoItem({ imagem: foto(nome), titulo }));

// ---------- Barbearia: preto e dourado, letra de impacto ----------

function barbearia(d: DadosPagina): PaginaConfig {
  return {
    modelo: 3,
    tema: novoTema("dourado", "escuro", { fonte: "anton", raio: "suave", densidade: "padrao" }),
    secoes: [
      novaSecao("aviso", d, { texto: "✂️ Primeiro mês com 20% de desconto para novos assinantes", alvo: "#planos" }),
      novaSecao(
        "capa",
        d,
        {
          etiqueta: "Barbearia · clube de assinatura",
          titulo: "Corte e barba em dia o mês inteiro",
          destaque: "o mês inteiro",
          texto: `Assine o clube da ${d.nome}: corte e barba sem pagar a cada visita, horário marcado pelo celular e comissão todo mês para quem indica os amigos.`,
          imagem: foto("barbearia-salao"),
          escurecer: 60,
          selos: itens([
            { icone: "relogio" as IdIcone, texto: "Sem fila: horário marcado" },
            { icone: "escudo" as IdIcone, texto: "Cancele quando quiser" },
          ]),
          botao: "Ver planos",
          alvo: "#planos",
          botaoSecundario: "Falar no WhatsApp",
          alvoSecundario: "#contato",
        },
        { titulo: "g", espaco: "grande" },
      ),
      novaSecao("destaques", d, {
        itens: itens([
          { titulo: "+800", texto: "cortes por mês" },
          { titulo: "4,9", texto: "nota dos clientes" },
          { titulo: "6", texto: "barbeiros na casa" },
          { titulo: "10 anos", texto: "de tradição" },
        ]),
      }),
      novaSecao(
        "beneficios",
        d,
        {
          etiqueta: "Clube de assinatura",
          titulo: "Por que assinar",
          texto: "Você paga um valor fixo por mês e vem quando quiser.",
          itens: beneficios([
            ["tesoura", "Cortes à vontade", "Venha quantas vezes quiser no mês, sem pagar a mais."],
            ["calendario", "Horário garantido", "Agende pelo celular e seja atendido na hora marcada."],
            ["presente", "Indique e ganhe", "Cada amigo que assinar pelo seu link rende comissão todo mês."],
            ["diamante", "Preço de assinante", "Desconto em produtos, pigmentação e outros serviços."],
            ["pessoas", "Barbeiro de confiança", "Escolha o seu profissional e mantenha o mesmo padrão."],
            ["raio", "Sem burocracia", "Assina em dois minutos e cancela quando quiser."],
          ]),
        },
        { colunas: 3 },
      ),
      novaSecao("sobre", d, {
        etiqueta: "A casa",
        titulo: "Tradição de barbearia, conforto de hoje",
        texto:
          "Toalha quente, navalha e conversa boa, do jeito que barbearia tem que ser. Aqui cada cliente tem o seu corte anotado, para sair igual toda vez.\n\nTroque este texto pela história da sua barbearia.",
        imagem: foto("barbearia-corte"),
        lado: "direita",
        botao: "Conhecer os planos",
        alvo: "#planos",
      }),
      novaSecao("planos", d, { etiqueta: "Planos", titulo: "Escolha o seu plano", texto: "Sem taxa de adesão. Cancele quando quiser.", botao: "Quero este plano" }, { fundo: "alternado", alinhamento: "centro" }),
      novaSecao("comoFunciona", d, {
        etiqueta: "Como funciona",
        titulo: "Em três passos",
        itens: itens([
          { titulo: "Assine um plano", texto: "Escolha o plano e pague pelo celular." },
          { titulo: "Marque o horário", texto: "Agende com o seu barbeiro, no dia que quiser." },
          { titulo: "Indique os amigos", texto: "Receba comissão todo mês por quem entrar pelo seu link." },
        ]),
      }),
      novaSecao(
        "galeria",
        d,
        {
          titulo: "Nosso trabalho",
          texto: "",
          itens: fotos([
            ["barbearia-degrade", "Degradê na navalha"],
            ["barbearia-barba", "Barba alinhada"],
            ["barbearia-corte", "Corte na tesoura"],
            ["barbearia-ferramentas", "Ferramentas da casa"],
          ]),
        },
        { colunas: 4 },
      ),
      novaSecao(
        "depoimentos",
        d,
        {
          titulo: "Quem assina, recomenda",
          itens: depoimentos([
            ["Rafael M.", "Assinante há 1 ano", "Venho toda semana alinhar a barba e pago o mesmo. Vale muito a pena."],
            ["Diego S.", "Assinante há 6 meses", "Marco pelo celular e nunca espero. E ainda ganho indicando os colegas do trabalho."],
            ["Lucas P.", "Assinante há 2 anos", "Melhor degradê da cidade. O barbeiro já sabe como eu gosto."],
          ]),
        },
        { fundo: "alternado" },
      ),
      novaSecao("duvidas", d, {
        itens: perguntas([
          ["Posso cortar quantas vezes no mês?", "Depende do plano. No plano ilimitado, quantas vezes quiser."],
          ["Preciso marcar horário?", "Sim. Assinante agenda pelo celular e é atendido na hora marcada."],
          ["Posso escolher o barbeiro?", "Pode. Na hora de agendar você escolhe o profissional."],
          ["Como funciona a indicação?", "Você recebe um link. Cada pessoa que assinar por ele rende comissão para você enquanto continuar assinando."],
          ["Posso cancelar quando quiser?", "Pode, sem multa. O acesso vale até o fim do período já pago."],
        ]),
      }),
      novaSecao("chamada", d, { titulo: "Bora ficar na régua?", texto: "Assine agora e marque o seu primeiro horário ainda hoje.", botao: "Quero assinar", alvo: "#planos" }, { fundo: "imagem", imagem: foto("barbearia-barba"), escurecer: 70, espaco: "grande" }),
      novaSecao("contato", d, { titulo: "Fale com a gente", texto: "Chamar no WhatsApp" }),
      novaSecao("rodape", d),
    ],
  };
}

// ---------- Salão de beleza: claro, rosa, letra arredondada ----------

function salao(d: DadosPagina): PaginaConfig {
  return {
    modelo: 3,
    tema: novoTema("doceria", "claro", { fonte: "outfit", raio: "redondo", densidade: "padrao" }),
    secoes: [
      novaSecao(
        "capa",
        d,
        {
          etiqueta: "Salão de beleza · clube de assinatura",
          titulo: "Beleza em dia, todo mês",
          destaque: "todo mês",
          texto: `No clube da ${d.nome} você cuida do cabelo, das unhas e da pele por um valor fixo no mês, com horário reservado e vantagens de assinante.`,
          imagem: foto("salao-secador"),
          escurecer: 35,
          selos: itens([
            { icone: "calendario" as IdIcone, texto: "Horário reservado" },
            { icone: "coracao" as IdIcone, texto: "Cancele quando quiser" },
          ]),
          botao: "Ver planos",
          alvo: "#planos",
          botaoSecundario: "Agendar pelo WhatsApp",
          alvoSecundario: "#contato",
        },
        { espaco: "grande" },
      ),
      novaSecao(
        "beneficios",
        d,
        {
          etiqueta: "Nossos serviços",
          titulo: "Tudo o que você precisa num lugar só",
          texto: "",
          itens: beneficios([
            ["tesoura", "Corte e escova", "Corte, hidratação, escova e finalização."],
            ["brilho", "Coloração e mechas", "Tintura, luzes e tratamentos para manter a cor."],
            ["flor", "Unhas", "Manicure, pedicure, alongamento e esmaltação em gel."],
            ["estrela", "Maquiagem", "Para o dia a dia, festas e noivas."],
            ["coracao", "Cuidados com a pele", "Limpeza de pele, sobrancelha e depilação."],
            ["presente", "Indique e ganhe", "Cada amiga que assinar pelo seu link rende comissão todo mês."],
          ]),
        },
        { colunas: 3, alinhamento: "centro" },
      ),
      novaSecao(
        "galeria",
        d,
        {
          titulo: "Resultados que a gente ama",
          texto: "",
          itens: fotos([
            ["salao-cabelo", "Mechas e ondas"],
            ["salao-maquiagem", "Maquiagem"],
            ["salao-unhas", "Unhas em gel"],
            ["salao-cachos", "Cachos definidos"],
          ]),
        },
        { colunas: 4, fundo: "alternado", alinhamento: "centro" },
      ),
      novaSecao("planos", d, { etiqueta: "Planos", titulo: "Escolha o seu plano", texto: "Um valor fixo por mês, sem surpresa na hora de pagar.", botao: "Quero este plano" }, { alinhamento: "centro" }),
      novaSecao("sobre", d, {
        etiqueta: "O salão",
        titulo: "Um espaço pensado para você relaxar",
        texto: "Café, música boa e uma equipe que escuta o que você quer antes de pegar na tesoura.\n\nTroque este texto pela história do seu salão.",
        imagem: foto("salao-cadeiras"),
        lado: "esquerda",
        botao: "",
        alvo: "",
      }),
      novaSecao("comoFunciona", d, {
        etiqueta: "Como funciona",
        titulo: "Simples assim",
        itens: itens([
          { titulo: "Assine um plano", texto: "Escolha o plano que combina com a sua rotina." },
          { titulo: "Reserve o seu horário", texto: "Agende pelo celular com a profissional que preferir." },
          { titulo: "Indique as amigas", texto: "Ganhe comissão todo mês por quem entrar pelo seu link." },
        ]),
      }),
      novaSecao(
        "depoimentos",
        d,
        {
          titulo: "O que as clientes dizem",
          itens: depoimentos([
            ["Camila R.", "Assinante há 8 meses", "Faço escova toda semana e unha a cada quinze dias. Sai muito mais em conta do que pagar avulso."],
            ["Juliana T.", "Assinante há 1 ano", "Atendimento maravilhoso e sempre no horário. Já indiquei para a família toda."],
            ["Patrícia L.", "Assinante há 4 meses", "Minhas mechas nunca ficaram tão bonitas. Recomendo de olhos fechados."],
          ]),
        },
        { fundo: "alternado" },
      ),
      novaSecao("duvidas", d, {
        itens: perguntas([
          ["O que está incluído no plano?", "Cada plano mostra os serviços incluídos. Serviços extras têm desconto para assinante."],
          ["Preciso agendar?", "Sim. Assim o seu horário fica reservado e você não espera."],
          ["Posso escolher a profissional?", "Pode. Na hora de agendar você escolhe quem vai te atender."],
          ["Posso cancelar quando quiser?", "Pode, sem multa. O acesso vale até o fim do período já pago."],
        ]),
      }),
      novaSecao("chamada", d, { titulo: "Pronta para se cuidar?", texto: "Assine e reserve o seu primeiro horário.", botao: "Quero assinar", alvo: "#planos" }, { fundo: "marca", espaco: "grande" }),
      novaSecao("contato", d, { titulo: "Fale com a gente", texto: "Chamar no WhatsApp" }),
      novaSecao("rodape", d),
    ],
  };
}

// ---------- Terapeutas: claro, verde-água, bastante respiro ----------

function terapeuta(d: DadosPagina): PaginaConfig {
  return {
    modelo: 3,
    tema: novoTema("tropical", "claro", { fonte: "outfit", raio: "redondo", densidade: "ampla" }),
    secoes: [
      novaSecao(
        "capa",
        d,
        {
          etiqueta: "Terapias e bem-estar",
          titulo: "Um tempo para cuidar de você",
          destaque: "cuidar de você",
          texto: "Sessões para aliviar dores, desacelerar a mente e recuperar a energia, com acompanhamento contínuo e um valor que cabe no mês.",
          imagem: foto("terapeuta-massagem"),
          escurecer: 40,
          mostrarNumero: false,
          selos: itens([
            { icone: "folha" as IdIcone, texto: "Atendimento individual" },
            { icone: "calendario" as IdIcone, texto: "Horário reservado para você" },
          ]),
          botao: "Ver pacotes",
          alvo: "#planos",
          botaoSecundario: "Agendar pelo WhatsApp",
          alvoSecundario: "#contato",
        },
        { alinhamento: "centro", espaco: "grande" },
      ),
      novaSecao("sobre", d, {
        etiqueta: "Sobre mim",
        titulo: d.equipe?.[0] ? `Prazer, eu sou a ${d.equipe[0].nome.split(" ")[0]}` : `Prazer, aqui é a ${d.nome}`,
        texto:
          "Sou terapeuta e trabalho com um atendimento humanizado: antes de qualquer técnica, eu escuto como você está.\n\nTroque este texto pela sua história, a sua formação e o que te move neste trabalho.",
        imagem: foto("terapeuta-retrato"),
        lado: "esquerda",
        botao: "",
        alvo: "",
      }),
      novaSecao(
        "beneficios",
        d,
        {
          etiqueta: "Atendimentos",
          titulo: "Como posso ajudar",
          texto: "Cada sessão é pensada para o que o seu corpo e a sua mente estão pedindo.",
          itens: beneficios([
            ["coracao", "Massagem relaxante", "Alivia a tensão e melhora o sono."],
            ["alvo", "Massagem terapêutica", "Para dores nas costas, no pescoço e nos ombros."],
            ["folha", "Aromaterapia", "Óleos essenciais para equilibrar corpo e emoções."],
            ["brilho", "Reiki", "Harmonização de energia para dias mais leves."],
            ["flor", "Pedras quentes", "Calor que solta a musculatura e acalma."],
            ["sorriso", "Escuta e acolhimento", "Um espaço seguro, sem pressa e sem julgamento."],
          ]),
        },
        { colunas: 3, fundo: "alternado", alinhamento: "centro" },
      ),
      novaSecao("comoFunciona", d, {
        etiqueta: "Como funciona",
        titulo: "O seu cuidado em três passos",
        itens: itens([
          { titulo: "Escolha o pacote", texto: "Veja qual frequência de sessões combina com você." },
          { titulo: "Agende a sessão", texto: "Reserve o melhor dia e horário pelo celular." },
          { titulo: "Cuide-se todo mês", texto: "Com sessões regulares, o resultado aparece e se mantém." },
        ]),
      }),
      novaSecao("planos", d, { etiqueta: "Pacotes", titulo: "Pacotes de sessões", texto: "Quem cuida de si com frequência paga menos por sessão.", botao: "Quero este pacote", selo: "Mais procurado" }, { fundo: "alternado", alinhamento: "centro" }),
      novaSecao(
        "galeria",
        d,
        {
          titulo: "O espaço",
          texto: "Um ambiente calmo, limpo e preparado para você.",
          itens: fotos([
            ["terapeuta-pedras", "Pedras quentes"],
            ["terapeuta-maos", "Massagem terapêutica"],
            ["terapeuta-oleo", "Óleos essenciais"],
          ]),
        },
        { colunas: 3, alinhamento: "centro" },
      ),
      novaSecao("depoimentos", d, {
        titulo: "Quem já passou por aqui",
        itens: depoimentos([
          ["Mariana F.", "Em acompanhamento há 6 meses", "Cheguei com dor nas costas todo dia. Hoje durmo bem e trabalho sem dor."],
          ["Renata C.", "Em acompanhamento há 1 ano", "É a minha hora de respirar na semana. Saio outra pessoa."],
          ["Paulo H.", "Em acompanhamento há 3 meses", "Atendimento muito humano. Indiquei para a minha esposa e para a minha mãe."],
        ]),
      }),
      novaSecao("duvidas", d, {
        itens: perguntas([
          ["Quanto tempo dura uma sessão?", "Em média 60 minutos. Na primeira, reservamos um tempo a mais para conversar."],
          ["Com que frequência devo vir?", "Depende do seu objetivo. Na primeira sessão eu indico a frequência ideal."],
          ["Preciso levar alguma coisa?", "Não. Venha com roupa confortável; o resto está preparado."],
          ["E se eu precisar desmarcar?", "Avise com antecedência e remarcamos sem custo."],
          ["Posso cancelar o pacote?", "Pode, quando quiser. As sessões já pagas continuam valendo."],
        ]),
      }),
      novaSecao("chamada", d, { titulo: "Vamos começar?", texto: "Reserve o seu horário e dê o primeiro passo.", botao: "Ver pacotes", alvo: "#planos" }, { fundo: "imagem", imagem: foto("terapeuta-meditacao"), escurecer: 60, espaco: "grande" }),
      novaSecao("contato", d, { titulo: "Fale comigo", texto: "Chamar no WhatsApp" }),
      novaSecao("rodape", d),
    ],
  };
}

export const modelos: ModeloPagina[] = [
  {
    chave: "barbearia",
    nome: "Barbearia",
    descricao: "Preto e dourado, letra de impacto. Clube de corte e barba, galeria de trabalhos e chamada forte.",
    foto: foto("barbearia-salao"),
    acento: ["#eab308", "#ca8a04"],
    criar: barbearia,
  },
  {
    chave: "salao",
    nome: "Salão de beleza",
    descricao: "Claro e rosa, cantos redondos. Serviços, resultados em fotos e planos de assinatura.",
    foto: foto("salao-secador"),
    acento: ["#f472b6", "#db2777"],
    criar: salao,
  },
  {
    chave: "terapeuta",
    nome: "Terapeutas",
    descricao: "Claro e verde-água, com bastante respiro. Sobre mim, atendimentos e pacotes de sessões.",
    foto: foto("terapeuta-massagem"),
    acento: ["#2dd4bf", "#0891b2"],
    criar: terapeuta,
  },
];

export const modelo = (chave: string) => modelos.find((m) => m.chave === chave) ?? null;
