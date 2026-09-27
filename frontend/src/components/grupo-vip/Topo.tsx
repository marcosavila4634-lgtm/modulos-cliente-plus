import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  ChartColumnIncreasing,
  Clapperboard,
  Clock,
  Eye,
  FileText,
  Gem,
  Headset,
  Megaphone,
  MessageCircle,
  Send,
  ShieldCheck,
  UserMinus,
  UserPlus,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import { dataPorExtenso, formatar, nomePlataforma, type DashboardGrupoVip } from "../../lib/grupo-vip";
import { BotaoCopiar } from "./formulario";
import { AviaoPapel, IconePlataforma, TracoLaranja } from "./Marcas";
import { Card, classeBotaoLaranja, LinkVerTodos, TituloCard, Variacao } from "./ui";

// ---------- Faixa de boas-vindas ----------

function Celular() {
  return (
    <div className="relative h-[190px] w-[112px] rotate-[14deg] rounded-[26px] border-[5px] border-slate-800 bg-gradient-to-b from-[#0c2c5c] via-[#0a1d3d] to-[#071228] shadow-[0_20px_50px_-10px_rgba(37,99,235,0.55)]">
      <div className="absolute top-1.5 left-1/2 h-1.5 w-8 -translate-x-1/2 rounded-full bg-slate-900" />
      <div className="absolute inset-0 grid place-items-center">
        <div className="grid size-16 place-items-center rounded-full bg-gradient-to-b from-sky-400 to-blue-600 shadow-[0_0_35px_rgba(56,189,248,0.8)]">
          <Send className="size-8 -translate-x-0.5 translate-y-0.5 fill-white text-white" />
        </div>
      </div>
    </div>
  );
}

export function BoasVindas({ nome, frase }: { nome: string; frase: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gv-line bg-[radial-gradient(ellipse_at_68%_40%,rgba(37,99,235,0.35),transparent_45%),linear-gradient(90deg,#070c17,#0a1426_60%,#08101f)] px-6 py-5">
      <div className="relative z-10 max-w-[440px]">
        <h1 className="font-poppins text-[28px] leading-tight font-bold text-white md:text-[30px]">
          Bem vindo, <span className="text-orange-500">{nome}!</span>
        </h1>
        <p className="mt-1 text-[15px] text-slate-200">Gestão de grupos VIP e conteúdos exclusivos.</p>
        {frase && <p className="mt-4 max-w-[300px] text-[13.5px] leading-snug text-slate-300 italic">“{frase}”</p>}
        <TracoLaranja className="mt-1 ml-28 h-3 w-24" />
      </div>
      <div className="pointer-events-none absolute top-1/2 right-[26%] hidden -translate-y-1/2 md:block">
        <Celular />
      </div>
      <div className="pointer-events-none absolute top-1/2 right-6 hidden -translate-y-1/2 -rotate-[8deg] text-right font-script text-[30px] leading-[0.95] text-slate-100 lg:block">
        Mais
        <br />
        conteúdo
        <br />
        Mais
        <br />
        resultados
      </div>
    </div>
  );
}

// ---------- Indicadores ----------

type Indicadores = DashboardGrupoVip["indicadores"];

export function IndicadoresGrupoVip({ dados }: { dados: Indicadores }) {
  const cards: { icone: LucideIcon; cor: string; rotulo: string; valor: string; variacao: number; anterior: string; para: string }[] = [
    {
      icone: Users,
      cor: "from-blue-500 to-blue-700",
      rotulo: "Membros ativos",
      valor: formatar.numero(dados.membrosAtivos.valor),
      variacao: dados.membrosAtivos.variacao,
      anterior: formatar.numero(dados.membrosAtivos.mesAnterior),
      para: "/grupo-vip/membros",
    },
    {
      icone: FileText,
      cor: "from-violet-400 to-violet-600",
      rotulo: "Conteúdos publicados",
      valor: formatar.numero(dados.conteudosPublicados.valor),
      variacao: dados.conteudosPublicados.variacao,
      anterior: formatar.numero(dados.conteudosPublicados.mesAnterior),
      para: "/grupo-vip/conteudos",
    },
    {
      icone: Eye,
      cor: "from-emerald-400 to-green-600",
      rotulo: "Visualizações",
      valor: formatar.numero(dados.visualizacoes.valor),
      variacao: dados.visualizacoes.variacao,
      anterior: formatar.numero(dados.visualizacoes.mesAnterior),
      para: "/grupo-vip/relatorios",
    },
    {
      icone: Gem,
      cor: "from-amber-400 to-orange-600",
      rotulo: "Receita do mês",
      valor: formatar.moeda(dados.receitaMes.valor),
      variacao: dados.receitaMes.variacao,
      anterior: formatar.moeda(dados.receitaMes.mesAnterior),
      para: "/grupo-vip/receitas",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ icone: Icone, ...c }) => (
        <Link key={c.rotulo} to={c.para} className="block rounded-2xl transition hover:-translate-y-0.5">
          <Card className="flex h-full items-center gap-3 !px-3.5">
            <span
              className={`grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-b ${c.cor} shadow-[0_6px_20px_-6px_rgba(0,0,0,0.8)]`}
            >
              <Icone className="size-[22px] text-white" />
            </span>
            <div className="min-w-0 leading-tight">
              <div className="text-[11.5px] text-slate-300">{c.rotulo}</div>
              <div className="mt-1 font-poppins text-[20px] font-bold whitespace-nowrap text-white">{c.valor}</div>
              <div className="mt-1">
                <Variacao valor={c.variacao} />
              </div>
              <div className="mt-0.5 text-[10.5px] text-gv-muted">Mês anterior: {c.anterior}</div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

// ---------- Pendências (o que fazer hoje) ----------

export function Pendencias({ p, robo }: { p: DashboardGrupoVip["pendencias"]; robo: boolean }) {
  const itens: { icone: LucideIcon; cor: string; rotulo: string; valor: number; para: string }[] = [
    { icone: UserPlus, cor: "text-emerald-300", rotulo: "Colocar nos grupos", valor: p.adicionar, para: "/grupo-vip/acessos" },
    { icone: UserMinus, cor: "text-red-300", rotulo: "Tirar dos grupos", valor: p.remover, para: "/grupo-vip/acessos" },
    { icone: Clock, cor: "text-sky-300", rotulo: "Link enviado, falta entrar", valor: p.aguardando, para: "/grupo-vip/acessos" },
    { icone: MessageCircle, cor: "text-green-300", rotulo: "Mensagens do WhatsApp", valor: p.mensagensWhatsapp, para: "/grupo-vip/automacao" },
    { icone: Send, cor: "text-sky-300", rotulo: "Postar no WhatsApp", valor: p.publicacoesManuais, para: "/grupo-vip/conteudos" },
    { icone: Headset, cor: "text-violet-300", rotulo: "Suporte esperando", valor: p.chamadosAbertos, para: "/grupo-vip/suporte" },
  ];
  return (
    <Card>
      <TituloCard
        icone={ShieldCheck}
        acao={
          <span className={`hidden items-center gap-1.5 text-[11px] sm:inline-flex ${robo ? "text-emerald-300" : "text-gv-muted"}`}>
            <Bot className="size-3.5" />
            {robo ? "Robô do Telegram ligado" : "Robô do Telegram desligado"}
          </span>
        }
      >
        Pendências de hoje
      </TituloCard>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {itens.map(({ icone: Icone, ...i }) => (
          <Link
            key={i.rotulo}
            to={i.para}
            className={`rounded-xl border px-3 py-2.5 transition hover:border-orange-500/50 ${
              i.valor > 0 ? "border-gv-line bg-gv-card-2/70" : "border-gv-line/60 bg-transparent opacity-70"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <Icone className={`size-4 ${i.cor}`} />
              <span className="font-poppins text-lg font-bold text-white">{i.valor}</span>
            </div>
            <div className="mt-1 text-[11.5px] leading-tight text-slate-300">{i.rotulo}</div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

// ---------- Atalhos ----------

const atalhos: { rotulo: string; icone: LucideIcon; para: string; search?: Record<string, boolean> }[] = [
  { rotulo: "Novo Grupo", icone: Send, para: "/grupo-vip/grupos", search: { novo: true } },
  { rotulo: "Novo Conteúdo", icone: FileText, para: "/grupo-vip/conteudos", search: { novo: true } },
  { rotulo: "Adicionar Membro", icone: UserPlus, para: "/grupo-vip/membros", search: { novo: true } },
  { rotulo: "Agendar Live", icone: Video, para: "/grupo-vip/lives-e-eventos", search: { novo: true } },
  { rotulo: "Enviar Aviso", icone: Megaphone, para: "/grupo-vip/anuncios" },
  { rotulo: "Relatório", icone: ChartColumnIncreasing, para: "/grupo-vip/relatorios" },
];

export function AtalhosGrupoVip() {
  return (
    <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
      {atalhos.map(({ rotulo, icone: Icone, para, search }) => (
        <Link
          key={rotulo}
          to={para}
          search={search}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-gv-line bg-gradient-to-b from-gv-card-2/70 to-gv-card px-2 py-3.5 text-center transition-colors hover:border-orange-500/50 hover:bg-gv-card-2"
        >
          <Icone className="size-7 text-sky-400" strokeWidth={1.75} />
          <span className="text-[12px] leading-tight text-slate-200">{rotulo}</span>
        </Link>
      ))}
    </div>
  );
}

// ---------- Coluna da direita ----------

export function EstaSemana() {
  return (
    <Card className="flex items-center gap-3 !py-3.5">
      <CalendarDays className="size-6 shrink-0 text-slate-200" />
      <div className="leading-tight">
        <div className="text-[11px] text-gv-muted">Hoje •</div>
        <div className="mt-0.5 text-[13px] font-medium text-white">{dataPorExtenso()}</div>
      </div>
    </Card>
  );
}

export function CardFrase({ frase }: { frase: string }) {
  return (
    <Card className="relative overflow-hidden">
      <AviaoPapel className="absolute top-4 right-3 size-14 drop-shadow-[0_0_14px_rgba(56,189,248,0.5)]" />
      <p className="max-w-[170px] text-[14px] leading-snug text-slate-100">“{frase}”</p>
      <Link to="/grupo-vip/anuncios" className={`${classeBotaoLaranja} mt-4`}>
        Enviar mensagem <ArrowRight className="size-3.5" />
      </Link>
    </Card>
  );
}

export const corGrupo: Record<DashboardGrupoVip["grupos"][number]["cor"], string> = {
  blue: "from-sky-400 to-blue-600",
  sky: "from-cyan-400 to-sky-600",
  violet: "from-fuchsia-400 to-violet-600",
  indigo: "from-blue-400 to-indigo-600",
  amber: "from-amber-300 to-orange-500",
};

export function MeusGrupos({ grupos }: { grupos: DashboardGrupoVip["grupos"] }) {
  return (
    <Card>
      <TituloCard icone={Send} cor="text-white" acao={<LinkVerTodos para="/grupo-vip/grupos" />}>
        Meus grupos
      </TituloCard>
      {grupos.length === 0 && <p className="mt-3 text-sm text-gv-muted">Nenhum grupo cadastrado.</p>}
      <ul className="mt-3.5 flex flex-col gap-3">
        {grupos.map((g) => (
          <li key={g.id} className="flex items-center gap-3">
            <span className="relative shrink-0">
              <span className={`grid size-9 place-items-center rounded-full bg-gradient-to-b ${corGrupo[g.cor]}`}>
                <Users className="size-4 text-white" />
              </span>
              <span
                title={nomePlataforma[g.plataforma]}
                className={`absolute -right-1 -bottom-1 grid size-[18px] place-items-center rounded-full border-2 border-gv-card text-white ${
                  g.plataforma === "telegram" ? "bg-sky-500" : "bg-green-500"
                }`}
              >
                <IconePlataforma plataforma={g.plataforma} className="size-2.5" />
              </span>
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-[13px] font-medium text-white">{g.nome}</div>
              <div className="text-[11px] text-gv-muted">
                {g.membros} no grupo · {g.automatico ? "robô" : nomePlataforma[g.plataforma]}
              </div>
            </div>
            <Link to="/grupo-vip/acessos" className={`${classeBotaoLaranja} !px-3 !py-1.5`}>
              Acessos
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function ProximosEventos({ eventos }: { eventos: DashboardGrupoVip["proximosEventos"] }) {
  return (
    <Card>
      <TituloCard icone={Clapperboard} cor="text-orange-400" acao={<LinkVerTodos para="/grupo-vip/lives-e-eventos" />}>
        Próximas lives / eventos
      </TituloCard>
      {eventos.length === 0 && <p className="mt-3 text-sm text-gv-muted">Nenhuma live agendada.</p>}
      <ul className="mt-3.5 flex flex-col gap-3">
        {eventos.map((e) => (
          <li key={e.id} className="flex items-center gap-3">
            {e.foto ? (
              <img src={e.foto} alt="" className="size-9 shrink-0 rounded-lg object-cover" />
            ) : (
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-gv-card-2">
                <Video className="size-4 text-orange-300" />
              </span>
            )}
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-[13px] font-medium text-white">{e.titulo}</div>
              <div className="text-[11px] text-gv-muted">{e.quando}</div>
            </div>
            {e.status === "ao_vivo" ? (
              <span className="rounded-md bg-red-600 px-2 py-1 text-[10.5px] font-semibold text-white">Ao vivo</span>
            ) : (
              <span className="rounded-md border border-gv-line bg-gv-card-2 px-2 py-1 text-[10.5px] text-slate-300">
                Em breve
              </span>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function CardConvite({ paginaVendas }: { paginaVendas: string }) {
  return (
    <div className="relative min-h-[150px] overflow-hidden rounded-2xl border border-gv-line">
      <img src="/grupo-vip/comunidade.jpg" alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-gv-bg via-gv-bg/80 to-blue-900/30" />
      <AviaoPapel className="absolute top-3 right-5 size-12 drop-shadow-[0_0_18px_rgba(56,189,248,0.9)]" />
      <div className="relative p-4">
        <p className="-rotate-[4deg] font-script text-[25px] leading-[0.95] text-white">
          Faça parte
          <br />
          de um grupo
          <br />
          que vai além.
        </p>
        <p className="mt-2 text-[11px] text-slate-300">Divulgue sua página de vendas:</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          <BotaoCopiar texto={paginaVendas} rotulo="Copiar link" variante="primario" />
          <a href={paginaVendas} target="_blank" rel="noreferrer" className={`${classeBotaoLaranja} !bg-none !bg-white/10 !text-white`}>
            Abrir <ArrowRight className="size-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
