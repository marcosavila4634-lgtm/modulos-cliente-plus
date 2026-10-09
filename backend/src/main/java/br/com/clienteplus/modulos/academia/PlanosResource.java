package br.com.clienteplus.modulos.academia;

import jakarta.inject.Inject;
import br.com.clienteplus.modulos.academia.AlunosContrato.PlanoJson;
import br.com.clienteplus.modulos.clienteplus.Plano;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.List;
import java.util.UUID;

// Planos que podem ser escolhidos na matrícula. O cadastro dos planos é feito
// no Cliente Plus (Produtos/Planos).
@Path("/academia/planos")
@Produces(MediaType.APPLICATION_JSON)
public class PlanosResource {

    // Loja da requisição (academia ou artes marciais), até existir login.
    @Inject
    LojaAcademia lojaAtual;

    @GET
    public List<PlanoJson> listar() {
        return Plano.<Plano>list("storeId = ?1 and ativo = true order by duracaoMeses, preco", lojaAtual.id()).stream()
                .map(Matriculas::plano)
                .toList();
    }
}
