package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.grupovip.TelegramContrato.*;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.DELETE;
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

// Tela "Telegram": controle dos grupos pelo robô, moderação e enquetes.
@Path("/grupo-vip/telegram")
@Produces(MediaType.APPLICATION_JSON)
public class TelegramResource {

    @ConfigProperty(name = "grupo-vip.store-id")
    UUID storeId;

    @Inject
    GestaoTelegram gestao;

    @Inject
    Enquetes enquetes;

    @GET
    @Transactional
    public Painel painel() {
        return gestao.painel(storeId);
    }

    @GET
    @Path("/grupos/{id}")
    @Transactional
    public Detalhes detalhes(@PathParam("id") UUID id) {
        return gestao.detalhes(storeId, id);
    }

    @PUT
    @Path("/grupos/{id}/regras")
    @Transactional
    public Detalhes regras(@PathParam("id") UUID id, DadosRegras dados) {
        gestao.salvarRegras(storeId, id, dados);
        return gestao.detalhes(storeId, id);
    }

    @PUT
    @Path("/grupos/{id}/dados")
    @Transactional
    public Detalhes dados(@PathParam("id") UUID id, DadosGrupoTelegram dados) {
        gestao.mudarDados(storeId, id, dados);
        return gestao.detalhes(storeId, id);
    }

    @POST
    @Path("/grupos/{id}/travar")
    @Transactional
    public Detalhes travar(@PathParam("id") UUID id) {
        gestao.travar(storeId, id, true);
        return gestao.detalhes(storeId, id);
    }

    @POST
    @Path("/grupos/{id}/liberar")
    @Transactional
    public Detalhes liberar(@PathParam("id") UUID id) {
        gestao.travar(storeId, id, false);
        return gestao.detalhes(storeId, id);
    }

    @POST
    @Path("/grupos/{id}/topicos")
    @Transactional
    public Detalhes criarTopico(@PathParam("id") UUID id, NomeTopico dados) {
        gestao.criarTopico(storeId, id, dados != null ? dados.nome() : null);
        return gestao.detalhes(storeId, id);
    }

    @PUT
    @Path("/topicos/{id}")
    @Transactional
    public void renomearTopico(@PathParam("id") UUID id, NomeTopico dados) {
        gestao.renomearTopico(storeId, id, dados != null ? dados.nome() : null);
    }

    @DELETE
    @Path("/topicos/{id}")
    @Transactional
    public void apagarTopico(@PathParam("id") UUID id) {
        gestao.apagarTopico(storeId, id);
    }

    @GET
    @Path("/moderacao")
    @Transactional
    public List<ModeracaoJson> moderacao() {
        return gestao.moderacao(storeId);
    }

    // ---------- Enquetes ----------

    @GET
    @Path("/enquetes")
    @Transactional
    public ListaEnquetes listarEnquetes() {
        return enquetes.listar(storeId);
    }

    @POST
    @Path("/enquetes")
    @Transactional
    public ListaEnquetes criarEnquete(DadosEnquete dados) {
        enquetes.criar(storeId, dados);
        return enquetes.listar(storeId);
    }

    @POST
    @Path("/enquetes/{id}/encerrar")
    @Transactional
    public ListaEnquetes encerrarEnquete(@PathParam("id") UUID id) {
        enquetes.encerrar(storeId, id);
        return enquetes.listar(storeId);
    }

    @DELETE
    @Path("/enquetes/{id}")
    @Transactional
    public ListaEnquetes excluirEnquete(@PathParam("id") UUID id) {
        enquetes.excluir(storeId, id);
        return enquetes.listar(storeId);
    }
}
