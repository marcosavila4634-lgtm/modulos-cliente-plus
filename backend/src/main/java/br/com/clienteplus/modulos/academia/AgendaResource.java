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
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;

// Agenda dos profissionais, com as aulas da grade no mesmo período.
@Path("/academia/agenda")
@Produces(MediaType.APPLICATION_JSON)
public class AgendaResource {

    @ConfigProperty(name = "academia.store-id")
    UUID storeId;

    @Inject
    Agenda agenda;

    @Inject
    Aulas aulas;

    // inicio: primeiro dia (padrão: hoje); dias: 1 a 31 (padrão 7)
    @GET
    public PainelAgenda painel(
            @QueryParam("inicio") String inicio,
            @QueryParam("dias") Integer dias,
            @QueryParam("profissionalId") UUID profissionalId) {
        LocalDate de;
        try {
            de = inicio == null || inicio.isBlank() ? Matriculas.hoje() : LocalDate.parse(inicio);
        } catch (DateTimeParseException e) {
            throw Erro.invalido("Data inválida");
        }
        int n = dias == null ? 7 : Math.max(1, Math.min(31, dias));
        LocalDate ate = de.plusDays(n - 1);

        List<Agendamento> lista = profissionalId == null
                ? Agendamento.list("storeId = ?1 and inicio >= ?2 and inicio < ?3 order by inicio",
                        storeId, Acessos.inicioDo(de), Acessos.inicioDo(ate.plusDays(1)))
                : Agendamento.list(
                        "storeId = ?1 and inicio >= ?2 and inicio < ?3 and profissional.id = ?4 order by inicio",
                        storeId, Acessos.inicioDo(de), Acessos.inicioDo(ate.plusDays(1)), profissionalId);

        List<ProfissionalAgenda> profissionais = Profissional.<Profissional>list(
                        "storeId = ?1 and ativo = true order by nome", storeId)
                .stream()
                .map(p -> new ProfissionalAgenda(p.id, p.nome, p.especialidade))
                .toList();

        return new PainelAgenda(de, n, profissionais, lista.stream().map(Agenda::json).toList(),
                aulas.entre(storeId, de, ate, profissionalId));
    }

    @POST
    public AgendamentoJson marcar(DadosAgendamento dados) {
        return Agenda.json(agenda.salvar(storeId, null, dados));
    }

    @PUT
    @Path("/{id}")
    public AgendamentoJson alterar(@PathParam("id") UUID id, DadosAgendamento dados) {
        return Agenda.json(agenda.salvar(storeId, id, dados));
    }

    @POST
    @Path("/{id}/status")
    public AgendamentoJson mudarStatus(@PathParam("id") UUID id, MudarStatus pedido) {
        return Agenda.json(agenda.mudarStatus(storeId, id, pedido));
    }
}
