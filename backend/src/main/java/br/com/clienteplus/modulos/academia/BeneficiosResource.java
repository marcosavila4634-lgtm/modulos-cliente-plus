package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.academia.FinanceiroContrato.*;
import br.com.clienteplus.modulos.comum.Erro;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.List;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;

// Benefícios para os alunos: cadastro, quem tem direito e resgates.
@Path("/academia/beneficios")
@Produces(MediaType.APPLICATION_JSON)
public class BeneficiosResource {

    @ConfigProperty(name = "academia.store-id")
    UUID storeId;

    @Inject
    Beneficios beneficios;

    @Inject
    Matriculas matriculas;

    @GET
    public List<BeneficioJson> listar() {
        return beneficios.listar(storeId);
    }

    @POST
    public DetalheBeneficio cadastrar(DadosBeneficio dados) {
        return beneficios.detalhe(storeId, beneficios.salvar(storeId, null, dados).id);
    }

    @PUT
    @Path("/{id}")
    public DetalheBeneficio atualizar(@PathParam("id") UUID id, DadosBeneficio dados) {
        beneficios.salvar(storeId, id, dados);
        return beneficios.detalhe(storeId, id);
    }

    @GET
    @Path("/{id}")
    public DetalheBeneficio detalhe(@PathParam("id") UUID id) {
        return beneficios.detalhe(storeId, id);
    }

    @POST
    @Path("/{id}/resgatar")
    public DetalheBeneficio resgatar(@PathParam("id") UUID id, NovoResgate pedido) {
        if (pedido == null || pedido.alunoId() == null) throw Erro.invalido("Escolha o aluno");
        beneficios.resgatar(storeId, id, matriculas.aluno(storeId, pedido.alunoId()), "recepcao");
        return beneficios.detalhe(storeId, id);
    }

    @POST
    @Path("/{id}/resgates/{resgateId}/entregar")
    public DetalheBeneficio entregar(@PathParam("id") UUID id, @PathParam("resgateId") UUID resgateId) {
        beneficios.entregar(storeId, resgateId);
        return beneficios.detalhe(storeId, id);
    }
}
