package br.com.clienteplus.modulos.academia;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@Path("/academia")
@Produces(MediaType.APPLICATION_JSON)
public class AcademiaResource {

    // Loja de exemplo, até existir login (application.properties).
    @ConfigProperty(name = "academia.store-id")
    UUID storeId;

    @Inject
    PainelAcademia painel;

    // Painel do gestor, calculado a partir dos alunos, matrículas e mensalidades.
    @GET
    @Path("/dashboard")
    public DashboardAcademia dashboard() {
        return painel.montar(storeId);
    }
}
