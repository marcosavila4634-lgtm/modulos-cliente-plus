-- Página pública personalizável, igual para todos os módulos (Academia,
-- Grupos VIP e os próximos). O dono edita no painel do módulo (editor
-- "Página de vendas") e publica; a página pública do módulo mostra a versão
-- publicada. Formato do JSON (tema + lista de seções):
-- frontend/src/lib/pagina.ts
--
-- Cada módulo guarda o próprio endereço (slug) e os dados que a página mostra
-- sozinha (nome, planos, horários...). Aqui fica só a aparência e os textos.
-- No projeto principal pode virar parte do "Personalizar Loja" (stores.page_config
-- e store_page_versions), com o JSON em jsonb.
--
-- RLS (Supabase): lojista vê e altera só as linhas da própria loja
-- (store_id in (select id from stores where <dono> = auth.uid())). A página
-- pública lê só "publicada" por uma Edge Function (ou uma view pública só com
-- modulo, store_id e publicada).

create table modulos_paginas (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  modulo text not null,                    -- 'academia' | 'grupo-vip' | ...
  rascunho text,                           -- JSON que o dono está editando (salva sozinho)
  publicada text,                          -- JSON que aparece na página pública; nulo = página padrão do módulo
  publicada_em timestamp with time zone,
  updated_at timestamp with time zone not null default now(),
  unique (store_id, modulo)
);

-- Versões publicadas (as 20 últimas de cada página), para voltar atrás.
create table modulos_paginas_versoes (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  modulo text not null,
  pagina text not null,
  publicada_em timestamp with time zone not null default now()
);
create index modulos_paginas_versoes_store_idx on modulos_paginas_versoes (store_id, modulo, publicada_em);
