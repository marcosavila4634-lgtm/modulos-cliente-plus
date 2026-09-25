import { ImageUp, LoaderCircle, Trash2, Video } from "lucide-react";
import { useRef, useState } from "react";
import { enviarArquivo } from "../../lib/academia-treinos";
import { mensagemDe } from "./formulario";

// Escolher e enviar uma imagem ou um vídeo. Mostra a prévia do que já foi
// enviado, o progresso do envio e um botão para remover.
export function CampoArquivo({
  tipo,
  url,
  aoMudar,
}: {
  tipo: "imagem" | "video";
  url: string | null;
  aoMudar: (url: string | null) => void;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [progresso, setProgresso] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function escolher(arquivo: File | undefined) {
    if (!arquivo) return;
    setErro(null);
    setProgresso(0);
    try {
      const enviado = await enviarArquivo(arquivo, setProgresso);
      aoMudar(enviado.url);
    } catch (e) {
      setErro(mensagemDe(e));
    } finally {
      setProgresso(null);
      if (entrada.current) entrada.current.value = "";
    }
  }

  const Icone = tipo === "imagem" ? ImageUp : Video;

  return (
    <div>
      <input
        ref={entrada}
        type="file"
        hidden
        accept={tipo === "imagem" ? "image/jpeg,image/png,image/webp,image/gif" : "video/mp4,video/webm,video/quicktime"}
        onChange={(e) => escolher(e.target.files?.[0])}
      />
      {url ? (
        <div className="relative overflow-hidden rounded-xl border border-ac-line bg-black">
          {tipo === "imagem" ? (
            <img src={url} alt="" className="h-40 w-full object-contain" />
          ) : (
            <video src={url} controls preload="metadata" className="h-40 w-full" />
          )}
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={() => entrada.current?.click()}
              className="rounded-lg bg-black/70 px-2.5 py-1 text-xs font-medium text-white hover:bg-black"
            >
              Trocar
            </button>
            <button
              type="button"
              onClick={() => aoMudar(null)}
              aria-label="Remover"
              className="rounded-lg bg-black/70 p-1.5 text-red-300 hover:bg-black"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={progresso !== null}
          onClick={() => entrada.current?.click()}
          className="flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-ac-line bg-ac-bg/40 text-sm text-slate-300 transition hover:border-violet-500/60 disabled:cursor-wait"
        >
          {progresso !== null ? (
            <>
              <LoaderCircle className="size-5 animate-spin text-violet-300" />
              <span className="text-xs">Enviando... {progresso}%</span>
              <span className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
                <span className="block h-full bg-violet-500" style={{ width: `${progresso}%` }} />
              </span>
            </>
          ) : (
            <>
              <Icone className="size-5 text-ac-muted" />
              {tipo === "imagem" ? "Enviar imagem (até 8 MB)" : "Enviar vídeo (até 100 MB)"}
            </>
          )}
        </button>
      )}
      {erro && <p className="mt-1.5 text-xs text-red-300">{erro}</p>}
    </div>
  );
}
