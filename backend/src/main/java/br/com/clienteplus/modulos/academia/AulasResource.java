package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.academia.AgendaContrato.*;
import br.com.clienteplus.modulos.comum.Erro;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import java.text.Collator;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.Locale;
import java.util.UUID;

// Aulas coletivas: cadastro, grade da semana, turma fixa, reservas e chamada.
@Path("/academia/aulas")
@Produces(MediaType.APPLICATION_JSON)
public class AulasResource {

    private static final Collator ALFABETICA = Collator.getInstance(Locale.of("pt", "BR"));

    // Loja da requisição (academia ou artes marciais), até existir login.
    @Inject
    LojaAcademia lojaAtual;

    @Inject
    Aulas aulas;

    @Inject
    Matriculas matriculas;

    // Aulas cadastradas e a grade da semana (inicio = qualquer dia da semana;
    // padrão: esta semana).
    @GET
    public GradeAulas grade(@QueryParam("semana") String semana) {
        LocalDate dia = data(semana, Matriculas.hoje());
        LocalDate segunda = dia.with(DayOfWeek.MONDAY);
        return new GradeAulas(
                segunda,
                Aula.<Aula>list("storeId", lojaAtual.id()).stream()
                        .sorted(Comparator.comparing((Aula a) -> !a.ativo).thenComparing(a -> a.nome, ALFABETICA))
                        .map(aulas::json)
                        .toList(),
                aulas.entre(lojaAtual.id(), segunda, segunda.plusDays(6), null));
    }

    @POST
    public AulaJson cadastrar(DadosAula dados) {
        return aulas.json(aulas.salvar(lojaAtual.id(), null, dados));
    }

    @PUT
    @Path("/{id}")
    public AulaJson atualizar(@PathParam("id") UUID id, DadosAula dados) {
        return aulas.json(aulas.salvar(lojaAtual.id(), id, dados));
    }

    // Uma aula numa data: participantes, vagas e chamada.
    @GET
    @Path("/sessao/{horarioId}")
    public SessaoAula sessao(@PathParam("horarioId") UUID horarioId, @QueryParam("data") String data) {
        return aulas.sessao(lojaAtual.id(), horarioId, data(data, null));
    }

    @POST
    @Path("/sessao/{horarioId}/reservar")
    public SessaoAula reservar(@PathParam("horarioId") UUID horarioId, Reserva r) {
        if (r == null || r.alunoId() == null) throw Erro.invalido("Escolha o aluno");
        aulas.reservar(lojaAtual.id(), horarioId, matriculas.aluno(lojaAtual.id(), r.alunoId()), r.data(), "recepcao");
        return aulas.sessao(lojaAtual.id(), horarioId, r.data());
    }

    @POST
    @Path("/sessao/{horarioId}/cancelar")
    public SessaoAula cancelar(@PathParam("horarioId") UUID horarioId, Reserva r) {
        if (r == null || r.alunoId() == null) throw Erro.invalido("Escolha o aluno");
        aulas.cancelarReserva(lojaAtual.id(), horarioId, matriculas.aluno(lojaAtual.id(), r.alunoId()), r.data());
        return aulas.sessao(lojaAtual.id(), horarioId, r.data());
    }

    @POST
    @Path("/sessao/{horarioId}/chamada")
    public SessaoAula chamada(@PathParam("horarioId") UUID horarioId, Chamada c) {
        if (c == null || c.alunoId() == null) throw Erro.invalido("Escolha o aluno");
        aulas.chamada(lojaAtual.id(), horarioId, matriculas.aluno(lojaAtual.id(), c.alunoId()), c.data(), c.status());
        return aulas.sessao(lojaAtual.id(), horarioId, c.data());
    }

    @POST
    @Path("/horarios/{horarioId}/turma")
    public void adicionarFixo(@PathParam("horarioId") UUID horarioId, NovoFixo f) {
        if (f == null || f.alunoId() == null) throw Erro.invalido("Escolha o aluno");
        aulas.adicionarFixo(lojaAtual.id(), horarioId, matriculas.aluno(lojaAtual.id(), f.alunoId()));
    }

    @POST
    @Path("/horarios/{horarioId}/turma/{alunoId}/remover")
    public void removerFixo(@PathParam("horarioId") UUID horarioId, @PathParam("alunoId") UUID alunoId) {
        aulas.removerFixo(lojaAtual.id(), horarioId, matriculas.aluno(lojaAtual.id(), alunoId));
    }

    private static LocalDate data(String s, LocalDate padrao) {
        if (s == null || s.isBlank()) {
            if (padrao == null) throw Erro.invalido("Informe a data");
            return padrao;
        }
        try {
            return LocalDate.parse(s);
        } catch (DateTimeParseException e) {
            throw Erro.invalido("Data inválida");
        }
    }
}
