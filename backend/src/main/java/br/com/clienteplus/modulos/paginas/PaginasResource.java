package br.com.clienteplus.modulos.paginas;

import br.com.clienteplus.modulos.comum.Erro;
import br.com.clienteplus.modulos.paginas.PaginaContrato.*;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import java.util.UUID;

// Editor da página pública de qualquer módulo: /api/paginas/<modulo>.
// Contrato com o frontend: frontend/src/lib/pagina.ts
@Path("/paginas/{modulo}")
@Produces(MediaType.APPLICATION_JSON)
public class PaginasResource {

    @Inject
    Instance<ModuloComPagina> modulos;

    @Inject
    Paginas paginas;

    private ModuloComPagina modulo(String nome) {
        return modulos.stream()
                .filter(m -> m.modulo().equals(nome))
                .findFirst()
                .orElseThrow(() -> Erro.naoEncontrado("Módulo sem página pública: " + nome));
    }

    @GET
    @Transactional
    public Editor editor(@PathParam("modulo") String modulo) {
        return paginas.editor(modulo(modulo));
    }

    @PUT
    @Path("/rascunho")
    public Salvo salvar(@PathParam("modulo") String modulo, JsonNode pagina) {
        return paginas.salvarRascunho(modulo(modulo), pagina);
    }

    @POST
    @Path("/publicar")
    @Transactional
    public Editor publicar(@PathParam("modulo") String modulo) {
        ModuloComPagina m = modulo(modulo);
        paginas.publicar(m);
        return paginas.editor(m);
    }

    @POST
    @Path("/descartar")
    @Transactional
    public Editor descartar(@PathParam("modulo") String modulo) {
        ModuloComPagina m = modulo(modulo);
        paginas.descartar(m);
        return paginas.editor(m);
    }

    @POST
    @Path("/versoes/{id}/restaurar")
    @Transactional
    public Editor restaurar(@PathParam("modulo") String modulo, @PathParam("id") UUID id) {
        ModuloComPagina m = modulo(modulo);
        paginas.restaurar(m, id);
        return paginas.editor(m);
    }
}
