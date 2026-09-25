-- Dados de exemplo (DEMO) do laboratório. Não copiar para o projeto principal.
insert into modulos (slug, nome, segmento, descricao, status, created_at) values
  ('agenda-barbearia', 'Agenda para Barbearias', 'Barbearias',
   'Agendamento presencial e online, profissionais, serviços, histórico de clientes. Já existe no projeto principal.',
   'migrado', timestamp with time zone '2026-09-01 12:00:00+00'),
  ('academia', 'Gestão para Academias', 'Academias',
   'Matrículas, planos, frequência e mensalidades integradas às indicações.',
   'em_desenvolvimento', timestamp with time zone '2026-09-01 12:00:01+00'),
  ('consultorio', 'Gestão para Consultórios', 'Clínicas e consultórios',
   'Agenda de consultas, pacientes, profissionais e pagamentos recorrentes.',
   'planejado', timestamp with time zone '2026-09-01 12:00:02+00'),
  ('escola', 'Gestão para Escolas e Cursos', 'Escolas e cursos',
   'Alunos, turmas, mensalidades e controle de inadimplência.',
   'planejado', timestamp with time zone '2026-09-01 12:00:03+00'),
  ('grupo-vip', 'Gestão de Grupos VIP', 'Grupos VIP (Telegram e WhatsApp)',
   'Para quem vende acesso a grupos pagos no Telegram e no WhatsApp: membros, planos, conteúdos, lives, avisos e receita.',
   'em_desenvolvimento', timestamp with time zone '2026-09-20 12:00:00+00');
