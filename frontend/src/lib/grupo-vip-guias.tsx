// Passo a passo de tudo o que o dono precisa configurar ou fazer fora do
// sistema (Telegram, WhatsApp, Google, banco). Aparece no "Como fazer?" de
// cada tela, na Central de ajuda (botão "?" do topo) e nos Primeiros passos
// do Dashboard. Um texto só para cada assunto: mude aqui e muda em todo lugar.

import type { ReactNode } from "react";
import { http } from "./http";

export type Guia = {
  titulo: string;
  // uma frase: para que serve
  resumo: string;
  categoria: Categoria;
  // tempo aproximado (ex.: "5 min")
  tempo?: string;
  passos: ReactNode[];
  // como saber que deu certo
  pronto?: ReactNode;
  dicas?: ReactNode[];
  // [pergunta, resposta]
  problemas?: [string, ReactNode][];
  // tela onde se faz (botão "Ir para a tela")
  tela?: { rotulo: string; para: string };
  // palavras extras para a busca
  busca?: string;
};

export type Categoria = "Começo" | "Telegram" | "WhatsApp" | "Vendas e pagamentos" | "Membros" | "Biblioteca" | "Comunicação";

export const categorias: Categoria[] = ["Começo", "Telegram", "WhatsApp", "Vendas e pagamentos", "Membros", "Biblioteca", "Comunicação"];

const Ext = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noreferrer" className="text-orange-300 underline">
    {children}
  </a>
);
const C = ({ children }: { children: ReactNode }) => <code className="rounded bg-white/5 px-1 text-orange-200">{children}</code>;

export const guias = {
  // ---------------- Começo ----------------
  pagina: {
    titulo: "Personalizar e divulgar a página de vendas",
    resumo: "A página onde as pessoas escolhem o plano, pagam e recebem o acesso.",
    categoria: "Começo",
    tempo: "5 min",
    passos: [
      <>Abra <b>Configurações</b> e desça até <b>Página de vendas</b>.</>,
      <>Em <b>Endereço da página</b>, escolha um nome curto (ex.: <C>meu-grupo-vip</C>). Só letras minúsculas, números e hífen.</>,
      <>Escreva a <b>Descrição</b> (o que a pessoa ganha ao assinar) e os <b>Benefícios</b>, um por linha.</>,
      <>Envie uma <b>Foto de capa</b> (de preferência deitada, 1200 × 600).</>,
      <>Toque em <b>Salvar</b>, no alto da tela.</>,
      <>Toque em <b>Copiar link</b> e divulgue: bio do Instagram, status do WhatsApp, stories, grupos gratuitos.</>,
    ],
    pronto: <>Toque em <b>Abrir</b> ao lado do link: a página mostra seus planos, a descrição e a foto.</>,
    dicas: [<>Os membros também divulgam: cada um tem um link de indicação na área do membro e ganha comissão todo mês.</>],
    tela: { rotulo: "Abrir Configurações", para: "/grupo-vip/configuracoes" },
    busca: "divulgar link vendas capa descricao slug",
  },
  grupo: {
    titulo: "Cadastrar um grupo",
    resumo: "Cada grupo do Telegram ou do WhatsApp que você vende entra aqui.",
    categoria: "Começo",
    tempo: "2 min",
    passos: [
      <>Abra <b>Grupos e planos</b> e toque em <b>Novo grupo</b>.</>,
      <>Dê o <b>nome</b> (como os membros vão ver) e uma descrição curta.</>,
      <>Escolha <b>Telegram</b> ou <b>WhatsApp</b>.</>,
      <>
        <b>Telegram:</b> coloque o robô como administrador do grupo e informe o <b>ID do grupo</b> (veja o passo a passo "Colocar o robô como
        administrador"). <b>WhatsApp:</b> cole o <b>link de convite</b> do grupo.
      </>,
      <>Toque em <b>Salvar</b>. Depois, abra cada plano e marque os grupos que ele libera.</>,
    ],
    pronto: <>O grupo aparece na lista. Grupo do Telegram ligado ao robô mostra a etiqueta <b>Telegram · robô</b>.</>,
    tela: { rotulo: "Abrir Grupos e planos", para: "/grupo-vip/grupos" },
  },
  plano: {
    titulo: "Criar um plano",
    resumo: "O que a pessoa assina: preço, de quanto em quanto tempo paga e quais grupos libera.",
    categoria: "Começo",
    tempo: "3 min",
    passos: [
      <>Abra <b>Grupos e planos</b> e toque em <b>Novo plano</b>.</>,
      <>Dê um nome (ex.: <i>VIP Mensal</i>), o <b>preço</b> e a <b>cobrança</b> (mensal, trimestral, semestral ou anual). Preço 0 = cortesia.</>,
      <>Marque os <b>grupos que o plano libera</b>.</>,
      <>
        Nos grupos do Telegram, escolha o que quem assina pode fazer: <b>tudo liberado</b>, <b>só texto</b> ou <b>só leitura</b>.
      </>,
      <>Deixe <b>Gera comissão de indicação</b> ligado para quem indicou ganhar comissão todo mês.</>,
      <>Toque em <b>Salvar</b>. O plano já aparece na página de vendas.</>,
    ],
    dicas: [<>Mudar o preço vale para as novas assinaturas; quem já assina continua pagando o valor dela.</>],
    tela: { rotulo: "Abrir Grupos e planos", para: "/grupo-vip/grupos" },
    busca: "preço mensalidade assinatura",
  },
  "suporte-whatsapp": {
    titulo: "WhatsApp de atendimento",
    resumo: "O número que os membros e os interessados usam para falar com você.",
    categoria: "Começo",
    tempo: "1 min",
    passos: [
      <>Abra <b>Configurações</b>, cartão <b>Negócio</b>.</>,
      <>Em <b>WhatsApp do suporte</b>, digite o número com DDD (ex.: 11 99999-0000).</>,
      <>Toque em <b>Salvar</b>, no alto da tela.</>,
    ],
    pronto: <>O botão "Falar com a equipe" aparece na página de vendas e no menu do robô.</>,
    tela: { rotulo: "Abrir Configurações", para: "/grupo-vip/configuracoes" },
  },

  // ---------------- Telegram ----------------
  robo: {
    titulo: "Criar e conectar o robô do Telegram",
    resumo: "O robô coloca quem pagou nos grupos, tira quem parou de pagar, publica conteúdos e atende no privado.",
    categoria: "Telegram",
    tempo: "5 min",
    passos: [
      <>
        No Telegram, abra o <Ext href="https://t.me/BotFather">@BotFather</Ext> (é o robô oficial do Telegram, com o selo azul).
      </>,
      <>Toque em <b>Iniciar</b> e mande <C>/newbot</C>.</>,
      <>Ele pede um <b>nome</b>: é o que os membros veem (ex.: <i>Assistente do Meu Grupo VIP</i>).</>,
      <>Depois pede um <b>usuário</b>, que precisa terminar em <C>bot</C> (ex.: <C>meugrupovip_bot</C>).</>,
      <>
        Ele responde com um <b>token</b>, parecido com <C>123456789:AAE...</C>. Toque nele para copiar. Não mande para ninguém: é a senha do robô.
      </>,
      <>Aqui no sistema: <b>Configurações › Robô do Telegram</b>, cole o token e toque em <b>Conectar robô</b>.</>,
    ],
    pronto: <>Aparece em verde <b>Conectado: @seurobo</b>.</>,
    problemas: [
      ["Deu \"Token inválido\"", <>Copie o token de novo, inteiro, sem espaço no começo ou no fim. Perdeu? No @BotFather mande <C>/mybots</C> › escolha o robô › <b>API Token</b>.</>],
      ["O robô já é usado em outro sistema", <>Cada robô só funciona em um sistema por vez. Crie outro robô só para o Grupos VIP.</>],
    ],
    tela: { rotulo: "Abrir Configurações", para: "/grupo-vip/configuracoes" },
    busca: "botfather token bot",
  },
  "robo-admin": {
    titulo: "Colocar o robô como administrador do grupo",
    resumo: "Sem isso o robô não consegue aprovar entradas, tirar quem não pagou nem publicar.",
    categoria: "Telegram",
    tempo: "3 min",
    passos: [
      <>Abra o grupo no Telegram e toque no <b>nome do grupo</b>, lá em cima.</>,
      <>Toque em <b>Editar</b> (lápis) › <b>Administradores</b> › <b>Adicionar administrador</b>.</>,
      <>Procure o robô pelo usuário (ex.: <C>@meugrupovip_bot</C>) e toque nele.</>,
      <>
        Deixe ligadas: <b>Apagar mensagens</b>, <b>Banir usuários</b>, <b>Convidar usuários via link</b>, <b>Fixar mensagens</b> e, se usar,{" "}
        <b>Gerenciar tópicos</b>. Para dar cargo de administrador a membros pelo sistema, ligue também <b>Adicionar administradores</b>.
      </>,
      <>Toque em <b>Salvar</b> (✓).</>,
      <>
        No grupo, mande <C>/id</C>. O robô responde o <b>ID do grupo</b> (um número que começa com <C>-100</C>). Ele também aparece em{" "}
        <b>Configurações › Robô do Telegram</b>, com botão para copiar.
      </>,
      <>Aqui: <b>Grupos e planos</b>, abra o grupo (lápis), cole o número em <b>ID do grupo no Telegram</b> e toque em <b>Salvar</b>.</>,
    ],
    pronto: <>O grupo mostra a etiqueta <b>Telegram · robô</b> e a partir daí as entradas e saídas são automáticas.</>,
    problemas: [
      ["O robô não respondeu o /id", <>Confira se ele está como administrador e se aparece "Conectado" em Configurações. Espere uns segundos e mande de novo.</>],
      ["O ID mudou", <>Quando o Telegram transforma o grupo em "supergrupo" (acontece ao dar cargo de administrador), o ID muda. Mande <C>/id</C> de novo e troque aqui.</>],
    ],
    tela: { rotulo: "Abrir Grupos e planos", para: "/grupo-vip/grupos" },
    busca: "id do grupo administrador admin permissao",
  },
  topicos: {
    titulo: "Usar tópicos no grupo do Telegram",
    resumo: "Separa o grupo em assuntos (Avisos, Materiais, Dúvidas) e você escolhe onde cada post cai.",
    categoria: "Telegram",
    tempo: "2 min",
    passos: [
      <>No Telegram, abra o grupo › toque no nome › <b>Editar</b>.</>,
      <>Ligue <b>Tópicos</b> e salve.</>,
      <>Confira se o robô tem a permissão <b>Gerenciar tópicos</b> (Administradores › robô).</>,
      <>Aqui: <b>Telegram</b> › escolha o grupo › <b>Tópicos</b> › crie os tópicos. Os criados no Telegram aparecem sozinhos.</>,
    ],
    tela: { rotulo: "Abrir Controle do Telegram", para: "/grupo-vip/telegram" },
  },
  permissoes: {
    titulo: "O que cada membro pode fazer no grupo",
    resumo: "Só leitura, só texto, tudo liberado ou administrador, por plano ou por pessoa.",
    categoria: "Telegram",
    tempo: "2 min",
    passos: [
      <><b>Pelo plano:</b> Grupos e planos › editar o plano › escolha, para cada grupo do Telegram, tudo liberado, só texto ou só leitura.</>,
      <>
        <b>Por pessoa:</b> Membros › abra o membro › cartão <b>Grupos</b> › <b>Permissões</b>. Dá para pôr prazo (ex.: só leitura por 3 dias) ou
        tornar administrador com um título ao lado do nome (ex.: Moderadora).
      </>,
      <><b>Atrasado só lê:</b> Configurações › Regras de acesso › ligue <b>Atrasado só lê</b>. Pagou, o robô libera sozinho.</>,
    ],
    dicas: [
      <>O robô precisa ser administrador com <b>Banir usuários</b> (para limitar) e <b>Adicionar administradores</b> (para promover).</>,
      <>O Telegram não deixa robôs adicionarem pessoas em grupos: a entrada é sempre pelo link exclusivo que o robô manda.</>,
    ],
    busca: "moderador administrador somente leitura restringir",
  },
  "membro-telegram": {
    titulo: "Conectar o Telegram do membro",
    resumo: "O Telegram só deixa o robô mandar mensagem para quem conversou com ele primeiro.",
    categoria: "Telegram",
    tempo: "1 min",
    passos: [
      <>Abra a ficha do membro › <b>Contato e links</b> › copie o link <b>Área do membro</b> (ou o <b>Conectar ao robô do Telegram</b>).</>,
      <>Mande para a pessoa (pelo WhatsApp, por exemplo).</>,
      <>Ela toca em <b>Conectar Telegram</b>, o Telegram abre e ela toca em <b>Iniciar</b>.</>,
    ],
    pronto: <>A ficha mostra <b>conectado ao robô</b> e a pessoa recebe os links dos grupos e o menu do robô.</>,
    problemas: [["Nada acontece quando ela toca", <>Ela precisa ter o Telegram instalado. Peça para abrir o link no celular.</>]],
  },

  // ---------------- WhatsApp ----------------
  "grupo-whatsapp": {
    titulo: "Pegar o link de convite do grupo do WhatsApp",
    resumo: "Com ele o sistema manda o acesso para quem pagou com um toque.",
    categoria: "WhatsApp",
    tempo: "1 min",
    passos: [
      <>No WhatsApp, abra o grupo e toque no <b>nome do grupo</b>, lá em cima.</>,
      <>Toque em <b>Convidar via link</b> (em alguns celulares: "Convidar para o grupo via link").</>,
      <>Toque em <b>Copiar link</b> (começa com <C>https://chat.whatsapp.com/</C>).</>,
      <>Aqui: <b>Grupos e planos</b>, abra o grupo (lápis), cole em <b>Link do grupo</b> e toque em <b>Salvar</b>.</>,
    ],
    dicas: [
      <>Se você tocar em "Redefinir link" no WhatsApp, o antigo para de funcionar: cole o novo aqui.</>,
      <>
        No WhatsApp você coloca e tira as pessoas: o sistema mostra a lista em <b>Controle de acesso</b>. Ele não faz sozinho porque o WhatsApp
        não tem um jeito oficial para isso, e os não oficiais podem banir o seu número.
      </>,
    ],
    tela: { rotulo: "Abrir Grupos e planos", para: "/grupo-vip/grupos" },
  },
  "controle-acesso": {
    titulo: "Quem entra e quem sai dos grupos",
    resumo: "Compara quem pagou com quem está em cada grupo.",
    categoria: "WhatsApp",
    passos: [
      <><b>Telegram com o robô:</b> tudo sozinho, a cada minuto. Quem pagou recebe um link exclusivo; quem passou da tolerância de atraso sai.</>,
      <>
        <b>WhatsApp:</b> em "Precisa entrar", toque em <b>Enviar acesso</b> (abre o WhatsApp com a mensagem pronta) e, quando a pessoa entrar,
        em <b>Já está no grupo</b>.
      </>,
      <>Em "Precisa sair", remova a pessoa no WhatsApp (toque no nome dela no grupo › Remover) e depois toque em <b>Já saiu</b>.</>,
    ],
    dicas: [<>Os dias de tolerância de atraso ficam em Configurações › Regras de acesso.</>],
    tela: { rotulo: "Abrir Controle de acesso", para: "/grupo-vip/acessos" },
  },
  automacoes: {
    titulo: "Mensagens automáticas e caixa de saída",
    resumo: "Boas-vindas, lembrete de vencimento, atraso, aniversário... saem sozinhas.",
    categoria: "WhatsApp",
    passos: [
      <>Abra <b>Automação</b>. Cada mensagem tem liga/desliga, os dias (ex.: lembrete 3 dias antes) e o texto.</>,
      <>No texto, as palavras entre chaves são trocadas sozinhas: <C>{"{nome}"}</C>, <C>{"{link_area}"}</C>, <C>{"{vencimento}"}</C>...</>,
      <>Para quem conectou o Telegram, a mensagem sai sozinha pelo robô.</>,
      <>
        Para os outros, ela fica na <b>Caixa de saída</b>: toque em <b>Enviar</b>, o WhatsApp abre com o texto pronto, e é só tocar em enviar
        lá.
      </>,
    ],
    tela: { rotulo: "Abrir Automação", para: "/grupo-vip/automacao" },
    busca: "lembrete cobranca mensagem",
  },

  // ---------------- Vendas e pagamentos ----------------
  pix: {
    titulo: "Configurar o Pix",
    resumo: "O membro paga com QR Code ou copia e cola, com o valor certo, direto na sua conta.",
    categoria: "Vendas e pagamentos",
    tempo: "2 min",
    passos: [
      <>Abra <b>Configurações</b>, cartão <b>Regras de acesso</b>, parte <b>Pix</b>.</>,
      <>
        Em <b>Chave Pix</b>, coloque a mesma chave cadastrada no seu banco: CPF/CNPJ, e-mail, telefone (no formato <C>+5511999999999</C>) ou
        chave aleatória.
      </>,
      <><b>Nome de quem recebe:</b> como está no banco (até 25 letras). <b>Cidade:</b> até 15 letras.</>,
      <>Toque em <b>Salvar</b>, no alto da tela.</>,
    ],
    pronto: <>Abra a área de um membro com cobrança em aberto: aparecem o QR Code e o botão "Copiar código Pix".</>,
    dicas: [
      <>
        O dinheiro cai na sua conta, mas o sistema não vê o seu banco: quando cair, confirme em <b>Receber</b> (veja "Confirmar um pagamento").
        No Cliente Plus completo isso é automático.
      </>,
    ],
    problemas: [["O banco diz \"chave não encontrada\"", <>Confira a chave. Telefone precisa de +55 e DDD; CPF/CNPJ só com números.</>]],
    tela: { rotulo: "Abrir Configurações", para: "/grupo-vip/configuracoes" },
  },
  receber: {
    titulo: "Confirmar um pagamento",
    resumo: "Pagamento confirmado libera o acesso e gera as comissões de indicação.",
    categoria: "Vendas e pagamentos",
    tempo: "1 min",
    passos: [
      <>Abra <b>Membros</b> e toque no membro (ou <b>Financeiro › Receitas</b>).</>,
      <>Na cobrança em aberto, toque em <b>Receber</b>.</>,
      <>Escolha a forma (Pix, dinheiro, cartão...) e confirme.</>,
    ],
    pronto: <>A situação vira <b>Em dia</b>, a próxima cobrança já é criada e, no Telegram, o robô manda o link de entrada.</>,
    tela: { rotulo: "Abrir Membros", para: "/grupo-vip/membros" },
  },
  cupom: {
    titulo: "Criar um cupom de desconto",
    resumo: "Desconto no primeiro pagamento, digitado na página de vendas.",
    categoria: "Vendas e pagamentos",
    tempo: "1 min",
    passos: [
      <>Abra <b>Configurações</b> › <b>Cupons de desconto</b> › <b>Novo cupom</b>.</>,
      <>Escolha o código (ex.: <C>BEMVINDO10</C>), se o desconto é em % ou em R$, e o valor.</>,
      <>Se quiser, ponha validade e limite de usos. Toque em <b>Salvar</b>.</>,
      <>Divulgue o código junto com o link da página de vendas.</>,
    ],
    tela: { rotulo: "Abrir Configurações", para: "/grupo-vip/configuracoes" },
  },
  saques: {
    titulo: "Pagar os saques de comissão",
    resumo: "Membros que indicam ganham comissão e pedem saque pela área do membro.",
    categoria: "Vendas e pagamentos",
    passos: [
      <>Abra <b>Financeiro › Saques</b>.</>,
      <>Em cada pedido aparece a chave Pix da pessoa: faça o Pix pelo app do seu banco.</>,
      <>Volte aqui e toque em <b>Marcar como pago</b> (ou recuse, explicando o motivo).</>,
    ],
    tela: { rotulo: "Abrir Saques", para: "/grupo-vip/saques" },
  },

  // ---------------- Membros ----------------
  membro: {
    titulo: "Cadastrar um membro",
    resumo: "Para quem assinou fora da página de vendas (ex.: pagou no seu WhatsApp).",
    categoria: "Membros",
    tempo: "2 min",
    passos: [
      <>Abra <b>Membros</b> e toque em <b>Novo membro</b>.</>,
      <>Preencha o nome e o WhatsApp (e-mail, CPF e nascimento são opcionais).</>,
      <>Escolha o plano. Se a pessoa já pagou, marque a forma de pagamento; senão a cobrança fica em aberto.</>,
      <>Toque em <b>Salvar</b>. Na ficha, copie o link da <b>área do membro</b> e mande para a pessoa: por ali ela paga, entra nos grupos e conecta o Telegram.</>,
    ],
    dicas: [<>Quem assina pela página de vendas é cadastrado sozinho.</>],
    tela: { rotulo: "Abrir Membros", para: "/grupo-vip/membros" },
  },

  // ---------------- Biblioteca ----------------
  "conta-servico": {
    titulo: "Pasta privada no Google Drive (livros ou outros materiais)",
    resumo: "Só o sistema abre a pasta; os membros nunca veem o endereço do Drive. Vale para livros, apostilas, vídeos, áudios...",
    categoria: "Biblioteca",
    tempo: "10 min",
    passos: [
      <>
        Em <b>Biblioteca</b>, no topo, escolha o que você guarda: <b>Livros</b> ou <b>Outros materiais</b> (apostilas, vídeos, áudios, imagens,
        planilhas...). Dá para trocar depois.
      </>,
      <>
        Entre em <Ext href="https://console.cloud.google.com/">console.cloud.google.com</Ext> com sua conta Google. No topo,{" "}
        <b>Selecionar projeto › Novo projeto</b>, dê um nome (ex.: Biblioteca) e crie.
      </>,
      <>No menu (☰): <b>APIs e serviços › Biblioteca</b>. Procure <b>Google Drive API</b> e toque em <b>Ativar</b>.</>,
      <>No menu: <b>IAM e administrador › Contas de serviço › Criar conta de serviço</b>. Dê um nome e toque em <b>Concluir</b> (não precisa de papel).</>,
      <>Toque na conta criada › aba <b>Chaves › Adicionar chave › Criar nova chave › JSON</b>. O computador baixa um arquivo .json.</>,
      <>Aqui: <b>Biblioteca › Google</b> › <b>Enviar o arquivo .json</b>. Guarde o arquivo: ele é a senha do sistema no seu Drive.</>,
      <>
        No Google Drive: botão direito na pasta dos arquivos › <b>Compartilhar</b> › cole o e-mail da conta de serviço (aparece na tela, termina em{" "}
        <C>iam.gserviceaccount.com</C>) como <b>Leitor</b>. Em "Acesso geral", deixe <b>Restrito</b>.
      </>,
    ],
    pronto: <>Faça um envio em massa com o link da pasta: os arquivos aparecem na aba Livros (ou Materiais).</>,
    dicas: [
      <>
        <b>Livros</b>: o robô procura por nome, autor, categoria e gênero, e o Google Books completa capa e resumo. <b>Outros materiais</b>: o robô
        procura por nome e categoria (subpasta), e aceita também vídeos, imagens, planilhas e apresentações.
      </>,
    ],
    problemas: [["Deu \"Não encontrado\" ou \"Sem permissão\"", <>A pasta não foi compartilhada com o e-mail da conta de serviço. Confira o passo 7.</>]],
    tela: { rotulo: "Abrir Biblioteca", para: "/grupo-vip/biblioteca?aba=google" },
    busca: "google drive json conta de servico livros materiais apostilas videos audios arquivos",
  },
  "envio-massa": {
    titulo: "Enviar livros ou materiais em massa",
    resumo: "Uma pasta inteira de arquivos (livros, apostilas, vídeos...) entra na biblioteca e, se quiser, é postada no grupo.",
    categoria: "Biblioteca",
    tempo: "2 min",
    passos: [
      <>Abra <b>Biblioteca</b> e toque em <b>Novo envio em massa</b>.</>,
      <>
        Escolha de onde: <b>pasta do Google Drive</b> (cole o link da pasta), <b>do computador</b> (arquivos ou uma pasta inteira) ou{" "}
        <b>outro grupo seu</b> do Telegram.
      </>,
      <>Escolha o grupo (e o tópico, se usar).</>,
      <>Deixe <b>Postar no grupo</b> ligado para o robô postar um por um; desligado, os arquivos ficam só no robô (o membro pede no privado).</>,
      <>Toque em <b>Começar</b>. O robô posta uns 20 por minuto; pode fechar a tela.</>,
    ],
    dicas: [
      <>As subpastas viram as categorias do robô (ex.: "Módulo 1", "Receitas"). Em livros, nomes como "Autor - Título.pdf" ajudam a achar o autor.</>,
      <>Vídeos, imagens e planilhas só são aceitos com a opção <b>Outros materiais</b> ligada no topo da Biblioteca.</>,
      <>Arquivos acima de 50 MB não vão para o grupo (limite do Telegram), mas o robô entrega por um link temporário.</>,
    ],
    tela: { rotulo: "Abrir Biblioteca", para: "/grupo-vip/biblioteca" },
  },
  "dono-telegram": {
    titulo: "Copiar os arquivos de um grupo seu para outro",
    resumo: "Para quando um grupo lota e você abre outro.",
    categoria: "Biblioteca",
    tempo: "3 min",
    passos: [
      <>O robô precisa ser administrador dos <b>dois</b> grupos.</>,
      <>Biblioteca › Novo envio em massa › <b>Outro grupo seu</b> › <b>Conectar meu Telegram</b> › no Telegram, toque em <b>Iniciar</b> › volte e toque em <b>Já conectei</b> (uma vez só).</>,
      <>
        Copie o link da <b>última mensagem</b> do grupo antigo: no computador, botão direito na mensagem › <b>Copiar link</b>; no celular, segure a
        mensagem › <b>Copiar link</b>.
      </>,
      <>Cole o link, escolha o grupo de destino e toque em <b>Começar</b>.</>,
    ],
    problemas: [["Nenhum arquivo foi copiado", <>O grupo antigo está com "Restringir conteúdo salvo" ligado. No Telegram: grupo › Editar › Tipo de grupo › desligue.</>]],
    tela: { rotulo: "Abrir Biblioteca", para: "/grupo-vip/biblioteca" },
  },
  "robo-livros": {
    titulo: "Como o membro pede livros ou materiais ao robô",
    resumo: "Menu com botões no privado do robô.",
    categoria: "Biblioteca",
    passos: [
      <>O membro abre a conversa com o robô no Telegram e escreve "oi" (ou toca em <b>Menu</b>).</>,
      <>Toca em <b>Baixar um livro</b> (ou <b>Baixar um material</b>) e escolhe: pelo nome, por categoria e, em livros, pelo autor ou gênero.</>,
      <>Toca no arquivo e recebe no privado (protegido contra encaminhar). Acima de 50 MB, recebe um link só dele, que vale 24 horas.</>,
      <>Não achou? Toca em <b>Pedir este livro</b> (ou material): aparece na aba Sugestões.</>,
    ],
    tela: { rotulo: "Abrir Biblioteca", para: "/grupo-vip/biblioteca?aba=pedidos" },
  },

  // ---------------- Comunicação ----------------
  conteudos: {
    titulo: "Publicar um conteúdo nos grupos",
    resumo: "Texto, foto ou vídeo, agora ou agendado, em um ou vários grupos.",
    categoria: "Comunicação",
    passos: [
      <>Abra <b>Conteúdos</b> e toque em <b>Novo conteúdo</b>.</>,
      <>Escreva o título e o texto, e se quiser envie uma foto ou vídeo e um link com botão.</>,
      <>Escolha os grupos e se publica agora, agenda ou guarda como rascunho.</>,
      <>No Telegram o robô publica sozinho. No WhatsApp, o sistema avisa em Pendências: poste lá e toque em <b>Já postei</b>.</>,
    ],
    tela: { rotulo: "Abrir Conteúdos", para: "/grupo-vip/conteudos" },
  },
  lives: {
    titulo: "Agendar uma live",
    resumo: "O robô avisa os membros alguns minutos antes.",
    categoria: "Comunicação",
    passos: [
      <>Abra <b>Lives e Eventos</b> e toque em <b>Nova live</b>.</>,
      <>Preencha o título, o dia e a hora, e o link (YouTube, Google Meet, Zoom, live do Instagram...).</>,
      <>Escolha quantos minutos antes avisar e em quais grupos.</>,
    ],
    tela: { rotulo: "Abrir Lives e Eventos", para: "/grupo-vip/lives-e-eventos" },
  },
  anuncios: {
    titulo: "Mandar um aviso para um público",
    resumo: "Ex.: só para quem está atrasado, só para um plano, ou para todos.",
    categoria: "Comunicação",
    passos: [
      <>Abra <b>Anúncios</b>, escreva o aviso e escolha o público.</>,
      <>Quem conectou o Telegram recebe na hora; os outros ficam na Caixa de saída do WhatsApp (Automação).</>,
    ],
    tela: { rotulo: "Abrir Anúncios", para: "/grupo-vip/anuncios" },
  },
  suporte: {
    titulo: "Responder o suporte",
    resumo: "Mensagens dos membros pela área do membro ou pelo robô do Telegram.",
    categoria: "Comunicação",
    passos: [
      <>Abra <b>Suporte</b> e toque na conversa.</>,
      <>Escreva a resposta. Ela chega pelo Telegram (se a pessoa conectou) ou fica na Caixa de saída do WhatsApp.</>,
      <>Resolveu? Marque como <b>resolvido</b>.</>,
    ],
    tela: { rotulo: "Abrir Suporte", para: "/grupo-vip/suporte" },
  },
} satisfies Record<string, Guia>;

export type IdGuia = keyof typeof guias;

export function guia(id: IdGuia): Guia {
  return guias[id];
}

// ---------- Primeiros passos (Dashboard) ----------

// Contrato com o backend: PrimeirosPassosResource.java
export type PrimeiroPasso = {
  id: string;
  titulo: string;
  descricao: string;
  feito: boolean;
  opcional: boolean;
  guia: IdGuia;
  para: string;
};

export const apiPrimeirosPassos = {
  listar: () => http.get<PrimeiroPasso[]>("/grupo-vip/primeiros-passos"),
};
