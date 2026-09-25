package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.academia.TreinosContrato.TreinoDoAluno;
import br.com.clienteplus.modulos.clienteplus.Cliente;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;

// O que o aluno vê na área do cliente do Cliente Plus (aba "Meu treino").
// No projeto principal o aluno está logado; aqui ele é escolhido pelo id.
@Path("/area-cliente")
@Produces(MediaType.APPLICATION_JSON)
public class AreaClienteResource {

    @ConfigProperty(name = "academia.store-id")
    UUID storeId;

    @Inject
    Matriculas matriculas;

    @Inject
    Treinos treinos;

    @GET
    @Path("/{clienteId}/treino")
    public TreinoDoAluno treino(@PathParam("clienteId") UUID clienteId) {
        Cliente aluno = matriculas.aluno(storeId, clienteId);
        Ficha ficha = treinos.fichaAtiva(aluno);
        String academia = AcademiaPainel.<AcademiaPainel>find("storeId", storeId)
                .firstResultOptional()
                .map(p -> p.nomeAcademia)
                .orElse("");
        return new TreinoDoAluno(academia, aluno.nome, ficha != null ? Treinos.json(ficha) : null);
    }
}
