import { Activity, Dumbbell, ExternalLink, HeartPulse, PersonStanding, type LucideIcon } from "lucide-react";
import { embedYoutube, type Exercicio, type GrupoMuscular } from "../../lib/academia-treinos";

const iconeGrupo: Partial<Record<GrupoMuscular, LucideIcon>> = {
  cardio: HeartPulse,
  abdomen: Activity,
  corpo_todo: Activity,
  alongamento: PersonStanding,
};

// Miniatura: a imagem enviada, a capa do vídeo do YouTube ou um ícone.
export function MiniaturaExercicio({
  exercicio,
  className = "size-12 rounded-lg",
}: {
  exercicio: Pick<Exercicio, "imagemUrl" | "videoLink" | "grupoMuscular" | "nome">;
  className?: string;
}) {
  const youtube = embedYoutube(exercicio.videoLink);
  const capa = exercicio.imagemUrl ?? (youtube ? `https://img.youtube.com/vi/${youtube.split("/").pop()}/mqdefault.jpg` : null);
  const Icone = iconeGrupo[exercicio.grupoMuscular] ?? Dumbbell;
  return capa ? (
    <img src={capa} alt="" loading="lazy" className={`shrink-0 object-cover ${className}`} />
  ) : (
    <span
      className={`grid shrink-0 place-items-center bg-gradient-to-br from-violet-600/30 to-fuchsia-500/20 text-violet-300 ${className}`}
    >
      <Icone className="size-1/2" strokeWidth={1.5} />
    </span>
  );
}

// Vídeo do exercício: o enviado pela academia, o do YouTube (dentro da
// página) ou um botão para abrir outro link.
export function VideoExercicio({ exercicio }: { exercicio: Pick<Exercicio, "videoUrl" | "videoLink" | "nome"> }) {
  if (exercicio.videoUrl) {
    return (
      <video src={exercicio.videoUrl} controls playsInline preload="metadata" className="w-full rounded-xl bg-black" />
    );
  }
  const youtube = embedYoutube(exercicio.videoLink);
  if (youtube) {
    return (
      <iframe
        src={youtube}
        title={exercicio.nome}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="aspect-video w-full rounded-xl bg-black"
      />
    );
  }
  if (exercicio.videoLink) {
    return (
      <a
        href={exercicio.videoLink}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 text-sm font-medium text-sky-400 hover:text-sky-300"
      >
        <ExternalLink className="size-4" />
        Ver vídeo do exercício
      </a>
    );
  }
  return null;
}
