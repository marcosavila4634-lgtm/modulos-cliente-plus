package br.com.clienteplus.modulos.academia;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import java.util.UUID;

// Relatórios: alunos, frequência, inadimplência, aulas e profissionais.
@Path("/academia/relatorios")
@Produces(MediaType.APPLICATION_JSON)
public class RelatoriosResource {

    // Loja da requisição (academia ou artes marciais), até existir login.
    @Inject
    LojaAcademia lojaAtual;

    @Inject
    Relatorios relatorios;

    // dias: tamanho do período (7 a 365; padrão 30)
    @GET
    public RelatoriosContrato.Relatorios montar(@QueryParam("dias") Integer dias) {
        return relatorios.montar(lojaAtual.id(), dias == null ? 30 : Math.max(7, Math.min(365, dias)));
    }
}
