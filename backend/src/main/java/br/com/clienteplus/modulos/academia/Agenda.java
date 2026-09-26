package br.com.clienteplus.modulos.academia;

import static br.com.clienteplus.modulos.comum.Formatos.FUSO;
import static br.com.clienteplus.modulos.comum.Formatos.numero;

import br.com.clienteplus.modulos.academia.AgendaContrato.*;
import br.com.clienteplus.modulos.academia.TreinosContrato.Referencia;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import br.com.clienteplus.modulos.comum.Erro;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Set;
import java.util.UUID;

// Regras da agenda dos profissionais.
//
// - Um profissional não pode ter dois horários ao mesmo tempo, nem um horário
//   durante uma aula que ele dá.
// - Duração padrão: a do serviço (ou 60 minutos).
// - Ao concluir um atendimento de serviço com preço, pode gerar a cobrança
//   (uma venda no nome do aluno, a receber no Faturamento).
@ApplicationScoped
public class Agenda {

    static final Set<String> TIPOS = Set.of("servico", "avaliacao", "outro");
    static final Set<String> STATUS = Set.of("agendado", "confirmado", "concluido", "faltou", "cancelado");
    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");

    @Inject
    Servicos servicos;

    @Inject
    Matriculas matriculas;

    static AgendamentoJson json(Agendamento a) {
        return new AgendamentoJson(
                a.id,
                a.cliente != null ? new Referencia(a.cliente.id, a.cliente.nome) : null,
                new Referencia(a.profissional.id, a.profissional.nome),
                a.servico != null ? new Referencia(a.servico.id, a.servico.nome) : null,
                a.tipo,
                a.titulo,
                a.inicio.atZoneSameInstant(FUSO).toOffsetDateTime(),
                a.fim.atZoneSameInstant(FUSO).toOffsetDateTime(),
                a.status,
                a.observacao,
                a.servico != null ? numero(a.servico.preco) : null,
                a.venda != null ? a.venda.id : null);
    }

    public Agendamento agendamento(UUID storeId, UUID id) {
        Agendamento a = Agendamento.findById(id);
        if (a == null || !a.storeId.equals(storeId)) throw Erro.naoEncontrado("Horário não encontrado na agenda");
        return a;
    }

    @Transactional
    public Agendamento salvar(UUID storeId, UUID id, DadosAgendamento d) {
        Agendamento a;
        if (id == null) {
            a = new Agendamento();
            a.storeId = storeId;
            a.status = "agendado";
        } else {
            a = agendamento(storeId, id);
            if ("concluido".equals(a.status) || Agendamento.CANCELADO.equals(a.status)) {
                throw Erro.conflito("Este horário já foi " + ("concluido".equals(a.status) ? "concluído" : "cancelado"));
            }
        }
        if (d == null || d.profissionalId() == null) throw Erro.invalido("Escolha o profissional");
        Profissional prof = Profissional.findById(d.profissionalId());
        if (prof == null || !prof.storeId.equals(storeId)) throw Erro.invalido("Profissional não encontrado");
        String tipo = d.tipo() != null ? d.tipo() : "servico";
        if (!TIPOS.contains(tipo)) throw Erro.invalido("Tipo de horário inválido");

        Servico servico = d.servicoId() != null ? servicos.servico(storeId, d.servicoId()) : null;
        if ("servico".equals(tipo) && servico == null) throw Erro.invalido("Escolha o serviço");
        Cliente aluno = d.alunoId() != null ? matriculas.aluno(storeId, d.alunoId()) : null;
        if (!"outro".equals(tipo) && aluno == null) throw Erro.invalido("Escolha o aluno");
        String titulo = d.titulo() != null ? d.titulo().trim() : "";
        if ("outro".equals(tipo) && titulo.isEmpty()) throw Erro.invalido("Dê um título ao compromisso");

        if (d.data() == null) throw Erro.invalido("Escolha a data");
        LocalTime hora;
        try {
            hora = LocalTime.parse(d.hora());
        } catch (DateTimeParseException | NullPointerException e) {
            throw Erro.invalido("Horário inválido: use HH:MM");
        }
        int duracao = d.duracaoMinutos() != null ? d.duracaoMinutos()
                : servico != null && servico.duracaoMinutos != null ? servico.duracaoMinutos : 60;
        if (duracao < 5 || duracao > 480) throw Erro.invalido("Duração: de 5 a 480 minutos");
        OffsetDateTime inicio = d.data().atTime(hora).atZone(FUSO).toOffsetDateTime();
        OffsetDateTime fim = inicio.plusMinutes(duracao);

        // Conflito com outro horário do mesmo profissional.
        Agendamento choque = Agendamento.<Agendamento>find(
                        "profissional = ?1 and status <> ?2 and inicio < ?3 and fim > ?4 and id <> ?5",
                        prof, Agendamento.CANCELADO, fim, inicio, a.id != null ? a.id : new UUID(0, 0))
                .firstResult();
        if (choque != null) {
            throw Erro.conflito(prof.nome.split(" ")[0] + " já tem horário das "
                    + choque.inicio.atZoneSameInstant(FUSO).format(HORA) + " às "
                    + choque.fim.atZoneSameInstant(FUSO).format(HORA) + " neste dia");
        }
        // Conflito com uma aula que ele dá.
        for (AulaHorario h : AulaHorario.<AulaHorario>list(
                "aula.professor = ?1 and ativo = true and aula.ativo = true and diaSemana = ?2",
                prof, d.data().getDayOfWeek().getValue())) {
            OffsetDateTime ini = Aulas.inicio(h, d.data());
            OffsetDateTime f = ini.plusMinutes(h.aula.duracaoMinutos);
            if (ini.isBefore(fim) && f.isAfter(inicio)) {
                throw Erro.conflito(prof.nome.split(" ")[0] + " dá aula de " + h.aula.nome + " às "
                        + h.horaInicio.format(HORA) + " neste dia");
            }
        }

        a.cliente = aluno;
        a.profissional = prof;
        a.servico = "servico".equals(tipo) ? servico : null;
        a.tipo = tipo;
        a.titulo = titulo;
        a.inicio = inicio;
        a.fim = fim;
        a.observacao = d.observacao() != null ? d.observacao().trim() : "";
        a.persistAndFlush();
        return a;
    }

    @Transactional
    public Agendamento mudarStatus(UUID storeId, UUID id, MudarStatus pedido) {
        Agendamento a = agendamento(storeId, id);
        if (pedido == null || pedido.status() == null || !STATUS.contains(pedido.status())) {
            throw Erro.invalido("Situação inválida");
        }
        if ("concluido".equals(a.status) && !"concluido".equals(pedido.status()) && a.venda != null) {
            throw Erro.conflito("Este atendimento já gerou cobrança; cancele a venda em Serviços antes");
        }
        a.status = pedido.status();
        if ("concluido".equals(a.status) && Boolean.TRUE.equals(pedido.gerarCobranca()) && a.venda == null
                && a.servico != null && a.cliente != null && a.servico.preco.signum() > 0) {
            a.venda = servicos.vender(storeId, a.cliente,
                    new NovaVenda(a.cliente.id, a.servico.id, a.profissional.id, 1, null, Matriculas.hoje(), false, null));
        }
        return a;
    }
}
