import { ImageUp, LoaderCircle, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { enviarArquivo } from "../../lib/academia-treinos";
import { mensagemDe } from "./formulario";

// Escolher e enviar uma foto ou um vídeo (POST /api/arquivos). Mostra a
// prévia, o progresso do envio e um botão para remover.
export function CampoMidia({
  url,
  tipo,
  aoMudar,
  soImagem = false,
}: {
  url: string | null;
  tipo: "imagem" | "video" | null;
  aoMudar: (url: string | null, tipo: "imagem" | "video" | null) => void;
  soImagem?: boolean;
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
      aoMudar(enviado.url, enviado.tipo as "imagem" | "video");
    } catch (e) {
      setErro(mensagemDe(e));
    } finally {
      setProgresso(null);
      if (entrada.current) entrada.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={entrada}
        type="file"
        hidden
        accept={soImagem ? "image/jpeg,image/png,image/webp,image/gif" : "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"}
        onChange={(e) => escolher(e.target.files?.[0])}
      />
      {url ? (
        <div className="relative overflow-hidden rounded-xl border border-gv-line bg-black">
          {tipo === "video" ? (
            <video src={url} controls preload="metadata" className="h-40 w-full" />
          ) : (
            <img src={url} alt="" className="h-40 w-full object-contain" />
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
              aria-label="Remover"
              onClick={() => aoMudar(null, null)}
              className="rounded-lg bg-black/70 p-1.5 text-red-300 hover:bg-black"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => entrada.current?.click()}
          disabled={progresso !== null}
          className="flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-gv-line text-sm text-gv-muted hover:border-orange-500/60 hover:text-slate-200"
        >
          {progresso !== null ? (
            <>
              <LoaderCircle className="size-5 animate-spin" /> Enviando... {progresso}%
            </>
          ) : (
            <>
              <ImageUp className="size-5" /> {soImagem ? "Escolher foto" : "Escolher foto ou vídeo"}
            </>
          )}
        </button>
      )}
      {erro && <p className="mt-1.5 text-xs text-red-300">{erro}</p>}
    </div>
  );
}
