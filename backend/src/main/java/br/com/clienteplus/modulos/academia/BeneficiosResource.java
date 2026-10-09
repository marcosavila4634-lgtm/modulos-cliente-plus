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

// Benefícios para os alunos: cadastro, quem tem direito e resgates.
@Path("/academia/beneficios")
@Produces(MediaType.APPLICATION_JSON)
public class BeneficiosResource {

    // Loja da requisição (academia ou artes marciais), até existir login.
    @Inject
    LojaAcademia lojaAtual;

    @Inject
    Beneficios beneficios;

    @Inject
    Matriculas matriculas;

    @GET
    public List<BeneficioJson> listar() {
        return beneficios.listar(lojaAtual.id());
    }

    @POST
    public DetalheBeneficio cadastrar(DadosBeneficio dados) {
        return beneficios.detalhe(lojaAtual.id(), beneficios.salvar(lojaAtual.id(), null, dados).id);
    }

    @PUT
    @Path("/{id}")
    public DetalheBeneficio atualizar(@PathParam("id") UUID id, DadosBeneficio dados) {
        beneficios.salvar(lojaAtual.id(), id, dados);
        return beneficios.detalhe(lojaAtual.id(), id);
    }

    @GET
    @Path("/{id}")
    public DetalheBeneficio detalhe(@PathParam("id") UUID id) {
        return beneficios.detalhe(lojaAtual.id(), id);
    }

    @POST
    @Path("/{id}/resgatar")
    public DetalheBeneficio resgatar(@PathParam("id") UUID id, NovoResgate pedido) {
        if (pedido == null || pedido.alunoId() == null) throw Erro.invalido("Escolha o aluno");
        beneficios.resgatar(lojaAtual.id(), id, matriculas.aluno(lojaAtual.id(), pedido.alunoId()), "recepcao");
        return beneficios.detalhe(lojaAtual.id(), id);
    }

    @POST
    @Path("/{id}/resgates/{resgateId}/entregar")
    public DetalheBeneficio entregar(@PathParam("id") UUID id, @PathParam("resgateId") UUID resgateId) {
        beneficios.entregar(lojaAtual.id(), resgateId);
        return beneficios.detalhe(lojaAtual.id(), id);
    }
}
