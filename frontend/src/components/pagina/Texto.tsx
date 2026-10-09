import { createContext, useContext, useLayoutEffect, useRef, type CSSProperties, type ReactNode, type Ref } from "react";

// Texto da página pública. Na página de verdade é um texto comum; na prévia
// do editor dá para clicar e digitar ali mesmo (o editor recebe cada mudança).
//
// `c` é o caminho do campo dentro da seção: "titulo", "itens/<id>/texto" ou
// "pecas/<id>/texto". Ele também vai no elemento (data-txt): é como o
// "Soltar tudo em peças livres" (Soltar.tsx) acha os textos da seção.

export const EdicaoTexto = createContext<((caminho: string, valor: string) => void) | null>(null);
export const useEditando = () => useContext(EdicaoTexto) !== null;

type Marca = "span" | "div" | "p" | "h1" | "h2" | "h3" | "blockquote" | "figcaption";

export function Txt({
  c,
  v,
  como = "span",
  className = "",
  estilo,
  linhas = false,
  pintar,
  children,
}: {
  c: string;
  v: string;
  como?: Marca;
  className?: string;
  estilo?: CSSProperties;
  linhas?: boolean; // aceita várias linhas (Enter quebra a linha)
  // desenha o texto de outro jeito dentro do elemento (ex.: parte colorida do título)
  pintar?: (el: HTMLElement, valor: string) => void;
  children?: ReactNode; // como aparece na página de verdade (padrão: o próprio texto)
}) {
  const editar = useContext(EdicaoTexto);
  const ref = useRef<HTMLElement>(null);
  const pintado = useRef<string | null>(null);
  const classe = `${className} ${linhas ? "whitespace-pre-line" : ""}`;

  // No editor o conteúdo é escrito à mão (fora do React), para o que a pessoa
  // digita não ser desfeito a cada tecla. Só atualiza quando ela não está digitando.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !editar || document.activeElement === el) return;
    desenha(el);
  });

  function desenha(el: HTMLElement) {
    if (pintar) {
      pintar(el, v);
      pintado.current = null;
    } else if (pintado.current !== v || el.textContent !== v) {
      el.textContent = v;
      pintado.current = v;
    }
  }

  const Marca = como as "span";
  if (!editar) return <Marca data-txt={c} className={classe} style={estilo}>{children ?? v}</Marca>;
  return (
    <Marca
      ref={ref as Ref<HTMLSpanElement>}
      data-txt={c}
      className={`${classe} cursor-text rounded-xs outline-offset-2 outline-sky-400 empty:before:opacity-40 empty:before:content-['Escreva_aqui'] focus:outline-1 focus:outline-dashed`}
      style={estilo}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck={false}
      onInput={(e) => {
        // textContent (e não innerText) para não vir em maiúsculas quando o estilo usa caixa alta
        const bruto = e.currentTarget.textContent ?? "";
        editar(c, linhas ? bruto.replace(/\n$/, "") : bruto.replace(/\s*\n\s*/g, " "));
      }}
      onKeyDown={(e) => {
        if ((e.key === "Enter" && !linhas) || e.key === "Escape") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      // dentro de um botão, a barra de espaço "clicaria" no botão
      onKeyUp={(e) => e.key === " " && e.preventDefault()}
      onBlur={(e) => desenha(e.currentTarget)}
    />
  );
}
