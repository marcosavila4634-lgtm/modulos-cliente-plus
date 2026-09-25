package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.academia.AlunosContrato.PlanoJson;
import br.com.clienteplus.modulos.clienteplus.Plano;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.List;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;

// Planos que podem ser escolhidos na matrícula. O cadastro dos planos é feito
// no Cliente Plus (Produtos/Planos).
@Path("/academia/planos")
@Produces(MediaType.APPLICATION_JSON)
public class PlanosResource {

    @ConfigProperty(name = "academia.store-id")
    UUID storeId;

    @GET
    public List<PlanoJson> listar() {
        return Plano.<Plano>list("storeId = ?1 and ativo = true order by duracaoMeses, preco", storeId).stream()
                .map(Matriculas::plano)
                .toList();
    }
}
