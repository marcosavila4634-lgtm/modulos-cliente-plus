package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.comum.Erro;
import br.com.clienteplus.modulos.grupovip.FinanceiroContrato.*;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;

// Financeiro: Receitas, Assinaturas e Saques.
@Path("/grupo-vip/financeiro")
@Produces(MediaType.APPLICATION_JSON)
public class FinanceiroResource {

    @ConfigProperty(name = "grupo-vip.store-id")
    UUID storeId;

    @Inject
    Financeiro financeiro;

    @GET
    @Path("/receitas")
    @Transactional
    public Receitas receitas(@QueryParam("mes") String mes) {
        YearMonth m;
        try {
            m = mes == null || mes.isBlank() ? YearMonth.from(Membros.hoje()) : YearMonth.parse(mes);
        } catch (DateTimeParseException e) {
            throw Erro.invalido("Mês inválido");
        }
        return financeiro.receitas(storeId, m);
    }

    @GET
    @Path("/assinaturas")
    @Transactional
    public Assinaturas assinaturas() {
        return financeiro.assinaturas(storeId);
    }

    @GET
    @Path("/saques")
    @Transactional
    public Saques saques() {
        return financeiro.saques(storeId);
    }

    @POST
    @Path("/saques/{id}/pagar")
    @Transactional
    public Saques pagar(@PathParam("id") UUID id) {
        financeiro.pagarSaque(storeId, id);
        return financeiro.saques(storeId);
    }

    @POST
    @Path("/saques/{id}/recusar")
    @Transactional
    public Saques recusar(@PathParam("id") UUID id, Recusar pedido) {
        financeiro.recusarSaque(storeId, id, pedido != null ? pedido.motivo() : null);
        return financeiro.saques(storeId);
    }
}
