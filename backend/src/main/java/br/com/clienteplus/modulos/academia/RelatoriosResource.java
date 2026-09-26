package br.com.clienteplus.modulos.academia;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;

// Relatórios: alunos, frequência, inadimplência, aulas e profissionais.
@Path("/academia/relatorios")
@Produces(MediaType.APPLICATION_JSON)
public class RelatoriosResource {

    @ConfigProperty(name = "academia.store-id")
    UUID storeId;

    @Inject
    Relatorios relatorios;

    // dias: tamanho do período (7 a 365; padrão 30)
    @GET
    public RelatoriosContrato.Relatorios montar(@QueryParam("dias") Integer dias) {
        return relatorios.montar(storeId, dias == null ? 30 : Math.max(7, Math.min(365, dias)));
    }
}
