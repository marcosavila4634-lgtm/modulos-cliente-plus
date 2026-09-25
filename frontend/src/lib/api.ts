// Chamadas ao backend. O Vite redireciona /api para http://localhost:3001.

export type StatusModulo = "planejado" | "em_desenvolvimento" | "pronto_para_migrar" | "migrado";

export type Modulo = {
  id: string;
  slug: string;
  nome: string;
  segmento: string;
  descricao: string;
  status: StatusModulo;
  created_at: string;
};

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`);
  if (!res.ok) throw new Error(`Erro ${res.status} ao buscar ${path}`);
  return res.json() as Promise<T>;
}

export const api = {
  health: () => get<{ ok: boolean; horario: string }>("/health"),
  modulos: () => get<Modulo[]>("/modulos"),
  modulo: (slug: string) => get<Modulo>(`/modulos/${slug}`),
};

export const statusLabel: Record<StatusModulo, string> = {
  planejado: "Planejado",
  em_desenvolvimento: "Em desenvolvimento",
  pronto_para_migrar: "Pronto para migrar",
  migrado: "Já no Cliente Plus",
};
