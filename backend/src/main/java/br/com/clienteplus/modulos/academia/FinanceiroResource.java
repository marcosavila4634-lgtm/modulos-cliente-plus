package br.com.clienteplus.modulos.academia;

import br.com.clienteplus.modulos.academia.FinanceiroContrato.*;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import java.util.UUID;

// Despesas, resultado do mês e comissões (profissionais e indicações).
@Path("/academia")
@Produces(MediaType.APPLICATION_JSON)
public class FinanceiroResource {

    // Loja da requisição (academia ou artes marciais), até existir login.
    @Inject
    LojaAcademia lojaAtual;

    @Inject
    Financeiro financeiro;

    // ---------- Despesas ----------

    @GET
    @Path("/despesas")
    public PainelDespesas despesas() {
        return financeiro.painelDespesas(lojaAtual.id());
    }

    @POST
    @Path("/despesas")
    public DespesaJson cadastrar(DadosDespesa dados) {
        return Financeiro.json(financeiro.salvarDespesa(lojaAtual.id(), null, dados));
    }

    @PUT
    @Path("/despesas/{id}")
    public DespesaJson atualizar(@PathParam("id") UUID id, DadosDespesa dados) {
        return Financeiro.json(financeiro.salvarDespesa(lojaAtual.id(), id, dados));
    }

    @POST
    @Path("/despesas/{id}/pagar")
    public DespesaJson pagar(@PathParam("id") UUID id, PagarDespesa pedido) {
        return Financeiro.json(financeiro.pagar(lojaAtual.id(), id, pedido));
    }

    @POST
    @Path("/despesas/{id}/cancelar")
    public void cancelar(@PathParam("id") UUID id) {
        financeiro.cancelar(lojaAtual.id(), id);
    }

    // ---------- Resultado ----------

    // meses: 1 a 12 (padrão 6), terminando no mês atual
    @GET
    @Path("/financeiro/resultado")
    public Resultado resultado(@QueryParam("meses") Integer meses) {
        return financeiro.resultado(lojaAtual.id(), meses == null ? 6 : Math.max(1, Math.min(12, meses)));
    }

    // ---------- Comissões ----------

    // mes: AAAA-MM (padrão: mês atual)
    @GET
    @Path("/comissoes/profissionais")
    public ComissoesProfissionais profissionais(@QueryParam("mes") String mes) {
        return financeiro.comissoesProfissionais(lojaAtual.id(), Financeiro.competencia(mes));
    }

    public record PagarComissao(String mes, String formaPagamento) {}

    @POST
    @Path("/comissoes/profissionais/{id}/pagar")
    public ComissoesProfissionais pagarComissao(@PathParam("id") UUID id, PagarComissao pedido) {
        String mes = pedido != null ? pedido.mes() : null;
        financeiro.pagarComissao(lojaAtual.id(), id, Financeiro.competencia(mes), pedido != null ? pedido.formaPagamento() : null);
        return financeiro.comissoesProfissionais(lojaAtual.id(), Financeiro.competencia(mes));
    }

    @GET
    @Path("/comissoes/indicacoes")
    public ComissoesIndicacoes indicacoes(@QueryParam("mes") String mes) {
        return financeiro.indicacoes(lojaAtual.id(), Financeiro.competencia(mes));
    }
}
