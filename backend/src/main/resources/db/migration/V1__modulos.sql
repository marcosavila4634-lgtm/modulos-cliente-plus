-- Catálogo dos módulos em desenvolvimento neste laboratório.
-- Tabela só do laboratório (não vai para o projeto principal), por isso sem store_id.
--
-- Compatível com H2 (modo PostgreSQL) e com Supabase: use
-- "timestamp with time zone" (o H2 não aceita "timestamptz") e escreva
-- "default ..." antes de "primary key".
create table modulos (
  id uuid default gen_random_uuid() primary key,
  slug text not null unique,
  nome text not null,
  segmento text not null,
  descricao text not null default '',
  status text not null default 'planejado'
    check (status in ('planejado', 'em_desenvolvimento', 'pronto_para_migrar', 'migrado')),
  created_at timestamp with time zone not null default now()
);
