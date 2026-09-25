-- Módulo Academia: avaliações físicas dos alunos.
--
-- cliente_id aponta para o cliente (aluno) do Cliente Plus (FK na migração
-- para o projeto principal; no laboratório: cliente-plus-simulado/V10).
-- IMC, massa gorda/magra e relação cintura-quadril são calculados na hora
-- (não ficam gravados). O % de gordura fica gravado: digitado (bioimpedância)
-- ou calculado pelas 7 dobras (Jackson & Pollock + Siri).
--
-- RLS (Supabase):
--   alter table academia_avaliacoes enable row level security;
--   create policy "lojista vê e altera só os dados da própria loja" on academia_avaliacoes
--     for all using (store_id in (select id from stores where <dono> = auth.uid()))
--     with check (store_id in (select id from stores where <dono> = auth.uid()));
-- O aluno (área do cliente) só LÊ as próprias avaliações.

create table academia_avaliacoes (
  id uuid default gen_random_uuid() primary key,
  store_id uuid not null,
  cliente_id uuid not null,
  profissional_id uuid references academia_profissionais (id),
  data date not null,
  sexo text not null check (sexo in ('M', 'F')),
  idade integer,
  peso numeric(5, 2) not null check (peso > 0),
  altura_cm numeric(5, 1) not null check (altura_cm > 0),
  metodo_gordura text not null default 'nenhum'
    check (metodo_gordura in ('nenhum', 'bioimpedancia', 'dobras_pollock7')),
  gordura_pct numeric(4, 1),
  -- dobras cutâneas (mm)
  dobra_peitoral numeric(4, 1),
  dobra_axilar numeric(4, 1),
  dobra_triceps numeric(4, 1),
  dobra_subescapular numeric(4, 1),
  dobra_abdominal numeric(4, 1),
  dobra_suprailiaca numeric(4, 1),
  dobra_coxa numeric(4, 1),
  -- circunferências (cm)
  medida_peitoral numeric(5, 1),
  medida_cintura numeric(5, 1),
  medida_abdomen numeric(5, 1),
  medida_quadril numeric(5, 1),
  medida_braco_direito numeric(5, 1),
  medida_braco_esquerdo numeric(5, 1),
  medida_coxa_direita numeric(5, 1),
  medida_coxa_esquerda numeric(5, 1),
  medida_panturrilha numeric(5, 1),
  -- saúde
  pressao_sistolica integer,
  pressao_diastolica integer,
  fc_repouso integer,
  objetivo text not null default '',
  restricoes text not null default '', -- lesões, doenças, medicamentos
  observacoes text not null default '',
  created_at timestamp with time zone not null default now()
);

create index academia_avaliacoes_cliente_idx on academia_avaliacoes (store_id, cliente_id, data);
