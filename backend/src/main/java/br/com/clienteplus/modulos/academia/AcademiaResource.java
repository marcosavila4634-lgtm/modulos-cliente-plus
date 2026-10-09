package br.com.clienteplus.modulos.academia;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.UUID;

@Path("/academia")
@Produces(MediaType.APPLICATION_JSON)
public class AcademiaResource {

    // Loja da requisição (academia ou artes marciais), até existir login.
    @Inject
    LojaAcademia lojaAtual;

    @Inject
    PainelAcademia painel;

    // Painel do gestor, calculado a partir dos alunos, matrículas e mensalidades.
    @GET
    @Path("/dashboard")
    public DashboardAcademia dashboard() {
        return painel.montar(lojaAtual.id());
    }
}
