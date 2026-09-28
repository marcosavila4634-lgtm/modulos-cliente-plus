package br.com.clienteplus.modulos.grupovip;

import br.com.clienteplus.modulos.grupovip.BibliotecaContrato.*;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
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
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

// Tela "Biblioteca": livros, envio em massa (Drive ou computador) e chave do Google.
@Path("/grupo-vip/biblioteca")
@Produces(MediaType.APPLICATION_JSON)
public class BibliotecaResource {

    @ConfigProperty(name = "grupo-vip.store-id")
    UUID storeId;

    @Inject
    Biblioteca biblioteca;

    @Inject
    Sugestoes sugestoes;

    @GET
    @Transactional
    public PainelBiblioteca painel() {
        return biblioteca.painel(storeId);
    }

    @PUT
    @Path("/google")
    @Transactional
    public PainelBiblioteca chaveGoogle(ChaveGoogle dados) {
        biblioteca.salvarChaveGoogle(storeId, dados != null ? dados.chave() : null);
        return biblioteca.painel(storeId);
    }

    // Pasta do Drive privada: arquivo JSON da conta de serviço do Google.
    @PUT
    @Path("/conta-servico")
    @Transactional
    public PainelBiblioteca contaServico(ContaServico dados) {
        biblioteca.salvarContaServico(storeId, dados != null ? dados.json() : null);
        return biblioteca.painel(storeId);
    }

    @GET
    @Path("/livros")
    @Transactional
    public ListaLivros livros(@QueryParam("busca") String busca, @QueryParam("grupo") UUID grupo,
                              @QueryParam("pagina") int pagina) {
        return biblioteca.livros(storeId, busca, grupo, pagina);
    }

    @DELETE
    @Path("/livros/{id}")
    @Transactional
    public void excluirLivro(@PathParam("id") UUID id, @QueryParam("doGrupo") boolean doGrupo) {
        biblioteca.excluirLivro(storeId, id, doGrupo);
    }

    // Corrigir título, autor, categoria, gênero e resumo.
    @PUT
    @Path("/livros/{id}")
    @Transactional
    public LivroJson editarLivro(@PathParam("id") UUID id, DadosLivro dados) {
        biblioteca.editarLivro(storeId, id, dados);
        return Biblioteca.json(biblioteca.livro(storeId, id));
    }

    // Procurar os dados no Google Books de novo.
    @POST
    @Path("/livros/{id}/buscar-dados")
    @Transactional
    public LivroJson buscarDados(@PathParam("id") UUID id) {
        biblioteca.buscarDadosDeNovo(storeId, id);
        return Biblioteca.json(biblioteca.livro(storeId, id));
    }

    @PUT
    @Path("/completar")
    @Transactional
    public PainelBiblioteca completar(Ligado dados) {
        biblioteca.completarLivros(storeId, dados != null && dados.ligado());
        return biblioteca.painel(storeId);
    }

    // Livros ou materiais (apostilas, vídeos, áudios...).
    @PUT
    @Path("/tipo")
    @Transactional
    public PainelBiblioteca tipo(TipoBiblioteca dados) {
        biblioteca.mudarTipo(storeId, dados != null ? dados.tipo() : null);
        return biblioteca.painel(storeId);
    }

    // ---------- Sugestões dos membros ----------

    @GET
    @Path("/sugestoes")
    @Transactional
    public List<SugestaoJson> sugestoes() {
        return sugestoes.listar(storeId);
    }

    @POST
    @Path("/sugestoes/responder")
    @Transactional
    public List<SugestaoJson> responder(RespostaSugestao dados) {
        if (dados == null) throw br.com.clienteplus.modulos.comum.Erro.invalido("Escolha a sugestão");
        sugestoes.responder(storeId, dados.ids(), dados.acao(), dados.livroId());
        return sugestoes.listar(storeId);
    }

    @POST
    @Path("/importacoes")
    @Transactional
    public ImportacaoJson criar(DadosImportacao dados) {
        return biblioteca.json(biblioteca.criar(storeId, dados));
    }

    @GET
    @Path("/importacoes/{id}")
    @Transactional
    public DetalhesImportacao detalhes(@PathParam("id") UUID id, @QueryParam("status") String status) {
        return biblioteca.detalhes(storeId, id, status);
    }

    // Um arquivo do computador (campo "arquivo"), até 50 MB. "pasta" (opcional):
    // subpasta onde ele estava, vira a categoria.
    @POST
    @Path("/importacoes/{id}/arquivos")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Transactional
    public ItemJson receber(@PathParam("id") UUID id, @RestForm("arquivo") FileUpload arquivo, @RestForm("pasta") String pasta) {
        return biblioteca.receberArquivo(storeId, id, arquivo, pasta);
    }

    @POST
    @Path("/importacoes/{id}/iniciar")
    @Transactional
    public ImportacaoJson iniciar(@PathParam("id") UUID id) {
        biblioteca.iniciar(storeId, id);
        return biblioteca.json(biblioteca.importacao(storeId, id));
    }

    @POST
    @Path("/importacoes/{id}/pausar")
    @Transactional
    public ImportacaoJson pausar(@PathParam("id") UUID id) {
        biblioteca.pausar(storeId, id);
        return biblioteca.json(biblioteca.importacao(storeId, id));
    }

    @POST
    @Path("/importacoes/{id}/continuar")
    @Transactional
    public ImportacaoJson continuar(@PathParam("id") UUID id) {
        biblioteca.continuar(storeId, id);
        return biblioteca.json(biblioteca.importacao(storeId, id));
    }

    @POST
    @Path("/importacoes/{id}/tentar-falhas")
    @Transactional
    public ImportacaoJson tentarFalhas(@PathParam("id") UUID id) {
        biblioteca.tentarFalhas(storeId, id);
        return biblioteca.json(biblioteca.importacao(storeId, id));
    }

    @DELETE
    @Path("/importacoes/{id}")
    @Transactional
    public void excluir(@PathParam("id") UUID id) {
        biblioteca.excluir(storeId, id);
    }
}
