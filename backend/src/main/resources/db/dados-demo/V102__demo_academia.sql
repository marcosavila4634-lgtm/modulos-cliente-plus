-- Dados de exemplo (DEMO) da "Academia Prime". Não copiar para o projeto principal.
-- store_id da loja de exemplo: 11111111-1111-4111-8111-111111111111
-- (o mesmo valor está em academia.store-id no application.properties).
-- Alunos, planos e mensalidades de exemplo ficam em V104__demo_alunos.sql.

insert into academia_painel (store_id, nome_academia, gestor_nome, gestor_cargo, frase) values
  ('11111111-1111-4111-8111-111111111111', 'Academia Prime', 'Fernando', 'Administrador',
   'Disciplina hoje, resultado sempre.');
