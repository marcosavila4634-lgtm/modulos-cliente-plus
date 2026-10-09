import { createFileRoute } from "@tanstack/react-router";
import { Maximize, Minimize, Pause, Play, RotateCcw, SkipForward, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CabecalhoPagina, Card } from "../../components/academia/ui";
import { Campo, classeInput } from "../../components/academia/formulario";

// Cronômetro de tatame (Artes Marciais): rounds e descanso com som, em tela
// cheia para a TV. Tudo no navegador; nada vai para o servidor.
export const Route = createFileRoute("/academia/cronometro")({
  component: Cronometro,
});

type Config = { nome: string; rounds: number; luta: number; descanso: number; aviso: number };

const prontos: Config[] = [
  { nome: "Jiu-Jitsu (rola 5 min)", rounds: 6, luta: 300, descanso: 60, aviso: 10 },
  { nome: "Jiu-Jitsu (rola 6 min)", rounds: 5, luta: 360, descanso: 60, aviso: 10 },
  { nome: "Muay Thai (3 × 3 min)", rounds: 3, luta: 180, descanso: 60, aviso: 10 },
  { nome: "Boxe (3 min)", rounds: 6, luta: 180, descanso: 60, aviso: 10 },
  { nome: "MMA (3 × 5 min)", rounds: 3, luta: 300, descanso: 60, aviso: 10 },
  { nome: "Tabata (20 s / 10 s)", rounds: 8, luta: 20, descanso: 10, aviso: 3 },
  { nome: "Kids (2 min)", rounds: 4, luta: 120, descanso: 60, aviso: 10 },
];

type Fase = "preparar" | "luta" | "descanso" | "fim";

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

function Cronometro() {
  const [cfg, setCfg] = useState<Config>(prontos[0]);
  const [fase, setFase] = useState<Fase>("preparar");
  const [round, setRound] = useState(1);
  const [resta, setResta] = useState(10);
  const [rodando, setRodando] = useState(false);
  const [som, setSom] = useState(true);
  const [cheia, setCheia] = useState(false);
  const tela = useRef<HTMLDivElement>(null);
  const audio = useRef<AudioContext | null>(null);

  function bip(freq: number, duracao = 0.25, vezes = 1) {
    if (!som) return;
    audio.current ??= new AudioContext();
    const ctx = audio.current;
    for (let i = 0; i < vezes; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = freq;
      o.type = "square";
      g.gain.setValueAtTime(0.18, ctx.currentTime + i * (duracao + 0.08));
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * (duracao + 0.08) + duracao);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * (duracao + 0.08));
      o.stop(ctx.currentTime + i * (duracao + 0.08) + duracao);
    }
  }

  // Um tique por segundo; troca de fase quando o tempo acaba.
  useEffect(() => {
    if (!rodando) return;
    const t = setInterval(() => {
      setResta((r) => {
        if (r > 1) {
          if (fase === "luta" && r - 1 === cfg.aviso) bip(880, 0.12, 3);
          if (fase !== "luta" && r - 1 <= 3) bip(660, 0.1);
          return r - 1;
        }
        // acabou a fase
        if (fase === "preparar" || fase === "descanso") {
          bip(990, 0.6);
          setFase("luta");
          return cfg.luta;
        }
        if (fase === "luta") {
          bip(440, 0.5, 2);
          if (round >= cfg.rounds) {
            setFase("fim");
            setRodando(false);
            return 0;
          }
          setRound((x) => x + 1);
          setFase("descanso");
          return cfg.descanso;
        }
        return 0;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rodando, fase, round, cfg, som]);

  useEffect(() => {
    const f = () => setCheia(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, []);

  function zerar(c = cfg) {
    setRodando(false);
    setFase("preparar");
    setRound(1);
    setResta(10);
    setCfg(c);
  }

  function pular() {
    setResta(1);
    if (!rodando) setRodando(true);
  }

  const cores: Record<Fase, string> = {
    preparar: "from-amber-600/30 to-black text-amber-200",
    luta: resta <= cfg.aviso ? "from-red-600/50 to-black text-white" : "from-red-700/25 to-black text-white",
    descanso: "from-emerald-700/30 to-black text-emerald-100",
    fim: "from-zinc-700/30 to-black text-zinc-200",
  };
  const rotulo: Record<Fase, string> = { preparar: "PREPARAR", luta: "LUTA", descanso: "DESCANSO", fim: "FIM" };

  return (
    <div className="flex flex-col gap-5 py-4">
      <CabecalhoPagina titulo="Cronômetro de tatame" descricao="Rounds e descanso com som. Em tela cheia, dá para usar na TV da academia." />

      <div
        ref={tela}
        className={`relative flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-ac-line bg-gradient-to-b ${cores[fase]} p-6 select-none ${
          cheia ? "!rounded-none" : ""
        }`}
      >
        <div className="font-impact text-[clamp(28px,5vw,64px)] tracking-[0.2em]">{rotulo[fase]}</div>
        <div className="font-poppins text-[clamp(96px,22vw,280px)] leading-none font-bold tabular-nums">{mmss(resta)}</div>
        <div className="mt-2 text-[clamp(16px,2.5vw,32px)] font-semibold tracking-widest text-white/80">
          ROUND {Math.min(round, cfg.rounds)} / {cfg.rounds}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (fase === "fim") zerar();
              else setRodando((r) => !r);
            }}
            className="inline-flex h-14 items-center gap-2 rounded-2xl bg-red-600 px-8 text-lg font-bold text-white hover:bg-red-500"
          >
            {rodando ? <Pause className="size-6" /> : <Play className="size-6" />}
            {rodando ? "Pausar" : fase === "fim" ? "De novo" : "Começar"}
          </button>
          <button type="button" onClick={pular} aria-label="Pular fase" className="grid size-14 place-items-center rounded-2xl border border-white/20 text-white hover:bg-white/10">
            <SkipForward className="size-6" />
          </button>
          <button type="button" onClick={() => zerar()} aria-label="Zerar" className="grid size-14 place-items-center rounded-2xl border border-white/20 text-white hover:bg-white/10">
            <RotateCcw className="size-6" />
          </button>
          <button type="button" onClick={() => setSom((s) => !s)} aria-label="Som" className="grid size-14 place-items-center rounded-2xl border border-white/20 text-white hover:bg-white/10">
            {som ? <Volume2 className="size-6" /> : <VolumeX className="size-6" />}
          </button>
          <button
            type="button"
            onClick={() => (document.fullscreenElement ? document.exitFullscreen() : tela.current?.requestFullscreen())}
            aria-label="Tela cheia"
            className="grid size-14 place-items-center rounded-2xl border border-white/20 text-white hover:bg-white/10"
          >
            {cheia ? <Minimize className="size-6" /> : <Maximize className="size-6" />}
          </button>
        </div>
        {cheia && <div className="absolute bottom-4 text-xs tracking-[0.3em] text-white/40">GESTÃO PLUS · ARTES MARCIAIS</div>}
      </div>

      <Card>
        <div className="flex flex-wrap gap-1.5">
          {prontos.map((p) => (
            <button
              key={p.nome}
              type="button"
              onClick={() => zerar(p)}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-medium ${
                p.nome === cfg.nome ? "bg-red-600/25 text-white ring-1 ring-red-500/60" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              {p.nome}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Campo rotulo="Rounds">
            <input type="number" min={1} max={30} className={classeInput} value={cfg.rounds} onChange={(e) => zerar({ ...cfg, nome: "Personalizado", rounds: Number(e.target.value) || 1 })} />
          </Campo>
          <Campo rotulo="Luta (segundos)">
            <input type="number" min={5} className={classeInput} value={cfg.luta} onChange={(e) => zerar({ ...cfg, nome: "Personalizado", luta: Number(e.target.value) || 5 })} />
          </Campo>
          <Campo rotulo="Descanso (segundos)">
            <input type="number" min={0} className={classeInput} value={cfg.descanso} onChange={(e) => zerar({ ...cfg, nome: "Personalizado", descanso: Number(e.target.value) || 0 })} />
          </Campo>
          <Campo rotulo="Aviso antes do fim (s)">
            <input type="number" min={0} className={classeInput} value={cfg.aviso} onChange={(e) => zerar({ ...cfg, nome: "Personalizado", aviso: Number(e.target.value) || 0 })} />
          </Campo>
        </div>
        <p className="mt-3 text-xs text-ac-muted">
          Sons: bipe longo = começa a luta; dois bipes = acabou o round; três bipes curtos = aviso antes do fim; bipes na contagem de 3
          segundos antes de começar.
        </p>
      </Card>
    </div>
  );
}
