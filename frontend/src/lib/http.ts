import { cabecalhoModulo } from "./modulo-atual";

// Chamadas ao backend com JSON. Em caso de erro, lança um Error com a mensagem
// enviada pela API ({"error": "..."}), pronta para mostrar na tela.

async function requisicao<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
  const res = await fetch(`/api${caminho}`, {
    method: metodo,
    headers: {
      ...cabecalhoModulo(),
      ...(corpo === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  if (!res.ok) {
    const erro = await res.json().catch(() => null);
    throw new Error(erro?.error ?? `Erro ${res.status} ao acessar ${caminho}`);
  }
  if (res.status === 204) return undefined as T; // resposta sem conteúdo
  return res.json() as Promise<T>;
}

export const http = {
  get: <T>(caminho: string) => requisicao<T>("GET", caminho),
  post: <T>(caminho: string, corpo: unknown = {}) => requisicao<T>("POST", caminho, corpo),
  put: <T>(caminho: string, corpo: unknown) => requisicao<T>("PUT", caminho, corpo),
  del: <T>(caminho: string) => requisicao<T>("DELETE", caminho),
};
