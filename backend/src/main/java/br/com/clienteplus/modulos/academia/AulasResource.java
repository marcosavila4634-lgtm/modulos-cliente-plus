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
import org.eclipse.microprofile.config.inject.ConfigProperty;

// Aulas coletivas: cadastro, grade da semana, turma fixa, reservas e chamada.
@Path("/academia/aulas")
@Produces(MediaType.APPLICATION_JSON)
public class AulasResource {

    private static final Collator ALFABETICA = Collator.getInstance(Locale.of("pt", "BR"));

    @ConfigProperty(name = "academia.store-id")
    UUID storeId;

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
                Aula.<Aula>list("storeId", storeId).stream()
                        .sorted(Comparator.comparing((Aula a) -> !a.ativo).thenComparing(a -> a.nome, ALFABETICA))
                        .map(aulas::json)
                        .toList(),
                aulas.entre(storeId, segunda, segunda.plusDays(6), null));
    }

    @POST
    public AulaJson cadastrar(DadosAula dados) {
        return aulas.json(aulas.salvar(storeId, null, dados));
    }

    @PUT
    @Path("/{id}")
    public AulaJson atualizar(@PathParam("id") UUID id, DadosAula dados) {
        return aulas.json(aulas.salvar(storeId, id, dados));
    }

    // Uma aula numa data: participantes, vagas e chamada.
    @GET
    @Path("/sessao/{horarioId}")
    public SessaoAula sessao(@PathParam("horarioId") UUID horarioId, @QueryParam("data") String data) {
        return aulas.sessao(storeId, horarioId, data(data, null));
    }

    @POST
    @Path("/sessao/{horarioId}/reservar")
    public SessaoAula reservar(@PathParam("horarioId") UUID horarioId, Reserva r) {
        if (r == null || r.alunoId() == null) throw Erro.invalido("Escolha o aluno");
        aulas.reservar(storeId, horarioId, matriculas.aluno(storeId, r.alunoId()), r.data(), "recepcao");
        return aulas.sessao(storeId, horarioId, r.data());
    }

    @POST
    @Path("/sessao/{horarioId}/cancelar")
    public SessaoAula cancelar(@PathParam("horarioId") UUID horarioId, Reserva r) {
        if (r == null || r.alunoId() == null) throw Erro.invalido("Escolha o aluno");
        aulas.cancelarReserva(storeId, horarioId, matriculas.aluno(storeId, r.alunoId()), r.data());
        return aulas.sessao(storeId, horarioId, r.data());
    }

    @POST
    @Path("/sessao/{horarioId}/chamada")
    public SessaoAula chamada(@PathParam("horarioId") UUID horarioId, Chamada c) {
        if (c == null || c.alunoId() == null) throw Erro.invalido("Escolha o aluno");
        aulas.chamada(storeId, horarioId, matriculas.aluno(storeId, c.alunoId()), c.data(), c.status());
        return aulas.sessao(storeId, horarioId, c.data());
    }

    @POST
    @Path("/horarios/{horarioId}/turma")
    public void adicionarFixo(@PathParam("horarioId") UUID horarioId, NovoFixo f) {
        if (f == null || f.alunoId() == null) throw Erro.invalido("Escolha o aluno");
        aulas.adicionarFixo(storeId, horarioId, matriculas.aluno(storeId, f.alunoId()));
    }

    @POST
    @Path("/horarios/{horarioId}/turma/{alunoId}/remover")
    public void removerFixo(@PathParam("horarioId") UUID horarioId, @PathParam("alunoId") UUID alunoId) {
        aulas.removerFixo(storeId, horarioId, matriculas.aluno(storeId, alunoId));
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
