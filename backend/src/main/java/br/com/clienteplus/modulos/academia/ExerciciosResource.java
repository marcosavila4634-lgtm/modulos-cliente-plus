package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.academia.TreinosContrato.*;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.text.Collator;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;

// Biblioteca de exercícios da academia. A busca e os filtros são feitos na tela.
@Path("/academia/exercicios")
@Produces(MediaType.APPLICATION_JSON)
public class ExerciciosResource {

    private static final Collator ALFABETICA = Collator.getInstance(Locale.of("pt", "BR"));

    @ConfigProperty(name = "academia.store-id")
    UUID storeId;

    @Inject
    Treinos treinos;

    @GET
    public List<ExercicioJson> listar() {
        return Exercicio.<Exercicio>list("storeId", storeId).stream()
                .sorted(Comparator.comparing((Exercicio e) -> e.nome, ALFABETICA))
                .map(Treinos::json)
                .toList();
    }

    @POST
    public ExercicioJson cadastrar(DadosExercicio dados) {
        return Treinos.json(treinos.salvarExercicio(storeId, null, dados));
    }

    @PUT
    @Path("/{id}")
    public ExercicioJson atualizar(@PathParam("id") UUID id, DadosExercicio dados) {
        return Treinos.json(treinos.salvarExercicio(storeId, id, dados));
    }
}
