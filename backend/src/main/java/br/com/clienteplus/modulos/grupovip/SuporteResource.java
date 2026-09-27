package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.grupovip.MembrosContrato.TextoLivre;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.List;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;

// Suporte pelo painel: conversas abertas pelos membros.
@Path("/grupo-vip/suporte")
@Produces(MediaType.APPLICATION_JSON)
public class SuporteResource {

    @ConfigProperty(name = "grupo-vip.store-id")
    UUID storeId;

    @Inject
    Suporte suporte;

    @GET
    @Transactional
    public List<Suporte.ChamadoJson> listar() {
        return suporte.listar(storeId, null);
    }

    @POST
    @Path("/{id}/responder")
    @Transactional
    public List<Suporte.ChamadoJson> responder(@PathParam("id") UUID id, TextoLivre pedido) {
        suporte.respostaDaEquipe(storeId, id, pedido != null ? pedido.texto() : null);
        return suporte.listar(storeId, null);
    }

    @POST
    @Path("/{id}/resolver")
    @Transactional
    public List<Suporte.ChamadoJson> resolver(@PathParam("id") UUID id) {
        suporte.mudarStatus(storeId, id, Chamado.RESOLVIDO);
        return suporte.listar(storeId, null);
    }

    @POST
    @Path("/{id}/reabrir")
    @Transactional
    public List<Suporte.ChamadoJson> reabrir(@PathParam("id") UUID id) {
        suporte.mudarStatus(storeId, id, Chamado.ABERTO);
        return suporte.listar(storeId, null);
    }
}
