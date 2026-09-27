package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.grupovip.ConteudosContrato.*;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import java.util.List;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;

// Conteúdos, categorias, lives e anúncios.
@Path("/grupo-vip")
@Produces(MediaType.APPLICATION_JSON)
public class ConteudosResource {

    @ConfigProperty(name = "grupo-vip.store-id")
    UUID storeId;

    @Inject
    Conteudos conteudos;

    @Inject
    Automacoes automacoes;

    // ---------- Conteúdos ----------

    @GET
    @Path("/conteudos")
    @Transactional
    public ListaConteudos listar() {
        return conteudos.listar(storeId);
    }

    @POST
    @Path("/conteudos")
    @Transactional
    public ConteudoJson criar(DadosConteudo dados) {
        return conteudos.json(conteudos.salvar(storeId, null, dados));
    }

    @PUT
    @Path("/conteudos/{id}")
    @Transactional
    public ConteudoJson atualizar(@PathParam("id") UUID id, DadosConteudo dados) {
        return conteudos.json(conteudos.salvar(storeId, id, dados));
    }

    @POST
    @Path("/conteudos/{id}/publicar")
    @Transactional
    public ConteudoJson publicar(@PathParam("id") UUID id) {
        conteudos.publicarAgora(storeId, id);
        return conteudos.json(conteudos.conteudo(storeId, id));
    }

    @DELETE
    @Path("/conteudos/{id}")
    @Transactional
    public void excluir(@PathParam("id") UUID id) {
        conteudos.excluir(storeId, id);
    }

    @POST
    @Path("/publicacoes/{id}/publicado")
    @Transactional
    public void marcarPublicado(@PathParam("id") UUID id) {
        conteudos.marcarPublicado(storeId, id);
    }

    @POST
    @Path("/publicacoes/{id}/fixar")
    @Transactional
    public void fixar(@PathParam("id") UUID id) {
        conteudos.fixarPublicacao(storeId, id, true);
    }

    @POST
    @Path("/publicacoes/{id}/desafixar")
    @Transactional
    public void desafixar(@PathParam("id") UUID id) {
        conteudos.fixarPublicacao(storeId, id, false);
    }

    @POST
    @Path("/publicacoes/{id}/apagar")
    @Transactional
    public void apagarDoGrupo(@PathParam("id") UUID id) {
        conteudos.apagarPublicacao(storeId, id);
    }

    @POST
    @Path("/publicacoes/{id}/tentar")
    @Transactional
    public void tentarDeNovo(@PathParam("id") UUID id) {
        conteudos.tentarDeNovo(storeId, id);
    }

    // ---------- Categorias ----------

    @GET
    @Path("/categorias")
    @Transactional
    public List<CategoriaJson> categorias() {
        return conteudos.categorias(storeId);
    }

    @POST
    @Path("/categorias")
    @Transactional
    public List<CategoriaJson> criarCategoria(DadosCategoria dados) {
        conteudos.salvarCategoria(storeId, null, dados);
        return conteudos.categorias(storeId);
    }

    @PUT
    @Path("/categorias/{id}")
    @Transactional
    public List<CategoriaJson> atualizarCategoria(@PathParam("id") UUID id, DadosCategoria dados) {
        conteudos.salvarCategoria(storeId, id, dados);
        return conteudos.categorias(storeId);
    }

    @DELETE
    @Path("/categorias/{id}")
    @Transactional
    public List<CategoriaJson> excluirCategoria(@PathParam("id") UUID id) {
        conteudos.excluirCategoria(storeId, id);
        return conteudos.categorias(storeId);
    }

    // ---------- Lives e eventos ----------

    @GET
    @Path("/lives")
    @Transactional
    public ListaEventos lives() {
        return conteudos.eventos(storeId);
    }

    @POST
    @Path("/lives")
    @Transactional
    public EventoJson criarLive(DadosEvento dados) {
        return Conteudos.json(conteudos.salvarEvento(storeId, null, dados));
    }

    @PUT
    @Path("/lives/{id}")
    @Transactional
    public EventoJson atualizarLive(@PathParam("id") UUID id, DadosEvento dados) {
        return Conteudos.json(conteudos.salvarEvento(storeId, id, dados));
    }

    @POST
    @Path("/lives/{id}/cancelar")
    @Transactional
    public EventoJson cancelarLive(@PathParam("id") UUID id) {
        conteudos.cancelarEvento(storeId, id);
        return Conteudos.json(conteudos.evento(storeId, id));
    }

    @POST
    @Path("/lives/{id}/avisar")
    @Transactional
    public EventoJson avisarLive(@PathParam("id") UUID id) {
        conteudos.avisarAgora(storeId, id, automacoes.garantir(storeId).get("live"));
        return Conteudos.json(conteudos.evento(storeId, id));
    }

    @DELETE
    @Path("/lives/{id}")
    @Transactional
    public void excluirLive(@PathParam("id") UUID id) {
        conteudos.excluirEvento(storeId, id);
    }

    // ---------- Anúncios ----------

    @GET
    @Path("/anuncios")
    @Transactional
    public ListaAnuncios anuncios() {
        return conteudos.anuncios(storeId);
    }

    @GET
    @Path("/anuncios/publico")
    @Transactional
    public Publico publico(@QueryParam("publico") String publico, @QueryParam("ref") UUID ref) {
        return conteudos.contarPublico(storeId, publico, ref);
    }

    @POST
    @Path("/anuncios")
    @Transactional
    public ListaAnuncios enviarAnuncio(DadosAnuncio dados) {
        conteudos.enviarAnuncio(storeId, dados);
        return conteudos.anuncios(storeId);
    }
}
