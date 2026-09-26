package br.com.clienteplus.modulos.academia;

import static br.com.clienteplus.modulos.comum.Formatos.FUSO;

import br.com.clienteplus.modulos.academia.AgendaContrato.*;
import br.com.clienteplus.modulos.academia.TreinosContrato.Referencia;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.Erro;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.text.Collator;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

// Regras das aulas coletivas.
//
// - Cada aula tem horários na semana; cada horário pode ter alunos fixos (a
//   turma) e receber reservas avulsas para uma data.
// - Ocupação de uma data = fixos ativos (menos os que avisaram que não vão)
//   + reservas avulsas não canceladas. Não passa da capacidade.
// - Só reserva quem tem matrícula ativa, para hoje ou datas futuras.
// - Chamada (presente/faltou): só de hoje para trás.
@ApplicationScoped
public class Aulas {

    static final Set<String> CORES = Set.of("violeta", "azul", "verde", "laranja", "rosa", "ciano");
    private static final Collator ALFABETICA = Collator.getInstance(Locale.of("pt", "BR"));

    @Inject
    Matriculas matriculas;

    // ---------- Conversões ----------

    AulaJson json(Aula a) {
        LocalDate hoje = Matriculas.hoje();
        return new AulaJson(
                a.id,
                a.nome,
                a.descricao,
                a.professor != null ? new Referencia(a.professor.id, a.professor.nome) : null,
                a.sala,
                a.capacidade,
                a.duracaoMinutos,
                a.cor,
                a.ativo,
                a.horarios.stream()
                        .filter(h -> h.ativo)
                        .map(h -> new HorarioAulaJson(h.id, h.diaSemana, Configuracoes.DIAS[h.diaSemana - 1],
                                h.horaInicio.toString(), fixos(h, hoje).size()))
                        .toList());
    }

    static List<TurmaAluno> fixos(AulaHorario h, LocalDate data) {
        return TurmaAluno.<TurmaAluno>list("horario = ?1 and ativo = true and desde <= ?2", h, data);
    }

    static OffsetDateTime inicio(AulaHorario h, LocalDate data) {
        return data.atTime(h.horaInicio).atZone(FUSO).toOffsetDateTime();
    }

    // Todas as aulas da grade entre duas datas (inclusive), com a ocupação.
    public List<AulaNaData> entre(UUID storeId, LocalDate de, LocalDate ate, UUID professorId) {
        List<AulaHorario> horarios = AulaHorario.list(
                "storeId = ?1 and ativo = true and aula.ativo = true", storeId);
        if (horarios.isEmpty()) return List.of();

        // fixos por horário (com a data de entrada) e presenças do período
        Map<UUID, List<TurmaAluno>> fixosPorHorario = new HashMap<>();
        for (TurmaAluno t : TurmaAluno.<TurmaAluno>list("storeId = ?1 and ativo = true", storeId)) {
            fixosPorHorario.computeIfAbsent(t.horario.id, k -> new ArrayList<>()).add(t);
        }
        Map<String, int[]> contagem = new HashMap<>(); // horario|data -> [avulsos, fixos cancelados]
        for (Presenca p : Presenca.<Presenca>list("storeId = ?1 and data >= ?2 and data <= ?3", storeId, de, ate)) {
            int[] c = contagem.computeIfAbsent(p.horario.id + "|" + p.data, k -> new int[2]);
            if (p.avulso && !Presenca.CANCELADO.equals(p.status)) c[0]++;
            if (!p.avulso && Presenca.CANCELADO.equals(p.status)) c[1]++;
        }

        List<AulaNaData> lista = new ArrayList<>();
        for (LocalDate d = de; !d.isAfter(ate); d = d.plusDays(1)) {
            int dia = d.getDayOfWeek().getValue();
            for (AulaHorario h : horarios) {
                if (h.diaSemana != dia) continue;
                if (professorId != null && (h.aula.professor == null || !h.aula.professor.id.equals(professorId))) continue;
                final LocalDate data = d;
                long fixos = fixosPorHorario.getOrDefault(h.id, List.of()).stream()
                        .filter(t -> !t.desde.isAfter(data))
                        .count();
                int[] c = contagem.getOrDefault(h.id + "|" + d, new int[2]);
                lista.add(naData(h, d, (int) fixos - c[1] + c[0]));
            }
        }
        lista.sort(Comparator.comparing(AulaNaData::inicio));
        return lista;
    }

    static AulaNaData naData(AulaHorario h, LocalDate data, int ocupados) {
        Aula a = h.aula;
        OffsetDateTime inicio = inicio(h, data);
        return new AulaNaData(
                h.id,
                a.id,
                a.nome,
                a.cor,
                a.sala,
                a.professor != null ? new Referencia(a.professor.id, a.professor.nome) : null,
                data,
                h.horaInicio.toString(),
                inicio,
                inicio.plusMinutes(a.duracaoMinutos),
                ocupados,
                a.capacidade);
    }

    // ---------- Consultas ----------

    public Aula aula(UUID storeId, UUID id) {
        Aula a = Aula.findById(id);
        if (a == null || !a.storeId.equals(storeId)) throw Erro.naoEncontrado("Aula não encontrada");
        return a;
    }

    public AulaHorario horario(UUID storeId, UUID id) {
        AulaHorario h = AulaHorario.findById(id);
        if (h == null || !h.storeId.equals(storeId)) throw Erro.naoEncontrado("Horário de aula não encontrado");
        return h;
    }

    private static void conferirDia(AulaHorario h, LocalDate data) {
        if (data == null) throw Erro.invalido("Informe a data da aula");
        if (data.getDayOfWeek().getValue() != h.diaSemana) {
            throw Erro.invalido("Esta aula acontece " + (h.diaSemana <= 5 ? "às " : "aos ")
                    + Configuracoes.DIAS[h.diaSemana - 1].toLowerCase() + "s");
        }
    }

    public SessaoAula sessao(UUID storeId, UUID horarioId, LocalDate data) {
        AulaHorario h = horario(storeId, horarioId);
        conferirDia(h, data);
        Map<UUID, Presenca> presencas = new HashMap<>();
        for (Presenca p : Presenca.<Presenca>list("horario = ?1 and data = ?2", h, data)) presencas.put(p.cliente.id, p);

        List<Participante> lista = new ArrayList<>();
        Set<UUID> fixos = new HashSet<>();
        for (TurmaAluno t : fixos(h, data)) {
            fixos.add(t.cliente.id);
            Presenca p = presencas.get(t.cliente.id);
            lista.add(new Participante(t.cliente.id, t.cliente.nome, "fixo", p != null ? p.status : Presenca.RESERVADO,
                    "recepcao"));
        }
        for (Presenca p : presencas.values()) {
            if (fixos.contains(p.cliente.id) || !p.avulso || Presenca.CANCELADO.equals(p.status)) continue;
            lista.add(new Participante(p.cliente.id, p.cliente.nome, "avulso", p.status, p.origem));
        }
        lista.sort(Comparator.comparing(Participante::nome, ALFABETICA));

        int ocupados = (int) lista.stream().filter(x -> !Presenca.CANCELADO.equals(x.status())).count();
        AulaNaData aula = naData(h, data, ocupados);
        return new SessaoAula(
                aula,
                Configuracoes.DIAS[h.diaSemana - 1],
                aula.fim().isBefore(OffsetDateTime.now()),
                lista,
                Math.max(0, h.aula.capacidade - ocupados),
                (int) lista.stream().filter(x -> Presenca.PRESENTE.equals(x.status())).count(),
                (int) lista.stream().filter(x -> Presenca.FALTOU.equals(x.status())).count());
    }

    // ---------- Aulas ----------

    @Transactional
    public Aula salvar(UUID storeId, UUID id, DadosAula d) {
        Aula a;
        if (id == null) {
            a = new Aula();
            a.storeId = storeId;
            a.ativo = true;
        } else {
            a = aula(storeId, id);
        }
        if (d == null || d.nome() == null || d.nome().isBlank()) throw Erro.invalido("Dê um nome para a aula");
        if (d.capacidade() == null || d.capacidade() < 1 || d.capacidade() > 500) {
            throw Erro.invalido("Capacidade: quantos alunos cabem na aula (1 a 500)");
        }
        if (d.duracaoMinutos() == null || d.duracaoMinutos() < 10 || d.duracaoMinutos() > 240) {
            throw Erro.invalido("Duração: de 10 a 240 minutos");
        }
        Profissional prof = null;
        if (d.professorId() != null) {
            prof = Profissional.findById(d.professorId());
            if (prof == null || !prof.storeId.equals(storeId)) throw Erro.invalido("Professor não encontrado");
        }
        a.nome = d.nome().trim();
        a.descricao = d.descricao() != null ? d.descricao().trim() : "";
        a.professor = prof;
        a.sala = d.sala() != null ? d.sala().trim() : "";
        a.capacidade = d.capacidade();
        a.duracaoMinutos = d.duracaoMinutos();
        a.cor = d.cor() != null && CORES.contains(d.cor()) ? d.cor() : "violeta";
        if (d.ativo() != null) a.ativo = d.ativo();

        // Horários: mantém os que continuam, cria os novos e tira da grade os
        // removidos (sem apagar, por causa do histórico de presenças).
        Set<String> pedidos = new HashSet<>();
        for (DadosHorario dh : d.horarios() != null ? d.horarios() : List.<DadosHorario>of()) {
            if (dh.diaSemana() < 1 || dh.diaSemana() > 7) throw Erro.invalido("Dia da semana inválido");
            LocalTime hora;
            try {
                hora = LocalTime.parse(dh.hora());
            } catch (DateTimeParseException | NullPointerException e) {
                throw Erro.invalido("Horário inválido na grade: use HH:MM");
            }
            if (!pedidos.add(dh.diaSemana() + "|" + hora)) continue;
            AulaHorario existente = a.horarios.stream()
                    .filter(h -> h.diaSemana == dh.diaSemana() && h.horaInicio.equals(hora))
                    .findFirst()
                    .orElse(null);
            if (existente != null) {
                existente.ativo = true;
            } else {
                AulaHorario h = new AulaHorario();
                h.storeId = storeId;
                h.aula = a;
                h.diaSemana = dh.diaSemana();
                h.horaInicio = hora;
                h.ativo = true;
                a.horarios.add(h);
            }
        }
        if (pedidos.isEmpty()) throw Erro.invalido("Coloque pelo menos um horário na grade");
        for (AulaHorario h : a.horarios) {
            if (!pedidos.contains(h.diaSemana + "|" + h.horaInicio)) h.ativo = false;
        }
        a.persistAndFlush();
        return a;
    }

    // ---------- Reservas, turma e chamada ----------

    @Transactional
    public void reservar(UUID storeId, UUID horarioId, Cliente aluno, LocalDate data, String origem) {
        AulaHorario h = horario(storeId, horarioId);
        conferirDia(h, data);
        if (!h.ativo || !h.aula.ativo) throw Erro.conflito("Esta aula não está mais na grade");
        if (inicio(h, data).plusMinutes(h.aula.duracaoMinutos).isBefore(OffsetDateTime.now())) {
            throw Erro.conflito("Esta aula já aconteceu");
        }
        if (matriculas.matriculaAtiva(aluno) == null) throw Erro.conflito(aluno.nome + " não tem matrícula ativa");

        Presenca p = Presenca.<Presenca>find("horario = ?1 and cliente = ?2 and data = ?3", h, aluno, data).firstResult();
        boolean fixo = fixos(h, data).stream().anyMatch(t -> t.cliente.id.equals(aluno.id));
        if (fixo && (p == null || !Presenca.CANCELADO.equals(p.status))) {
            throw Erro.conflito(aluno.nome.split(" ")[0] + " já é da turma fixa deste horário");
        }
        if (p != null && !Presenca.CANCELADO.equals(p.status)) throw Erro.conflito("Reserva já feita para esta aula");

        SessaoAula s = sessao(storeId, horarioId, data);
        if (s.vagas() <= 0) throw Erro.conflito("Aula lotada (" + h.aula.capacidade + " vagas)");

        if (p == null) {
            p = new Presenca();
            p.storeId = storeId;
            p.horario = h;
            p.cliente = aluno;
            p.data = data;
            p.avulso = !fixo;
        }
        p.status = Presenca.RESERVADO;
        p.origem = origem;
        p.persist();
    }

    // Avulso: cancela a reserva. Fixo: avisa que não vai nesse dia (libera a vaga).
    @Transactional
    public void cancelarReserva(UUID storeId, UUID horarioId, Cliente aluno, LocalDate data) {
        AulaHorario h = horario(storeId, horarioId);
        conferirDia(h, data);
        Presenca p = Presenca.<Presenca>find("horario = ?1 and cliente = ?2 and data = ?3", h, aluno, data).firstResult();
        boolean fixo = fixos(h, data).stream().anyMatch(t -> t.cliente.id.equals(aluno.id));
        if (p == null && !fixo) throw Erro.naoEncontrado("Reserva não encontrada");
        if (p == null) {
            p = new Presenca();
            p.storeId = storeId;
            p.horario = h;
            p.cliente = aluno;
            p.data = data;
            p.avulso = false;
            p.origem = "recepcao";
        }
        p.status = Presenca.CANCELADO;
        p.persist();
    }

    @Transactional
    public void chamada(UUID storeId, UUID horarioId, Cliente aluno, LocalDate data, String status) {
        AulaHorario h = horario(storeId, horarioId);
        conferirDia(h, data);
        if (!Set.of(Presenca.PRESENTE, Presenca.FALTOU, Presenca.RESERVADO).contains(status)) {
            throw Erro.invalido("Situação inválida na chamada");
        }
        if (data.isAfter(Matriculas.hoje())) throw Erro.conflito("A chamada só pode ser feita no dia da aula ou depois");
        Presenca p = Presenca.<Presenca>find("horario = ?1 and cliente = ?2 and data = ?3", h, aluno, data).firstResult();
        boolean fixo = fixos(h, data).stream().anyMatch(t -> t.cliente.id.equals(aluno.id));
        if (p == null && !fixo) throw Erro.conflito(aluno.nome + " não está nesta aula");
        if (p == null) {
            p = new Presenca();
            p.storeId = storeId;
            p.horario = h;
            p.cliente = aluno;
            p.data = data;
            p.avulso = false;
            p.origem = "recepcao";
        }
        p.status = status;
        p.persist();
    }

    @Transactional
    public void adicionarFixo(UUID storeId, UUID horarioId, Cliente aluno) {
        AulaHorario h = horario(storeId, horarioId);
        if (matriculas.matriculaAtiva(aluno) == null) throw Erro.conflito(aluno.nome + " não tem matrícula ativa");
        LocalDate hoje = Matriculas.hoje();
        if (fixos(h, hoje.plusYears(10)).stream().anyMatch(t -> t.cliente.id.equals(aluno.id))) {
            throw Erro.conflito("Este aluno já está na turma");
        }
        if (fixos(h, hoje.plusYears(10)).size() >= h.aula.capacidade) {
            throw Erro.conflito("A turma já tem " + h.aula.capacidade + " alunos fixos (capacidade da aula)");
        }
        TurmaAluno t = new TurmaAluno();
        t.storeId = storeId;
        t.horario = h;
        t.cliente = aluno;
        t.desde = hoje;
        t.ativo = true;
        t.persist();
    }

    @Transactional
    public void removerFixo(UUID storeId, UUID horarioId, Cliente aluno) {
        AulaHorario h = horario(storeId, horarioId);
        List<TurmaAluno> lista = TurmaAluno.list("horario = ?1 and cliente = ?2 and ativo = true", h, aluno);
        if (lista.isEmpty()) throw Erro.naoEncontrado("Este aluno não está na turma");
        lista.forEach(t -> t.ativo = false);
    }
}
